import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { initElasticsearch } from './config/elasticsearch';
import { emailQueue } from './queue/email.queue';
import { startEmailWorker } from './worker';

async function recoverPendingJobsOnStartup() {
  const pendingEmails = await prisma.emailJob.findMany({
    where: { status: { in: ['SCHEDULED', 'PROCESSING'] } },
  });

  if (pendingEmails.length === 0) return;

  console.log(`🔄 Reconciling ${pendingEmails.length} pending email jobs after startup...`);
  for (const job of pendingEmails) {
    // Reset stuck PROCESSING jobs back to SCHEDULED so they aren't lost
    if (job.status === 'PROCESSING') {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: 'SCHEDULED' },
      });
    }

    const existingBullJob = await emailQueue.getJob(job.id);
    if (!existingBullJob) {
      const delay = Math.max(0, new Date(job.scheduledAt).getTime() - Date.now());
      await emailQueue.add(
        'send-email',
        { emailJobId: job.id },
        { jobId: job.id, delay }
      );
    }
  }
}

async function bootstrap() {
  await initElasticsearch();
  await recoverPendingJobsOnStartup();

  // Start embedded BullMQ worker (you can also run `npm run worker` separately for horizontal scaling)
  startEmailWorker();

  app.listen(Number(env.PORT), () => {
    console.log(`🚀 Backend API running at http://localhost:${env.PORT}`);
    console.log(`📊 BullMQ Live Dashboard at http://localhost:${env.PORT}/admin/queues`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});