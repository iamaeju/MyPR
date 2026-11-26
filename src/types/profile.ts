export interface ProfileLink {
  id: string;
  url: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  /** Data URL of an uploaded, downscaled avatar image. */
  avatarUrl?: string;
  links: ProfileLink[];
}
