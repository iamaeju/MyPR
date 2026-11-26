import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  /** Diameter in px. */
  size: number;
  className?: string;
}

/** Round profile picture, or the first letter of the name when there is no photo. */
export const Avatar: React.FC<AvatarProps> = ({ name, src, size, className = '' }) => {
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? 'M';
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={`rounded-full overflow-hidden bg-[#111111] text-white flex items-center justify-center select-none shrink-0 ${className}`}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
      ) : (
        <span className="font-bold leading-none">{initial}</span>
      )}
    </span>
  );
};
