import React, { useEffect, useState } from 'react';
import { EmailJob } from '../types';
import { useEmails } from '../hooks/useEmails';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { EmailList } from '../components/emails/EmailList';
import { EmailDetailView } from '../components/emails/EmailDetailView';
import { ComposeView } from '../components/emails/ComposeView';
import { ToastContainer, ToastMessage } from '../components/common/Toast';

export const DashboardPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'SENT'>('SCHEDULED');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'SCHEDULED' | 'SENT' | 'FAILED' | null
  >(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { emails, counts, loading, refetch } = useEmails(
    activeTab,
    searchQuery,
    statusFilter
  );

  const addToast = (type: 'success' | 'error', text: string) => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Check if user just returned from Slack OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slackStatus = params.get('slack');
    if (slackStatus === 'connected') {
      refreshUser();
      addToast('success', 'Slack connected! Rate-limit alerts are now active.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (slackStatus === 'error') {
      addToast('error', 'Failed to connect Slack workspace.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleTabChange = (tab: 'SCHEDULED' | 'SENT') => {
    setActiveTab(tab);
    setStatusFilter(null);
    setSelectedEmail(null);
    setIsComposing(false);
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onComposeClick={() => {
          setIsComposing(true);
          setSelectedEmail(null);
        }}
        counts={counts}
        onToast={addToast}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {isComposing ? (
          <ComposeView
            onBack={() => setIsComposing(false)}
            onScheduledSuccess={(count) => {
              setIsComposing(false);
              setActiveTab('SCHEDULED');
              refetch();
              addToast('success', `Successfully scheduled ${count} email(s)!`);
            }}
            onToast={addToast}
          />
        ) : selectedEmail ? (
          <EmailDetailView email={selectedEmail} onBack={() => setSelectedEmail(null)} />
        ) : (
          <>
            <TopBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={refetch}
              statusFilter={statusFilter}
              onStatusFilterChange={(status) => {
                setStatusFilter(status);
                setSelectedEmail(null);
                setActiveTab(status === 'SCHEDULED' ? 'SCHEDULED' : 'SENT');
              }}
            />
            <div className="flex-1 overflow-y-auto">
              <EmailList
                emails={emails}
                loading={loading}
                tab={activeTab}
                onSelectEmail={(email) => setSelectedEmail(email)}
              />
            </div>
          </>
        )}
      </main>

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
};