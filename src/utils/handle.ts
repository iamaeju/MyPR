/** A page address: my-pr-fawn.vercel.app/<handle> */
export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

/** Single-segment paths the app may need for itself. */
const RESERVED = new Set([
  'about', 'admin', 'api', 'app', 'assets', 'auth', 'edit', 'help', 'home', 'login', 'logout',
  'me', 'mypr', 'new', 'settings', 'signin', 'signup', 'src', 'static', 'support', 'www',
]);

export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase();
}

/** Returns an error message, or null when the handle is usable. */
export function validateHandle(handle: string): string | null {
  if (!HANDLE_PATTERN.test(handle)) {
    return '주소는 영어 소문자, 숫자, 밑줄(_)로 3~20자여야 해요.';
  }
  if (RESERVED.has(handle)) return '이 주소는 사용할 수 없어요. 다른 주소를 골라주세요.';
  return null;
}

/** A first guess at a handle, from the email or name. */
export function suggestHandle(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/@.*/, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 14);
  const padded = base.length >= 3 ? base : `mypr${base}`;
  return RESERVED.has(padded) ? `${padded}_1` : padded;
}

/** The handle in the current URL, if the path looks like a page address. */
export function handleFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/@?([A-Za-z0-9_]{3,20})\/?$/);
  if (!match) return null;
  const handle = match[1].toLowerCase();
  return RESERVED.has(handle) ? null : handle;
}

export function pageUrl(handle: string): string {
  return `${window.location.origin}/${handle}`;
}
