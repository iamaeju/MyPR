import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import type { PRCardData } from '../types/card';
import { PRCard } from './PRCard';

interface CardManagementProps {
  isOpen: boolean;
  cards: PRCardData[];
  activeIndex: number;
  onClose: () => void;
  onSelectCard: (index: number) => void;
  onOpenAdd: () => void;
  onOpenEdit: (card: PRCardData) => void;
  onMoveCard: (fromIndex: number, toIndex: number) => void;
  onDeleteCard: (cardId: string) => void;
  onResetDefaults: () => void;
}

export const CardManagement: React.FC<CardManagementProps> = ({
  isOpen,
  cards,
  activeIndex,
  onClose,
  onSelectCard,
  onOpenAdd,
  onOpenEdit,
  onMoveCard,
  onDeleteCard,
  onResetDefaults,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmDeleteId(null);
      setConfirmReset(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const previewCard = cards[activeIndex] ?? cards[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-[120] flex justify-end bg-black/35 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Manage Cards"
        className="w-full max-w-[460px] h-full bg-[#FFFFFF] border-l border-[#E8E8E8] shadow-[-16px_0_48px_rgba(0,0,0,0.12)] flex flex-col"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E8E8E8]">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#111111]">
              Manage Cards
            </h2>
            <p className="text-[12px] text-[#888888] mt-0.5 tabular-nums">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} in your collection
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close card management"
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#888888] hover:text-[#111111] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Live Selected Card Preview */}
        {previewCard && (
          <div className="px-5 sm:px-6 py-4 bg-[#F7F7F5] border-b border-[#E8E8E8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#888888]">
                Active Card Preview
              </span>
              <button
                type="button"
                onClick={() => onOpenEdit(previewCard)}
                className="text-[12px] font-medium text-[#111111] hover:underline cursor-pointer"
              >
                Customize
              </button>
            </div>
            <div className="max-w-[270px] mx-auto shadow-[0_12px_28px_-10px_rgba(17,17,17,0.18)] rounded-[24px]">
              <PRCard card={previewCard} isInteractive={false} compact />
            </div>
          </div>
        )}

        {/* Ordered Card List */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-2.5">
          {cards.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] font-medium text-[#111111]">
                등록된 카드가 없습니다.
              </p>
              <p className="text-[12px] text-[#888888] mt-1">
                아래 버튼을 눌러 새 PR 카드를 추가하세요.
              </p>
            </div>
          ) : (
            cards.map((card, idx) => {
              const isSelected = idx === activeIndex;
              const isConfirmingDelete = confirmDeleteId === card.id;

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl border p-3 transition-colors ${
                    isSelected
                      ? 'border-[#111111] bg-[#F7F7F5]'
                      : 'border-[#E8E8E8] bg-white hover:border-[#CCCCCC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Color / Thumbnail Swatch */}
                    <button
                      type="button"
                      onClick={() => onSelectCard(idx)}
                      aria-label={`Select ${card.category} ${card.title}`}
                      className="w-12 h-8 rounded-lg shrink-0 border border-black/10 overflow-hidden cursor-pointer"
                      style={{ backgroundColor: card.bgColor }}
                    >
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>

                    {/* Title & Meta */}
                    <button
                      type="button"
                      onClick={() => onSelectCard(idx)}
                      className="min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#888888] truncate">
                          {card.category}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-semibold text-[#111111]">
                            · Active
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] font-semibold text-[#111111] truncate">
                        {card.title}
                      </p>
                      <p className="text-[11px] text-[#888888] truncate">
                        {card.url ? card.url : '연결된 링크 없음'}
                      </p>
                    </button>

                    {/* Reorder + Edit + Delete Controls */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onMoveCard(idx, idx - 1)}
                        disabled={idx === 0}
                        aria-label={`Move ${card.category} up`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-black/5 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveCard(idx, idx + 1)}
                        disabled={idx === cards.length - 1}
                        aria-label={`Move ${card.category} down`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-black/5 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenEdit(card)}
                        aria-label={`Edit ${card.category} ${card.title}`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#555555] hover:text-[#111111] hover:bg-black/5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(card.id)}
                        aria-label={`Delete ${card.category} ${card.title}`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#888888] hover:text-[#D94E34] hover:bg-[#D94E34]/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Inline 2-step delete confirmation */}
                  {isConfirmingDelete && (
                    <div className="mt-2.5 pt-2.5 border-t border-[#E8E8E8] flex items-center justify-between gap-2">
                      <span className="text-[12px] text-[#555555]">
                        이 카드를 삭제할까요?
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#555555] hover:bg-black/5 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCard(card.id);
                            setConfirmDeleteId(null);
                          }}
                          aria-label={`Confirm delete ${card.title}`}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#D94E34] text-white hover:bg-[#BF3F27] cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#E8E8E8] bg-white space-y-2.5">
          <button
            type="button"
            onClick={onOpenAdd}
            className="w-full min-h-[46px] rounded-xl bg-[#111111] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add New Card</span>
          </button>

          <div className="flex items-center justify-center">
            {confirmReset ? (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#888888]">기본 카드 덱으로 복원할까요?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetDefaults();
                    setConfirmReset(false);
                  }}
                  className="font-semibold text-[#111111] hover:underline cursor-pointer"
                >
                  Confirm Reset
                </button>
                <span className="text-[#CCCCCC]">·</span>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-[#888888] hover:text-[#111111] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 py-1 text-[12px] text-[#888888] hover:text-[#111111] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset Default Collection</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
