import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy, Heart } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

const PADDLE_W = 120;
const PADDLE_H = 16;
const BALL_R = 10;
const BRICK_COLS = 10;
const BRICK_ROWS = 5;
const BRICK_W = 80;
const BRICK_H = 28;
const CANVAS_W = BRICK_COLS * BRICK_W;
const CANVAS_H = 600;
const PADDLE_Y = CANVAS_H - 60;
const BALL_SPEED = 2.8;
const COLORS = [
     { bg: '#ef4444', light: '#fca5a5', dark: '#991b1b', shadow: 'rgba(239, 68, 68, 0.8)' },
     { bg: '#f97316', light: '#fdba74', dark: '#9a3412', shadow: 'rgba(249, 115, 22, 0.8)' },
     { bg: '#eab308', light: '#fde047', dark: '#854d0e', shadow: 'rgba(234, 179, 8, 0.8)' },
     { bg: '#22c55e', light: '#86efac', dark: '#166534', shadow: 'rgba(34, 197, 94, 0.8)' },
     { bg: '#3b82f6', light: '#93c5fd', dark: '#1e40af', shadow: 'rgba(59, 130, 246, 0.8)' }
];
const MAX_PARTICLES = 120;

const GangnamBrickBreaker = ({ onClose, user }) => {
     const [paddleX, setPaddleX] = useState((CANVAS_W - PADDLE_W) / 2);
     const [ball, setBall] = useState({ x: CANVAS_W / 2, y: PADDLE_Y - BALL_R - 5, dx: BALL_SPEED * 0.7, dy: -BALL_SPEED });
     const [bricks, setBricks] = useState([]);
     const [score, setScore] = useState(0);
     const [lives, setLives] = useState(3);
     const [gameStarted, setGameStarted] = useState(false);
     const [gameOver, setGameOver] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('brick', true));
     const [shake, setShake] = useState(false);
     const canvasRef = useRef(null);
     const ballRef = useRef(ball);
     const savedRef = useRef(false);
     const particlesRef = useRef([]);
     const lastBounceRef = useRef(0);
     const streakRef = useRef({ count: 0, last: 0 });
     ballRef.current = ball;

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 200);
     };

     // 'bounce'는 아주 자주 울릴 수 있어 60ms 스로틀
     const playBounce = () => {
          const now = Date.now();
          if (now - lastBounceRef.current < 60) return;
          lastBounceRef.current = now;
          playSound('bounce');
     };

     const spawnParticles = (x, y, color) => {
          const arr = particlesRef.current;
          for (let i = 0; i < 8; i++) {
               if (arr.length >= MAX_PARTICLES) break;
               const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.6;
               const speed = 1.5 + Math.random() * 2.5;
               arr.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life: 1, color });
          }
     };

     const initBricks = useCallback(() => {
          const arr = [];
          for (let r = 0; r < BRICK_ROWS; r++) {
               for (let c = 0; c < BRICK_COLS; c++) {
                    arr.push({ x: c * BRICK_W + 2, y: r * BRICK_H + 50 + 2, w: BRICK_W - 4, h: BRICK_H - 4, color: COLORS[r % COLORS.length], alive: true });
               }
          }
          return arr;
     }, []);

     const startGame = useCallback(() => {
          playSound('click');
          savedRef.current = false;
          particlesRef.current = [];
          streakRef.current = { count: 0, last: 0 };
          setPaddleX((CANVAS_W - PADDLE_W) / 2);
          setBall({ x: CANVAS_W / 2, y: PADDLE_Y - BALL_R - 5, dx: BALL_SPEED * 0.7, dy: -BALL_SPEED });
          setBricks(initBricks());
          setScore(0);
          setLives(3);
          setGameOver(false);
          setGameStarted(true);
          setRankList(getRankTop10('brick', true));
     }, [initBricks]);

     useEffect(() => {
          if (!gameStarted || !gameOver || savedRef.current) return;
          savedRef.current = true;
          const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
          if (score > 0) addScore('brick', name, score, true);
          setRankList(getRankTop10('brick', true));
          playSound(lives > 0 ? 'win' : 'gameover');
     }, [gameStarted, gameOver, score, lives, user]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const id = requestAnimationFrame(function loop() {
               setBall(prev => {
                    let { x, y, dx, dy } = prev;
                    x += dx;
                    y += dy;
                    if (x <= BALL_R || x >= CANVAS_W - BALL_R) {
                         dx = -dx;
                         playBounce(); // Wall hit sound
                    }
                    if (y <= BALL_R) {
                         dy = -dy;
                         playBounce();
                    }
                    if (y >= PADDLE_Y - BALL_R && y <= PADDLE_Y + PADDLE_H &&
                         x >= paddleX - BALL_R && x <= paddleX + PADDLE_W + BALL_R) {
                         dy = -Math.abs(dy);
                         const hitPos = (x - paddleX) / PADDLE_W;
                         dx = (hitPos - 0.5) * 5; // Adjust angle based on where it hit the paddle
                         playBounce(); // Paddle hit sound
                    }
                    if (y > CANVAS_H + BALL_R) {
                         playSound('wrong');
                         setLives(l => {
                              triggerShake();
                              if (l <= 1) {
                                   setGameOver(true);
                                   return 0;
                              }
                              return l - 1;
                         });
                         return { x: CANVAS_W / 2, y: PADDLE_Y - BALL_R - 5, dx: BALL_SPEED * 0.7, dy: -BALL_SPEED };
                    }
                    return { x, y, dx, dy };
               });

               setBricks(prev => {
                    const next = prev.map(b => {
                         if (!b.alive) return b;
                         const bx = b.x + b.w / 2;
                         const by = b.y + b.h / 2;
                         const ball = ballRef.current;
                         if (Math.abs(ball.x - bx) < b.w / 2 + BALL_R && Math.abs(ball.y - by) < b.h / 2 + BALL_R) {
                              const now = Date.now();
                              const streak = streakRef.current;
                              streak.count = now - streak.last < 900 ? streak.count + 1 : 1;
                              streak.last = now;
                              playSound(streak.count >= 3 ? 'combo' : 'hit');
                              spawnParticles(bx, by, b.color.bg);
                              setScore(s => s + 10);
                              setBall(ball => ({ ...ball, dy: ball.y < by ? Math.abs(ball.dy) : -Math.abs(ball.dy) }));
                              return { ...b, alive: false };
                         }
                         return b;
                    });
                    const alive = next.filter(b => b.alive).length;
                    if (alive === 0) setGameOver(true);
                    return next;
               });

               requestAnimationFrame(loop);
          });
          return () => cancelAnimationFrame(id);
     }, [gameStarted, gameOver, paddleX]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const onMove = (e) => {
               const rect = canvasRef.current?.getBoundingClientRect();
               if (!rect) return;
               const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
               let next = x - PADDLE_W / 2;
               next = Math.max(0, Math.min(CANVAS_W - PADDLE_W, next));
               setPaddleX(next);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('touchmove', onMove, { passive: true });
          return () => {
               window.removeEventListener('mousemove', onMove);
               window.removeEventListener('touchmove', onMove);
          };
     }, [gameStarted, gameOver]);

     useEffect(() => {
          const ctx = canvasRef.current?.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

          // Depth background: vertical gradient + top light pool
          const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
          bg.addColorStop(0, '#0d1530');
          bg.addColorStop(0.55, '#070b18');
          bg.addColorStop(1, '#02040a');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
          const topLight = ctx.createRadialGradient(CANVAS_W / 2, 100, 40, CANVAS_W / 2, 100, 500);
          topLight.addColorStop(0, 'rgba(59, 130, 246, 0.16)');
          topLight.addColorStop(1, 'rgba(59, 130, 246, 0)');
          ctx.fillStyle = topLight;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

          // Draw Bricks (top-lit gradient + bevel for 3D)
          bricks.filter(b => b.alive).forEach(b => {
               const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
               grad.addColorStop(0, b.color.light);
               grad.addColorStop(0.5, b.color.bg);
               grad.addColorStop(1, b.color.dark);
               ctx.shadowBlur = 14;
               ctx.shadowColor = b.color.shadow;
               ctx.fillStyle = grad;
               ctx.beginPath();
               ctx.roundRect(b.x, b.y, b.w, b.h, 4);
               ctx.fill();
               ctx.shadowBlur = 0;
               // Glass highlight on the upper half
               ctx.fillStyle = 'rgba(255,255,255,0.28)';
               ctx.beginPath();
               ctx.roundRect(b.x + 2, b.y + 2, b.w - 4, b.h / 2 - 2, 3);
               ctx.fill();
               // Bottom bevel shade
               ctx.fillStyle = 'rgba(0,0,0,0.3)';
               ctx.beginPath();
               ctx.roundRect(b.x + 2, b.y + b.h - 5, b.w - 4, 3, 2);
               ctx.fill();
          });

          // Destruction particles (lightweight fading circles)
          const parts = particlesRef.current;
          for (let i = parts.length - 1; i >= 0; i--) {
               const p = parts[i];
               p.x += p.vx;
               p.y += p.vy;
               p.vy += 0.12;
               p.life -= 0.035;
               if (p.life <= 0) {
                    parts.splice(i, 1);
                    continue;
               }
               ctx.globalAlpha = Math.max(0, p.life);
               ctx.fillStyle = p.color;
               ctx.beginPath();
               ctx.arc(p.x, p.y, 1.5 + p.life * 3, 0, Math.PI * 2);
               ctx.fill();
          }
          ctx.globalAlpha = 1;

          // Draw Paddle (rounded, lit from above)
          const paddleGrad = ctx.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + PADDLE_H);
          paddleGrad.addColorStop(0, '#d8b4fe');
          paddleGrad.addColorStop(0.45, '#a855f7');
          paddleGrad.addColorStop(1, '#6b21a8');
          ctx.shadowBlur = 20;
          ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
          ctx.fillStyle = paddleGrad;
          ctx.beginPath();
          ctx.roundRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 8);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.roundRect(paddleX + 6, PADDLE_Y + 2, PADDLE_W - 12, 4, 2);
          ctx.fill();

          // Draw Ball (offset radial gradient = glossy sphere)
          const ballGrad = ctx.createRadialGradient(ball.x - BALL_R * 0.4, ball.y - BALL_R * 0.4, BALL_R * 0.15, ball.x, ball.y, BALL_R);
          ballGrad.addColorStop(0, '#ffffff');
          ballGrad.addColorStop(0.6, '#dbeafe');
          ballGrad.addColorStop(1, '#60a5fa');
          ctx.shadowBlur = 18;
          ctx.shadowColor = 'rgba(147, 197, 253, 0.9)';
          ctx.fillStyle = ballGrad;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // Reset

          // Vignette for depth
          const vig = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.35, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.85);
          vig.addColorStop(0, 'rgba(0,0,0,0)');
          vig.addColorStop(1, 'rgba(0,0,0,0.45)');
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
     }, [bricks, paddleX, ball]);

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.2)] max-w-7xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'animate-shake' : ''}`}>
                    
                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-wider">NEON BREAKER</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-400 drop-shadow-sm">NEON<br/>BREAKER</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="flex flex-row lg:flex-col gap-4 w-full">
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-blue-500/30 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]">
                                   <div className="text-xs font-black text-cyan-400 tracking-[0.2em] mb-1">SCORE</div>
                                   <div className="text-4xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                                        {score.toLocaleString()}
                                   </div>
                              </div>
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-blue-500/30 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]">
                                   <div className="text-xs font-black text-red-400 tracking-[0.2em] mb-1">LIVES</div>
                                   <div className="flex items-center gap-2 mt-2">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                             <Heart key={i} className={`w-8 h-8 ${i < lives ? 'fill-red-500 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'fill-transparent text-gray-700'}`} />
                                        ))}
                                   </div>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-blue-500/20 w-full flex-1 hidden lg:block">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-blue-500/10 transition-colors">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-cyan-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-cyan-300 font-mono text-sm font-bold">{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-blue-500/50 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Board (3D tilted table) */}
                    <div className="w-full lg:w-2/3 flex justify-center relative [perspective:800px]">
                         <div className="relative rounded-3xl overflow-hidden border-2 border-blue-500/50 shadow-[0_35px_70px_rgba(0,0,0,0.65),0_0_50px_rgba(59,130,246,0.3)] bg-black/80 [transform:rotateX(3deg)] origin-bottom" style={{ width: CANVAS_W, height: CANVAS_H }}>
                              
                              <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="block w-full h-full touch-none" />
                              
                              {/* Grid Background Pattern */}
                              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                   style={{ backgroundImage: `linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)`, backgroundSize: `32px 32px` }}>
                              </div>

                              {/* Overlays */}
                              {!gameStarted && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-6 drop-shadow-lg tracking-widest">NEON BREAKER</div>
                                        <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-sm border border-blue-500/20">
                                             <div className="text-sm font-black text-blue-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                             <ul className="text-gray-300 text-sm space-y-2 list-none">
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"/>마우스나 터치로 패들을 조작</li>
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"/>공을 튕겨내 모든 벽돌을 파괴</li>
                                                  <li className="flex items-center gap-2 text-red-400"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"/>공을 떨어뜨리면 생명 1 감소</li>
                                             </ul>
                                        </div>
                                        <button onClick={startGame} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                             <Play className="w-6 h-6 fill-white" /> START
                                        </button>
                                   </div>
                              )}

                              {gameStarted && gameOver && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">GAME OVER</div>
                                        <div className="text-2xl text-white font-black mb-8 font-mono">Score: <span className="text-cyan-400">{score}</span></div>
                                        <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
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

export default GangnamBrickBreaker;
