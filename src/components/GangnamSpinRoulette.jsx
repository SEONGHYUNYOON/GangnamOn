import React, { useState, useMemo } from 'react';
import { ArrowLeft, RotateCw, Zap } from 'lucide-react';
import GameHelpDropdown from './GameHelpDropdown';

const SEGMENTS = [
     { label: '+5온', value: 5, color: '#22c55e' },
     { label: '꽝', value: 0, color: '#64748b' },
     { label: '+10온', value: 10, color: '#3b82f6' },
     { label: '+20온', value: 20, color: '#a855f7' },
     { label: '꽝', value: 0, color: '#475569' },
     { label: '+50온', value: 50, color: '#f59e0b' },
     { label: '+5온', value: 5, color: '#10b981' },
     { label: '+10온', value: 10, color: '#6366f1' },
];

const GangnamSpinRoulette = ({ onClose, user, beanCount = 0, updateBeanCount }) => {
     const [spinning, setSpinning] = useState(false);
     const [rotation, setRotation] = useState(0);
     const [result, setResult] = useState(null);
     const [history, setHistory] = useState([]);

     const shuffled = useMemo(() => {
          const arr = [...SEGMENTS];
          for (let i = arr.length - 1; i > 0; i--) {
               const j = Math.floor(Math.random() * (i + 1));
               [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
     }, []);

     const spin = () => {
          if (spinning) return;
          if (!user?.id) { alert('로그인 후 이용할 수 있습니다.'); return; }
          if (beanCount < 1) { alert('온이 부족해요! (1온 필요)'); return; }

          const ok = window.confirm('룰렛 1회 돌리기에 1온이 소모됩니다. 진행할까요?');
          if (!ok) return;
          if (typeof updateBeanCount === 'function') updateBeanCount(-1);

          const idx = Math.floor(Math.random() * shuffled.length);
          const segAngle = 360 / shuffled.length;
          const targetAngle = 360 * 5 + (360 - idx * segAngle - segAngle / 2);

          setSpinning(true);
          setResult(null);
          setRotation(prev => prev + targetAngle);

          setTimeout(() => {
               const won = shuffled[idx];
               setResult(won);
               setSpinning(false);
               if (won.value > 0 && typeof updateBeanCount === 'function') {
                    updateBeanCount(won.value);
               }
               setHistory(h => [{ ...won, at: new Date().toLocaleTimeString() }, ...h].slice(0, 5));
          }, 4200);
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-lg mx-auto">
               <div className="w-full flex justify-between items-center mb-6">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <div className="flex items-center gap-1.5">
                         <h2 className="text-xl font-black tracking-wider">온 룰렛</h2>
                         <GameHelpDropdown accent="amber">
                              <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside leading-relaxed">
                                   <li>입장은 <b className="text-white">무료</b>예요</li>
                                   <li><b className="text-amber-400">돌리기</b> 버튼 클릭 시 1온이 소모돼요</li>
                                   <li>당첨 시 +5 ~ +50온 지급 · 꽝도 있어요</li>
                              </ul>
                         </GameHelpDropdown>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-bold min-w-[3rem] justify-end"><Zap className="w-4 h-4" />{beanCount}</div>
               </div>

               <div className="relative mb-8">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-amber-400" />
                    <div
                         className="w-64 h-64 rounded-full border-4 border-amber-500/50 flex items-center justify-center transition-transform duration-[4000ms] ease-out shadow-xl"
                         style={{
                              transform: `rotate(${rotation}deg)`,
                              background: `conic-gradient(${shuffled.map((seg, i) => `${seg.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')})`,
                         }}
                    >
                         <div className="w-16 h-16 rounded-full bg-gray-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-black text-sm">온</div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                         {shuffled.map((seg, i) => (
                              <div
                                   key={i}
                                   className="absolute text-[10px] font-black text-white drop-shadow"
                                   style={{
                                        left: '50%',
                                        top: '50%',
                                        transform: `rotate(${i * 45 + 22}deg) translateY(-90px)`,
                                        transformOrigin: '0 0',
                                   }}
                              >
                                   {seg.label}
                              </div>
                         ))}
                    </div>
               </div>

               <button
                    onClick={spin}
                    disabled={spinning}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-black py-3 px-10 rounded-full flex items-center gap-2 mb-4"
               >
                    <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
                    {spinning ? '돌리는 중...' : '돌리기 (1온)'}
               </button>

               {result && (
                    <div className={`rounded-2xl p-4 text-center w-full border ${result.value > 0 ? 'bg-green-900/30 border-green-500/40' : 'bg-gray-800 border-gray-600'}`}>
                         <p className="text-2xl font-black">{result.value > 0 ? `🎉 ${result.label} 획득!` : '😅 꽝... 다음 기회에!'}</p>
                    </div>
               )}

               {history.length > 0 && (
                    <div className="mt-6 w-full">
                         <p className="text-xs text-gray-500 mb-2">최근 결과</p>
                         {history.map((h, i) => (
                              <div key={i} className="text-sm text-gray-400 py-1 border-b border-white/5">{h.at} — {h.label}</div>
                         ))}
                    </div>
               )}
          </div>
     );
};

export default GangnamSpinRoulette;
