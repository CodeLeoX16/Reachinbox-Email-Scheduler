import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  ELASTICSEARCH_URL: z.string().default('http://localhost:9200'),
  JWT_SECRET: z.string().min(8),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  WORKER_CONCURRENCY: z.string().transform(Number).default('5'),
  MIN_DELAY_BETWEEN_EMAILS_MS: z.string().transform(Number).default('2000'),
  DEFAULT_MAX_EMAILS_PER_HOUR_PER_SENDER: z.string().transform(Number).default('200'),
  SLACK_CLIENT_ID: z.string().optional().default(''),
  SLACK_CLIENT_SECRET: z.string().optional().default(''),
  SLACK_REDIRECT_URI: z.string().default('http://localhost:5000/api/slack/callback'),
});

export const env = envSchema.parse(process.env);