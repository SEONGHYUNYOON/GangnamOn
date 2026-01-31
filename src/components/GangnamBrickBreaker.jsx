import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const PADDLE_W = 100;
const PADDLE_H = 14;
const BALL_R = 10;
const BRICK_COLS = 10;
const BRICK_ROWS = 5;
const BRICK_W = 64;
const BRICK_H = 24;
const CANVAS_W = BRICK_COLS * BRICK_W;
const CANVAS_H = 420;
const PADDLE_Y = CANVAS_H - 50;
const BALL_SPEED = 6;
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

const GangnamBrickBreaker = ({ onClose, user }) => {
     const [paddleX, setPaddleX] = useState((CANVAS_W - PADDLE_W) / 2);
     const [ball, setBall] = useState({ x: CANVAS_W / 2, y: PADDLE_Y - BALL_R - 5, dx: BALL_SPEED * 0.7, dy: -BALL_SPEED });
     const [bricks, setBricks] = useState([]);
     const [score, setScore] = useState(0);
     const [lives, setLives] = useState(3);
     const [gameStarted, setGameStarted] = useState(false);
     const [gameOver, setGameOver] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('brick', true));
     const canvasRef = useRef(null);
     const ballRef = useRef(ball);
     const savedRef = useRef(false);
     ballRef.current = ball;

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
          savedRef.current = false;
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
          addScore('brick', name, score, true);
          setRankList(getRankTop10('brick', true));
     }, [gameStarted, gameOver, score, user]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const id = requestAnimationFrame(function loop() {
               setBall(prev => {
                    let { x, y, dx, dy } = prev;
                    x += dx;
                    y += dy;
                    if (x <= BALL_R || x >= CANVAS_W - BALL_R) dx = -dx;
                    if (y <= BALL_R) dy = -dy;
                    if (y >= PADDLE_Y - BALL_R && y <= PADDLE_Y + PADDLE_H &&
                         x >= paddleX - BALL_R && x <= paddleX + PADDLE_W + BALL_R) {
                         dy = -Math.abs(dy);
                         const hitPos = (x - paddleX) / PADDLE_W;
                         dx = (hitPos - 0.5) * 4;
                    }
                    if (y > CANVAS_H + BALL_R) {
                         setLives(l => (l <= 1 ? (setGameOver(true), 0) : l - 1));
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
     }, [gameStarted, gameOver, paddleX, score, user]);

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

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-slate-900 to-black text-white max-w-4xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <h2 className="text-xl font-black tracking-wider">벽돌깨기</h2>
                    <div className="flex items-center gap-4">
                         <span className="bg-red-600/80 px-3 py-1 rounded-lg font-black text-sm">❤️ {lives}</span>
                         <span className="bg-purple-600 px-3 py-1 rounded-lg font-black text-sm">{score}</span>
                    </div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-600 shadow-2xl" style={{ width: CANVAS_W, height: CANVAS_H }}>
                         <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="block bg-slate-900" style={{ width: CANVAS_W, height: CANVAS_H }} />
                         {/* Draw with divs for simplicity */}
                         <div className="absolute inset-0 pointer-events-none">
                              {bricks.filter(b => b.alive).map((b, i) => (
                                   <div key={i} className="absolute rounded border-2 border-white/20" style={{ left: b.x, top: b.y, width: b.w, height: b.h, backgroundColor: b.color }} />
                              ))}
                              <div className="absolute rounded-lg bg-purple-500 border-2 border-purple-400" style={{ left: paddleX, top: PADDLE_Y, width: PADDLE_W, height: PADDLE_H }} />
                              <div className="absolute rounded-full bg-white border-2 border-gray-300" style={{ left: ball.x - BALL_R, top: ball.y - BALL_R, width: BALL_R * 2, height: BALL_R * 2 }} />
                         </div>

                         {!gameStarted && (
                              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
                                   <div className="text-2xl font-black mb-1">벽돌깨기</div>
                                   <div className="text-gray-400 text-sm mb-6">패들로 공을 튕겨 벽돌을 깨세요!</div>
                                   <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full shadow-lg flex items-center gap-2"><Play className="w-5 h-5" /> 시작하기</button>
                              </div>
                         )}

                         {gameStarted && gameOver && (
                              <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                                   <div className="text-3xl font-black mb-2">GAME OVER</div>
                                   <div className="text-xl text-yellow-400 font-bold mb-6">Score: {score}</div>
                                   <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2"><RotateCw className="w-5 h-5" /> 다시 하기</button>
                              </div>
                         )}
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600 w-full lg:w-56 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-gray-400 tracking-wider">TOP 10</span></div>
                         <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {rankList.map((e, i) => (
                                   <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                             <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${e.rank === 1 ? 'bg-yellow-500 text-black' : e.rank === 2 ? 'bg-gray-400 text-black' : e.rank === 3 ? 'bg-orange-600 text-white' : 'bg-slate-600 text-gray-300'}`}>{e.rank}</span>
                                             <span className="text-gray-300 truncate max-w-[80px]">{e.name}</span>
                                        </div>
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

export default GangnamBrickBreaker;
