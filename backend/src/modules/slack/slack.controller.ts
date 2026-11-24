import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/database';

export async function getSlackAuthUrl(req: Request, res: Response) {
  if (!env.SLACK_CLIENT_ID) {
    return res.status(400).json({
      error: 'SLACK_CLIENT_ID is not configured in backend .env',
    });
  }

  // Sign userId into OAuth state so callback knows which user connected Slack
  const state = jwt.sign({ userId: req.user!.id }, env.JWT_SECRET, { expiresIn: '15m' });
  const scopes = 'incoming-webhook,chat:write';

  const url =
    `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(env.SLACK_REDIRECT_URI)}` +
    `&state=${state}`;

  return res.json({ url });
}

export async function handleSlackCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${env.FRONTEND_URL}?slack=error`);
    }

    const decoded = jwt.verify(String(state), env.JWT_SECRET) as { userId: string };

    const tokenRes = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        code: String(code),
        redirect_uri: env.SLACK_REDIRECT_URI,
      },
    });

    if (!tokenRes.data.ok) {
      console.error('Slack OAuth exchange failed:', tokenRes.data.error);
      return res.redirect(`${env.FRONTEND_URL}?slack=error`);
    }

    const accessToken = tokenRes.data.access_token;
    const channelId = tokenRes.data.incoming_webhook?.channel_id || '';
    const channelName = tokenRes.data.incoming_webhook?.channel || '#general';
    const teamName = tokenRes.data.team?.name || 'Slack Workspace';

    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        slackAccessToken: accessToken,
        slackChannelId: channelId,
        slackChannelName: channelName,
        slackTeamName: teamName,
      },
    });

    return res.redirect(`${env.FRONTEND_URL}?slack=connected`);
  } catch (err: any) {
    console.error('Slack callback exception:', err.message);
    return res.redirect(`${env.FRONTEND_URL}?slack=error`);
  }
}

export async function disconnectSlack(req: Request, res: Response) {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      slackAccessToken: null,
      slackChannelId: null,
      slackChannelName: null,
      slackTeamName: null,
    },
  });
  return res.json({ disconnected: true });
}