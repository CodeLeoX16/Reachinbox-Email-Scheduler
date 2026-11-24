import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { emailQueue } from '../../queue/email.queue';
import { indexEmailDocument, searchEmailsInES } from '../../services/search.service';
import { env } from '../../config/env';

const scheduleBatchSchema = z.object({
  senderId: z.string().uuid(),
  recipients: z.array(z.string().email()).min(1, 'At least one valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  startTime: z.string().datetime().optional(), // ISO string; defaults to now
  delayBetweenEmailsSeconds: z.number().min(0).default(2),
  hourlyLimit: z.number().int().min(1).default(env.DEFAULT_MAX_EMAILS_PER_HOUR_PER_SENDER),
  attachments: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        contentType: z.string().trim().min(1).max(255),
        contentBase64: z.string().min(1),
      })
    )
    .max(10)
    .default([]),
});

export async function scheduleEmails(req: Request, res: Response) {
  try {
    const parsed = scheduleBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const {
      senderId,
      recipients,
      subject,
      body,
      startTime,
      delayBetweenEmailsSeconds,
      hourlyLimit,
      attachments,
    } = parsed.data;

    const sender = await prisma.sender.findFirst({
      where: { id: senderId, userId: req.user!.id },
    });

    if (!sender) {
      return res.status(404).json({ error: 'Selected sender account not found' });
    }

    // Deduplicate recipients within the same batch
    const uniqueRecipients = Array.from(new Set(recipients.map((e) => e.trim().toLowerCase())));
    const baseStartMs = startTime ? Math.max(Date.now(), new Date(startTime).getTime()) : Date.now();
    const delayMs = Math.max(delayBetweenEmailsSeconds * 1000, env.MIN_DELAY_BETWEEN_EMAILS_MS);

    const createdJobs = [];

    for (let i = 0; i < uniqueRecipients.length; i++) {
      const recipientEmail = uniqueRecipients[i];
      const scheduledTimestamp = baseStartMs + i * delayMs;
      const scheduledAt = new Date(scheduledTimestamp);
      const idempotencyKey = uuidv4();

      const emailJob = await prisma.emailJob.create({
        data: {
          idempotencyKey,
          userId: req.user!.id,
          senderId: sender.id,
          recipientEmail,
          subject,
          body,
          status: 'SCHEDULED',
          scheduledAt,
          delayMs,
          hourlyLimit,
          attachments,
        },
        include: { sender: true },
      });

      const bullDelay = Math.max(0, scheduledTimestamp - Date.now());
      await emailQueue.add(
        'send-email',
        { emailJobId: emailJob.id },
        {
          jobId: emailJob.id, // Enforces strict idempotency in BullMQ
          delay: bullDelay,
        }
      );

      await indexEmailDocument(emailJob);
      createdJobs.push(emailJob);
    }

    return res.status(201).json({
      message: `Scheduled ${createdJobs.length} emails`,
      count: createdJobs.length,
      emails: createdJobs,
    });
  } catch (err: any) {
    console.error('Schedule emails error:', err);
    return res.status(500).json({ error: 'Failed to schedule emails' });
  }
}

export async function listEmails(req: Request, res: Response) {
  try {
    const tab = req.query.tab === 'SENT' ? 'SENT' : 'SCHEDULED';
    const statusFilter =
      req.query.status === 'SCHEDULED' ||
      req.query.status === 'SENT' ||
      req.query.status === 'FAILED'
        ? req.query.status
        : tab;
    const searchQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    let matchedIds: string[] | null = null;
    if (searchQuery) {
      matchedIds = await searchEmailsInES(req.user!.id, searchQuery, statusFilter);
    }

    const statusCondition =
      statusFilter === 'SCHEDULED'
        ? { in: ['SCHEDULED', 'PROCESSING'] as any }
        : statusFilter;

    const whereClause: any = {
      userId: req.user!.id,
      status: statusCondition,
    };

    if (searchQuery) {
      if (matchedIds !== null) {
        whereClause.id = { in: matchedIds };
      } else {
        // Fallback DB search if ES is unavailable
        whereClause.OR = [
          { recipientEmail: { contains: searchQuery, mode: 'insensitive' } },
          { subject: { contains: searchQuery, mode: 'insensitive' } },
          { body: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
    }

    const [emails, scheduledCount, sentCount] = await Promise.all([
      prisma.emailJob.findMany({
        where: whereClause,
        include: {
          sender: { select: { id: true, email: true, name: true } },
        },
        orderBy: tab === 'SCHEDULED' ? { scheduledAt: 'asc' } : { sentAt: 'desc' },
        take: 200,
      }),
      prisma.emailJob.count({
        where: { userId: req.user!.id, status: { in: ['SCHEDULED', 'PROCESSING'] } },
      }),
      prisma.emailJob.count({
        where: { userId: req.user!.id, status: { in: ['SENT', 'FAILED'] } },
      }),
    ]);

    return res.json({
      emails,
      counts: {
        scheduled: scheduledCount,
        sent: sentCount,
      },
    });
  } catch (err: any) {
    console.error('List emails error:', err);
    return res.status(500).json({ error: 'Failed to fetch emails' });
  }
}

export async function getEmailById(req: Request, res: Response) {
  const email = await prisma.emailJob.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { sender: { select: { id: true, email: true, name: true } } },
  });

  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }
  return res.json({ email });
}