import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Share2, X } from 'lucide-react';
import { pageUrl } from '../utils/handle';

interface ShareModalProps {
  isOpen: boolean;
  handle: string;
  name: string;
  /** False while pages are only saved on this device. */
  isPublic: boolean;
  onClose: () => void;
  onEditAddress: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  handle,
  name,
  isPublic,
  onClose,
  onEditAddress,
}) => {
  const [copied, setCopied] = useState(false);
  const url = pageUrl(handle);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: select-and-copy fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    try {
      await navigator.share({ title: `${name} | MyPR`, text: `${name}님의 MyPR 카드`, url });
    } catch {
      // Cancelled by the person, nothing to do
    }
  };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-heading"
        className="w-full sm:max-w-[420px] bg-[#F7F7F5] rounded-t-[28px] sm:rounded-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_24px_60px_rgba(0,0,0,0.2)] animate-[popIn_220ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="share-heading" className="text-[17px] font-bold tracking-[-0.02em]">
            내 MyPR 공유하기
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {isPublic ? (
          <p className="mt-1 text-[14px] text-[#777777]">
            이 주소를 보내면 누구나 로그인 없이 내 카드를 볼 수 있어요.
          </p>
        ) : (
          <p className="mt-1 text-[14px] text-[#C2412B]">
            아직 서버에 저장되지 않아 다른 사람은 이 주소를 열 수 없어요.
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white border border-[#E3E3E0] pl-4 pr-1.5 h-14">
          <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-[#111111]" title={url}>
            {url.replace(/^https?:\/\//, '')}
          </span>
          <button
            type="button"
            onClick={copy}
            className="h-11 px-4 rounded-xl bg-[#111111] text-white text-[14px] font-bold inline-flex items-center gap-1.5 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {canNativeShare ? (
            <button
              type="button"
              onClick={share}
              className="h-12 rounded-2xl bg-white border border-[#E3E3E0] text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:border-[#111111] cursor-pointer"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              공유하기
            </button>
          ) : (
            <button
              type="button"
              onClick={onEditAddress}
              className="h-12 rounded-2xl bg-white border border-[#E3E3E0] text-[14px] font-semibold hover:border-[#111111] cursor-pointer"
            >
              주소 바꾸기
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-2xl bg-white border border-[#E3E3E0] text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:border-[#111111]"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            내 페이지 보기
          </a>
        </div>

        {canNativeShare && (
          <button
            type="button"
            onClick={onEditAddress}
            className="mt-3 mx-auto block h-9 px-3 rounded-xl text-[13px] text-[#777777] underline underline-offset-2 hover:text-[#111111] cursor-pointer"
          >
            주소 바꾸기
          </button>
        )}
      </div>
    </div>
  );
};
