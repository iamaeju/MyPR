import type { PRCardData } from '../types/card';
import type { PageData, ProfileLink } from '../types/profile';
import { supabase } from './supabase';

/** Row shape of public.mypr_pages (see supabase/schema.sql). */
interface PageRow {
  user_id: string;
  handle: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  links: ProfileLink[] | null;
  cards: PRCardData[] | null;
}

const TABLE = 'mypr_pages';
const COLUMNS = 'user_id, handle, name, bio, avatar_url, links, cards';

export class PageApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'handle_taken' | 'missing_table' | 'network' | 'other'
  ) {
    super(message);
  }
}

function toPage(row: PageRow): PageData {
  return {
    userId: row.user_id,
    profile: {
      handle: row.handle,
      name: row.name,
      bio: row.bio,
      avatarUrl: row.avatar_url ?? undefined,
      links: Array.isArray(row.links) ? row.links : [],
    },
    cards: Array.isArray(row.cards) ? row.cards : [],
  };
}

function toError(error: { code?: string; message?: string } | null): PageApiError {
  const code = error?.code ?? '';
  const message = error?.message ?? 'Unknown error';
  if (code === '23505') return new PageApiError(message, 'handle_taken');
  if (code === '42P01' || code === 'PGRST205' || /does not exist|schema cache/i.test(message)) {
    return new PageApiError(message, 'missing_table');
  }
  if (/fetch|network|load failed/i.test(message)) return new PageApiError(message, 'network');
  return new PageApiError(message, 'other');
}

function client() {
  if (!supabase) throw new PageApiError('Supabase is not configured', 'other');
  return supabase;
}

export async function fetchPageByHandle(handle: string): Promise<PageData | null> {
  const { data, error } = await client()
    .from(TABLE)
    .select(COLUMNS)
    .eq('handle', handle)
    .maybeSingle<PageRow>();
  if (error) throw toError(error);
  return data ? toPage(data) : null;
}

export async function fetchPageByUser(userId: string): Promise<PageData | null> {
  const { data, error } = await client()
    .from(TABLE)
    .select(COLUMNS)
    .eq('user_id', userId)
    .maybeSingle<PageRow>();
  if (error) throw toError(error);
  return data ? toPage(data) : null;
}

/** True when nobody else uses this handle. */
export async function isHandleFree(handle: string, userId: string): Promise<boolean> {
  const { data, error } = await client()
    .from(TABLE)
    .select('user_id')
    .eq('handle', handle)
    .maybeSingle<{ user_id: string }>();
  if (error) throw toError(error);
  return !data || data.user_id === userId;
}

export async function savePage(page: PageData): Promise<void> {
  const row: PageRow & { updated_at: string } = {
    user_id: page.userId,
    handle: page.profile.handle,
    name: page.profile.name,
    bio: page.profile.bio,
    avatar_url: page.profile.avatarUrl ?? null,
    links: page.profile.links,
    cards: page.cards,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client().from(TABLE).upsert(row, { onConflict: 'user_id' });
  if (error) throw toError(error);
}
