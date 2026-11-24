import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium bg-white ${
            t.type === 'success'
              ? 'border-brand-mintBorder text-gray-800'
              : 'border-red-200 text-red-700'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{t.text}</span>
          <button onClick={() => onDismiss(t.id)} className="text-gray-400 hover:text-gray-600 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};