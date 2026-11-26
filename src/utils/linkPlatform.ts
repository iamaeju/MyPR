import type { PRCardDraft } from '../types/card';
import { normalizeExternalUrl } from './deckMath';

export type LinkPlatform =
  | 'instagram'
  | 'youtube'
  | 'blog'
  | 'linkedin'
  | 'github'
  | 'x'
  | 'facebook'
  | 'behance'
  | 'email'
  | 'website';

type CardStyle = Pick<
  PRCardDraft,
  'category' | 'iconKey' | 'bgColor' | 'accentColor' | 'graphicStyle' | 'fontStyle'
>;

export const PLATFORM_META: Record<LinkPlatform, { label: string; card: CardStyle }> = {
  instagram: {
    label: 'Instagram',
    card: { category: 'INSTAGRAM', iconKey: 'camera', bgColor: '#1C1B19', accentColor: '#E8E5DC', graphicStyle: 'editorial', fontStyle: 'serif' },
  },
  youtube: {
    label: 'YouTube',
    card: { category: 'YOUTUBE', iconKey: 'play', bgColor: '#D94E34', accentColor: '#F7F7F5', graphicStyle: 'minimal', fontStyle: 'sans' },
  },
  blog: {
    label: 'Blog',
    card: { category: 'BLOG', iconKey: 'book', bgColor: '#DDD6CC', accentColor: '#2C2623', graphicStyle: 'editorial', fontStyle: 'serif' },
  },
  linkedin: {
    label: 'LinkedIn',
    card: { category: 'LINKEDIN', iconKey: 'briefcase', bgColor: '#DCE1E5', accentColor: '#111111', graphicStyle: 'grid', fontStyle: 'sans' },
  },
  github: {
    label: 'GitHub',
    card: { category: 'GITHUB', iconKey: 'code', bgColor: '#141413', accentColor: '#C8BFA8', graphicStyle: 'lines', fontStyle: 'mono' },
  },
  x: {
    label: 'X',
    card: { category: 'X', iconKey: 'globe', bgColor: '#111111', accentColor: '#F7F7F5', graphicStyle: 'minimal', fontStyle: 'sans' },
  },
  facebook: {
    label: 'Facebook',
    card: { category: 'FACEBOOK', iconKey: 'globe', bgColor: '#DCE1E5', accentColor: '#111111', graphicStyle: 'circles', fontStyle: 'sans' },
  },
  behance: {
    label: 'Behance',
    card: { category: 'BEHANCE', iconKey: 'layers', bgColor: '#141413', accentColor: '#C8BFA8', graphicStyle: 'lines', fontStyle: 'mono' },
  },
  email: {
    label: 'Email',
    card: { category: 'CONTACT', iconKey: 'mail', bgColor: '#FFFFFF', accentColor: '#111111', graphicStyle: 'minimal', fontStyle: 'sans' },
  },
  website: {
    label: 'Website',
    card: { category: 'WEBSITE', iconKey: 'compass', bgColor: '#E8E5DC', accentColor: '#E5482E', graphicStyle: 'circles', fontStyle: 'sans' },
  },
};

const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

const BLOG_HOSTS = [
  'blog.naver.com',
  'tistory.com',
  'velog.io',
  'brunch.co.kr',
  'medium.com',
  'substack.com',
  'wordpress.com',
  'blogspot.com',
];

/**
 * Turns what a person typed into a safe link: adds https:// when missing,
 * turns a bare email address into mailto:, and rejects unsafe schemes.
 */
export function toSafeLink(raw: string): string | null {
  const trimmed = raw.trim();
  if (EMAIL_PATTERN.test(trimmed)) return `mailto:${trimmed}`;
  const normalized = normalizeExternalUrl(trimmed);
  if (!normalized) return null;
  if (normalized.startsWith('mailto:') || normalized.startsWith('tel:')) return normalized;
  try {
    // Require a dotted host so plain words ("hello") are not accepted as links
    const host = new URL(normalized).hostname;
    return host.includes('.') ? normalized : null;
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\.|^m\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

const matches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

export function detectPlatform(safeUrl: string): LinkPlatform {
  if (safeUrl.startsWith('mailto:')) return 'email';
  const host = hostOf(safeUrl);
  if (matches(host, 'instagram.com')) return 'instagram';
  if (matches(host, 'youtube.com') || host === 'youtu.be') return 'youtube';
  if (matches(host, 'linkedin.com')) return 'linkedin';
  if (matches(host, 'github.com')) return 'github';
  if (matches(host, 'x.com') || matches(host, 'twitter.com')) return 'x';
  if (matches(host, 'facebook.com')) return 'facebook';
  if (matches(host, 'behance.net')) return 'behance';
  if (BLOG_HOSTS.some((d) => matches(host, d))) return 'blog';
  return 'website';
}

/** First path segment, e.g. "sora" for instagram.com/sora/ */
function handleFromUrl(safeUrl: string): string | null {
  try {
    const segment = new URL(safeUrl).pathname.split('/').filter(Boolean)[0];
    if (!segment) return null;
    return decodeURIComponent(segment).replace(/^@/, '');
  } catch {
    return null;
  }
}

/** Builds a ready-to-save card from a single link, styled for its platform. */
export function buildCardDraftFromUrl(raw: string): PRCardDraft | null {
  const safeUrl = toSafeLink(raw);
  if (!safeUrl) return null;

  const platform = detectPlatform(safeUrl);
  const meta = PLATFORM_META[platform];
  const host = hostOf(safeUrl);
  const handle = handleFromUrl(safeUrl);

  let title: string;
  let subtitle: string;
  if (platform === 'email') {
    title = 'Get in Touch';
    subtitle = safeUrl.replace(/^mailto:/, '');
  } else if (platform === 'website') {
    title = host;
    subtitle = handle ? `/${handle}` : 'Website';
  } else {
    title = `My ${meta.label}`;
    subtitle = handle && !['watch', 'channel', 'in', 'c'].includes(handle) ? `@${handle}` : host;
  }

  return {
    ...meta.card,
    title,
    subtitle,
    description: '',
    url: safeUrl,
    imageUrl: undefined,
  };
}
