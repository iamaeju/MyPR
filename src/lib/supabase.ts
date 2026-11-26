import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Public connection details for the MyPR Supabase project.
 * The publishable key is designed to be shipped to browsers (access is
 * controlled by Row Level Security), so it is safe to keep in the code.
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY override these when set.
 * Never put a secret (sb_secret_...) or service_role key here.
 */
const DEFAULT_SUPABASE_URL = 'https://mgcrfzdyrveakbzsodwh.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_jCd-4mL1xvyrvgQr3naMRQ_k47yQ9VL';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;

/** True when both Supabase settings are available. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
