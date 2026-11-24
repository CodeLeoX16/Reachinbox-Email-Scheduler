import { Client } from '@elastic/elasticsearch';
import { env } from './env';

const isValidHttpUrl =
  Boolean(env.ELASTICSEARCH_URL) &&
  (env.ELASTICSEARCH_URL.startsWith('http://') || env.ELASTICSEARCH_URL.startsWith('https://'));

export const esClient = isValidHttpUrl
  ? new Client({
      node: env.ELASTICSEARCH_URL,
    })
  : null;

export const EMAIL_INDEX = 'reachinbox_emails';

export async function initElasticsearch() {
  if (!esClient) {
    console.log('ℹ️ Elasticsearch URL not set (or non-HTTP); using PostgreSQL search fallback.');
    return;
  }

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
    console.warn('⚠️ Elasticsearch init warning (will fallback to Postgres):', err.message);
  }
}
