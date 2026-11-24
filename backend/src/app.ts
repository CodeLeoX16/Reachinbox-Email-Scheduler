import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { serverAdapter } from './config/bullBoard';
import authRoutes from './modules/auth/auth.routes';
import senderRoutes from './modules/senders/senders.routes';
import emailRoutes from './modules/emails/emails.routes';
import slackRoutes from './modules/slack/slack.routes';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Live BullMQ Queue Dashboard
app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

export default app;