import React, { useEffect } from 'react';

const pieces = Array.from({ length: 28 }, (_, index) => ({
     id: index,
     left: 18 + ((index * 23) % 72),
     delay: (index % 7) * 0.06,
     duration: 1.1 + (index % 5) * 0.12,
     rotate: (index % 2 === 0 ? 1 : -1) * (90 + index * 12),
     color: ['#F59E0B', '#22C55E', '#3B82F6', '#EC4899', '#A855F7'][index % 5],
}));

const WelcomeConfetti = ({ name, onDone }) => {
     useEffect(() => {
          const timer = setTimeout(() => onDone?.(), 3300);
          return () => clearTimeout(timer);
     }, [onDone]);

     return (
          <div className="fixed bottom-7 right-7 z-[120] pointer-events-none">
               <div className="relative w-[310px] overflow-hidden rounded-2xl border border-brand-gold/30 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-gold via-rose-400 to-sky-400" />
                    <p className="text-sm font-black text-brand-ink">{name || '강남 이웃'} 님 환영합니다</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">강남온 미니홈피와 모임을 바로 시작해보세요.</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-black text-brand-accent">
                         <span className="rounded-full bg-brand-light px-2.5 py-1">WELCOME</span>
                         <span>+ 강남 새싹 배지</span>
                    </div>
                    <div className="absolute inset-0">
                         {pieces.map(piece => (
                              <span
                                   key={piece.id}
                                   className="welcome-confetti-piece"
                                   style={{
                                        left: `${piece.left}%`,
                                        backgroundColor: piece.color,
                                        animationDelay: `${piece.delay}s`,
                                        animationDuration: `${piece.duration}s`,
                                        '--confetti-rotate': `${piece.rotate}deg`,
                                   }}
                              />
                         ))}
                    </div>
               </div>
          </div>
     );
};

export default WelcomeConfetti;
