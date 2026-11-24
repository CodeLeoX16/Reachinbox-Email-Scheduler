import React from 'react';
import { ArrowLeft, Star, Trash2, ExternalLink } from 'lucide-react';
import { EmailJob } from '../../types';
import { formatDetailDate } from '../../utils/date';

interface EmailDetailViewProps {
  email: EmailJob;
  onBack: () => void;
}

export const EmailDetailView: React.FC<EmailDetailViewProps> = ({ email, onBack }) => {
  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      {/* Detail Top Header */}
      <div className="h-12 border-b border-gray-100 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-gray-900 truncate">{email.subject}</h2>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          {email.previewUrl && (
            <a
              href={email.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-mint text-brand-green hover:underline mr-2"
            >
              Ethereal SMTP Preview
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button className="p-1.5 hover:text-amber-400">
            <Star className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Email Body Container */}
      <div className="max-w-3xl w-full mx-auto px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-green text-white font-semibold text-sm flex items-center justify-center">
              {email.sender.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{email.sender.name}</span>
                <span className="text-xs text-gray-400">&lt;{email.sender.email}&gt;</span>
              </div>
              <p className="text-xs text-gray-500">to {email.recipientEmail}</p>
            </div>
          </div>

          <span className="text-xs text-gray-400">
            {formatDetailDate(email.sentAt || email.scheduledAt)}
          </span>
        </div>

        {email.errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            <strong>Delivery Error:</strong> {email.errorMessage}
          </div>
        )}

        <div
          className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>
    </div>
  );
};