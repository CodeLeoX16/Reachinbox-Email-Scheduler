import { useCallback, useEffect, useState } from 'react';
import { EmailJob } from '../types';
import { emailsApi } from '../services/api';

export function useEmails(
  tab: 'SCHEDULED' | 'SENT',
  searchQuery: string,
  statusFilter: 'SCHEDULED' | 'SENT' | 'FAILED' | null
) {
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [counts, setCounts] = useState({ scheduled: 0, sent: 0 });
  const [loading, setLoading] = useState(true);

  const fetchEmails = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const { data } = await emailsApi.list(
          tab,
          searchQuery,
          statusFilter || undefined
        );
        setEmails(data.emails);
        setCounts(data.counts);
      } catch (err) {
        console.error('Failed to load emails', err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [tab, searchQuery, statusFilter]
  );

  useEffect(() => {
    fetchEmails(false);
    const interval = setInterval(() => fetchEmails(true), 5000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  return { emails, counts, loading, refetch: () => fetchEmails(false) };
}