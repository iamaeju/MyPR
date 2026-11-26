import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { PRCardData } from '../types/card';
import { getContrastInk, normalizeExternalUrl } from '../utils/deckMath';
import { CardIcon } from './CardIcon';

interface PRCardProps {
  card: PRCardData;
  isActive?: boolean;
  isInteractive?: boolean;
  compact?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
}

function formatHostLabel(rawUrl: string): string {
  const normalized = normalizeExternalUrl(rawUrl);
  if (!normalized) return 'No link';
  if (normalized.startsWith('mailto:')) {
    return normalized.replace(/^mailto:/i, '');
  }
  try {
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return 'Open';
  }
}

export const PRCard: React.FC<PRCardProps> = ({
  card,
  isActive = false,
  isInteractive = true,
  compact = false,
  onClick,
  className = '',
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasValidImage = Boolean(card.imageUrl && !imageFailed);

  const inkMode = hasValidImage ? 'light' : getContrastInk(card.bgColor);
  const isLightInk = inkMode === 'light';

  const textColorClass = isLightInk ? 'text-[#FAF9F6]' : 'text-[#111111]';
  const mutedTextClass = isLightInk ? 'text-[#FAF9F6]/75' : 'text-[#111111]/70';
  const subtleBorderClass =
    card.bgColor.toUpperCase() === '#FFFFFF'
      ? 'border border-[#E5E5E3]'
      : isLightInk
        ? 'border border-white/12'
        : 'border border-black/8';

  const fontClass =
    card.fontStyle === 'serif'
      ? 'font-card-serif'
      : card.fontStyle === 'mono'
        ? 'font-card-mono'
        : 'font-card-sans';

  const safeUrl = normalizeExternalUrl(card.url);
  const hostLabel = formatHostLabel(card.url);
  const hasUrl = Boolean(safeUrl);
  const isMailOrTel = Boolean(
    safeUrl && (safeUrl.startsWith('mailto:') || safeUrl.startsWith('tel:'))
  );

  const renderContent = () => (
    <>
      {/* Background image or custom graphic motif */}
      {hasValidImage ? (
        <>
          <img
            src={card.imageUrl}
            alt={card.title}
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45 pointer-events-none"
          />
        </>
      ) : (
        <CardGraphicBackdrop
          style={card.graphicStyle}
          accentColor={card.accentColor}
          isLightInk={isLightInk}
        />
      )}

      {/* Card Inner Content */}
      <div
        className={`relative z-10 h-full w-full flex flex-col justify-between ${
          compact ? 'pt-3 px-4 pb-3.5' : 'pt-3 sm:pt-3.5 px-5 sm:px-6 pb-4 sm:pb-5'
        } ${textColorClass} ${fontClass} text-left`}
      >
        {/* Top Bar (visible when card peeks above in the stack) */}
        <div className="flex items-center justify-between gap-3">
          <span
            className={`${
              compact ? 'text-[11px]' : 'text-[12px] sm:text-[13px]'
            } font-semibold tracking-[0.06em] uppercase truncate leading-none`}
          >
            {card.category}
          </span>
          <span
            className={`inline-flex items-center justify-center ${
              compact ? 'w-6 h-6' : 'w-6.5 h-6.5 sm:w-7 sm:h-7'
            } rounded-full shrink-0 ${
              isLightInk ? 'bg-white/14 text-white' : 'bg-black/7 text-[#111111]'
            }`}
          >
            <CardIcon
              iconKey={card.iconKey}
              className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}
            />
          </span>
        </div>

        {/* Bottom Identity Block */}
        <div className="flex items-end justify-between gap-3 mt-auto">
          <div className="min-w-0 flex-1">
            {card.subtitle && (
              <p
                className={`${
                  compact ? 'text-[10px]' : 'text-[11px] sm:text-[12px]'
                } font-medium truncate mb-0.5 ${mutedTextClass}`}
              >
                {card.subtitle}
              </p>
            )}
            <h2
              className={`${
                compact
                  ? 'text-[15px] leading-[1.16]'
                  : 'text-[17px] sm:text-[21px] leading-[1.16]'
              } font-bold tracking-[-0.025em] line-clamp-2`}
            >
              {card.title}
            </h2>
            {card.description && !compact && (
              <p
                className={`text-[11px] sm:text-[12px] leading-[1.4] mt-1 line-clamp-2 ${mutedTextClass}`}
              >
                {card.description}
              </p>
            )}
          </div>

          <div
            className={`shrink-0 inline-flex items-center gap-1 ${
              compact ? 'text-[10px]' : 'text-[11px]'
            } font-medium whitespace-nowrap pb-0.5 ${
              hasUrl ? textColorClass : mutedTextClass
            }`}
          >
            <span className="max-w-[96px] truncate">{hasUrl ? hostLabel : '링크 없음'}</span>
            {hasUrl && <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
          </div>
        </div>
      </div>
    </>
  );

  const cardSurfaceStyle: React.CSSProperties = {
    backgroundColor: card.bgColor,
  };

  const baseClasses = `relative w-full aspect-[3/2] rounded-[24px] overflow-hidden select-none ${subtleBorderClass} ${className}`;

  if (!isInteractive) {
    return (
      <div style={cardSurfaceStyle} className={baseClasses}>
        {renderContent()}
      </div>
    );
  }

  const interactiveClasses = `${baseClasses} block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2 focus-visible:ring-offset-white`;

  if (isActive && safeUrl) {
    return (
      <a
        href={safeUrl}
        target={isMailOrTel ? undefined : '_blank'}
        rel={isMailOrTel ? undefined : 'noopener noreferrer'}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onClick={onClick}
        style={cardSurfaceStyle}
        aria-label={`${card.category}: ${card.title} — Open ${hostLabel}`}
        className={interactiveClasses}
      >
        {renderContent()}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={cardSurfaceStyle}
      aria-label={
        isActive
          ? `${card.category}: ${card.title} — No external link attached`
          : `${card.category}: ${card.title} — Bring to front`
      }
      className={interactiveClasses}
    >
      {renderContent()}
    </button>
  );
};

interface BackdropProps {
  style: PRCardData['graphicStyle'];
  accentColor: string;
  isLightInk: boolean;
}

const CardGraphicBackdrop: React.FC<BackdropProps> = ({
  style,
  accentColor,
  isLightInk,
}) => {
  if (style === 'circles') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 450 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <circle cx="152" cy="110" r="60" fill={accentColor} opacity="0.92" />
        <circle cx="222" cy="110" r="60" fill={accentColor} opacity="0.88" />
        <circle cx="300" cy="110" r="64" fill={accentColor} opacity="0.95" />
      </svg>
    );
  }

  if (style === 'lines') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 450 300"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
      >
        <line x1="0" y1="68" x2="450" y2="68" stroke={accentColor} strokeWidth="1" />
        <line x1="0" y1="124" x2="450" y2="124" stroke={accentColor} strokeWidth="1" />
        <line x1="0" y1="180" x2="450" y2="180" stroke={accentColor} strokeWidth="1" />
        <line x1="310" y1="0" x2="310" y2="300" stroke={accentColor} strokeWidth="1" />
        <circle cx="310" cy="124" r="38" fill="none" stroke={accentColor} strokeWidth="1.25" />
      </svg>
    );
  }

  if (style === 'grid') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 450 300"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-15"
      >
        <defs>
          <pattern id="mypr-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke={accentColor}
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="450" height="300" fill="url(#mypr-grid)" />
      </svg>
    );
  }

  if (style === 'editorial') {
    return (
      <div
        aria-hidden="true"
        className={`absolute inset-3.5 rounded-[16px] border pointer-events-none ${
          isLightInk ? 'border-white/15' : 'border-black/10'
        }`}
      />
    );
  }

  // 'minimal'
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${
        isLightInk
          ? 'bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_55%)]'
          : 'bg-[radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.03),transparent_55%)]'
      }`}
    />
  );
};
