import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { prisma } from '../../config/database';

const customSenderSchema = z.object({
  name: z.string().trim().min(1, 'Sender name is required'),
  email: z.string().trim().email('A valid email address is required'),
  smtpHost: z.string().trim().min(1, 'SMTP host is required'),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().trim().min(1, 'SMTP username is required').optional(),
  smtpPass: z.string().min(1, 'SMTP password or app password is required'),
});

export async function listSenders(req: Request, res: Response) {
  const senders = await prisma.sender.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      smtpHost: true,
      smtpPort: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return res.json({ senders });
}

export async function createEtherealSender(req: Request, res: Response) {
  try {
    const testAccount = await nodemailer.createTestAccount();
    const sender = await prisma.sender.upsert({
      where: {
        userId_email: {
          userId: req.user!.id,
          email: testAccount.user,
        },
      },
      create: {
        userId: req.user!.id,
        email: testAccount.user,
        name: req.body.name || `${req.user!.name} (${testAccount.user.split('@')[0]})`,
        smtpHost: testAccount.smtp.host,
        smtpPort: testAccount.smtp.port,
        smtpUser: testAccount.user,
        smtpPass: testAccount.pass,
      },
      update: {
        name: req.body.name || `${req.user!.name} (${testAccount.user.split('@')[0]})`,
        smtpHost: testAccount.smtp.host,
        smtpPort: testAccount.smtp.port,
        smtpUser: testAccount.user,
        smtpPass: testAccount.pass,
      },
      select: {
        id: true,
        email: true,
        name: true,
        smtpHost: true,
        smtpPort: true,
      },
    });
    return res.status(201).json({ sender });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to provision Ethereal sender' });
  }
}

export async function createCustomSender(req: Request, res: Response) {
  try {
    const parsed = customSenderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid sender details',
      });
    }

    const { name, email, smtpHost, smtpPort, smtpPass } = parsed.data;
    const smtpUser = parsed.data.smtpUser || email;

    const sender = await prisma.sender.upsert({
      where: {
        userId_email: {
          userId: req.user!.id,
          email,
        },
      },
      create: {
        userId: req.user!.id,
        email,
        name,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
      },
      update: {
        name,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
      },
      select: {
        id: true,
        email: true,
        name: true,
        smtpHost: true,
        smtpPort: true,
      },
    });

    return res.status(201).json({ sender });
  } catch (err: any) {
    console.error('Create custom sender error:', err);
    return res.status(500).json({ error: 'Failed to add custom email account' });
  }
}