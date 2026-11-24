import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { CardDeck } from './components/CardDeck';
import { CardFormModal } from './components/CardFormModal';
import { CardManagement } from './components/CardManagement';
import { Header } from './components/Header';
import { NotificationToast, type ToastMessage } from './components/NotificationToast';
import { INITIAL_ACTIVE_CARD_INDEX } from './data/defaultCards';
import type { PRCardData, PRCardDraft } from './types/card';
import { cardRepository } from './utils/cardStorage';
import { normalizeExternalUrl, reorderCards } from './utils/deckMath';

interface AppProps {
  onSignOut?: () => void;
}

export default function App({ onSignOut }: AppProps) {
  const [cards, setCards] = useState<PRCardData[]>(() => cardRepository.load().cards);
  const [activeIndex, setActiveIndex] = useState<number>(
    () => cardRepository.load().activeIndex
  );

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    targetCard: PRCardData | null;
  }>({
    isOpen: false,
    mode: 'add',
    targetCard: null,
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, tone: 'info' | 'success' = 'info') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ id: Date.now(), text, tone });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Persist deck & active index whenever cards or selection changes
  useEffect(() => {
    cardRepository.save({ cards, activeIndex });
  }, [cards, activeIndex]);

  const handleCardClick = useCallback(
    (card: PRCardData) => {
      const safeUrl = normalizeExternalUrl(card.url);
      if (!safeUrl) {
        showToast('아직 연결된 링크가 없습니다.', 'info');
      }
    },
    [showToast]
  );

  const handleOpenAddModal = useCallback(() => {
    setFormState({
      isOpen: true,
      mode: 'add',
      targetCard: null,
    });
  }, []);

  const handleOpenEditModal = useCallback((card: PRCardData) => {
    setFormState({
      isOpen: true,
      mode: 'edit',
      targetCard: card,
    });
  }, []);

  const handleSaveCard = useCallback(
    (draft: PRCardDraft) => {
      if (formState.mode === 'add') {
        const newCard: PRCardData = {
          ...draft,
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: Date.now(),
        };
        const insertAt = cards.length === 0 ? 0 : Math.min(activeIndex + 1, cards.length);
        const nextCards = [
          ...cards.slice(0, insertAt),
          newCard,
          ...cards.slice(insertAt),
        ];
        setCards(nextCards);
        setActiveIndex(insertAt);
        setFormState((prev) => ({ ...prev, isOpen: false }));
        showToast('새 PR 카드가 추가되었습니다.', 'success');
      } else if (formState.targetCard) {
        const targetId = formState.targetCard.id;
        setCards((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, ...draft } : c))
        );
        setFormState((prev) => ({ ...prev, isOpen: false }));
        showToast('카드 정보가 수정되었습니다.', 'success');
      }
    },
    [formState, cards, activeIndex, showToast]
  );

  const handleMoveCard = useCallback(
    (fromIndex: number, toIndex: number) => {
      setCards((prev) => reorderCards(prev, fromIndex, toIndex));
      if (activeIndex === fromIndex) {
        setActiveIndex(toIndex);
      } else if (activeIndex === toIndex) {
        setActiveIndex(fromIndex);
      }
    },
    [activeIndex]
  );

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      const targetIdx = cards.findIndex((c) => c.id === cardId);
      if (targetIdx === -1) return;
      const nextCards = cards.filter((c) => c.id !== cardId);
      setCards(nextCards);
      setActiveIndex((prev) => {
        if (nextCards.length === 0) return 0;
        if (prev > targetIdx) return prev - 1;
        return Math.min(prev, nextCards.length - 1);
      });
      showToast('카드가 삭제되었습니다.', 'info');
    },
    [cards, showToast]
  );

  const handleResetDefaults = useCallback(() => {
    const initial = cardRepository.reset();
    setCards(initial.cards);
    setActiveIndex(initial.activeIndex);
    showToast('기본 카드 컬렉션으로 복원되었습니다.', 'success');
  }, [showToast]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#F7F7F5] text-[#111111] flex flex-col">
      {/* Minimal Header */}
      <Header
        onOpenManage={() => setIsManageOpen(true)}
        onSignOut={onSignOut}
        onResetScroll={() => {
          if (cards.length > 0) {
            setActiveIndex(Math.min(INITIAL_ACTIVE_CARD_INDEX, cards.length - 1));
          }
        }}
      />

      {/* Main Centered Collection Experience */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 flex flex-col items-center justify-between pt-3 pb-7 sm:py-6">
        {/* Quiet Editorial Brand Introduction */}
        <section aria-label="Introduction" className="text-center max-w-md mx-auto mb-2 sm:mb-4">
          <h1 className="text-[20px] sm:text-[24px] font-bold tracking-[-0.03em] text-[#111111] text-balance">
            Your Identity, Your Cards.
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#888888] mt-1 tracking-[-0.01em]">
            나를 표현하는 다양한 카드를 한곳에 모아보세요.
          </p>
        </section>

        {/* Hero Interactive Stacked PR Card Deck */}
        <section
          aria-label="Personal PR Card Collection"
          className="w-full flex-1 flex items-center justify-center my-1"
        >
          <CardDeck
            cards={cards}
            activeIndex={activeIndex}
            onChangeActiveIndex={setActiveIndex}
            onCardClick={handleCardClick}
            onOpenAddCard={handleOpenAddModal}
            keyboardDisabled={isManageOpen || formState.isOpen}
          />
        </section>

        {/* Minimal Bottom Add Card Action */}
        <div className="pt-2 sm:pt-4 flex flex-col items-center">
          <button
            type="button"
            onClick={handleOpenAddModal}
            aria-label="Add Card"
            className="group inline-flex flex-col items-center gap-1.5 min-w-[64px] min-h-[44px] px-3 py-1 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] cursor-pointer"
          >
            <span className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(17,17,17,0.18)] group-hover:scale-105 group-active:scale-95 transition-transform duration-150">
              <Plus className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <span className="text-[12px] font-medium text-[#555555] group-hover:text-[#111111] transition-colors">
              Add Card
            </span>
          </button>
        </div>
      </main>

      {/* Card Management Drawer */}
      <CardManagement
        isOpen={isManageOpen}
        cards={cards}
        activeIndex={activeIndex}
        onClose={() => setIsManageOpen(false)}
        onSelectCard={(index) => setActiveIndex(index)}
        onOpenAdd={handleOpenAddModal}
        onOpenEdit={handleOpenEditModal}
        onMoveCard={handleMoveCard}
        onDeleteCard={handleDeleteCard}
        onResetDefaults={handleResetDefaults}
      />

      {/* Add / Edit Card Modal */}
      <CardFormModal
        isOpen={formState.isOpen}
        mode={formState.mode}
        initialCard={formState.targetCard}
        onClose={() => setFormState((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveCard}
      />

      {/* Notification Toast */}
      <NotificationToast toast={toast} />
    </div>
  );
}
