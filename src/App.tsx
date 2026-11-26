import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { LogOut, MoreHorizontal, Plus, SlidersHorizontal, UserRound } from 'lucide-react';
import { Avatar } from './components/Avatar';
import { CardDeck } from './components/CardDeck';
import { CardFormModal } from './components/CardFormModal';
import { CardManagement } from './components/CardManagement';
import { CreateCardPopup } from './components/CreateCardPopup';
import { MyPRLogo } from './components/MyPRLogo';
import { NotificationToast, type ToastMessage } from './components/NotificationToast';
import { ProfileEditModal } from './components/ProfileEditModal';
import { SocialIcon } from './components/SocialIcon';
import type { PRCardData, PRCardDraft } from './types/card';
import type { UserProfile } from './types/profile';
import { LocalStorageCardRepository } from './utils/cardStorage';
import { normalizeExternalUrl, reorderCards } from './utils/deckMath';
import { detectPlatform, PLATFORM_META } from './utils/linkPlatform';
import { loadProfile, saveProfile } from './utils/profileStorage';

interface AppProps {
  userId: string;
  defaultName: string;
  onSignOut?: () => void;
}

/** Height of the top bar; also where the card sheet stops when fully open. */
const TOP_BAR_H = 64;
const AVATAR_BIG = 96;
const AVATAR_SMALL = 40;
const AVATAR_BIG_CENTER_Y = TOP_BAR_H + 8 + AVATAR_BIG / 2;
const SPRING = { type: 'spring' as const, stiffness: 420, damping: 42, mass: 0.9 };

const newCardId = () => `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export default function App({ userId, defaultName, onSignOut }: AppProps) {
  const repository = useMemo(() => new LocalStorageCardRepository(userId), [userId]);
  const [cards, setCards] = useState<PRCardData[]>(() => repository.load().cards);
  const [activeIndex, setActiveIndex] = useState<number>(() => repository.load().activeIndex);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(userId, defaultName));

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    targetCard: PRCardData | null;
  }>({ isOpen: false, mode: 'add', targetCard: null });

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, tone: 'info' | 'success' = 'info') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), text, tone });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    repository.save({ cards, activeIndex });
  }, [repository, cards, activeIndex]);

  // ---------------------------------------------------------------------------
  // Sheet geometry: y = 0 is fully open (#02), y = maxY is the resting state (#01)
  // ---------------------------------------------------------------------------
  const shellRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLElement | null>(null);
  const [shellWidth, setShellWidth] = useState(390);
  const [maxY, setMaxY] = useState(320);
  const geometry = useRef({ width: 390, maxY: 320 });
  geometry.current = { width: shellWidth, maxY };

  const sheetY = useMotionValue(320);
  const expandedRef = useRef(false);
  expandedRef.current = isExpanded;

  useLayoutEffect(() => {
    const measure = () => {
      const shell = shellRef.current;
      const prof = profileRef.current;
      if (!shell || !prof) return;
      setShellWidth(shell.clientWidth);
      const collapsedTop = prof.offsetTop + prof.offsetHeight + 20;
      // Always leave at least ~38% of the screen for the cards when resting
      const limit = Math.round(shell.clientHeight * 0.62);
      setMaxY(Math.max(120, Math.min(collapsedTop, limit) - TOP_BAR_H));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (shellRef.current) observer.observe(shellRef.current);
    if (profileRef.current) observer.observe(profileRef.current);
    return () => observer.disconnect();
  }, []);

  // Keep the sheet pinned to its state when the layout changes
  useEffect(() => {
    if (!expandedRef.current) sheetY.set(maxY);
  }, [maxY, sheetY]);

  const snapTo = useCallback(
    (expand: boolean) => {
      setIsExpanded(expand);
      setIsMenuOpen(false);
      animate(sheetY, expand ? 0 : geometry.current.maxY, SPRING);
    },
    [sheetY]
  );

  /** 0 = resting (#01), 1 = fully open (#02) */
  const progress = useTransform(() => {
    const m = geometry.current.maxY || 1;
    return Math.min(1, Math.max(0, 1 - sheetY.get() / m));
  });
  const profileOpacity = useTransform(() => Math.max(0, 1 - progress.get() * 1.6));
  const profileShift = useTransform(() => -progress.get() * 40);
  const fadeIn = useTransform(() => Math.max(0, progress.get() * 1.4 - 0.4));
  const fadeOut = useTransform(() => 1 - progress.get());

  // The profile picture travels from the centre of #01 to the top-right of #02
  const avatarX = useTransform(() => {
    const p = progress.get();
    const from = geometry.current.width / 2;
    const to = geometry.current.width - 16 - AVATAR_SMALL / 2;
    return from + (to - from) * p - AVATAR_BIG / 2;
  });
  const avatarY = useTransform(() => {
    const p = progress.get();
    const to = TOP_BAR_H / 2;
    return AVATAR_BIG_CENTER_Y + (to - AVATAR_BIG_CENTER_Y) * p - AVATAR_BIG / 2;
  });
  const avatarScale = useTransform(() => 1 + (AVATAR_SMALL / AVATAR_BIG - 1) * progress.get());

  // ---------------------------------------------------------------------------
  // Swipe gesture shared by the profile area, the resting sheet and the handle
  // ---------------------------------------------------------------------------
  const gesture = useRef<{
    pointerId: number;
    startY: number;
    startSheetY: number;
    lastY: number;
    lastT: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const onSwipeDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    sheetY.stop();
    gesture.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startSheetY: sheetY.get(),
      lastY: e.clientY,
      lastT: performance.now(),
      velocity: 0,
      moved: false,
    };
  };

  const onSwipeMove = (e: React.PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dy = e.clientY - g.startY;
    if (!g.moved) {
      if (Math.abs(dy) < 6) return;
      g.moved = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer capture is optional
      }
    }
    const now = performance.now();
    const dt = Math.max(8, now - g.lastT);
    g.velocity = g.velocity * 0.4 + ((e.clientY - g.lastY) / dt) * 0.6;
    g.lastY = e.clientY;
    g.lastT = now;

    const m = geometry.current.maxY;
    let next = g.startSheetY + dy;
    if (next < 0) next *= 0.2;
    if (next > m) next = m + (next - m) * 0.2;
    sheetY.set(next);
  };

  const onSwipeEnd = (e: React.PointerEvent<HTMLElement>, tapExpands: boolean) => {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gesture.current = null;
    if (!g.moved) {
      if (tapExpands) snapTo(true);
      return;
    }
    suppressClickRef.current = true;
    window.setTimeout(() => (suppressClickRef.current = false), 80);
    const projected = sheetY.get() + g.velocity * 200;
    snapTo(projected < geometry.current.maxY / 2);
  };

  const swipeHandlers = (tapExpands: boolean) => ({
    onPointerDown: onSwipeDown,
    onPointerMove: onSwipeMove,
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => onSwipeEnd(e, tapExpands),
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => onSwipeEnd(e, false),
  });

  const onRestingWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 12) snapTo(true);
  };

  // ---------------------------------------------------------------------------
  // Cards
  // ---------------------------------------------------------------------------
  const insertCard = useCallback(
    (draft: PRCardDraft) => {
      const newCard: PRCardData = { ...draft, id: newCardId(), createdAt: Date.now() };
      const insertAt = cards.length === 0 ? 0 : Math.min(activeIndex + 1, cards.length);
      setCards([...cards.slice(0, insertAt), newCard, ...cards.slice(insertAt)]);
      setActiveIndex(insertAt);
    },
    [cards, activeIndex]
  );

  const handleCardClick = useCallback(
    (card: PRCardData) => {
      if (!normalizeExternalUrl(card.url)) showToast('아직 연결된 링크가 없습니다.', 'info');
    },
    [showToast]
  );

  const handleSaveCard = useCallback(
    (draft: PRCardDraft) => {
      if (formState.mode === 'add') {
        insertCard(draft);
        showToast('새 MyPR 카드가 추가되었습니다.', 'success');
      } else if (formState.targetCard) {
        const targetId = formState.targetCard.id;
        setCards((prev) => prev.map((c) => (c.id === targetId ? { ...c, ...draft } : c)));
        showToast('카드 정보가 수정되었습니다.', 'success');
      }
      setFormState((prev) => ({ ...prev, isOpen: false }));
    },
    [formState, insertCard, showToast]
  );

  const handleMoveCard = useCallback(
    (fromIndex: number, toIndex: number) => {
      setCards((prev) => reorderCards(prev, fromIndex, toIndex));
      if (activeIndex === fromIndex) setActiveIndex(toIndex);
      else if (activeIndex === toIndex) setActiveIndex(fromIndex);
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
    const initial = repository.reset();
    setCards(initial.cards);
    setActiveIndex(initial.activeIndex);
    showToast('기본 카드 컬렉션으로 복원되었습니다.', 'success');
  }, [repository, showToast]);

  const handleSaveProfile = (next: UserProfile) => {
    setProfile(next);
    setIsProfileEditOpen(false);
    if (saveProfile(userId, next)) {
      showToast('프로필이 저장되었습니다.', 'success');
    } else {
      showToast('저장 공간이 부족해요. 더 작은 사진을 써주세요.', 'info');
    }
  };

  const anyModalOpen =
    isProfileEditOpen || isCreateOpen || isManageOpen || formState.isOpen || isMenuOpen;

  return (
    <div className="h-[100dvh] w-full bg-[#F7F7F5] text-[#111111] overflow-hidden">
      <div ref={shellRef} className="relative mx-auto h-full w-full max-w-[560px] overflow-hidden">
        {/* Top bar: logo left, menu right (the avatar takes this spot when the sheet is open) */}
        <header
          className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4"
          style={{ height: TOP_BAR_H }}
        >
          <button
            type="button"
            onClick={() => snapTo(false)}
            aria-label="MyPR 처음 화면으로"
            className="h-11 -ml-1 px-1 rounded-xl flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] cursor-pointer"
          >
            <MyPRLogo className="h-8 w-auto text-[#111111]" />
          </button>
          <motion.button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="메뉴"
            aria-expanded={isMenuOpen}
            style={{ opacity: fadeOut }}
            className={`w-11 h-11 -mr-1.5 rounded-full flex items-center justify-center text-[#111111] hover:bg-black/5 cursor-pointer ${
              isExpanded ? 'pointer-events-none' : ''
            }`}
          >
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        </header>

        {/* #01 profile */}
        <motion.section
          ref={profileRef}
          aria-label="프로필"
          {...swipeHandlers(false)}
          onWheel={onRestingWheel}
          style={{ opacity: profileOpacity, y: profileShift, touchAction: 'none', top: TOP_BAR_H }}
          className="absolute inset-x-0 z-10 flex flex-col items-center px-6 pt-2 text-center select-none"
        >
          {/* Space for the floating avatar */}
          <div style={{ width: AVATAR_BIG, height: AVATAR_BIG }} aria-hidden="true" />
          <h1 className="mt-3.5 text-[22px] font-bold tracking-[-0.03em] leading-tight break-all">
            {profile.name}
          </h1>
          {profile.bio && (
            <p className="mt-1 text-[14px] text-[#777777] tracking-[-0.01em] max-w-[320px]">
              {profile.bio}
            </p>
          )}
          {profile.links.length > 0 ? (
            <ul className="mt-3 flex flex-wrap items-center justify-center gap-1.5" aria-label="소셜 링크">
              {profile.links.map((link) => {
                const platform = detectPlatform(link.url);
                return (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target={platform === 'email' ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      aria-label={PLATFORM_META[platform].label}
                      onClick={(e) => suppressClickRef.current && e.preventDefault()}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
                    >
                      <SocialIcon platform={platform} />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <button
              type="button"
              onClick={() => !suppressClickRef.current && setIsProfileEditOpen(true)}
              className="mt-3 h-10 px-4 rounded-full border border-[#DDDDD8] bg-white text-[13px] font-medium text-[#555555] hover:text-[#111111] cursor-pointer"
            >
              + 소셜 링크 추가
            </button>
          )}
        </motion.section>

        {/* #01 → #02 floating profile picture */}
        <motion.button
          type="button"
          onClick={() => {
            if (suppressClickRef.current) return;
            if (isExpanded) setIsMenuOpen((v) => !v);
            else setIsProfileEditOpen(true);
          }}
          aria-label={isExpanded ? '메뉴' : '프로필 편집'}
          style={{ x: avatarX, y: avatarY, scale: avatarScale, width: AVATAR_BIG, height: AVATAR_BIG }}
          className="absolute left-0 top-0 z-40 origin-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-[#111111]/30 cursor-pointer"
        >
          <Avatar name={profile.name} src={profile.avatarUrl} size={AVATAR_BIG} />
        </motion.button>

        {/* Card sheet: rests below the profile (#01), swipe up to open it full screen (#02) */}
        <motion.section
          aria-label="내 MyPR 카드"
          style={{ y: sheetY, top: TOP_BAR_H }}
          className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[32px] bg-[#EBEBE7] shadow-[0_-10px_40px_rgba(17,17,17,0.08)]"
        >
          <div
            {...swipeHandlers(false)}
            onWheel={(e) => {
              if (isExpanded && e.deltaY < -12) snapTo(false);
            }}
            style={{ touchAction: 'none' }}
            className="shrink-0 pt-2.5 pb-1 select-none cursor-grab active:cursor-grabbing"
          >
            <button
              type="button"
              onClick={() => !suppressClickRef.current && snapTo(!isExpanded)}
              aria-label={isExpanded ? '카드 화면 내리기' : '카드 화면 펼치기'}
              aria-expanded={isExpanded}
              className="mx-auto flex h-6 w-24 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] cursor-pointer"
            >
              <span className="h-1.5 w-11 rounded-full bg-[#C9C9C4]" />
            </button>
            <div className="flex items-baseline justify-between px-6 pt-1 pb-2">
              <span className="text-[12px] font-bold tracking-[0.14em] text-[#111111]">MY CARDS</span>
              <span className="text-[12px] font-medium tabular-nums text-[#999999]">
                {String(cards.length).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="relative flex-1 min-h-0 overflow-hidden">
            <div className="relative z-0 isolate flex justify-center pt-1">
              <CardDeck
                cards={cards}
                activeIndex={activeIndex}
                onChangeActiveIndex={setActiveIndex}
                onCardClick={handleCardClick}
                onOpenAddCard={() => setIsCreateOpen(true)}
                keyboardDisabled={!isExpanded || anyModalOpen}
              />
            </div>

            {/* While resting, the whole sheet is one big "swipe up / tap to open" surface */}
            {!isExpanded && (
              <div
                {...swipeHandlers(true)}
                onWheel={onRestingWheel}
                style={{ touchAction: 'none' }}
                className="absolute inset-0 z-10 cursor-pointer"
                aria-hidden="true"
              />
            )}
          </div>

          {/* #02 create button → #03 popup */}
          <motion.div
            style={{ opacity: fadeIn }}
            className={`absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[max(16px,env(safe-area-inset-bottom))] pointer-events-none ${
              isExpanded ? '[&>button]:pointer-events-auto' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              aria-label="새 MyPR 카드 만들기"
              tabIndex={isExpanded ? 0 : -1}
              className="w-14 h-14 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(17,17,17,0.28)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Plus className="w-6 h-6" strokeWidth={2.25} aria-hidden="true" />
            </button>
          </motion.div>
        </motion.section>

        {/* Menu */}
        {isMenuOpen && (
          <div className="absolute inset-0 z-50" onClick={() => setIsMenuOpen(false)} role="presentation">
            <div
              role="menu"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 w-52 rounded-2xl bg-white border border-[#E8E8E4] shadow-[0_16px_40px_rgba(17,17,17,0.16)] p-1.5"
              style={{ top: TOP_BAR_H - 4 }}
            >
              {[
                { label: '프로필 편집', icon: UserRound, action: () => setIsProfileEditOpen(true) },
                { label: '카드 관리', icon: SlidersHorizontal, action: () => setIsManageOpen(true) },
                ...(onSignOut ? [{ label: '로그아웃', icon: LogOut, action: onSignOut }] : []),
              ].map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    action();
                  }}
                  className="w-full h-11 px-3 rounded-xl flex items-center gap-2.5 text-[14px] font-medium text-[#111111] hover:bg-[#F2F2EF] cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-[#777777]" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateCardPopup
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={(draft) => {
          insertCard(draft);
          setIsCreateOpen(false);
          showToast('새 MyPR 카드가 만들어졌어요.', 'success');
        }}
        onCustomize={(draft) => {
          setIsCreateOpen(false);
          setFormState({
            isOpen: true,
            mode: 'add',
            targetCard: draft ? { ...draft, id: 'draft', createdAt: Date.now() } : null,
          });
        }}
      />

      <ProfileEditModal
        isOpen={isProfileEditOpen}
        profile={profile}
        onClose={() => setIsProfileEditOpen(false)}
        onSave={handleSaveProfile}
      />

      <CardManagement
        isOpen={isManageOpen}
        cards={cards}
        activeIndex={activeIndex}
        onClose={() => setIsManageOpen(false)}
        onSelectCard={(index) => setActiveIndex(index)}
        onOpenAdd={() => setIsCreateOpen(true)}
        onOpenEdit={(card) => setFormState({ isOpen: true, mode: 'edit', targetCard: card })}
        onMoveCard={handleMoveCard}
        onDeleteCard={handleDeleteCard}
        onResetDefaults={handleResetDefaults}
      />

      <CardFormModal
        isOpen={formState.isOpen}
        mode={formState.mode}
        initialCard={formState.targetCard}
        onClose={() => setFormState((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveCard}
      />

      <NotificationToast toast={toast} />
    </div>
  );
}
