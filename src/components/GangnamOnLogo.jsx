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
                    <filter id="gangnamTextNeon" x="-24%" y="-42%" width="148%" height="200%" colorInterpolationFilters="sRGB">
                         <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#38BDF8" floodOpacity="0.42" />
                         <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#60A5FA" floodOpacity="0.24" />
                         <feDropShadow dx="0" dy="1" stdDeviation="2.6" floodColor="#A77910" floodOpacity="0.18" />
                    </filter>
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
                    fill="#38BDF8"
                    opacity="0.18"
                    filter="url(#gangnamTextNeon)"
               >
                    강남
               </text>
               <text
                    x="60"
                    y="43"
                    fontFamily="Pretendard, SUIT, Inter, system-ui, sans-serif"
                    fontSize="33"
                    fontWeight="850"
                    fill={DARK}
                    filter="url(#gangnamTextNeon)"
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
