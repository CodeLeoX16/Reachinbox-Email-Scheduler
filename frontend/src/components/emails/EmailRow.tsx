import React from 'react';
import { Star } from 'lucide-react';
import { EmailJob } from '../../types';
import { Badge } from '../common/Badge';
import { stripHtml } from '../../utils/emailParser';

interface EmailRowProps {
  email: EmailJob;
  onSelect: (email: EmailJob) => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({ email, onSelect }) => {
  const previewText = stripHtml(email.body);

  return (
    <div
      onClick={() => onSelect(email)}
      className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer transition-colors group"
    >
      {/* Recipient */}
      <div className="w-56 shrink-0 pr-4 truncate">
        <span className="text-xs font-medium text-gray-800">
          To: {email.recipientName || email.recipientEmail.split('@')[0]}
        </span>
      </div>

      {/* Status Badge + Subject + Snippet */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <Badge status={email.status} scheduledAt={email.scheduledAt} />

        <div className="truncate text-xs">
          <span className="font-semibold text-gray-900">{email.subject}</span>
          {previewText && <span className="text-gray-400 ml-1.5">- {previewText}</span>}
        </div>
      </div>

      {/* Right Star Action */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="ml-4 text-gray-300 hover:text-amber-400 transition-colors shrink-0"
      >
        <Star className="w-4 h-4" />
      </button>
    </div>
  );
};