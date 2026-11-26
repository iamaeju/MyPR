import { DEFAULT_CARDS, INITIAL_ACTIVE_CARD_INDEX } from '../data/defaultCards';
import type { PRCardData } from '../types/card';

export interface DeckStateSnapshot {
  cards: PRCardData[];
  activeIndex: number;
}

/**
 * Storage abstraction designed so a backend API / database repository
 * can replace LocalStorageCardRepository without changing UI components.
 */
export interface CardRepository {
  load(): DeckStateSnapshot;
  save(snapshot: DeckStateSnapshot): void;
  reset(): DeckStateSnapshot;
}

const LEGACY_STORAGE_KEY = 'mypr.deck.v1';

export class LocalStorageCardRepository implements CardRepository {
  private readonly storageKey: string;

  /** Pass a user id to keep each account's deck separate on a shared device. */
  constructor(userId?: string) {
    this.storageKey = userId ? `${LEGACY_STORAGE_KEY}.${userId}` : LEGACY_STORAGE_KEY;
  }

  load(): DeckStateSnapshot {
    try {
      const raw =
        window.localStorage.getItem(this.storageKey) ??
        // Carry over a deck saved before decks were stored per account
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        return {
          cards: DEFAULT_CARDS,
          activeIndex: INITIAL_ACTIVE_CARD_INDEX,
        };
      }
      const parsed = JSON.parse(raw) as Partial<DeckStateSnapshot>;
      if (!Array.isArray(parsed.cards)) {
        return {
          cards: DEFAULT_CARDS,
          activeIndex: INITIAL_ACTIVE_CARD_INDEX,
        };
      }
      const maxIndex = Math.max(0, parsed.cards.length - 1);
      const safeIndex =
        typeof parsed.activeIndex === 'number' && Number.isFinite(parsed.activeIndex)
          ? Math.min(Math.max(0, parsed.activeIndex), maxIndex)
          : 0;

      return {
        cards: parsed.cards,
        activeIndex: safeIndex,
      };
    } catch {
      return {
        cards: DEFAULT_CARDS,
        activeIndex: INITIAL_ACTIVE_CARD_INDEX,
      };
    }
  }

  save(snapshot: DeckStateSnapshot): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
    } catch {
      // Ignore quota errors gracefully
    }
  }

  reset(): DeckStateSnapshot {
    const initial = {
      cards: DEFAULT_CARDS,
      activeIndex: INITIAL_ACTIVE_CARD_INDEX,
    };
    this.save(initial);
    return initial;
  }
}

export const cardRepository: CardRepository = new LocalStorageCardRepository();
