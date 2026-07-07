import React from 'react';

// 강남On 브랜드 로고 (전원 버튼 아이콘 + "강남" + 코인형 o + n, 자간 좁힘)
// 기존 860KB PNG 목업 이미지를 대체하는 SVG 워드마크입니다.
const GangnamOnLogo = ({ className = 'h-14 w-auto', onClick }) => {
     const GOLD = '#B8860B';
     const DARK = '#111827';

     return (
          <svg
               viewBox="0 0 200 60"
               className={className}
               onClick={onClick}
               role="img"
               aria-label="강남On"
          >
               {/* 전원 버튼 아이콘 */}
               <circle
                    cx="26"
                    cy="30"
                    r="15"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="3.4"
                    strokeDasharray="78 16"
                    strokeDashoffset="-8"
                    strokeLinecap="round"
               />
               <line x1="26" y1="8" x2="26" y2="24" stroke={GOLD} strokeWidth="3.4" strokeLinecap="round" />

               {/* 강남 */}
               <text x="54" y="42" fontSize="32" fontWeight="700" fill={DARK}>강남</text>

               {/* 코인형 o + n (자간 좁힘) */}
               <circle cx="146" cy="24" r="14" fill={GOLD} />
               <text x="163" y="42" fontSize="32" fontWeight="500" fill={GOLD}>n</text>
          </svg>
     );
};

export default GangnamOnLogo;
