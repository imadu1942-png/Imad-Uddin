import React from 'react';
import officialLogo from '../../assets/images/official_logo_1790499886861.jpg';

interface OfficialLogoProps {
  className?: string;
  alt?: string;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({
  className = 'w-10 h-10',
  alt = 'আশেকানে গাউছিয়া অফিসিয়াল লোগো',
}) => {
  return (
    <img
      src={officialLogo}
      alt={alt}
      className={`object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
