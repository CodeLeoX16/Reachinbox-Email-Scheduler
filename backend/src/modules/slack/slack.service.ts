import axios from 'axios';

export async function sendSlackRateLimitAlert(params: {
  accessToken: string;
  channelId: string;
  senderEmail: string;
  hourlyLimit: number;
  windowStr: string;
  minutesUntilReset: number;
}) {
  const response = await axios.post(
    'https://slack.com/api/chat.postMessage',
    {
      channel: params.channelId,
      text: `⚠️ *ReachInbox Rate Limit Hit* — Sender \`${params.senderEmail}\` reached its hourly limit of *${params.hourlyLimit} emails/hr*.`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ Sender Hourly Rate Limit Reached',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Sender:*\n\`${params.senderEmail}\`` },
            { type: 'mrkdwn', text: `*Hourly Limit:*\n${params.hourlyLimit} emails/hr` },
            { type: 'mrkdwn', text: `*UTC Window:*\n${params.windowStr}` },
            {
              type: 'mrkdwn',
              text: `*Action Taken:*\nQueued emails delayed ~${params.minutesUntilReset}m to next hour window`,
            },
          ],
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.data.ok) {
    throw new Error(`Slack API error: ${response.data.error}`);
  }
  console.log(`📣 Sent live Slack rate-limit alert to channel ${params.channelId}`);
}