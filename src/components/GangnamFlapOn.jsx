import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const W = 360;
const H = 520;
const BIRD_R = 14;
const PIPE_W = 52;
const GAP = 130;
const GRAVITY = 0.45;
const FLAP = -7.5;
const PIPE_SPEED = 3;

const GangnamFlapOn = ({ onClose, user }) => {
     const canvasRef = useRef(null);
     const [phase, setPhase] = useState('idle');
     const [score, setScore] = useState(0);
     const [rankList, setRankList] = useState(() => getRankTop10('flapon', true));
     const stateRef = useRef({ birdY: H / 2, birdVy: 0, pipes: [], frame: 0, score: 0 });
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';

     const reset = useCallback(() => {
          stateRef.current = { birdY: H / 2, birdVy: 0, pipes: [], frame: 0, score: 0 };
          setScore(0);
          setPhase('playing');
          setRankList(getRankTop10('flapon', true));
     }, []);

     const flap = useCallback(() => {
          if (phase === 'idle') { reset(); return; }
          if (phase === 'over') return;
          stateRef.current.birdVy = FLAP;
     }, [phase, reset]);

     const endGame = useCallback(() => {
          setPhase('over');
          const s = stateRef.current.score;
          setScore(s);
          addScore('flapon', name, s, true);
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

               if (s.frame % 90 === 0) {
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
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, W, H);
                    // skyline
                    ctx.fillStyle = '#1e293b';
                    for (let i = 0; i < 8; i++) ctx.fillRect(i * 50 - (s.frame % 50), H - 60 - (i % 3) * 20, 40, 60 + (i % 4) * 15);
                    // pipes (buildings)
                    s.pipes.forEach(p => {
                         const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
                         grad.addColorStop(0, '#f59e0b');
                         grad.addColorStop(1, '#d97706');
                         ctx.fillStyle = grad;
                         ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
                         ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
                         ctx.fillStyle = '#fbbf24';
                         for (let wy = 10; wy < p.gapY; wy += 24) ctx.fillRect(p.x + 8, wy, PIPE_W - 16, 8);
                    });
                    // coin bird
                    ctx.beginPath();
                    ctx.arc(bx, s.birdY, BIRD_R, 0, Math.PI * 2);
                    ctx.fillStyle = '#fbbf24';
                    ctx.fill();
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.fillStyle = '#92400e';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('온', bx - 6, s.birdY + 4);
               }
               id = requestAnimationFrame(loop);
          };
          id = requestAnimationFrame(loop);
          return () => cancelAnimationFrame(id);
     }, [phase, endGame]);

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-6xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <h2 className="text-xl font-black tracking-wider">온 점프</h2>
                    <div className="text-amber-400 font-black">{score}</div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="flex-1 flex flex-col items-center">
                         <canvas
                              ref={canvasRef}
                              width={W}
                              height={H}
                              onClick={flap}
                              className="rounded-2xl border-2 border-amber-500/30 cursor-pointer max-w-full"
                              style={{ width: '100%', maxWidth: W }}
                         />
                         {phase === 'idle' && (
                              <button onClick={reset} className="mt-4 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-full flex items-center gap-2"><Play className="w-5 h-5" /> 시작하기</button>
                         )}
                         {phase === 'over' && (
                              <div className="mt-4 text-center">
                                   <p className="text-xl font-black text-red-400 mb-2">게임 오버 · {score}점</p>
                                   <button onClick={reset} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto"><RotateCw className="w-4 h-4" /> 다시하기</button>
                              </div>
                         )}
                         <p className="text-gray-500 text-xs mt-2">클릭 또는 스페이스바로 점프</p>
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

export default GangnamFlapOn;
