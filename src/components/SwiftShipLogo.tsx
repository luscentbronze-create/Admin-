import React from 'react';

interface SwiftShipLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const SwiftShipLogo: React.FC<SwiftShipLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Hexagonal Yellow Cube Logo */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-lg bg-gradient-to-br from-[#FFD600] to-[#E6C200] text-black shadow-md shadow-[#FFD600]/20 flex-shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-3/5 h-3/5 fill-none stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round"
        >
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
          <path d="M12 22V12" />
          <path d="M21 7l-9 5-9-5" />
          <path d="M7.5 4.5l9 5" opacity="0.6" />
        </svg>
      </div>

      {showText && (
        <div className="flex items-center leading-none">
          <span className={`font-bold tracking-tight text-white ${textSizes[size]}`}>
            SwiftShip
          </span>
        </div>
      )}
    </div>
  );
};
