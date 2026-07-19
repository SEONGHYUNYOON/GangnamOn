import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { soundManager } from '../lib/soundManager';

const COLS = 24;
const ROWS = 18;
const CELL_SIZE = 34;
const INITIAL_SPEED = 180;

const FOOD_EMOJI = ['🥐', '☕', '🍩', '🥖', '🧋'];

const GangnamSnake = ({ onClose, user }) => {
     const [snake, setSnake] = useState([{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }]);
     const [direction, setDirection] = useState({ dx: 1, dy: 0 });
     const [food, setFood] = useState({ x: 12, y: 10 });
     const [foodEmoji, setFoodEmoji] = useState(FOOD_EMOJI[0]);
     const [score, setScore] = useState(0);
     const [gameOver, setGameOver] = useState(false);
     const [gameStarted, setGameStarted] = useState(false);
     const [speed, setSpeed] = useState(INITIAL_SPEED);
     const [rankList, setRankList] = useState(() => getRankTop10('snake', true));
     const [shake, setShake] = useState(false);
     const nextDirRef = useRef({ dx: 1, dy: 0 });

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 200);
     };

     const randomFood = useCallback(() => {
          const used = new Set(snake.map(s => `${s.x},${s.y}`));
          let x, y;
          do {
               x = Math.floor(Math.random() * COLS);
               y = Math.floor(Math.random() * ROWS);
          } while (used.has(`${x},${y}`));
          return { x, y };
     }, [snake]);

     const startGame = useCallback(() => {
          soundManager.init();
          soundManager.playCoin();
          const start = [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }];
          const used = new Set(start.map(s => `${s.x},${s.y}`));
          let fx, fy;
          do {
               fx = Math.floor(Math.random() * COLS);
               fy = Math.floor(Math.random() * ROWS);
          } while (used.has(`${fx},${fy}`));
          setSnake(start);
          setDirection({ dx: 1, dy: 0 });
          nextDirRef.current = { dx: 1, dy: 0 };
          setFood({ x: fx, y: fy });
          setFoodEmoji(FOOD_EMOJI[Math.floor(Math.random() * FOOD_EMOJI.length)]);
          setScore(0);
          setGameOver(false);
          setSpeed(INITIAL_SPEED);
          setGameStarted(true);
          setRankList(getRankTop10('snake', true));
     }, []);

     useEffect(() => {
          if (gameStarted && gameOver && score > 0) {
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               addScore('snake', name, score, true);
               setRankList(getRankTop10('snake', true));
               soundManager.playGameOver();
          }
     }, [gameStarted, gameOver, score, user]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;

          const id = setInterval(() => {
               setSnake(prev => {
                    const head = prev[0];
                    const d = nextDirRef.current;
                    const newHead = { x: (head.x + d.dx + COLS) % COLS, y: (head.y + d.dy + ROWS) % ROWS };

                    if (prev.some((s, i) => i > 0 && s.x === newHead.x && s.y === newHead.y)) {
                         setGameOver(true);
                         triggerShake();
                         return prev;
                    }

                    const ate = newHead.x === food.x && newHead.y === food.y;
                    let next = [newHead, ...prev];
                    if (!ate) next = next.slice(0, -1);
                    else {
                         soundManager.playCoin();
                         setScore(s => s + 10);
                         setSpeed(sp => Math.max(80, sp - 2));
                         const f = randomFood();
                         setFood(f);
                         setFoodEmoji(FOOD_EMOJI[Math.floor(Math.random() * FOOD_EMOJI.length)]);
                         triggerShake();
                    }
                    return next;
               });
          }, speed);
          return () => clearInterval(id);
     }, [gameStarted, gameOver, food, speed, randomFood]);

     useEffect(() => {
          const handleKey = (e) => {
               if (!gameStarted || gameOver) return;
               const key = e.key;
               const d = nextDirRef.current;
               let changed = false;
               if (key === 'ArrowUp' && d.dy === 0) { nextDirRef.current = { dx: 0, dy: -1 }; changed = true; }
               if (key === 'ArrowDown' && d.dy === 0) { nextDirRef.current = { dx: 0, dy: 1 }; changed = true; }
               if (key === 'ArrowLeft' && d.dx === 0) { nextDirRef.current = { dx: -1, dy: 0 }; changed = true; }
               if (key === 'ArrowRight' && d.dx === 0) { nextDirRef.current = { dx: 1, dy: 0 }; changed = true; }
               if (changed) soundManager.playMove();
          };
          window.addEventListener('keydown', handleKey);
          return () => window.removeEventListener('keydown', handleKey);
     }, [gameStarted, gameOver]);

     const move = (dx, dy) => {
          const d = nextDirRef.current;
          if (d.dx !== 0 && dx !== 0) return;
          if (d.dy !== 0 && dy !== 0) return;
          nextDirRef.current = { dx, dy };
          soundManager.playMove();
     };

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.2)] max-w-6xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'animate-shake' : ''}`}>
                    
                    {/* Header / Mobile Title */}
                    <div className="w-full flex justify-between items-center lg:hidden mb-4">
                         <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider">NEON SNAKE</h2>
                         <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                              <ArrowLeft className="w-6 h-6" />
                         </button>
                    </div>

                    {/* Game Board */}
                    <div
                         className="relative rounded-2xl overflow-hidden bg-black/60 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0 flex items-center justify-center"
                         style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE }}
                    >
                         {/* Grid Pattern */}
                         <div className="absolute inset-0 opacity-10"
                              style={{ backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`, backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px` }} />

                         {/* Snake */}
                         {snake.map((seg, i) => {
                              const isHead = i === 0;
                              return (
                                   <div
                                        key={i}
                                        className={`absolute rounded-sm transition-all duration-75 ${isHead ? 'bg-emerald-300 shadow-[0_0_15px_rgba(110,231,183,1)] z-10' : 'bg-emerald-600/80 shadow-[0_0_10px_rgba(5,150,105,0.6)]'}`}
                                        style={{ left: seg.x * CELL_SIZE + 2, top: seg.y * CELL_SIZE + 2, width: CELL_SIZE - 4, height: CELL_SIZE - 4 }}
                                   >
                                        {isHead && <div className="w-full h-full relative"><div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-1" /><div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 right-1" /></div>}
                                   </div>
                              );
                         })}

                         {/* Food */}
                         <div
                              className="absolute flex items-center justify-center text-2xl select-none filter drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse"
                              style={{ left: food.x * CELL_SIZE, top: food.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                         >
                              {foodEmoji}
                         </div>

                         {/* Overlays */}
                         {!gameStarted && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                   <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 drop-shadow-lg tracking-widest">NEON SNAKE</div>
                                   <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-sm border border-emerald-500/20">
                                        <div className="text-sm font-black text-emerald-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                        <ul className="text-gray-300 text-sm space-y-2 list-none">
                                             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>방향키 또는 버튼으로 이동</li>
                                             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>먹이를 먹으면 꼬리가 길어짐</li>
                                             <li className="flex items-center gap-2 text-red-400"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"/>자기 몸에 부딪히면 GAME OVER</li>
                                             <li className="flex items-center gap-2 text-cyan-400"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"/>벽을 통과하면 반대편에서 나옴</li>
                                        </ul>
                                   </div>
                                   <button onClick={startGame} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                        <Play className="w-6 h-6 fill-white" /> START
                                   </button>
                              </div>
                         )}

                         {gameStarted && gameOver && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                   <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">CRASH!</div>
                                   <div className="text-2xl text-white font-black mb-8 font-mono">Score: <span className="text-emerald-400">{score}</span></div>
                                   <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                        <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                   </button>
                              </div>
                         )}
                    </div>

                    {/* Right Panel */}
                    <div className="flex-1 w-full lg:w-72 flex flex-col gap-6">
                         <div className="hidden lg:flex justify-between items-start w-full">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider">NEON<br/>SNAKE</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="bg-black/40 p-6 rounded-2xl border border-emerald-500/20 w-full shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
                              <div className="text-xs font-black text-emerald-500 tracking-[0.2em] mb-2">SCORE</div>
                              <div className="text-5xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-300">
                                   {score.toLocaleString()}
                              </div>
                         </div>

                         <div className="bg-black/40 rounded-2xl p-6 border border-emerald-500/20 w-full flex-1">
                              <div className="flex items-center gap-3 mb-6">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20">
                                             <div className="flex items-center gap-3">
                                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-emerald-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[100px]">{e.name}</span>
                                             </div>
                                             <span className="text-emerald-400 font-mono text-sm font-bold">{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-emerald-500/50 text-sm text-center py-4 font-bold">아직 기록이 없어요.</p>}
                              </div>
                         </div>

                         {/* Mobile Controls */}
                         <div className="w-full lg:hidden flex justify-center mt-2">
                              <div className="grid grid-cols-3 gap-3 w-48">
                                   <div />
                                   <button onMouseDown={() => move(0, -1)} onTouchStart={(e) => { e.preventDefault(); move(0, -1); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <ArrowUp className="w-8 h-8" />
                                   </button>
                                   <div />
                                   <button onMouseDown={() => move(-1, 0)} onTouchStart={(e) => { e.preventDefault(); move(-1, 0); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <ArrowLeftIcon className="w-8 h-8" />
                                   </button>
                                   <div className="aspect-square bg-emerald-900/50 border border-emerald-700 rounded-2xl flex items-center justify-center">
                                        <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                   </div>
                                   <button onMouseDown={() => move(1, 0)} onTouchStart={(e) => { e.preventDefault(); move(1, 0); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <ArrowRight className="w-8 h-8" />
                                   </button>
                                   <div />
                                   <button onMouseDown={() => move(0, 1)} onTouchStart={(e) => { e.preventDefault(); move(0, 1); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <ArrowDown className="w-8 h-8" />
                                   </button>
                                   <div />
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamSnake;
