import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../config/database';
import { env } from '../../config/env';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

async function ensureDefaultSender(userId: string, userName: string) {
  const existingSenders = await prisma.sender.count({ where: { userId } });
  if (existingSenders === 0) {
    const testAccount = await nodemailer.createTestAccount();
    await prisma.sender.create({
      data: {
        userId,
        email: testAccount.user,
        name: userName,
        smtpHost: testAccount.smtp.host,
        smtpPort: testAccount.smtp.port,
        smtpUser: testAccount.user,
        smtpPass: testAccount.pass,
      },
    });
  }
}

export async function googleLogin(req: Request, res: Response) {
  try {
    const { credential, accessToken } = req.body;
    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    if (credential) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: 'Invalid Google ID token' });
      }
      email = payload.email;
      name = payload.name || payload.email.split('@')[0];
      avatar = payload.picture || '';
      googleId = payload.sub;
    } else if (accessToken) {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      email = data.email;
      name = data.name || data.email.split('@')[0];
      avatar = data.picture || '';
      googleId = data.sub;
    } else {
      return res.status(400).json({ error: 'Missing Google credential or accessToken' });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, avatar, googleId },
      create: { email, name, avatar, googleId },
    });

    await ensureDefaultSender(user.id, user.name);

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        slackConnected: Boolean(user.slackAccessToken),
        slackChannelName: user.slackChannelName,
      },
    });
  } catch (err: any) {
    console.error('Google login error:', err.message);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
}

export async function demoLogin(_req: Request, res: Response) {
  const user = await prisma.user.upsert({
    where: { email: 'oliver.brown@domain.io' },
    update: {},
    create: {
      email: 'oliver.brown@domain.io',
      name: 'Oliver Brown',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    },
  });

  await ensureDefaultSender(user.id, user.name);
  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      slackConnected: Boolean(user.slackAccessToken),
      slackChannelName: user.slackChannelName,
    },
  });
}

export async function getMe(req: Request, res: Response) {
  const user = req.user!;
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    slackConnected: Boolean(user.slackAccessToken),
    slackChannelName: user.slackChannelName,
    slackTeamName: user.slackTeamName,
  });
}