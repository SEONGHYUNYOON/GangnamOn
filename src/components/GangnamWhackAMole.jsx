import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

const ROWS = 2;
const COLS = 3;
const ROUND_SEC = 30;
const POP_MIN = 500;
const POP_MAX = 1000;

const MOLE_EMOJI = ['🐹', '🦫', '🐿️'];

const GangnamWhackAMole = ({ onClose, user }) => {
     const [score, setScore] = useState(0);
     const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
     const [activeHole, setActiveHole] = useState(null);
     const [gameStarted, setGameStarted] = useState(false);
     const [gameOver, setGameOver] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('whack', true));
     const [hitHole, setHitHole] = useState(null); // For hit effect
     const [combo, setCombo] = useState(0); // 연속 히트 표시용
     const timerRef = useRef(null);
     const popRef = useRef(null);
     const hideRef = useRef(null);
     const streakRef = useRef(0); // 연속 히트 카운트 (사운드/이펙트 전용)
     const gameOverRef = useRef(gameOver);
     gameOverRef.current = gameOver;

     const schedulePop = useCallback(() => {
          if (!gameStarted || gameOverRef.current) return;
          const delay = POP_MIN + Math.random() * (POP_MAX - POP_MIN);
          popRef.current = setTimeout(() => {
               if (gameOverRef.current) return;
               const idx = Math.floor(Math.random() * (ROWS * COLS));
               playSound('pop');
               setActiveHole(idx);
               const hideDelay = 700 + Math.random() * 500;
               hideRef.current = setTimeout(() => {
                    // 놓친 두더지 → 콤보 끊김
                    streakRef.current = 0;
                    setCombo(0);
                    setActiveHole(null);
                    schedulePop();
               }, hideDelay);
          }, delay);
     }, [gameStarted]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          schedulePop();
          return () => {
               if (popRef.current) clearTimeout(popRef.current);
               if (hideRef.current) clearTimeout(hideRef.current);
          };
     }, [gameStarted, gameOver, schedulePop]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          if (timeLeft <= 0) {
               playSound('gameover');
               setGameOver(true);
               if (score > 0) {
                    const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
                    addScore('whack', name, score, true);
                    setRankList(getRankTop10('whack', true));
               }
               return;
          }
          timerRef.current = setInterval(() => {
               setTimeLeft(t => {
                    if (t <= 5 && t > 1) playSound('tick');
                    return t - 1;
               });
          }, 1000);
          return () => clearInterval(timerRef.current);
     }, [gameStarted, gameOver, timeLeft, score, user]);

     const whack = (idx) => {
          if (activeHole === idx) {
               streakRef.current += 1;
               setCombo(streakRef.current);
               playSound(streakRef.current >= 3 ? 'combo' : 'hit');
               setScore(s => s + 10);
               setActiveHole(null);
               setHitHole(idx);
               setTimeout(() => setHitHole(null), 300); // Remove hit effect
               if (hideRef.current) clearTimeout(hideRef.current);
               hideRef.current = null;
               schedulePop();
          } else if (gameStarted && !gameOver) {
               // 빈 구멍 클릭 → 콤보 끊김
               playSound('wrong');
               streakRef.current = 0;
               setCombo(0);
          }
     };

     const startGame = useCallback(() => {
          playSound('click');
          setScore(0);
          setTimeLeft(ROUND_SEC);
          setActiveHole(null);
          setHitHole(null);
          streakRef.current = 0;
          setCombo(0);
          setGameOver(false);
          setGameStarted(true);
     }, []);

     return (
          <div className="fixed inset-0 z-[70] bg-[#1a0f0a] flex items-center justify-center p-4">
               {/* 두더지 등장/타격 이펙트 키프레임 (이 컴포넌트 전용) */}
               <style>{`
                    @keyframes wamRise {
                         0% { transform: translateY(100%) scale(0.7); }
                         70% { transform: translateY(-6%) scale(1.05); }
                         100% { transform: translateY(0) scale(1); }
                    }
                    @keyframes wamSquash {
                         0% { transform: scale(1.3, 0.5); opacity: 1; }
                         60% { transform: scale(0.9, 1.15); opacity: 1; }
                         100% { transform: scale(1, 1); opacity: 0.9; }
                    }
                    @keyframes wamBurst {
                         0% { transform: rotate(var(--ang)) translateY(-8px) scale(0.4); opacity: 1; }
                         100% { transform: rotate(var(--ang)) translateY(-52px) scale(1); opacity: 0; }
                    }
                    @keyframes wamComboPop {
                         0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
                         60% { transform: translateX(-50%) scale(1.15); opacity: 1; }
                         100% { transform: translateX(-50%) scale(1); opacity: 1; }
                    }
                    @keyframes wamShake {
                         0%, 100% { transform: translateX(0); }
                         25% { transform: translateX(-5px); }
                         75% { transform: translateX(5px); }
                    }
                    .wam-shake { animation: wamShake 0.2s ease-in-out; }
               `}</style>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />

               <div className={`relative bg-amber-950/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border-2 border-orange-900 shadow-[0_0_80px_rgba(217,119,6,0.3)] max-w-5xl w-full flex flex-col lg:flex-row gap-10 items-center animate-in zoom-in-95 duration-500 ${hitHole !== null ? 'wam-shake' : ''}`}>

                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">WHACK-A-MOLE</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-500 drop-shadow-sm">WHACK-A<br/>MOLE</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="flex flex-row lg:flex-col gap-4 w-full">
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-orange-500/30 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)]">
                                   <div className="text-xs font-black text-orange-500 tracking-[0.2em] mb-1">SCORE</div>
                                   <div className="text-4xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-amber-200">
                                        {score.toLocaleString()}
                                   </div>
                              </div>
                              <div className={`flex-1 bg-black/40 p-5 rounded-2xl border ${timeLeft <= 5 ? 'border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.3)] animate-pulse' : 'border-orange-500/30 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)]'}`}>
                                   <div className={`text-xs font-black tracking-[0.2em] mb-1 ${timeLeft <= 5 ? 'text-red-500' : 'text-orange-500'}`}>TIME</div>
                                   <div className={`text-4xl font-black font-mono ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                                        {timeLeft}s
                                   </div>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-orange-500/20 w-full flex-1 hidden lg:block">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-orange-400" />
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
                    <div className="w-full lg:w-2/3 flex justify-center relative">
                         {/* 콤보 배너 */}
                         {combo >= 2 && gameStarted && !gameOver && (
                              <div key={combo} className="absolute -top-6 left-1/2 z-40 pointer-events-none" style={{ animation: 'wamComboPop 0.25s ease-out both' }}>
                                   <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] whitespace-nowrap">🔥 COMBO x{combo}</span>
                              </div>
                         )}

                         <div className="grid gap-4 md:gap-6 w-full max-w-lg" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                              {Array.from({ length: ROWS * COLS }).map((_, idx) => (
                                   <button
                                        key={idx}
                                        onClick={() => whack(idx)}
                                        disabled={!gameStarted || gameOver}
                                        className={`relative aspect-square rounded-3xl overflow-hidden transition-all duration-100 disabled:cursor-default
                                             ${hitHole === idx ? 'bg-orange-600 scale-95 border-b-0 translate-y-2' : 'bg-gradient-to-b from-amber-800 to-amber-950 border-amber-700 border-b-8 hover:border-b-4 hover:translate-y-1 active:border-b-0 active:translate-y-2'}
                                             shadow-[0_10px_20px_rgba(0,0,0,0.5)]`}
                                   >
                                        {/* 잔디 표면 하이라이트 (좌상단 광원) */}
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.14),transparent_55%)] pointer-events-none" />

                                        {/* Hole Depth — 움푹 파인 굴 (radial-gradient + inset shadow) */}
                                        <div className="absolute inset-x-4 inset-y-4 rounded-full bg-[radial-gradient(ellipse_at_50%_30%,#000000_0%,#120a04_45%,#2b1a0b_78%,#4a2f16_100%)] shadow-[inset_0_14px_24px_rgba(0,0,0,0.9),inset_0_-3px_6px_rgba(255,255,255,0.08)] flex items-end justify-center overflow-hidden">
                                             {/* 굴 앞턱 흙더미 */}
                                             <div className="absolute bottom-0 inset-x-0 h-1/4 bg-[radial-gradient(ellipse_at_50%_100%,#5b3a1c_0%,#3a2410_60%,transparent_100%)] pointer-events-none" />

                                             {/* Mole — 아래에서 솟아오르는 3D 팝 */}
                                             {activeHole === idx && hitHole !== idx && (
                                                  <div
                                                       className="relative text-6xl md:text-8xl select-none pb-2 filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.7)]"
                                                       style={{ animation: 'wamRise 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                                                  >
                                                       {MOLE_EMOJI[idx % MOLE_EMOJI.length]}
                                                  </div>
                                             )}

                                             {/* Hit Effect — 찌부러짐 + 별 파편 */}
                                             {hitHole === idx && (
                                                  <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                                                       <span className="text-5xl md:text-7xl select-none" style={{ animation: 'wamSquash 0.3s ease-out both' }}>💥</span>
                                                       {[0, 60, 120, 180, 240, 300].map(ang => (
                                                            <span key={ang} className="absolute text-xl md:text-2xl select-none" style={{ '--ang': `${ang}deg`, animation: 'wamBurst 0.3s ease-out both' }}>⭐</span>
                                                       ))}
                                                  </div>
                                             )}
                                        </div>
                                   </button>
                              ))}
                         </div>

                         {/* Overlays */}
                         {!gameStarted && (
                              <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-6 rounded-3xl border border-white/10 shadow-2xl">
                                   <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200 mb-6 drop-shadow-lg text-center leading-tight">CATCH THE<br/>MOLES!</div>
                                   <button onClick={startGame} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                        <Play className="w-6 h-6 fill-white" /> START GAME
                                   </button>
                              </div>
                         )}

                         {gameStarted && gameOver && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl border border-red-500/30">
                                   <div className="text-5xl font-black text-red-500 mb-2 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">TIME UP!</div>
                                   <div className="text-2xl text-white font-black mb-8 font-mono">Final Score: <span className="text-orange-400">{score}</span></div>
                                   <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                        <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                   </button>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};

export default GangnamWhackAMole;
