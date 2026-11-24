import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = env.REDIS_URL
  ? new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    })
  : new IORedis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

redisConnection.on('connect', () => {
  console.log('🟢 Redis connected');
});

redisConnection.on('error', (err) => {
  console.error('🔴 Redis connection error:', err.message);
});
