import type { PRCardData } from './card';

export interface ProfileLink {
  id: string;
  url: string;
}

export interface UserProfile {
  /** Public page address: <site>/<handle> */
  handle: string;
  name: string;
  bio: string;
  /** Data URL of an uploaded, downscaled avatar image. */
  avatarUrl?: string;
  links: ProfileLink[];
}

/** Everything a visitor sees on someone's page. */
export interface PageData {
  userId: string;
  profile: UserProfile;
  cards: PRCardData[];
}
