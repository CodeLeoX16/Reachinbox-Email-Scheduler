import { EmailJob, Sender } from '@prisma/client';
import { esClient, EMAIL_INDEX } from '../config/elasticsearch';
import { prisma } from '../config/database';

type EmailWithSender = EmailJob & { sender: Sender };

export async function indexEmailDocument(email: EmailWithSender) {
  const client = esClient;
  if (!client) return;

  try {
    await client.index({
      index: EMAIL_INDEX,
      id: email.id,
      document: {
        id: email.id,
        userId: email.userId,
        senderEmail: email.sender.email,
        recipientEmail: email.recipientEmail,
        recipientName: email.recipientName || '',
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt,
        sentAt: email.sentAt,
      },
      refresh: true,
    });
  } catch (err: any) {
    console.warn(`⚠️ Elasticsearch index error for ${email.id}:`, err.message);
  }
}

export async function searchEmailsInES(
  userId: string,
  query: string,
  statusFilter?: 'SCHEDULED' | 'SENT' | 'FAILED'
): Promise<string[] | null> {
  const client = esClient;
  if (!client) return null;

  try {
    const mustClauses: any[] = [
      { term: { userId } },
      {
        multi_match: {
          query,
          fields: ['recipientEmail^3', 'recipientName^2', 'subject^2', 'body'],
          fuzziness: 'AUTO',
        },
      },
    ];

    if (statusFilter === 'SCHEDULED') {
      mustClauses.push({ terms: { status: ['SCHEDULED', 'PROCESSING'] } });
    } else if (statusFilter === 'SENT') {
      mustClauses.push({ term: { status: 'SENT' } });
    } else if (statusFilter === 'FAILED') {
      mustClauses.push({ term: { status: 'FAILED' } });
    }

    const result = await client.search({
      index: EMAIL_INDEX,
      size: 100,
      query: {
        bool: { must: mustClauses },
      },
    });

    return result.hits.hits.map((hit) => hit._id!);
  } catch (err: any) {
    console.warn('⚠️ Elasticsearch search fallback to Postgres:', err.message);
    return null;
  }
}

export async function reindexAllEmails() {
  const all = await prisma.emailJob.findMany({ include: { sender: true } });
  for (const item of all) {
    await indexEmailDocument(item);
  }
}
