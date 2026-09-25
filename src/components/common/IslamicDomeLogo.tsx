import React from 'react';

interface IslamicDomeLogoProps {
  className?: string;
}

export const IslamicDomeLogo: React.FC<IslamicDomeLogoProps> = ({
  className = 'w-9 h-9 text-emerald-400',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Islamic Mosque Dome Logo"
    >
      {/* Top Islamic Crescent (Hilal) & Finial Spire */}
      <path
        d="M24 2.8C25.4 2.8 26.5 3.7 26.5 5C26.5 6.3 25.4 7.2 24 7.2C24.8 6.8 25.3 6 25.3 5C25.3 4 24.8 3.2 24 2.8Z"
        fill="currentColor"
      />
      <circle cx="24" cy="5" r="0.8" fill="currentColor" />
      <path
        d="M24 7.2V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Main Mosque Dome (Graceful Ogee Onion Arch) */}
      <path
        d="M24 11C23.2 13.8 15 16.5 15 24.5C15 29 17.5 31.8 17.5 34.5H30.5C30.5 31.8 33 29 33 24.5C33 16.5 24.8 13.8 24 11Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Dome Rib Accents (Subtle Architectural Radiance) */}
      <path
        d="M24 11.5C21.8 16 19.5 24 20 34.5M24 11.5C26.2 16 28.5 24 28 34.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />

      {/* Central Mihrab / Arched Gateway */}
      <path
        d="M21 34.5V27.5C21 25.3 22.8 23.5 24 22.5C25.2 23.5 27 25.3 27 27.5V34.5"
        fill="currentColor"
        fillOpacity="0.38"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Left Minaret / Architectural Flank */}
      <path
        d="M9.5 17L9.5 18.5M9.5 18.5C9 20 7.5 21 7.5 23.5H11.5C11.5 21 10 20 9.5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect
        x="7"
        y="23.5"
        width="5"
        height="1.8"
        rx="0.5"
        fill="currentColor"
      />
      <rect
        x="8"
        y="25.3"
        width="3"
        height="9.2"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.1"
      />

      {/* Right Minaret / Architectural Flank */}
      <path
        d="M38.5 17L38.5 18.5M38.5 18.5C38 20 36.5 21 36.5 23.5H40.5C40.5 21 39 20 38.5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect
        x="36"
        y="23.5"
        width="5"
        height="1.8"
        rx="0.5"
        fill="currentColor"
      />
      <rect
        x="37"
        y="25.3"
        width="3"
        height="9.2"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.1"
      />

      {/* Mosque Foundation Plinth & Base Steps */}
      <path
        d="M12.5 34.5H35.5V37.2H12.5V34.5Z"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M6 37.2H42V40.5H6V37.2Z"
        fill="currentColor"
        fillOpacity="0.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
};
