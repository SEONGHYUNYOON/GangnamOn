import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const EventTimer = ({ expiresAt }) => {
     const [timeLeft, setTimeLeft] = useState('');
     const [isExpired, setIsExpired] = useState(false);

     useEffect(() => {
          if (!expiresAt) return;

          const calculateTimeLeft = () => {
               const difference = new Date(expiresAt) - new Date();

               if (difference <= 0) {
                    setIsExpired(true);
                    setTimeLeft('종료됨');
                    return;
               }

               const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
               const minutes = Math.floor((difference / 1000 / 60) % 60);
               const seconds = Math.floor((difference / 1000) % 60);

               setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          };

          calculateTimeLeft();
          const timer = setInterval(calculateTimeLeft, 1000);

          return () => clearInterval(timer);
     }, [expiresAt]);

     return (
          <div className={`flex items-center gap-2 ${isExpired ? 'text-stone-400' : 'text-rose-600'}`}>
               <Clock className={`w-5 h-5 ${!isExpired && 'animate-bounce'}`} />
               <span className={`font-mono text-xl md:text-2xl font-black tracking-widest ${!isExpired && 'drop-shadow-sm'}`}>
                    {isExpired ? '종료됨' : timeLeft}
               </span>
               {!isExpired && <span className="text-xs font-bold text-rose-400 mb-1 self-end">남음</span>}
          </div>
     );
};

export default EventTimer;
