import React from 'react';
import {
  BookOpen,
  Facebook,
  Github,
  Globe,
  Instagram,
  Layers,
  Linkedin,
  Mail,
  Twitter,
  Youtube,
} from 'lucide-react';
import type { LinkPlatform } from '../utils/linkPlatform';

interface SocialIconProps {
  platform: LinkPlatform;
  className?: string;
}

export const SocialIcon: React.FC<SocialIconProps> = ({ platform, className = 'w-5 h-5' }) => {
  const props = { className, 'aria-hidden': true as const, strokeWidth: 1.8 };
  switch (platform) {
    case 'instagram':
      return <Instagram {...props} />;
    case 'youtube':
      return <Youtube {...props} />;
    case 'blog':
      return <BookOpen {...props} />;
    case 'linkedin':
      return <Linkedin {...props} />;
    case 'github':
      return <Github {...props} />;
    case 'x':
      return <Twitter {...props} />;
    case 'facebook':
      return <Facebook {...props} />;
    case 'behance':
      return <Layers {...props} />;
    case 'email':
      return <Mail {...props} />;
    case 'website':
    default:
      return <Globe {...props} />;
  }
};
