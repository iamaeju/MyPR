import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { MyPRLogo } from './MyPRLogo';

interface HeaderProps {
  onOpenManage: () => void;
  onResetScroll?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenManage, onResetScroll }) => {
  return (
    <header className="w-full max-w-5xl mx-auto px-5 sm:px-8 pt-5 pb-3 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onResetScroll}
        className="inline-flex items-center gap-2.5 min-h-[44px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] rounded-lg pr-2 transition-opacity hover:opacity-80 cursor-pointer"
        aria-label="MyPR — Presentation Represented by Myself"
      >
        <MyPRLogo className="h-7 sm:h-8 w-auto shrink-0" />
        <span className="text-[20px] sm:text-[22px] font-bold tracking-[-0.03em] text-[#111111] leading-none whitespace-nowrap">
          MyPR
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenManage}
        aria-label="Manage Cards (카드 관리)"
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#E8E8E8] text-[#111111] text-[13px] font-medium tracking-[-0.01em] whitespace-nowrap shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Manage Cards</span>
      </button>
    </header>
  );
};
