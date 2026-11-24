import { Client } from '@elastic/elasticsearch';
import { env } from './env';

export const esClient = new Client({
  node: env.ELASTICSEARCH_URL,
});

export const EMAIL_INDEX = 'reachinbox_emails';

export async function initElasticsearch() {
  try {
    const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            senderEmail: { type: 'keyword' },
            recipientEmail: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            recipientName: { type: 'text' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
          },
        },
      });
      console.log(`🟢 Elasticsearch index "${EMAIL_INDEX}" created`);
    } else {
      console.log(`🟢 Elasticsearch index "${EMAIL_INDEX}" ready`);
    }
  } catch (err: any) {
    console.warn('⚠️ Elasticsearch init warning (will retry on operations):', err.message);
  }
}