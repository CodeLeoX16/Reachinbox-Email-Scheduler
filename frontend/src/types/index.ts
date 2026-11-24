export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  slackConnected?: boolean;
  slackChannelName?: string | null;
  slackTeamName?: string | null;
}

export interface Sender {
  id: string;
  email: string;
  name: string;
  smtpHost: string;
  smtpPort: number;
}

export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface EmailJob {
  id: string;
  senderId: string;
  sender: {
    id: string;
    email: string;
    name: string;
  };
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string | null;
  delayMs: number;
  hourlyLimit: number;
  errorMessage?: string | null;
  previewUrl?: string | null;
  createdAt: string;
}

export interface EmailsResponse {
  emails: EmailJob[];
  counts: {
    scheduled: number;
    sent: number;
  };
}