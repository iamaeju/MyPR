import React, { useEffect, useRef, useState } from 'react';
import { Link2, SlidersHorizontal, X } from 'lucide-react';
import type { PRCardData, PRCardDraft } from '../types/card';
import { buildCardDraftFromUrl } from '../utils/linkPlatform';
import { PRCard } from './PRCard';

interface CreateCardPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** Save the card built from the link straight away. */
  onCreate: (draft: PRCardDraft) => void;
  /** Open the full card editor, prefilled from the link (or blank). */
  onCustomize: (draft: PRCardDraft | null) => void;
}

/** #03 — "CREATE MYPR CARD": paste a link, press OK, get a card. */
export const CreateCardPopup: React.FC<CreateCardPopupProps> = ({
  isOpen,
  onClose,
  onCreate,
  onCustomize,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setUrl('');
    setError(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const draft = url.trim() ? buildCardDraftFromUrl(url) : null;
  const preview: PRCardData | null = draft ? { ...draft, id: 'preview', createdAt: 0 } : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('카드로 만들 사이트 주소를 입력해주세요.');
      return;
    }
    if (!draft) {
      setError('올바른 주소가 아니에요. 예: instagram.com/내아이디');
      return;
    }
    onCreate(draft);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-[3px] p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-card-heading"
        onSubmit={handleSubmit}
        noValidate
        className="relative w-full max-w-[400px] rounded-[28px] bg-[#F7F7F5] p-6 pt-8 shadow-[0_30px_80px_rgba(0,0,0,0.3)] animate-[popIn_220ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-[#555555] hover:bg-black/5 cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <h2
          id="create-card-heading"
          className="text-center text-[30px] leading-[1.05] font-bold tracking-[-0.03em] text-[#111111]"
        >
          CREATE
          <br />
          MYPR
          <br />
          CARD
        </h2>
        <p className="mt-3 text-center text-[14px] text-[#888888]">
          카드로 만들 사이트 주소를 넣어주세요.
        </p>

        <div className="mt-5 min-h-[40px]">
          {preview ? (
            <div className="pointer-events-none">
              <PRCard card={preview} isActive isInteractive={false} />
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white border border-[#E3E3E0] pl-3.5 pr-1.5 h-14 focus-within:border-[#111111] transition-colors">
          <Link2 className="w-5 h-5 text-[#999999] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="https://"
            aria-label="카드로 만들 사이트 주소"
            aria-invalid={Boolean(error)}
            className="flex-1 min-w-0 h-full bg-transparent text-[16px] text-[#111111] placeholder:text-[#B0B0AC] focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-[#111111] text-white text-[15px] font-bold hover:bg-[#2A2A2A] transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2.5 text-[13px] text-[#C2412B]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => onCustomize(draft)}
          className="mt-4 mx-auto flex items-center gap-1.5 h-10 px-3 rounded-xl text-[13px] font-medium text-[#555555] hover:text-[#111111] hover:bg-black/5 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          색상·글꼴·사진까지 직접 꾸미기
        </button>
      </form>
    </div>
  );
};
