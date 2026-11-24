import nodemailer, { Transporter } from 'nodemailer';
import { Sender } from '@prisma/client';

const transporterCache = new Map<string, Transporter>();

function getTransporter(sender: Sender): Transporter {
  if (transporterCache.has(sender.id)) {
    return transporterCache.get(sender.id)!;
  }

  const transporter = nodemailer.createTransport({
    host: sender.smtpHost,
    port: sender.smtpPort,
    secure: sender.smtpPort === 465,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    pool: true,
    maxConnections: 5,
    auth: {
      user: sender.smtpUser,
      pass: sender.smtpPass,
    },
  });

  transporterCache.set(sender.id, transporter);
  return transporter;
}

export async function sendEtherealEmail(params: {
  sender: Sender;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    name: string;
    contentType: string;
    contentBase64: string;
  }>;
}) {
  const mailtrapToken = process.env.MAILTRAP_API_TOKEN;
  const sandboxInboxId = process.env.MAILTRAP_INBOX_ID;

  // Production HTTPS Transport (bypasses Render Free Tier outbound SMTP port block)
  if (mailtrapToken && sandboxInboxId) {
    const endpoint = `https://sandbox.api.mailtrap.io/api/send/${sandboxInboxId}`;

    const payload: Record<string, any> = {
      from: {
        email: params.sender.email,
        name: params.sender.name || 'ReachInbox Scheduler',
      },
      to: [{ email: params.to }],
      subject: params.subject,
      html: params.html,
      text: params.html.replace(/<[^>]*>?/gm, ''),
    };

    if (params.attachments && params.attachments.length > 0) {
      payload.attachments = params.attachments.map((attachment) => ({
        filename: attachment.name,
        content: attachment.contentBase64,
        type: attachment.contentType || 'application/octet-stream',
        disposition: 'attachment',
      }));
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mailtrapToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(
        `Mailtrap Sandbox API error (${response.status}): ${JSON.stringify(data.errors || data)}`
      );
    }

    return {
      messageId: data.message_ids?.[0] || `mailtrap-${Date.now()}`,
      previewUrl: `https://mailtrap.io/inboxes/${sandboxInboxId}/messages`,
    };
  }

  // Local Development SMTP Transport (Ethereal)
  const transporter = getTransporter(params.sender);

  const info = await transporter.sendMail({
    from: `"${params.sender.name}" <${params.sender.email}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    attachments: (params.attachments || []).map((attachment) => ({
      filename: attachment.name,
      contentType: attachment.contentType,
      content: Buffer.from(attachment.contentBase64, 'base64'),
    })),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  return { messageId: info.messageId, previewUrl };
}
