import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-send-queue';

export interface EmailJobPayload {
  emailJobId: string;
}

export const emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 1000 }, // Keep last 1000 in BullBoard for visibility
    removeOnFail: { count: 1000 },
  },
});