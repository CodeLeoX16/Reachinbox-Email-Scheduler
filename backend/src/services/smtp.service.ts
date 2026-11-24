import nodemailer from 'nodemailer';
import { Sender } from '@prisma/client';

export interface EmailAttachment {
  filename: string;
  content: string; // base64 string
  contentType?: string;
}

export interface SendEmailParams {
  sender: Sender;
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({
  sender,
  to,
  subject,
  body,
  attachments = [],
}: SendEmailParams) {
  const mailtrapToken = process.env.MAILTRAP_API_TOKEN;
  const sandboxInboxId = process.env.MAILTRAP_INBOX_ID;

  // Production HTTPS Transport (bypasses Render Free Tier outbound SMTP port block)
  if (mailtrapToken && sandboxInboxId) {
    const endpoint = `https://sandbox.api.mailtrap.io/api/send/${sandboxInboxId}`;

    const payload: Record<string, any> = {
      from: {
        email: sender.email,
        name: sender.name || 'ReachInbox Scheduler',
      },
      to: [{ email: to }],
      subject,
      html: body,
      text: body.replace(/<[^>]*>?/gm, ''),
    };

    if (attachments.length > 0) {
      payload.attachments = attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        type: att.contentType || 'application/octet-stream',
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
  const transporter = nodemailer.createTransport({
    host: sender.smtpHost || 'smtp.ethereal.email',
    port: sender.smtpPort || 587,
    secure: (sender.smtpPort || 587) === 465,
    auth: {
      user: sender.smtpUser,
      pass: sender.smtpPass,
    },
  });

  const info = await transporter.sendMail({
    from: `"${sender.name || 'ReachInbox'}" <${sender.email}>`,
    to,
    subject,
    html: body,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType,
    })),
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || null,
  };
}
