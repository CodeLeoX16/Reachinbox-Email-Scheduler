import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = new IORedis({
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