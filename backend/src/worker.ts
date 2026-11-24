import { Worker } from 'bullmq';
import { redisConnection } from './config/redis';
import { env } from './config/env';
import { EMAIL_QUEUE_NAME, EmailJobPayload } from './queue/email.queue';
import { processEmailJob } from './queue/email.processor';

export function startEmailWorker() {
  const worker = new Worker<EmailJobPayload>(
    EMAIL_QUEUE_NAME,
    async (job, token) => processEmailJob(job, token),
    {
      connection: redisConnection,
      concurrency: env.WORKER_CONCURRENCY,
    }
  );

  worker.on('ready', () => {
    console.log(`🚀 BullMQ Email Worker running (concurrency: ${env.WORKER_CONCURRENCY})`);
  });

  worker.on('failed', (job, err) => {
    if (err.name !== 'DelayedError') {
      console.error(`💥 Job ${job?.id} failed:`, err.message);
    }
  });

  // Graceful shutdown for zero job loss on restart
  const shutdown = async () => {
    console.log('🛑 Shutting down email worker gracefully...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return worker;
}

if (require.main === module) {
  startEmailWorker();
}