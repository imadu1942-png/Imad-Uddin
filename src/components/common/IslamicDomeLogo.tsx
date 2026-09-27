import React from 'react';
import officialLogo from '../../assets/images/official_logo_1790499886861.jpg';

interface IslamicDomeLogoProps {
  className?: string;
}

export const IslamicDomeLogo: React.FC<IslamicDomeLogoProps> = ({
  className = 'w-9 h-9',
}) => {
  return (
    <img
      src={officialLogo}
      alt="আশেকানে গাউছিয়া অফিসিয়াল লোগো"
      className={`object-contain rounded-full ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

