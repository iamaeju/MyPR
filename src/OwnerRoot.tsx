import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import App from './App';
import { fetchPageByUser, isHandleFree, PageApiError, savePage } from './lib/pageApi';
import type { PageData } from './types/profile';
import { LocalStorageCardRepository } from './utils/cardStorage';
import { suggestHandle } from './utils/handle';
import { loadProfile } from './utils/profileStorage';

interface OwnerRootProps {
  session: Session;
  onSignOut: () => void;
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; page: PageData; syncEnabled: boolean; notice: string | null };

/** Finds a free handle by adding a short number when the first choice is taken. */
async function claimHandle(preferred: string, userId: string): Promise<string> {
  let candidate = preferred;
  for (let i = 0; i < 6; i++) {
    if (await isHandleFree(candidate, userId)) return candidate;
    candidate = `${preferred.slice(0, 16)}${Math.floor(Math.random() * 900 + 100)}`;
  }
  return `${preferred.slice(0, 12)}${Date.now().toString(36).slice(-6)}`;
}

/**
 * Loads the signed-in person's page from the server (or creates it from what
 * this device already has), then hands it to the editor.
 */
export function OwnerRoot({ session, onSignOut }: OwnerRootProps) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const user = session.user;

  useEffect(() => {
    let cancelled = false;
    const metaName = user.user_metadata?.username;
    const defaultName =
      (typeof metaName === 'string' && metaName.trim()) || user.email?.split('@')[0] || 'MyPR';
    const localProfile = loadProfile(user.id, defaultName, suggestHandle(user.email ?? defaultName));
    const localPage: PageData = {
      userId: user.id,
      profile: localProfile,
      // New accounts start with an empty deck instead of the sample cards,
      // so a shared page never shows someone else's examples
      cards: (() => {
        const repo = new LocalStorageCardRepository(user.id);
        return repo.hasSavedDeck() ? repo.load().cards : [];
      })(),
    };

    (async () => {
      try {
        const remote = await fetchPageByUser(user.id);
        if (remote) {
          if (!cancelled) setState({ status: 'ready', page: remote, syncEnabled: true, notice: null });
          return;
        }
        // First visit since sharing launched: publish what this device has
        const handle = await claimHandle(localProfile.handle, user.id);
        const page: PageData = { ...localPage, profile: { ...localProfile, handle } };
        await savePage(page);
        if (!cancelled) setState({ status: 'ready', page, syncEnabled: true, notice: null });
      } catch (err) {
        const kind = err instanceof PageApiError ? err.kind : 'other';
        const notice =
          kind === 'missing_table'
            ? '공유용 데이터베이스가 아직 준비되지 않아 이 기기에만 저장돼요.'
            : '서버에 연결하지 못해 이 기기에만 저장돼요.';
        if (!cancelled) setState({ status: 'ready', page: localPage, syncEnabled: false, notice });
      }
    })();

    return () => {
      cancelled = true;
    };
    // Load once per account; later session refreshes must not reload the editor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F7F7F5]">
        <Loader2 className="w-6 h-6 text-[#999999] animate-spin" aria-label="불러오는 중" />
      </div>
    );
  }

  return (
    <App
      mode="owner"
      initialPage={state.page}
      syncEnabled={state.syncEnabled}
      syncNotice={state.notice}
      onSignOut={onSignOut}
    />
  );
}
