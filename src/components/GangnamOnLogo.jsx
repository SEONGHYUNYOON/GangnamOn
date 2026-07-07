import React from 'react';

const GangnamOnLogo = ({ className = 'h-14 w-auto', onClick }) => {
     const GOLD = '#B88A14';
     const DARK = '#111827';

     return (
          <svg
               viewBox="0 0 176 58"
               className={className}
               onClick={onClick}
               role="img"
               aria-label="강남On"
          >
               <defs>
                    <linearGradient id="gangnamOnGold" x1="18" y1="10" x2="44" y2="42" gradientUnits="userSpaceOnUse">
                         <stop stopColor="#D3A12A" />
                         <stop offset="1" stopColor="#9C7107" />
                    </linearGradient>
               </defs>

               <g transform="translate(5 9)">
                    <rect x="0" y="0" width="40" height="40" rx="14" fill="url(#gangnamOnGold)" />
                    <path d="M12 25.5C12 18 20 12.5 28 15.8" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M28 12.5V18.5H34" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="20" cy="20" r="3" fill="white" opacity="0.95" />
               </g>

               <text
                    x="56"
                    y="39"
                    fontFamily="Pretendard, SUIT, Inter, system-ui, sans-serif"
                    fontSize="30"
                    fontWeight="800"
                    fill={DARK}
               >
                    강남
               </text>
               <text
                    x="118"
                    y="39"
                    fontFamily="Inter, Pretendard, system-ui, sans-serif"
                    fontSize="29"
                    fontWeight="700"
                    fontStyle="italic"
                    fill={GOLD}
               >
                    on
               </text>
          </svg>
     );
};

export default GangnamOnLogo;
