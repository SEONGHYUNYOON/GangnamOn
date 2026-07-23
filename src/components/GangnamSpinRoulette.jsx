import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCw, Zap } from 'lucide-react';
import GameHelpDropdown from './GameHelpDropdown';
import { playSound } from '../lib/gameSounds';

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
     const tickTimersRef = useRef([]); // 감속 틱 사운드 타이머 (언마운트 시 정리)

     const shuffled = useMemo(() => {
          const arr = [...SEGMENTS];
          for (let i = arr.length - 1; i > 0; i--) {
               const j = Math.floor(Math.random() * (i + 1));
               [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
     }, []);

     useEffect(() => () => {
          tickTimersRef.current.forEach(clearTimeout);
     }, []);

     const spin = () => {
          if (spinning) return;
          playSound('click');
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

          // 회전 사운드: 발사음 + 점점 느려지는 틱
          playSound('whoosh');
          tickTimersRef.current.forEach(clearTimeout);
          tickTimersRef.current = [];
          let tickAt = 0;
          let gap = 110;
          while (tickAt < 3900) {
               tickTimersRef.current.push(setTimeout(() => playSound('tick'), tickAt));
               tickAt += gap;
               gap *= 1.22;
          }

          setTimeout(() => {
               const won = shuffled[idx];
               playSound(won.value >= 50 ? 'win' : won.value > 0 ? 'coin' : 'wrong');
               setResult(won);
               setSpinning(false);
               if (won.value > 0 && typeof updateBeanCount === 'function') {
                    updateBeanCount(won.value);
               }
               setHistory(h => [{ ...won, at: new Date().toLocaleTimeString() }, ...h].slice(0, 5));
          }, 4200);
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-2xl mx-auto">
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

               {/* 살짝 기울어진 3D 룰렛 */}
               <div className="relative mb-8 [perspective:900px]">
                    <div className="relative [transform:rotateX(12deg)]">
                         {/* 포인터 */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-[0_4px_5px_rgba(0,0,0,0.6)]" />

                         {/* 메탈릭 림 (골드 콘익 그라데이션 + 층층 그림자) */}
                         <div className="relative rounded-full p-2.5 bg-[conic-gradient(from_45deg,#fde68a,#b45309,#fbbf24,#78350f,#fde68a,#b45309,#fbbf24,#78350f,#fde68a)] shadow-[0_22px_45px_rgba(0,0,0,0.65),0_0_35px_rgba(245,158,11,0.25),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-3px_8px_rgba(0,0,0,0.6)]">

                              {/* 회전하는 휠 (세그먼트 라벨도 함께 회전) */}
                              <div
                                   className="w-64 h-64 rounded-full border-2 border-black/40 transition-transform duration-[4000ms] ease-out relative"
                                   style={{
                                        transform: `rotate(${rotation}deg)`,
                                        background: `conic-gradient(${shuffled.map((seg, i) => `${seg.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')})`,
                                   }}
                              >
                                   {shuffled.map((seg, i) => (
                                        <div
                                             key={i}
                                             className="absolute text-[10px] font-black text-white drop-shadow"
                                             style={{
                                                  left: '50%',
                                                  top: '50%',
                                                  transform: `rotate(${i * 45 + 22.5}deg) translateY(-90px)`,
                                                  transformOrigin: '0 0',
                                             }}
                                        >
                                             {seg.label}
                                        </div>
                                   ))}
                              </div>

                              {/* 고정 광택/깊이 오버레이 (휠 위에서 회전하지 않음) */}
                              <div className="absolute inset-2.5 rounded-full pointer-events-none bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,0.28),rgba(255,255,255,0.05)_38%,transparent_55%)] shadow-[inset_0_12px_25px_rgba(0,0,0,0.5),inset_0_-10px_20px_rgba(0,0,0,0.45)]" />

                              {/* 림 스터드 */}
                              {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
                                   <div
                                        key={a}
                                        className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-gradient-to-br from-yellow-100 to-amber-600 shadow-[0_1px_2px_rgba(0,0,0,0.6)] pointer-events-none"
                                        style={{ transform: `rotate(${a}deg) translateY(-133px)` }}
                                   />
                              ))}

                              {/* 고정 중앙 허브 */}
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 via-gray-900 to-black border-2 border-amber-400 shadow-[0_5px_12px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center text-amber-400 font-black text-sm">온</div>
                         </div>
                    </div>
               </div>

               <button
                    onClick={spin}
                    disabled={spinning}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-black py-3 px-10 rounded-full flex items-center gap-2 mb-4 shadow-[0_6px_16px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] active:scale-95 transition-transform"
               >
                    <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
                    {spinning ? '돌리는 중...' : '돌리기 (1온)'}
               </button>

               {result && (
                    <div className={`rounded-2xl p-4 text-center w-full border ${result.value > 0 ? 'bg-green-900/30 border-green-500/40 shadow-[0_0_25px_rgba(34,197,94,0.2)]' : 'bg-gray-800 border-gray-600'}`}>
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
