import React, { useState } from 'react';
import { Clock, Send, ChevronDown, LogOut, Hash, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { slackApi } from '../../services/api';
import { Button } from '../common/Button';

interface SidebarProps {
  activeTab: 'SCHEDULED' | 'SENT';
  onTabChange: (tab: 'SCHEDULED' | 'SENT') => void;
  onComposeClick: () => void;
  counts: { scheduled: number; sent: number };
  onToast: (type: 'success' | 'error', text: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onComposeClick,
  counts,
  onToast,
}) => {
  const { user, logout, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [slackLoading, setSlackLoading] = useState(false);

  const handleSlackAction = async () => {
    setSlackLoading(true);
    try {
      if (user?.slackConnected) {
        await slackApi.disconnect();
        await refreshUser();
        onToast('success', 'Disconnected Slack notifications');
      } else {
        const { data } = await slackApi.getAuthUrl();
        window.location.href = data.url;
      }
    } catch (err: any) {
      onToast('error', err.response?.data?.error || 'Slack connection error');
    } finally {
      setSlackLoading(false);
    }
  };

  return (
    <aside className="w-[176px] border-r border-gray-100 bg-white flex flex-col justify-between p-3 shrink-0">
      <div>
        {/* Brand Logo matching Figma "ONB" */}
        <div className="px-2 pt-1 pb-5">
          <span className="text-2xl font-black tracking-tighter text-gray-900 select-none">
            ON<span className="text-brand-green">B</span>
          </span>
        </div>

        {/* User Profile Card + Logout Dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    user?.name || 'U'
                  )}`
                }
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          </button>

          {menuOpen && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Primary Compose Button */}
        <Button variant="outline" className="w-full mb-6" onClick={onComposeClick}>
          Compose
        </Button>

        {/* CORE Navigation */}
        <div>
          <p className="px-2 text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">
            CORE
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => onTabChange('SCHEDULED')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'SCHEDULED'
                  ? 'bg-brand-mint text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-gray-500" />
                Scheduled
              </span>
              <span className="text-[11px] text-gray-500">{counts.scheduled}</span>
            </button>

            <button
              onClick={() => onTabChange('SENT')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'SENT'
                  ? 'bg-brand-mint text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-gray-500" />
                Sent
              </span>
              <span className="text-[11px] text-gray-500">{counts.sent}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Slack Rate-Limit Alert Integration Card */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handleSlackAction}
          disabled={slackLoading}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
            user?.slackConnected
              ? 'border-brand-mintBorder bg-brand-mint/50 text-gray-800 hover:bg-brand-mint'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            {user?.slackConnected ? (
              <CheckCircle className="w-4 h-4 text-brand-green shrink-0" />
            ) : (
              <Hash className="w-4 h-4 text-purple-600 shrink-0" />
            )}
            <span className="truncate">
              {user?.slackConnected
                ? `Slack (${user.slackChannelName || 'Connected'})`
                : 'Connect Slack'}
            </span>
          </span>
        </button>
      </div>
    </aside>
  );
};