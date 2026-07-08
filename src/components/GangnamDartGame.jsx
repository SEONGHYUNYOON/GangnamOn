import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const ROUNDS = 10;
const BOARD_R = 120;

const scoreAt = (dx, dy, r) => {
     const dist = Math.sqrt(dx * dx + dy * dy);
     const ratio = dist / r;
     if (ratio <= 0.15) return 100;
     if (ratio <= 0.35) return 60;
     if (ratio <= 0.55) return 40;
     if (ratio <= 0.75) return 20;
     if (ratio <= 1) return 10;
     return 0;
};

const GangnamDartGame = ({ onClose, user }) => {
     const [phase, setPhase] = useState('idle');
     const [round, setRound] = useState(0);
     const [total, setTotal] = useState(0);
     const [lastHit, setLastHit] = useState(null);
     const [target, setTarget] = useState({ x: 0, y: 0, scale: 1 });
     const [rankList, setRankList] = useState(() => getRankTop10('dart', true));
     const animRef = useRef(null);
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';

     const animateTarget = useCallback(() => {
          let t = 0;
          const loop = () => {
               t += 0.03;
               setTarget({
                    x: Math.sin(t * 1.3) * 30,
                    y: Math.cos(t * 0.9) * 25,
                    scale: 0.85 + Math.sin(t * 2) * 0.15,
               });
               animRef.current = requestAnimationFrame(loop);
          };
          animRef.current = requestAnimationFrame(loop);
     }, []);

     const start = () => {
          setPhase('playing');
          setRound(0);
          setTotal(0);
          setLastHit(null);
          animateTarget();
     };

     useEffect(() => () => cancelAnimationFrame(animRef.current), []);

     const handleBoardClick = (e) => {
          if (phase !== 'playing') return;
          const rect = e.currentTarget.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const r = (BOARD_R * target.scale);
          const dx = e.clientX - cx - target.x;
          const dy = e.clientY - cy - target.y;
          const pts = scoreAt(dx, dy, r);
          setLastHit(pts);
          const newTotal = total + pts;
          setTotal(newTotal);
          const nextRound = round + 1;
          setRound(nextRound);
          if (nextRound >= ROUNDS) {
               cancelAnimationFrame(animRef.current);
               setPhase('done');
               addScore('dart', name, newTotal, true);
               setRankList(getRankTop10('dart', true));
          }
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-6xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <h2 className="text-xl font-black tracking-wider">골드 다트</h2>
                    <div className="text-amber-400 font-black">{phase === 'playing' || phase === 'done' ? `${total}점` : ''}</div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="flex-1 flex flex-col items-center">
                         {phase === 'idle' && (
                              <button onClick={start} className="my-16 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-full flex items-center gap-2"><Play className="w-5 h-5" /> 시작하기</button>
                         )}
                         {(phase === 'playing' || phase === 'done') && (
                              <>
                                   <p className="text-sm text-gray-400 mb-3">라운드 {Math.min(round + 1, ROUNDS)} / {ROUNDS} {lastHit !== null && <span className="text-amber-400 ml-2">+{lastHit}점</span>}</p>
                                   <div
                                        onClick={handleBoardClick}
                                        className="relative cursor-crosshair"
                                        style={{ width: BOARD_R * 2 + 60, height: BOARD_R * 2 + 60 }}
                                   >
                                        <div
                                             className="absolute rounded-full border-4 border-amber-500/50 flex items-center justify-center transition-transform duration-75"
                                             style={{
                                                  width: BOARD_R * 2 * target.scale,
                                                  height: BOARD_R * 2 * target.scale,
                                                  left: '50%',
                                                  top: '50%',
                                                  transform: `translate(calc(-50% + ${target.x}px), calc(-50% + ${target.y}px))`,
                                                  background: 'radial-gradient(circle, #fef3c7 0%, #f59e0b 40%, #b45309 70%, #78350f 100%)',
                                             }}
                                        >
                                             <div className="w-1/2 h-1/2 rounded-full bg-red-600 border-2 border-white" />
                                        </div>
                                   </div>
                              </>
                         )}
                         {phase === 'done' && (
                              <div className="mt-6 text-center">
                                   <p className="text-xl font-black text-amber-300 mb-2">최종 {total}점!</p>
                                   <button onClick={() => { setPhase('idle'); }} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto"><RotateCw className="w-4 h-4" /> 다시하기</button>
                              </div>
                         )}
                    </div>

                    <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-600 w-full lg:w-56 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-gray-400">TOP 10</span></div>
                         <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {rankList.map((e, i) => (
                                   <div key={i} className="flex justify-between text-sm">
                                        <span className="text-gray-300 truncate max-w-[100px]">{e.rank}. {e.name}</span>
                                        <span className="text-gray-400 font-mono text-xs">{e.score}</span>
                                   </div>
                              ))}
                              {rankList.length === 0 && <p className="text-gray-500 text-xs">아직 기록이 없어요.</p>}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamDartGame;
