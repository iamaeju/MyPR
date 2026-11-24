export type CardGraphicStyle = 'circles' | 'minimal' | 'lines' | 'grid' | 'editorial';

export type CardFontStyle = 'sans' | 'serif' | 'mono';

export type CardIconKey =
  | 'compass'
  | 'camera'
  | 'layers'
  | 'briefcase'
  | 'play'
  | 'book'
  | 'mail'
  | 'globe'
  | 'code';

export interface PRCardData {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  bgColor: string;
  accentColor: string;
  graphicStyle: CardGraphicStyle;
  fontStyle: CardFontStyle;
  iconKey: CardIconKey;
  imageUrl?: string;
  createdAt: number;
}

export type PRCardDraft = Omit<PRCardData, 'id' | 'createdAt'>;
