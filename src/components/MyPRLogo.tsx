import React from 'react';

interface MyPRLogoProps {
  className?: string;
}

export const MyPRLogo: React.FC<MyPRLogoProps> = ({ className = 'h-7 w-auto' }) => {
  return (
    <img
      src="/assets/mypr-logo.png"
      alt="MyPR Logo"
      className={`${className} block select-none object-contain`}
      draggable={false}
    />
  );
};
