import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { PRCardData } from '../types/card';
import {
  applyEdgeResistance,
  computeCardVisualState,
  computeVirtualIndex,
  didPointerDrag,
  resolveSwipeTarget,
  SWIPE_STEP_PX,
} from '../utils/deckMath';
import { PRCard } from './PRCard';

interface CardDeckProps {
  cards: PRCardData[];
  activeIndex: number;
  onChangeActiveIndex: (index: number) => void;
  onCardClick: (card: PRCardData) => void;
  /** Omit for read-only decks (visitors). */
  onOpenAddCard?: () => void;
  keyboardDisabled?: boolean;
}

export const CardDeck: React.FC<CardDeckProps> = ({
  cards,
  activeIndex,
  onChangeActiveIndex,
  onCardClick,
  onOpenAddCard,
  keyboardDisabled = false,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(260);
  const [dragOffsetPx, setDragOffsetPx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Gesture tracking refs for zero-lag velocity + tap-vs-drag detection
  const pointerStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    lastY: number;
    lastTime: number;
    velocityY: number;
    didDrag: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocityY: 0,
    didDrag: false,
  });

  const wheelLockRef = useRef<number>(0);
  const wheelAccumRef = useRef<number>(0);

  // Measure card width dynamically to derive exact 1.5:1 card height
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const updateSize = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setCardHeight(Math.round(width / 1.5));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stepBy = useCallback(
    (delta: number) => {
      if (cards.length === 0) return;
      const next = Math.min(Math.max(0, activeIndex + delta), cards.length - 1);
      if (next !== activeIndex) {
        onChangeActiveIndex(next);
      }
    },
    [activeIndex, cards.length, onChangeActiveIndex]
  );

  // Keyboard ArrowUp / ArrowDown navigation
  useEffect(() => {
    if (keyboardDisabled || cards.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepBy(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardDisabled, cards.length, stepBy]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cards.length === 0) return;
    // Only respond to primary mouse button or touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const now = performance.now();
    pointerStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastY: e.clientY,
      lastTime: now,
      velocityY: 0,
      didDrag: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    const moved = didPointerDrag(state.startX, state.startY, e.clientX, e.clientY);
    if (moved && !state.didDrag) {
      state.didDrag = true;
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unavailable
      }
    }

    if (!state.didDrag) return;

    const now = performance.now();
    const dt = Math.max(8, now - state.lastTime);
    const instVelocity = (e.clientY - state.lastY) / dt;
    // Exponential smoothing on velocity so flick direction is reliable
    state.velocityY = state.velocityY * 0.4 + instVelocity * 0.6;
    state.lastY = e.clientY;
    state.lastTime = now;

    const rawDeltaY = e.clientY - state.startY;
    const resisted = applyEdgeResistance(rawDeltaY, activeIndex, cards.length);
    setDragOffsetPx(resisted);
  };

  const finishPointerGesture = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    const wasDragging = state.didDrag;
    const velocityY = state.velocityY;
    state.active = false;
    state.pointerId = null;

    if (wasDragging) {
      const nextIndex = resolveSwipeTarget(
        activeIndex,
        cards.length,
        dragOffsetPx,
        velocityY,
        SWIPE_STEP_PX
      );
      setIsDragging(false);
      setDragOffsetPx(0);
      if (nextIndex !== activeIndex) {
        onChangeActiveIndex(nextIndex);
      }
      // Keep didDrag true briefly to suppress click firing right after pointerup
      window.setTimeout(() => {
        pointerStateRef.current.didDrag = false;
      }, 60);
    } else {
      setIsDragging(false);
      setDragOffsetPx(0);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (cards.length <= 1) return;
    const now = performance.now();
    if (now - wheelLockRef.current < 260) {
      return;
    }

    wheelAccumRef.current += e.deltaY;
    if (Math.abs(wheelAccumRef.current) >= 34) {
      const direction = wheelAccumRef.current > 0 ? 1 : -1;
      wheelAccumRef.current = 0;
      wheelLockRef.current = now;
      stepBy(direction);
    }
  };

  if (cards.length === 0) {
    return (
      <div
        data-testid="card-deck-empty"
        className="w-full max-w-[440px] mx-auto px-4 py-12 flex flex-col items-center justify-center text-center"
      >
        <div className="w-full aspect-[3/2] rounded-[24px] border border-dashed border-[#D6D6D2] bg-white/70 flex flex-col items-center justify-center p-6">
          <p className="text-[16px] font-semibold text-[#111111]">
            아직 수집된 카드가 없습니다.
          </p>
          <p className="text-[13px] text-[#888888] mt-1.5 max-w-[260px]">
            나를 표현하는 첫 번째 PR 카드를 만들어 컬렉션을 시작해보세요.
          </p>
          {onOpenAddCard && (
          <button
            type="button"
            onClick={onOpenAddCard}
            className="mt-5 inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#111111] text-white text-[13px] font-medium hover:bg-[#2A2A2A] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Create First Card</span>
          </button>
          )}
        </div>
      </div>
    );
  }

  const virtualIndex = computeVirtualIndex(
    activeIndex,
    cards.length,
    dragOffsetPx,
    SWIPE_STEP_PX
  );

  // Generous vertical space so cards peeking above & below never clip
  const stageHeight = Math.round(cardHeight * 1.72);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-[540px] flex items-center justify-center">
        {/* Card Stack Gesture Stage */}
        <div
          ref={stageRef}
          data-testid="card-deck-stage"
          data-active-index={activeIndex}
          data-card-count={cards.length}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerGesture}
          onPointerCancel={finishPointerGesture}
          onWheel={handleWheel}
          style={{ height: `${stageHeight}px`, touchAction: 'none' }}
          className="relative w-[88vw] max-w-[440px] flex items-center justify-center select-none"
        >
          {cards.map((card, index) => {
            const offset = index - virtualIndex;
            const visual = computeCardVisualState(offset, cardHeight);
            if (!visual.isVisible) return null;

            const isFront = index === activeIndex;
            const shadowClass = isFront
              ? 'shadow-[0_24px_48px_-14px_rgba(17,17,17,0.22),0_4px_14px_rgba(17,17,17,0.08)]'
              : offset < 0
                ? 'shadow-[0_-4px_16px_rgba(17,17,17,0.08)]'
                : 'shadow-[0_10px_24px_-8px_rgba(17,17,17,0.14)]';

            return (
              <div
                key={card.id}
                data-testid={isFront ? 'active-pr-card' : `stacked-pr-card-${index}`}
                style={{
                  transform: `translate3d(0, ${visual.translateY}px, 0) scale(${visual.scale})`,
                  zIndex: visual.zIndex,
                  opacity: visual.opacity,
                  transition: isDragging
                    ? 'none'
                    : 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease',
                }}
                className={`absolute left-0 right-0 w-full rounded-[24px] will-change-transform motion-reduce-instant ${shadowClass}`}
              >
                <PRCard
                  card={card}
                  isActive={isFront}
                  onClick={(e) => {
                    if (pointerStateRef.current.didDrag) {
                      e.preventDefault();
                      return;
                    }
                    if (isFront) {
                      onCardClick(card);
                    } else {
                      e.preventDefault();
                      onChangeActiveIndex(index);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Desktop Subtle Side Rail Controls (accessible & unobtrusive) */}
        <div className="hidden md:flex flex-col items-center gap-2 ml-6 shrink-0">
          <button
            type="button"
            onClick={() => stepBy(-1)}
            disabled={activeIndex <= 0}
            aria-label="Previous card"
            className="w-11 h-11 rounded-full bg-white border border-[#E8E8E8] flex items-center justify-center text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#111111] hover:text-white hover:border-[#111111] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          </button>

          <span
            aria-label={`Card ${activeIndex + 1} of ${cards.length}`}
            className="text-[12px] font-medium text-[#888888] tabular-nums py-1 select-none"
          >
            {String(activeIndex + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={() => stepBy(1)}
            disabled={activeIndex >= cards.length - 1}
            aria-label="Next card"
            className="w-11 h-11 rounded-full bg-white border border-[#E8E8E8] flex items-center justify-center text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#111111] hover:text-white hover:border-[#111111] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Compact Deck Indicator & Quick Step */}
      <div className="flex md:hidden items-center justify-center gap-3 mt-1">
        <button
          type="button"
          onClick={() => stepBy(-1)}
          disabled={activeIndex <= 0}
          aria-label="Previous card"
          className="w-11 h-11 rounded-full bg-white border border-[#E8E8E8] flex items-center justify-center text-[#111111] disabled:opacity-30 transition-colors"
        >
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
        </button>
        <span className="text-[12px] font-medium text-[#888888] tabular-nums min-w-[48px] text-center">
          {String(activeIndex + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={() => stepBy(1)}
          disabled={activeIndex >= cards.length - 1}
          aria-label="Next card"
          className="w-11 h-11 rounded-full bg-white border border-[#E8E8E8] flex items-center justify-center text-[#111111] disabled:opacity-30 transition-colors"
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
