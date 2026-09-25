import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface NotificationToastProps {
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
}) => {
  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-teal-600 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-300 text-stone-800 shadow-lg shadow-emerald-900/5',
    error: 'bg-white border-rose-300 text-stone-800 shadow-lg shadow-rose-900/5',
    info: 'bg-white border-teal-300 text-stone-800 shadow-lg shadow-teal-900/5',
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border ${bgStyles[notification.type]}`}
      >
        <div className="flex items-center gap-3">
          {icons[notification.type]}
          <span className="text-sm font-medium">
            {notification.message}
          </span>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="ml-3 text-stone-400 hover:text-stone-600 p-1 rounded-md"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
