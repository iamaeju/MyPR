import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BrandSite } from '../brand/BrandSite';
import { AuthScreen } from './AuthScreen';

interface AuthGateProps {
  children: (session: Session, signOut: () => Promise<void>) => ReactNode;
}

/** Shows the login / sign-up screen until there is a Supabase session. */
export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) setSession(data.session);
      })
      .catch(() => {
        // Network failure while restoring a session: fall back to the login screen.
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-[#999999] animate-spin" aria-label="불러오는 중" />
      </div>
    );
  }

  if (!session) {
    // Logged-out visitors land on the brand page; /?mode=login or /?mode=signup opens the form
    const mode = new URLSearchParams(window.location.search).get('mode');
    return mode === 'login' || mode === 'signup' ? <AuthScreen /> : <BrandSite />;
  }

  return <>{children(session, signOut)}</>;
}
