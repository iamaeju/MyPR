import React from 'react';
import {
  BookOpen,
  Briefcase,
  Camera,
  Code2,
  Compass,
  Globe,
  Layers,
  Mail,
  Play,
} from 'lucide-react';
import type { CardIconKey } from '../types/card';

interface CardIconProps {
  iconKey: CardIconKey;
  className?: string;
}

export const CardIcon: React.FC<CardIconProps> = ({ iconKey, className = 'w-4 h-4' }) => {
  switch (iconKey) {
    case 'compass':
      return <Compass className={className} aria-hidden="true" />;
    case 'camera':
      return <Camera className={className} aria-hidden="true" />;
    case 'layers':
      return <Layers className={className} aria-hidden="true" />;
    case 'briefcase':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'play':
      return <Play className={className} aria-hidden="true" />;
    case 'book':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'mail':
      return <Mail className={className} aria-hidden="true" />;
    case 'code':
      return <Code2 className={className} aria-hidden="true" />;
    case 'globe':
    default:
      return <Globe className={className} aria-hidden="true" />;
  }
};
