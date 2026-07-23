import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play, Target } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

const ROUNDS = 10;
const BOARD_R = 140;

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
     const [darts, setDarts] = useState([]); // 꽂힌 다트 마커 (시각 효과 전용)
     const [rankList, setRankList] = useState(() => getRankTop10('dart', true));
     const animRef = useRef(null);
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
     const [shake, setShake] = useState(false);

     const animateTarget = useCallback(() => {
          let t = 0;
          const loop = () => {
               t += 0.04; // Speed up slightly for difficulty
               setTarget({
                    x: Math.sin(t * 1.5) * 40,
                    y: Math.cos(t * 1.1) * 35,
                    scale: 0.8 + Math.sin(t * 2) * 0.2,
               });
               animRef.current = requestAnimationFrame(loop);
          };
          animRef.current = requestAnimationFrame(loop);
     }, []);

     const start = () => {
          playSound('click');
          setPhase('playing');
          setRound(0);
          setTotal(0);
          setLastHit(null);
          setDarts([]);
          animateTarget();
          setRankList(getRankTop10('dart', true));
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

          // 다트 마커 추가 (클릭 지점에 꽂힘)
          setDarts(d => [...d, { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top, pts }].slice(-ROUNDS));

          // 던지는 소리 → 짧은 비행 후 명중음
          playSound('whoosh');
          if (pts === 100) {
               setShake(true);
               setTimeout(() => setShake(false), 200);
               setTimeout(() => playSound('combo'), 160); // Bullseye!
          } else if (pts > 0) {
               setTimeout(() => playSound('hit'), 160);
          } else {
               setTimeout(() => playSound('wrong'), 160); // Missed
          }

          const newTotal = total + pts;
          setTotal(newTotal);
          const nextRound = round + 1;
          setRound(nextRound);

          if (nextRound >= ROUNDS) {
               cancelAnimationFrame(animRef.current);
               setTimeout(() => playSound('gameover'), 450);
               setPhase('done');
               if (newTotal > 0) addScore('dart', name, newTotal, true);
               setRankList(getRankTop10('dart', true));
          }
     };

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* 다트 명중/점수 팝 이펙트 키프레임 (이 컴포넌트 전용) */}
               <style>{`
                    @keyframes dartLand {
                         0% { transform: scale(2.6) translateY(-30px); opacity: 0; filter: drop-shadow(0 18px 10px rgba(0,0,0,0.5)); }
                         70% { transform: scale(0.92) translateY(2px); opacity: 1; }
                         100% { transform: scale(1) translateY(0); opacity: 1; filter: drop-shadow(0 3px 2px rgba(0,0,0,0.5)); }
                    }
                    @keyframes dartScorePop {
                         0% { transform: translateY(16px) scale(0.6); opacity: 0; }
                         60% { transform: translateY(-2px) scale(1.1); opacity: 1; }
                         100% { transform: translateY(0) scale(1); opacity: 1; }
                    }
                    @keyframes dartShake {
                         0%, 100% { transform: translateX(0); }
                         25% { transform: translateX(-5px); }
                         75% { transform: translateX(5px); }
                    }
                    .dart-shake { animation: dartShake 0.2s ease-in-out; }
               `}</style>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-900/20 rounded-full blur-[120px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-orange-500/30 shadow-[0_0_60px_rgba(249,115,22,0.2)] max-w-5xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'dart-shake' : ''}`}>

                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 tracking-wider">NEON DART</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-500 drop-shadow-sm leading-tight">NEON<br/>DART</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="flex flex-row lg:flex-col gap-4 w-full">
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-orange-500/30 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)]">
                                   <div className="text-xs font-black text-orange-400 tracking-[0.2em] mb-1">SCORE</div>
                                   <div className="text-4xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-amber-300">
                                        {total}
                                   </div>
                              </div>
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-orange-500/30 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)]">
                                   <div className="text-xs font-black text-yellow-400 tracking-[0.2em] mb-1">ROUND</div>
                                   <div className="text-4xl font-black font-mono text-yellow-400">
                                        {Math.min(round + 1, ROUNDS)} <span className="text-xl text-yellow-900">/ {ROUNDS}</span>
                                   </div>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-orange-500/20 w-full flex-1 hidden lg:block">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-orange-500/10 transition-colors">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-orange-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-orange-300 font-mono text-sm font-bold">{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-orange-500/50 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Board */}
                    <div className="w-full lg:w-2/3 flex justify-center relative min-h-[400px]">

                         <div className="w-full h-full bg-black/60 rounded-3xl border-2 border-orange-500/30 flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">

                              {/* Background Grid Lines */}
                              <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                                   style={{ backgroundImage: `linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)`, backgroundSize: `40px 40px` }}>
                              </div>

                              {phase === 'idle' && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 border border-orange-400/30 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                                             <Target className="w-10 h-10 text-orange-400" />
                                        </div>
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-6 drop-shadow-lg tracking-widest">NEON DART</div>
                                        <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-sm border border-orange-500/20">
                                             <div className="text-sm font-black text-orange-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                             <ul className="text-gray-300 text-sm space-y-2 list-none">
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"/>움직이는 다트판을 클릭(터치)하세요</li>
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"/>중앙에 가까울수록 높은 점수 획득!</li>
                                                  <li className="flex items-center gap-2 text-yellow-400"><div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"/>총 10번의 기회가 주어집니다.</li>
                                             </ul>
                                        </div>
                                        <button onClick={start} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                             <Play className="w-6 h-6 fill-white" /> START
                                        </button>
                                   </div>
                              )}

                              {(phase === 'playing' || phase === 'done') && (
                                   <div
                                        onClick={handleBoardClick}
                                        className="relative cursor-crosshair w-full h-full flex items-center justify-center"
                                   >
                                        <div
                                             className="absolute rounded-full flex items-center justify-center transition-transform duration-75"
                                             style={{
                                                  width: BOARD_R * 2 * target.scale,
                                                  height: BOARD_R * 2 * target.scale,
                                                  transform: `translate(${target.x}px, ${target.y}px)`,
                                                  // 점수 구간(15/35/55/75%)과 일치하는 동심원 그라데이션으로 깊이 표현
                                                  background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.14), transparent 45%),
                                                       radial-gradient(circle, #334155 0%, #1e293b 14%, #0f172a 16%, #0f172a 34%, #1e293b 36%, #1e293b 54%, #0f172a 56%, #0f172a 74%, #1e293b 76%, #0b1120 92%, #020617 100%)`,
                                                  border: '6px solid rgba(245, 158, 11, 0.55)',
                                                  boxShadow: `0 22px 45px rgba(0,0,0,0.65),
                                                       0 0 40px rgba(245,158,11,0.4),
                                                       inset 0 10px 22px rgba(0,0,0,0.6),
                                                       inset 0 -8px 18px rgba(0,0,0,0.5),
                                                       inset 0 2px 4px rgba(255,255,255,0.12)`,
                                             }}
                                        >
                                             {/* Target Rings */}
                                             <div className="absolute w-[80%] h-[80%] rounded-full border-2 border-orange-500/40 shadow-[inset_0_4px_10px_rgba(0,0,0,0.4)]" />
                                             <div className="absolute w-[60%] h-[60%] rounded-full border-2 border-orange-500/60 shadow-[inset_0_4px_10px_rgba(0,0,0,0.4)]" />
                                             <div className="absolute w-[40%] h-[40%] rounded-full border-2 border-orange-500/80 shadow-[inset_0_4px_10px_rgba(0,0,0,0.4)]" />

                                             {/* Bullseye — 구슬처럼 볼록한 하이라이트 */}
                                             <div className="w-[15%] h-[15%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fca5a5,#dc2626_55%,#7f1d1d)] border-2 border-white shadow-[0_0_15px_rgba(239,68,68,1),0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center">
                                                  <div className="w-1 h-1 bg-white rounded-full opacity-70"/>
                                             </div>
                                        </div>

                                        {/* 꽂힌 다트 마커 — 날아와 박히는 애니메이션 */}
                                        {darts.map(d => (
                                             <div
                                                  key={d.id}
                                                  className="absolute pointer-events-none z-20"
                                                  style={{ left: d.x, top: d.y, animation: 'dartLand 0.22s cubic-bezier(0.2, 0.8, 0.3, 1) both', transformOrigin: 'bottom center' }}
                                             >
                                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                                       {/* 깃 */}
                                                       <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[10px] border-l-transparent border-r-transparent ${d.pts === 100 ? 'border-t-red-400' : d.pts > 0 ? 'border-t-amber-400' : 'border-t-gray-500'}`} />
                                                       {/* 바늘 */}
                                                       <div className="w-[2px] h-4 bg-gradient-to-b from-gray-200 to-gray-500" />
                                                  </div>
                                             </div>
                                        ))}

                                        {/* Last Hit Indicator floating */}
                                        {lastHit !== null && phase === 'playing' && (
                                             <div key={round} className="absolute top-10 right-10" style={{ animation: 'dartScorePop 0.3s ease-out both' }}>
                                                  <div className={`text-4xl font-black ${lastHit === 100 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] scale-110' : 'text-amber-400 drop-shadow-md'}`}>
                                                       +{lastHit}
                                                  </div>
                                             </div>
                                        )}
                                   </div>
                              )}

                              {phase === 'done' && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className="text-5xl font-black text-amber-500 mb-4 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">FINISHED!</div>
                                        <div className="text-2xl text-white font-black mb-8 font-mono">Final Score: <span className="text-orange-400">{total}</span></div>
                                        <button onClick={() => { playSound('click'); setPhase('idle'); }} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                             <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                        </button>
                                   </div>
                              )}
                         </div>

                    </div>
               </div>
          </div>
     );
};

export default GangnamDartGame;
