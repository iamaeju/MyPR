import type { PRCardData } from '../types/card';

export const DRAG_THRESHOLD_PX = 12;
export const SWIPE_STEP_PX = 135;
export const SWIPE_VELOCITY_THRESHOLD = 0.35; // px/ms

export interface CardVisualState {
  translateY: number;
  scale: number;
  zIndex: number;
  opacity: number;
  isVisible: boolean;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Applies soft rubber-band resistance when dragging past the start or end of the deck.
 */
export function applyEdgeResistance(
  rawDragPx: number,
  activeIndex: number,
  totalCards: number
): number {
  if (totalCards <= 1) {
    return rawDragPx * 0.25;
  }
  const atStartAndDraggingDown = activeIndex <= 0 && rawDragPx > 0;
  const atEndAndDraggingUp = activeIndex >= totalCards - 1 && rawDragPx < 0;

  if (atStartAndDraggingDown || atEndAndDraggingUp) {
    return Math.round(rawDragPx * 0.28);
  }
  return rawDragPx;
}

/**
 * Converts discrete activeIndex + continuous dragOffsetPx into a fractional virtual index.
 * Dragging upward (negative dragOffsetPx) advances to higher indices.
 */
export function computeVirtualIndex(
  activeIndex: number,
  totalCards: number,
  dragOffsetPx: number,
  stepPx: number = SWIPE_STEP_PX
): number {
  if (totalCards <= 0) return 0;
  const raw = activeIndex - dragOffsetPx / stepPx;
  return clamp(raw, -0.45, totalCards - 1 + 0.45);
}

/**
 * Computes continuous vertical stack geometry for any card given its offset from the virtual active card.
 * offset < 0: stacked behind & above the active card (revealing top edges/headers)
 * offset = 0: active foreground card
 * offset > 0: stacked behind & below the active card (revealing bottom edges)
 */
export function computeCardVisualState(
  offset: number,
  cardHeight: number
): CardVisualState {
  const absOffset = Math.abs(offset);
  const isVisible = absOffset <= 5.2;

  // Gentle scale progression so underlying cards tuck cleanly behind the foreground card
  const scaleStep = offset < 0 ? 0.042 : 0.036;
  const scale = clamp(1 - absOffset * scaleStep, 0.72, 1);

  // Desired edge reveal relative to the foreground card's top/bottom edges
  const topPeekPerStep = Math.max(36, Math.round(cardHeight * 0.155));
  const bottomPeekPerStep = Math.max(22, Math.round(cardHeight * 0.105));

  let baseY = 0;
  if (offset < 0) {
    // Diminishing step for deeper upper cards keeps the stack compact
    const compressedDepth =
      absOffset <= 1 ? absOffset : 1 + (absOffset - 1) * 0.88;
    const edgeReveal = compressedDepth * topPeekPerStep;
    baseY = -edgeReveal - ((1 - scale) * cardHeight) / 2;
  } else if (offset > 0) {
    const compressedDepth =
      absOffset <= 1 ? absOffset : 1 + (absOffset - 1) * 0.88;
    const edgeReveal = compressedDepth * bottomPeekPerStep;
    baseY = edgeReveal + ((1 - scale) * cardHeight) / 2;
  }

  // Tactile lift arc during active transition between 0 and +/-1 so the card clearly responds to the finger
  const transitionArc =
    absOffset > 0 && absOffset < 1
      ? Math.sin(absOffset * Math.PI) * Math.sign(offset) * Math.round(cardHeight * 0.18)
      : 0;

  const translateY = baseY + transitionArc;
  const zIndex = Math.max(1, Math.round(100 - absOffset * 20));
  const opacity = absOffset > 4.5 ? clamp(1 - (absOffset - 4.5) * 1.4, 0, 1) : 1;

  return {
    translateY,
    scale,
    zIndex,
    opacity,
    isVisible,
  };
}

/**
 * Determines the next settled activeIndex after a drag/flick gesture finishes.
 */
export function resolveSwipeTarget(
  currentIndex: number,
  totalCards: number,
  dragOffsetPx: number,
  velocityY: number,
  stepPx: number = SWIPE_STEP_PX
): number {
  if (totalCards <= 0) return 0;

  const distanceRatio = dragOffsetPx / stepPx;
  let nextIndex = currentIndex;

  if (distanceRatio < -0.26 || velocityY < -SWIPE_VELOCITY_THRESHOLD) {
    nextIndex = currentIndex + 1;
  } else if (distanceRatio > 0.26 || velocityY > SWIPE_VELOCITY_THRESHOLD) {
    nextIndex = currentIndex - 1;
  }

  return clamp(nextIndex, 0, totalCards - 1);
}

/**
 * Distinguishes an intentional tap/click from a drag gesture.
 */
export function didPointerDrag(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  thresholdPx: number = DRAG_THRESHOLD_PX
): boolean {
  const dx = currentX - startX;
  const dy = currentY - startY;
  return Math.hypot(dx, dy) > thresholdPx;
}

/**
 * Returns 'dark' or 'light' ink for maximum WCAG contrast against a given hex background color.
 */
export function getContrastInk(hexColor: string): 'dark' | 'light' {
  const cleaned = hexColor.replace('#', '').trim();
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return 'dark';
  }

  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.36 ? 'dark' : 'light';
}

/**
 * Normalizes and validates an external destination URL.
 * Rejects dangerous protocols such as javascript: or data:.
 */
export function normalizeExternalUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null;
  }

  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) {
    return trimmed;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Immutably moves a card from one position to another.
 */
export function reorderCards(
  cards: PRCardData[],
  fromIndex: number,
  toIndex: number
): PRCardData[] {
  if (
    fromIndex < 0 ||
    fromIndex >= cards.length ||
    toIndex < 0 ||
    toIndex >= cards.length ||
    fromIndex === toIndex
  ) {
    return cards;
  }
  const next = [...cards];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
