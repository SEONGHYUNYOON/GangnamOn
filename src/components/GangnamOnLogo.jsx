import React from 'react';

const GangnamOnLogo = ({ className = 'h-20 w-auto', onClick }) => {
     const GOLD = '#A77910';
     const DARK = '#111827';

     return (
          <svg
               viewBox="0 0 202 84"
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

               <g transform="translate(8 9)">
                    <rect x="0" y="0" width="42" height="42" rx="15" fill="url(#gangnamOnGold)" />
                    <path d="M12.8 27C12.8 19.6 20.6 13.9 28.9 17.1" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M29 13V20H35.7" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="21.2" cy="21.5" r="3" fill="white" opacity="0.96" />
               </g>

               <text
                    x="60"
                    y="43"
                    fontFamily="Pretendard, SUIT, Inter, system-ui, sans-serif"
                    fontSize="33"
                    fontWeight="850"
                    fill={DARK}
               >
                    강남
               </text>
               <text
                    x="130"
                    y="43"
                    fontFamily="'Segoe Script', 'Brush Script MT', 'Pacifico', cursive"
                    fontSize="31"
                    fontWeight="700"
                    fontStyle="italic"
                    fill={GOLD}
               >
                    on
               </text>
               <text
                    x="62"
                    y="66"
                    fontFamily="'Segoe Script', 'Brush Script MT', 'Pacifico', cursive"
                    fontSize="15.5"
                    fontWeight="600"
                    letterSpacing="0.7"
                    fill="#8B99AE"
               >
                    GangNam On
               </text>
          </svg>
     );
};

export default GangnamOnLogo;
