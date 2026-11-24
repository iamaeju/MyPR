import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'info' | 'success';
}

interface NotificationToastProps {
  toast: ToastMessage | null;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-none px-4 w-full max-w-sm flex justify-center"
    >
      <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-[13px] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-white/10">
        {toast.tone === 'success' ? (
          <Check className="w-4 h-4 text-[#A7F3D0] shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-4 h-4 text-white/75 shrink-0" aria-hidden="true" />
        )}
        <span>{toast.text}</span>
      </div>
    </div>
  );
};
