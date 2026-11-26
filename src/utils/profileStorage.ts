import type { UserProfile } from '../types/profile';

const keyFor = (userId: string) => `mypr.profile.v1.${userId}`;

export function loadProfile(userId: string, fallbackName: string): UserProfile {
  const fallback: UserProfile = { name: fallbackName, bio: '', links: [] };
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : fallbackName,
      bio: typeof parsed.bio === 'string' ? parsed.bio : '',
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : undefined,
      links: Array.isArray(parsed.links)
        ? parsed.links.filter(
            (l): l is UserProfile['links'][number] =>
              Boolean(l) && typeof l.id === 'string' && typeof l.url === 'string'
          )
        : [],
    };
  } catch {
    return fallback;
  }
}

export function saveProfile(userId: string, profile: UserProfile): boolean {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}
