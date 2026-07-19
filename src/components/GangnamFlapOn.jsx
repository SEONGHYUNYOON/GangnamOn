import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { soundManager } from '../lib/soundManager';

const W = 360;
const H = 520;
const BIRD_R = 14;
const PIPE_W = 56;
const GAP = 150;
const GRAVITY = 0.4;
const FLAP = -6;
const PIPE_SPEED = 3.5;

const GangnamFlapOn = ({ onClose, user }) => {
     const canvasRef = useRef(null);
     const [phase, setPhase] = useState('idle');
     const [score, setScore] = useState(0);
     const [rankList, setRankList] = useState(() => getRankTop10('flapon', true));
     const stateRef = useRef({ birdY: H / 2, birdVy: 0, pipes: [], frame: 0, score: 0 });
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
     const [shake, setShake] = useState(false);

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 200);
     };

     const reset = useCallback(() => {
          soundManager.init();
          soundManager.playCoin();
          stateRef.current = { birdY: H / 2, birdVy: 0, pipes: [], frame: 0, score: 0 };
          setScore(0);
          setPhase('playing');
          setRankList(getRankTop10('flapon', true));
     }, []);

     const flap = useCallback(() => {
          if (phase === 'idle') { reset(); return; }
          if (phase === 'over') return;
          soundManager.playMove(); // Use move sound for flapping
          stateRef.current.birdVy = FLAP;
     }, [phase, reset]);

     const endGame = useCallback(() => {
          soundManager.playExplosion();
          triggerShake();
          setPhase('over');
          const s = stateRef.current.score;
          setScore(s);
          if (s > 0) addScore('flapon', name, s, true);
          setRankList(getRankTop10('flapon', true));
     }, [name]);

     useEffect(() => {
          const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); flap(); } };
          window.addEventListener('keydown', onKey);
          return () => window.removeEventListener('keydown', onKey);
     }, [flap]);

     useEffect(() => {
          if (phase !== 'playing') return;
          let id;
          const loop = () => {
               const s = stateRef.current;
               s.birdVy += GRAVITY;
               s.birdY += s.birdVy;
               s.frame++;

               if (s.frame % 80 === 0) {
                    const gapY = 80 + Math.random() * (H - GAP - 160);
                    s.pipes.push({ x: W + 20, gapY, passed: false });
               }
               s.pipes = s.pipes.filter(p => p.x > -PIPE_W - 20);
               s.pipes.forEach(p => { p.x -= PIPE_SPEED; });

               const bx = 80;
               for (const p of s.pipes) {
                    if (!p.passed && p.x + PIPE_W < bx) {
                         p.passed = true;
                         s.score++;
                         setScore(s.score);
                         soundManager.playCoin(); // Point gained
                    }
                    const inX = bx + BIRD_R > p.x && bx - BIRD_R < p.x + PIPE_W;
                    if (inX && (s.birdY - BIRD_R < p.gapY || s.birdY + BIRD_R > p.gapY + GAP)) {
                         endGame();
                         return;
                    }
               }
               if (s.birdY < BIRD_R || s.birdY > H - BIRD_R) { endGame(); return; }

               const ctx = canvasRef.current?.getContext('2d');
               if (ctx) {
                    ctx.clearRect(0, 0, W, H);
                    
                    // Background
                    ctx.fillStyle = '#0f172a'; // slate-900
                    ctx.fillRect(0, 0, W, H);
                    
                    // Cyberpunk Skyline
                    ctx.fillStyle = '#1e293b';
                    for (let i = 0; i < 8; i++) {
                         ctx.fillRect(i * 50 - (s.frame % 50), H - 80 - (i % 3) * 30, 40, 80 + (i % 4) * 20);
                         // Building windows
                         ctx.fillStyle = '#38bdf8'; // sky-400
                         if (i % 2 === 0) ctx.fillRect(i * 50 - (s.frame % 50) + 10, H - 60 - (i % 3) * 30, 8, 12);
                         ctx.fillStyle = '#1e293b';
                    }

                    // Pipes (Neon bars)
                    s.pipes.forEach(p => {
                         ctx.shadowBlur = 15;
                         ctx.shadowColor = 'rgba(16, 185, 129, 0.8)'; // emerald-500 glow
                         ctx.fillStyle = '#059669'; // emerald-600
                         
                         // Top pipe
                         ctx.beginPath();
                         ctx.roundRect(p.x, 0, PIPE_W, p.gapY, [0, 0, 8, 8]);
                         ctx.fill();
                         
                         // Bottom pipe
                         ctx.beginPath();
                         ctx.roundRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP, [8, 8, 0, 0]);
                         ctx.fill();

                         // Inner neon tube
                         ctx.shadowBlur = 0;
                         ctx.fillStyle = '#34d399'; // emerald-400
                         ctx.fillRect(p.x + PIPE_W/2 - 4, 0, 8, p.gapY - 10);
                         ctx.fillRect(p.x + PIPE_W/2 - 4, p.gapY + GAP + 10, 8, H - p.gapY - GAP - 10);
                    });

                    // Bird (Glowing Orb)
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'rgba(245, 158, 11, 1)'; // amber-500 glow
                    ctx.fillStyle = '#fbbf24'; // amber-400
                    ctx.beginPath();
                    ctx.arc(bx, s.birdY, BIRD_R, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(bx - 4, s.birdY - 4, 4, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.shadowBlur = 0;
               }
               id = requestAnimationFrame(loop);
          };
          id = requestAnimationFrame(loop);
          return () => cancelAnimationFrame(id);
     }, [phase, endGame]);

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/20 rounded-full blur-[120px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.2)] max-w-5xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'animate-shake' : ''}`}>
                    
                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 tracking-wider">NEON JUMP</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 drop-shadow-sm leading-tight">NEON<br/>JUMP</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="w-full">
                              <div className="bg-black/40 p-5 rounded-2xl border border-amber-500/30 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)] w-full text-center lg:text-left">
                                   <div className="text-xs font-black text-amber-400 tracking-[0.2em] mb-1">SCORE</div>
                                   <div className="text-5xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-300">
                                        {score}
                                   </div>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-amber-500/20 w-full flex-1 hidden lg:block">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-amber-500/10 transition-colors">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-amber-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-amber-300 font-mono text-sm font-bold">{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-amber-500/50 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Board */}
                    <div className="w-full lg:w-2/3 flex flex-col items-center justify-center relative">
                         <div className="relative rounded-3xl overflow-hidden border-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black" style={{ width: W, height: H, maxWidth: '100%' }}>
                              <canvas
                                   ref={canvasRef}
                                   width={W}
                                   height={H}
                                   onClick={(e) => { e.preventDefault(); flap(); }}
                                   className="block w-full h-full cursor-pointer touch-none"
                              />

                              {/* Overlays */}
                              {phase === 'idle' && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 mb-6 drop-shadow-lg tracking-widest">NEON JUMP</div>
                                        <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-xs border border-amber-500/20">
                                             <div className="text-sm font-black text-amber-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                             <ul className="text-gray-300 text-sm space-y-2 list-none">
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"/>화면을 탭하거나 스페이스바를 눌러 점프!</li>
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>네온 기둥 사이를 무사히 통과하세요</li>
                                             </ul>
                                        </div>
                                        <button onClick={reset} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                             <Play className="w-6 h-6 fill-black" /> START GAME
                                        </button>
                                   </div>
                              )}

                              {phase === 'over' && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">CRASH!</div>
                                        <div className="text-2xl text-white font-black mb-8 font-mono">Score: <span className="text-amber-400">{score}</span></div>
                                        <button onClick={reset} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                             <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                        </button>
                                   </div>
                              )}
                         </div>
                         <p className="text-gray-500 text-sm mt-4 font-bold">화면 탭 또는 스페이스바로 점프</p>
                    </div>
               </div>
          </div>
     );
};

export default GangnamFlapOn;
