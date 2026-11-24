import { Job, DelayedError } from 'bullmq';
import { prisma } from '../config/database';
import { redisConnection } from '../config/redis';
import { env } from '../config/env';
import { EmailJobPayload } from './email.queue';
import { checkAndConsumeSenderRateLimit } from './rateLimiter';
import { sendEtherealEmail } from '../services/smtp.service';
import { indexEmailDocument } from '../services/search.service';

export async function processEmailJob(job: Job<EmailJobPayload>, token?: string) {
  const { emailJobId } = job.data;

  // 1. Fetch record from DB & enforce strict idempotency
  const emailRecord = await prisma.emailJob.findUnique({
    where: { id: emailJobId },
    include: { sender: true },
  });

  if (!emailRecord) {
    console.warn(`⚠️ EmailJob ${emailJobId} not found in DB, skipping.`);
    return;
  }

  if (emailRecord.status === 'SENT') {
    console.log(`⏭️ Idempotency check: EmailJob ${emailJobId} already SENT.`);
    return;
  }

  // 2. Check hourly rate limit per sender
  const rateLimit = await checkAndConsumeSenderRateLimit(
    emailRecord.senderId,
    emailRecord.sender.email,
    emailRecord.userId,
    emailRecord.hourlyLimit || env.DEFAULT_MAX_EMAILS_PER_HOUR_PER_SENDER
  );

  if (!rateLimit.allowed) {
    const nextRunTimestamp = Date.now() + rateLimit.delayUntilNextWindowMs;
    console.log(
      `⏳ Hourly limit (${rateLimit.limit}/hr) reached for ${emailRecord.sender.email}. ` +
        `Rescheduling job ${emailJobId} to ${new Date(nextRunTimestamp).toISOString()}`
    );

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { scheduledAt: new Date(nextRunTimestamp) },
    });

    await job.moveToDelayed(nextRunTimestamp, token);
    throw new DelayedError();
  }

  // 3. Enforce minimum delay between individual email sends per sender (safe across parallel workers)
  const minDelayMs = Math.max(emailRecord.delayMs, env.MIN_DELAY_BETWEEN_EMAILS_MS);
  const senderSlotKey = `sender:next_slot:${emailRecord.senderId}`;
  const now = Date.now();

  // Reserve a send slot atomically
  const slotResult = await redisConnection.eval(
    `
    local nextSlot = tonumber(redis.call('GET', KEYS[1]) or '0')
    local now = tonumber(ARGV[1])
    local gap = tonumber(ARGV[2])
    local scheduledTime = math.max(now, nextSlot)
    redis.call('SET', KEYS[1], scheduledTime + gap, 'PX', gap * 10 + 60000)
    return scheduledTime - now
    `,
    1,
    senderSlotKey,
    now,
    minDelayMs
  );

  const waitMs = Number(slotResult);
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  // 4. Mark PROCESSING and send via Ethereal SMTP
  await prisma.emailJob.update({
    where: { id: emailJobId },
    data: {
      status: 'PROCESSING',
      attemptCount: { increment: 1 },
    },
  });

  try {
    const info = await sendEtherealEmail({
      sender: emailRecord.sender,
      to: emailRecord.recipientEmail,
      subject: emailRecord.subject,
      html: emailRecord.body,
      attachments: Array.isArray(emailRecord.attachments)
        ? (emailRecord.attachments as Array<{
            name: string;
            contentType: string;
            contentBase64: string;
          }>)
        : [],
    });

    const sentAt = new Date();
    const updated = await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'SENT',
        sentAt,
        previewUrl: info.previewUrl || null,
        errorMessage: null,
      },
      include: { sender: true },
    });

    await indexEmailDocument(updated);
    console.log(
      `✅ Sent email [${emailJobId}] to ${emailRecord.recipientEmail} | Preview: ${info.previewUrl}`
    );
  } catch (err: any) {
    console.error(`❌ Failed to send email [${emailJobId}]:`, err.message);
    const updated = await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'FAILED',
        errorMessage: err.message,
      },
      include: { sender: true },
    });
    await indexEmailDocument(updated);
    throw err; // Let BullMQ retry according to backoff policy
  }
}