import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import App from './App';
import { MyPRLogo } from './components/MyPRLogo';
import { fetchPageByHandle, PageApiError } from './lib/pageApi';
import { supabase } from './lib/supabase';
import type { PageData } from './types/profile';

type State =
  | { status: 'loading' }
  | { status: 'found'; page: PageData; isOwnPage: boolean }
  | { status: 'missing' }
  | { status: 'error'; kind: PageApiError['kind']; detail: string };

/** A person's public page at <site>/<handle>. No login needed. */
export function PublicRoot({ handle }: { handle: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await fetchPageByHandle(handle);
        if (!page) {
          if (!cancelled) setState({ status: 'missing' });
          return;
        }
        const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
        if (!cancelled) {
          setState({ status: 'found', page, isOwnPage: data.session?.user.id === page.userId });
        }
      } catch (err) {
        const kind = err instanceof PageApiError ? err.kind : 'other';
        const detail = err instanceof Error ? err.message : String(err);
        if (!cancelled) setState({ status: 'error', kind, detail });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  useEffect(() => {
    if (state.status === 'found') document.title = `${state.page.profile.name} | MyPR`;
  }, [state]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-[#999999] animate-spin" aria-label="불러오는 중" />
      </div>
    );
  }

  if (state.status === 'found') {
    return <App mode="visitor" page={state.page} isOwnPage={state.isOwnPage} />;
  }

  return (
    <div className="min-h-[100dvh] bg-white text-[#111111] flex flex-col items-center justify-center px-6 text-center">
      <MyPRLogo className="h-12 w-auto" />
      <h1 className="mt-6 text-[22px] font-bold tracking-[-0.03em]">
        {state.status === 'missing'
          ? '페이지를 찾을 수 없어요'
          : state.kind === 'missing_table'
            ? '공유 기능이 아직 준비되지 않았어요'
            : '페이지를 불러오지 못했어요'}
      </h1>
      <p className="mt-2 text-[14px] text-[#777777] max-w-[320px]">
        {state.status === 'missing'
          ? `/${handle} 주소를 쓰는 MyPR 페이지가 없어요.`
          : state.kind === 'missing_table'
            ? '사이트의 데이터베이스 설정(supabase/schema.sql)이 끝나면 볼 수 있어요.'
            : '인터넷 연결을 확인하고 잠시 후 다시 시도해주세요.'}
      </p>
      {state.status === 'error' && (
        <p className="mt-3 max-w-[320px] break-all font-mono text-[11px] text-[#AAAAAA]">
          오류 정보: {state.detail}
        </p>
      )}
      <a
        href="/"
        className="mt-6 h-12 px-6 rounded-2xl bg-[#111111] text-white text-[15px] font-bold inline-flex items-center"
      >
        나도 MyPR 만들기
      </a>
    </div>
  );
}
