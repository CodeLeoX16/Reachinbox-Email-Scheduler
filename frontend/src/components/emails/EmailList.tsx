import React from 'react';
import { EmailJob } from '../../types';
import { EmailRow } from './EmailRow';
import { Loader } from '../common/Loader';
import { EmptyState } from '../common/EmptyState';

interface EmailListProps {
  emails: EmailJob[];
  loading: boolean;
  tab: 'SCHEDULED' | 'SENT';
  onSelectEmail: (email: EmailJob) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  loading,
  tab,
  onSelectEmail,
}) => {
  if (loading) {
    return <Loader label={`Loading ${tab.toLowerCase()} emails...`} />;
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        title={tab === 'SCHEDULED' ? 'No scheduled emails' : 'No sent emails yet'}
        description={
          tab === 'SCHEDULED'
            ? 'Click "Compose" in the left sidebar to schedule your first batch of outreach emails.'
            : 'Once your scheduled emails are dispatched by the BullMQ worker, they will appear here.'
        }
      />
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {emails.map((email) => (
        <EmailRow key={email.id} email={email} onSelect={onSelectEmail} />
      ))}
    </div>
  );
};