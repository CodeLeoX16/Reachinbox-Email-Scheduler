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