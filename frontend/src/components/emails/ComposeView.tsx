import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Upload, Clock, X, Plus, Paperclip, FileText, Image } from 'lucide-react';
import { Sender } from '../../types';
import { emailsApi, sendersApi } from '../../services/api';
import { parseEmailsFromFile } from '../../utils/emailParser';
import { getPresetDate } from '../../utils/date';
import { Button } from '../common/Button';
import { RichTextEditor } from './RichTextEditor';

interface ComposeViewProps {
  onBack: () => void;
  onScheduledSuccess: (count: number) => void;
  onToast: (type: 'success' | 'error', text: string) => void;
}

export const ComposeView: React.FC<ComposeViewProps> = ({
  onBack,
  onScheduledSuccess,
  onToast,
}) => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Array<{
    name: string;
    contentType: string;
    contentBase64: string;
  }>>([]);
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(200);

  // Send Later Popover State
  const [sendLaterOpen, setSendLaterOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [customSenderOpen, setCustomSenderOpen] = useState(false);
  const [customSenderSaving, setCustomSenderSaving] = useState(false);
  const [customSender, setCustomSender] = useState({
    name: '',
    email: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sendersApi.list().then(({ data }) => {
      setSenders(data.senders);
      if (data.senders.length > 0) {
        setSelectedSenderId(data.senders[0].id);
      }
    });
  }, []);

  const handleAddEtherealSender = async () => {
    try {
      const { data } = await sendersApi.createEthereal();
      setSenders((prev) => [...prev, data.sender]);
      setSelectedSenderId(data.sender.id);
      onToast('success', `Created new Ethereal sender: ${data.sender.email}`);
    } catch {
      onToast('error', 'Could not create Ethereal sender');
    }
  };

  const handleAddCustomSender = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSenderSaving(true);
    try {
      const { data } = await sendersApi.createCustom(customSender);
      setSenders((prev) => {
        const withoutDuplicate = prev.filter((sender) => sender.id !== data.sender.id);
        return [...withoutDuplicate, data.sender];
      });
      setSelectedSenderId(data.sender.id);
      setCustomSenderOpen(false);
      setCustomSender({
        name: '',
        email: '',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
      });
      onToast('success', `Added custom sender: ${data.sender.email}`);
    } catch (err: any) {
      onToast('error', err.response?.data?.error || 'Could not add custom email account');
    } finally {
      setCustomSenderSaving(false);
    }
  };

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = recipientInput.trim().replace(/,$/, '').toLowerCase();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (!recipients.includes(email)) {
          setRecipients((prev) => [...prev, email]);
        }
        setRecipientInput('');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const extracted = await parseEmailsFromFile(file);
      if (extracted.length === 0) {
        onToast('error', 'No valid email addresses found in file.');
        return;
      }
      setRecipients((prev) => Array.from(new Set([...prev, ...extracted])));
      onToast('success', `Detected ${extracted.length} valid email addresses from ${file.name}`);
    } catch {
      onToast('error', 'Failed to parse uploaded file');
    } finally {
      e.target.value = '';
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const acceptedFiles = files.filter((file) => file.size <= MAX_FILE_SIZE);
    if (acceptedFiles.length !== files.length) {
      onToast('error', 'Each attachment must be 10 MB or smaller');
    }

    try {
      const encoded = await Promise.all(
        acceptedFiles.map(
          (file) =>
            new Promise<{
              name: string;
              contentType: string;
              contentBase64: string;
            }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  name: file.name,
                  contentType: file.type || 'application/octet-stream',
                  contentBase64: String(reader.result).split(',')[1] || '',
                });
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            })
        )
      );

      setAttachments((prev) => {
        const combined = [...prev];
        for (const attachment of encoded) {
          if (!combined.some((item) => item.name === attachment.name)) {
            combined.push(attachment);
          }
        }
        return combined;
      });
    } catch {
      onToast('error', 'Failed to read one of the attachments');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (useScheduledTime: boolean) => {
    if (!selectedSenderId) {
      onToast('error', 'Please select a sender email');
      return;
    }

    // Include any typed email in input box if user didn't press Enter
    let finalRecipients = [...recipients];
    const pendingEmail = recipientInput.trim().toLowerCase();
    if (pendingEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pendingEmail)) {
      finalRecipients = Array.from(new Set([...finalRecipients, pendingEmail]));
    }

    if (finalRecipients.length === 0) {
      onToast('error', 'Please add at least one recipient or upload a CSV/TXT file');
      return;
    }
    if (!subject.trim()) {
      onToast('error', 'Subject is required');
      return;
    }
    if (!body.trim()) {
      onToast('error', 'Email body cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const startTimeIso =
        useScheduledTime && scheduledDateTime
          ? new Date(scheduledDateTime).toISOString()
          : new Date().toISOString();

      const { data } = await emailsApi.schedule({
        senderId: selectedSenderId,
        recipients: finalRecipients,
        subject: subject.trim(),
        body,
        attachments,
        startTime: startTimeIso,
        delayBetweenEmailsSeconds: Number(delaySeconds) || 2,
        hourlyLimit: Number(hourlyLimit) || 200,
      });

      onScheduledSuccess(data.count);
    } catch (err: any) {
      onToast('error', err.response?.data?.error || 'Failed to schedule emails');
    } finally {
      setSubmitting(false);
    }
  };

  const applyPreset = (preset: 'tomorrow_9' | 'tomorrow_10' | 'tomorrow_11' | 'tomorrow_15') => {
    const dt = getPresetDate(preset);
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduledDateTime(localIso);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      {/* Top Action Header */}
      <div className="h-12 border-b border-gray-100 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Compose New Email</h1>
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            type="button"
            onClick={() => setSendLaterOpen((prev) => !prev)}
            className="p-2 text-gray-400 hover:text-brand-green rounded-full hover:bg-brand-mint transition-colors"
            title="Schedule Send Time"
          >
            <Clock className="w-4 h-4" />
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSendLaterOpen((prev) => !prev)}
          >
            {scheduledDateTime ? 'Scheduled' : 'Send Later'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={submitting}
            onClick={() => handleSubmit(Boolean(scheduledDateTime))}
          >
            {submitting ? 'Scheduling...' : scheduledDateTime ? 'Schedule' : 'Send'}
          </Button>

          {/* Send Later Popover matching Figma */}
          {sendLaterOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-40">
              <p className="text-xs font-semibold text-gray-900 mb-3">Send Later</p>

              <label className="block text-[11px] text-gray-500 mb-1">Pick date &amp; time</label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg mb-3 outline-none focus:border-brand-green"
              />

              <div className="space-y-1.5 border-t border-gray-100 pt-2.5 mb-3">
                {[
                  { label: 'Tomorrow', key: 'tomorrow_9' as const },
                  { label: 'Tomorrow, 10:00 AM', key: 'tomorrow_10' as const },
                  { label: 'Tomorrow, 11:00 AM', key: 'tomorrow_11' as const },
                  { label: 'Tomorrow, 3:00 PM', key: 'tomorrow_15' as const },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => applyPreset(item.key)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setScheduledDateTime('');
                    setSendLaterOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setSendLaterOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Body */}
      <div className="w-full px-5 py-4 space-y-3">
        {/* From Row */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-3">
          <label className="w-20 text-xs font-medium text-gray-500">From</label>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 rounded-lg text-gray-800 outline-none"
            >
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddEtherealSender}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-green hover:underline"
            >
              <Plus className="w-3 h-3" /> Add Ethereal Sender
            </button>
            <button
              type="button"
              onClick={() => setCustomSenderOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:text-brand-green hover:underline"
            >
              <Plus className="w-3 h-3" /> Add Custom Email
            </button>
          </div>
        </div>

        {/* To Row + CSV/TXT Upload List */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <label className="w-20 text-xs font-medium text-gray-500 shrink-0">To</label>
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {recipients.slice(0, 3).map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-brand-mint text-gray-800 border border-brand-mintBorder"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => setRecipients((prev) => prev.filter((r) => r !== email))}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {recipients.length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-mint text-brand-green">
                  +{recipients.length - 3} ({recipients.length} total)
                </span>
              )}

              <input
                type="text"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={handleRecipientKeyDown}
                placeholder={
                  recipients.length === 0 ? 'recipient@example.com (press Enter)' : 'Add more...'
                }
                className="flex-1 min-w-[180px] text-xs outline-none py-1"
              />
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-green hover:underline shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload List
            </button>
          </div>
        </div>

        {/* Subject Row */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-3">
          <label className="w-20 text-xs font-medium text-gray-500">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 text-xs text-gray-900 outline-none"
          />
        </div>

        {/* Delay Between Emails & Hourly Limit Row */}
        <div className="flex flex-wrap items-center gap-6 py-2">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-700">
              Delay between 2 emails (sec)
            </label>
            <input
              type="number"
              min={1}
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Number(e.target.value))}
              className="w-16 px-2.5 py-1.5 text-xs text-center border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-700">Hourly Limit</label>
            <input
              type="number"
              min={1}
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(Number(e.target.value))}
              className="w-20 px-2.5 py-1.5 text-xs text-center border border-gray-200 rounded-lg outline-none focus:border-brand-green"
            />
          </div>
        </div>

        {/* Rich Text Editor */}
        <RichTextEditor value={body} onChange={setBody} />

        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          <input
            ref={attachmentInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            onChange={handleAttachmentUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-brand-green hover:text-brand-green"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Add Images or Documents
          </button>

          {attachments.map((attachment) => (
            <span
              key={`${attachment.name}-${attachment.contentType}`}
              className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-brand-mintBorder bg-brand-mint/50 px-2.5 py-1 text-[11px] text-gray-700"
              title={attachment.name}
            >
              {attachment.contentType.startsWith('image/') ? (
                <Image className="h-3 w-3 shrink-0 text-brand-green" />
              ) : (
                <FileText className="h-3 w-3 shrink-0 text-brand-green" />
              )}
              <span className="truncate">{attachment.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) =>
                    prev.filter((item) => item.name !== attachment.name)
                  )
                }
                className="ml-0.5 text-gray-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {customSenderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
          <form
            onSubmit={handleAddCustomSender}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Add Custom Email</h2>
                <p className="mt-1 text-[11px] text-gray-500">
                  Credentials are stored for this account and used by the existing email worker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomSenderOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs font-medium text-gray-700">
                Sender name
                <input
                  required
                  value={customSender.name}
                  onChange={(e) =>
                    setCustomSender((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Oliver Brown"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-green"
                />
              </label>

              <label className="col-span-2 text-xs font-medium text-gray-700">
                From email
                <input
                  required
                  type="email"
                  value={customSender.email}
                  onChange={(e) =>
                    setCustomSender((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-green"
                />
              </label>

              <label className="text-xs font-medium text-gray-700">
                SMTP host
                <input
                  required
                  value={customSender.smtpHost}
                  onChange={(e) =>
                    setCustomSender((prev) => ({ ...prev, smtpHost: e.target.value }))
                  }
                  placeholder="smtp.gmail.com"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-green"
                />
              </label>

              <label className="text-xs font-medium text-gray-700">
                SMTP port
                <input
                  required
                  type="number"
                  min={1}
                  max={65535}
                  value={customSender.smtpPort}
                  onChange={(e) =>
                    setCustomSender((prev) => ({
                      ...prev,
                      smtpPort: Number(e.target.value) || 587,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-green"
                />
              </label>

              <label className="col-span-2 text-xs font-medium text-gray-700">
                SMTP username
                <input
                  value={customSender.smtpUser}
                  onChange={(e) =>
                    setCustomSender((prev) => ({ ...prev, smtpUser: e.target.value }))
                  }
                  placeholder="Defaults to the from email"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-green"
                />
              </label>

              <label className="col-span-2 text-xs font-medium text-gray-700">
                Password / app password
                <input
                  required
                  type="password"
                  value={customSender.smtpPass}
                  onChange={(e) =>
                    setCustomSender((prev) => ({ ...prev, smtpPass: e.target.value }))
                  }
                  placeholder="Use an app password when 2FA is enabled"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-brand-green"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomSenderOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={customSenderSaving}>
                {customSenderSaving ? 'Adding...' : 'Add Email'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};