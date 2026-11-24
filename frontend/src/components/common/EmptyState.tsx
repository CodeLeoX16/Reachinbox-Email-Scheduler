
import React from 'react';
import { MailOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center px-4">
    <div className="w-12 h-12 rounded-full bg-brand-mint flex items-center justify-center text-brand-green mb-4">
      <MailOpen className="w-6 h-6" />
    </div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
  </div>
);