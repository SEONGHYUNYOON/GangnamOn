import React from 'react';

const GangnamOnLogo = ({ className = 'h-14 w-auto', onClick }) => {
     const GOLD = '#A77910';
     const DARK = '#111827';

     return (
          <svg
               viewBox="0 0 184 74"
               className={className}
               onClick={onClick}
               role="img"
               aria-label="강남On"
          >
               <defs>
                    <linearGradient id="gangnamOnGold" x1="14" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
                         <stop stopColor="#D6A427" />
                         <stop offset="1" stopColor="#9A7009" />
                    </linearGradient>
               </defs>

               <g transform="translate(7 8)">
                    <rect x="0" y="0" width="38" height="38" rx="13" fill="url(#gangnamOnGold)" />
                    <path d="M11.5 24.5C11.5 17.8 18.6 12.6 26.2 15.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <path d="M26.2 11.8V18H32.2" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="19.2" cy="19.5" r="2.8" fill="white" opacity="0.96" />
               </g>

               <text
                    x="55"
                    y="38"
                    fontFamily="Pretendard, SUIT, Inter, system-ui, sans-serif"
                    fontSize="29"
                    fontWeight="850"
                    fill={DARK}
               >
                    강남
               </text>
               <text
                    x="115"
                    y="38"
                    fontFamily="Inter, Pretendard, system-ui, sans-serif"
                    fontSize="27"
                    fontWeight="760"
                    fontStyle="italic"
                    fill={GOLD}
               >
                    on
               </text>
               <text
                    x="56"
                    y="59"
                    fontFamily="Inter, Pretendard, system-ui, sans-serif"
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="1.6"
                    fill="#94A3B8"
               >
                    GangNam On
               </text>
          </svg>
     );
};

export default GangnamOnLogo;
