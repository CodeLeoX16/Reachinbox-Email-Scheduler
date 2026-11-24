import axios from 'axios';
import { EmailsResponse, Sender, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reachinbox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  loginWithGoogle: (payload: { credential?: string; accessToken?: string }) =>
    api.post<{ token: string; user: User }>('/auth/google', payload),
  loginDemo: () => api.post<{ token: string; user: User }>('/auth/demo'),
  getMe: () => api.get<User>('/auth/me'),
};

export const sendersApi = {
  list: () => api.get<{ senders: Sender[] }>('/senders'),
  createEthereal: (name?: string) => api.post<{ sender: Sender }>('/senders/ethereal', { name }),
  createCustom: (payload: {
    name: string;
    email: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser?: string;
    smtpPass: string;
  }) => api.post<{ sender: Sender }>('/senders/custom', payload),
};

export const emailsApi = {
  list: (
    tab: 'SCHEDULED' | 'SENT',
    q?: string,
    status?: 'SCHEDULED' | 'SENT' | 'FAILED'
  ) =>
    api.get<EmailsResponse>('/emails', {
      params: { tab, q: q || undefined, status: status || undefined },
    }),
  schedule: (payload: {
    senderId: string;
    recipients: string[];
    subject: string;
    body: string;
    attachments?: Array<{
      name: string;
      contentType: string;
      contentBase64: string;
    }>;
    startTime?: string;
    delayBetweenEmailsSeconds: number;
    hourlyLimit: number;
  }) => api.post('/emails/schedule', payload),
};

export const slackApi = {
  getAuthUrl: () => api.get<{ url: string }>('/slack/auth-url'),
  disconnect: () => api.post('/slack/disconnect'),
};