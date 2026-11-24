import React from 'react';
import { Clock } from 'lucide-react';
import { EmailStatus } from '../../types';
import { formatScheduledPill } from '../../utils/date';

interface BadgeProps {
  status: EmailStatus;
  scheduledAt: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, scheduledAt }) => {
  if (status === 'SCHEDULED' || status === 'PROCESSING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-amberBg text-brand-amberText whitespace-nowrap">
        <Clock className="w-3 h-3" />
        {formatScheduledPill(scheduledAt)}
      </span>
    );
  }

  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
      Sent
    </span>
  );
};