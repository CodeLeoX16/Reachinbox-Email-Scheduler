import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCw } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  statusFilter: 'SCHEDULED' | 'SENT' | 'FAILED' | null;
  onStatusFilterChange: (status: 'SCHEDULED' | 'SENT' | 'FAILED') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const options: Array<{
    value: 'SCHEDULED' | 'SENT' | 'FAILED';
    label: string;
  }> = [
    { value: 'SCHEDULED', label: 'Scheduled email' },
    { value: 'SENT', label: 'Sent email' },
    { value: 'FAILED', label: 'Failed email' },
  ];

  return (
    <header className="h-12 border-b border-gray-100 px-4 flex items-center gap-2 bg-white shrink-0">
      <div className="relative flex-1 max-w-[360px]">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search emails via Elasticsearch..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-gray-100/80 border border-transparent focus:border-gray-200 focus:bg-white rounded-full outline-none transition-all"
        />
      </div>

      <div className="relative">
        <button
          onClick={() => setFilterOpen((open) => !open)}
          title="Filter emails"
          className={`p-2 rounded-full transition-colors ${
            statusFilter
              ? 'bg-brand-mint text-brand-green'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {filterOpen && (
          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onStatusFilterChange(option.value);
                  setFilterOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  statusFilter === option.value
                    ? 'bg-brand-mint font-medium text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onRefresh}
        title="Sync now"
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <RotateCw className="w-4 h-4" />
      </button>
    </header>
  );
};