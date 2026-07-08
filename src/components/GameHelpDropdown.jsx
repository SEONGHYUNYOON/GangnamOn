import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

const accentMap = {
     violet: { btn: 'text-violet-400 hover:bg-violet-500/20', border: 'border-violet-500/30', label: 'text-violet-300' },
     amber: { btn: 'text-amber-400 hover:bg-amber-500/20', border: 'border-amber-500/30', label: 'text-amber-300' },
     pink: { btn: 'text-pink-400 hover:bg-pink-500/20', border: 'border-pink-500/30', label: 'text-pink-300' },
     orange: { btn: 'text-orange-400 hover:bg-orange-500/20', border: 'border-orange-500/30', label: 'text-orange-300' },
     teal: { btn: 'text-teal-400 hover:bg-teal-500/20', border: 'border-teal-500/30', label: 'text-teal-300' },
     rose: { btn: 'text-rose-400 hover:bg-rose-500/20', border: 'border-rose-500/30', label: 'text-rose-300' },
};

const GameHelpDropdown = ({ accent = 'violet', children }) => {
     const [open, setOpen] = useState(false);
     const ref = useRef(null);
     const colors = accentMap[accent] || accentMap.violet;

     useEffect(() => {
          if (!open) return;
          const onOutside = (e) => {
               if (ref.current && !ref.current.contains(e.target)) setOpen(false);
          };
          document.addEventListener('mousedown', onOutside);
          return () => document.removeEventListener('mousedown', onOutside);
     }, [open]);

     return (
          <div className="relative" ref={ref}>
               <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className={`p-1 rounded-full transition-colors ${colors.btn}`}
                    aria-label="게임 방법 보기"
                    aria-expanded={open}
               >
                    <HelpCircle className="w-5 h-5" />
               </button>
               {open && (
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-72 bg-gray-800 rounded-xl p-4 border shadow-xl shadow-black/40 ${colors.border} text-left`}>
                         <div className={`text-xs font-bold mb-2 ${colors.label}`}>🎯 게임 방법</div>
                         {children}
                    </div>
               )}
          </div>
     );
};

export default GameHelpDropdown;
