import React from 'react';

export const Loader: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
    <div className="w-7 h-7 border-2 border-brand-green border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-xs font-medium">{label}</span>
  </div>
);