import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const COLS = 24;
const ROWS = 18;
const CELL_SIZE = 34;
const INITIAL_SPEED = 180;

const FOOD_EMOJI = ['🥐', '☕', '🍩', '🥖', '🧋']; // 강남 카페/빵

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
     const nextDirRef = useRef({ dx: 1, dy: 0 });

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
                         return prev;
                    }

                    const ate = newHead.x === food.x && newHead.y === food.y;
                    let next = [newHead, ...prev];
                    if (!ate) next = next.slice(0, -1);
                    else {
                         setScore(s => s + 10);
                         setSpeed(sp => Math.max(80, sp - 2));
                         const f = randomFood();
                         setFood(f);
                         setFoodEmoji(FOOD_EMOJI[Math.floor(Math.random() * FOOD_EMOJI.length)]);
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
               if (key === 'ArrowUp' && d.dy === 0) nextDirRef.current = { dx: 0, dy: -1 };
               if (key === 'ArrowDown' && d.dy === 0) nextDirRef.current = { dx: 0, dy: 1 };
               if (key === 'ArrowLeft' && d.dx === 0) nextDirRef.current = { dx: -1, dy: 0 };
               if (key === 'ArrowRight' && d.dx === 0) nextDirRef.current = { dx: 1, dy: 0 };
          };
          window.addEventListener('keydown', handleKey);
          return () => window.removeEventListener('keydown', handleKey);
     }, [gameStarted, gameOver]);

     const move = (dx, dy) => {
          const d = nextDirRef.current;
          if (d.dx !== 0 && dx !== 0) return;
          if (d.dy !== 0 && dy !== 0) return;
          nextDirRef.current = { dx, dy };
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-6xl mx-auto w-full">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                         <ArrowLeft className="w-6 h-6 text-gray-300" />
                    </button>
                    <h2 className="text-xl font-black tracking-wider">스네이크</h2>
                    <div className="w-10 h-10 flex items-center justify-center bg-purple-600 rounded-xl font-black text-sm">{score}</div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div
                         className="relative rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 shrink-0"
                         style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE }}
                    >
                    {/* Grid bg */}
                    <div className="absolute inset-0 bg-gray-900/90" />
                    {Array.from({ length: ROWS }).map((_, y) =>
                         Array.from({ length: COLS }).map((_, x) => (
                              <div
                                   key={`${x}-${y}`}
                                   className="absolute border border-gray-800"
                                   style={{ left: x * CELL_SIZE, top: y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                              />
                         ))
                    )}

                    {/* Snake */}
                    {snake.map((seg, i) => (
                         <div
                              key={i}
                              className={`absolute rounded-sm ${i === 0 ? 'bg-green-400 border-2 border-green-300' : 'bg-green-600 border border-green-500'}`}
                              style={{ left: seg.x * CELL_SIZE + 1, top: seg.y * CELL_SIZE + 1, width: CELL_SIZE - 2, height: CELL_SIZE - 2 }}
                         />
                    ))}

                    {/* Food */}
                    <div
                         className="absolute flex items-center justify-center text-2xl select-none"
                         style={{ left: food.x * CELL_SIZE, top: food.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                    >
                         {foodEmoji}
                    </div>

                    {!gameStarted && (
                         <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                              <div className="text-2xl font-black text-white mb-3">스네이크</div>
                              <div className="bg-gray-800/80 rounded-xl p-4 mb-5 text-left max-w-xs">
                                   <div className="text-xs font-bold text-green-300 mb-2">🎯 게임 방법</div>
                                   <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside">
                                        <li>방향키 또는 화면 버튼으로 이동</li>
                                        <li>🥐☕🍩 먹이를 먹으면 점수 +10, 몸이 길어짐</li>
                                        <li>자기 몸에 부딪히면 게임 오버!</li>
                                        <li>벽은 반대편으로 이어짐 (안 죽음)</li>
                                   </ul>
                              </div>
                              <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full shadow-lg flex items-center gap-2">
                                   <Play className="w-5 h-5" /> 시작하기
                              </button>
                         </div>
                    )}

                    {gameStarted && gameOver && (
                         <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                              <div className="text-3xl font-black text-white mb-2">GAME OVER</div>
                              <div className="text-xl text-yellow-400 font-bold mb-6">Score: {score}</div>
                              <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2">
                                   <RotateCw className="w-5 h-5" /> 다시 하기
                              </button>
                         </div>
                    )}
                    </div>

                    <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-600 w-full lg:w-52 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-gray-400 tracking-wider">TOP 10</span></div>
                         <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {rankList.map((e, i) => (
                                   <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                             <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${e.rank === 1 ? 'bg-yellow-500 text-black' : e.rank === 2 ? 'bg-gray-400 text-black' : e.rank === 3 ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'}`}>{e.rank}</span>
                                             <span className="text-gray-300 truncate max-w-[80px]">{e.name}</span>
                                        </div>
                                        <span className="text-gray-400 font-mono text-xs">{e.score}</span>
                                   </div>
                              ))}
                              {rankList.length === 0 && <p className="text-gray-500 text-xs">아직 기록이 없어요.</p>}
                         </div>
                    </div>
               </div>

               <p className="text-gray-500 text-xs mt-3">방향키 또는 아래 버튼으로 조작</p>
               <div className="grid grid-cols-3 gap-2 mt-4 w-48">
                    <div />
                    <button onMouseDown={() => move(0, -1)} onTouchStart={() => move(0, -1)} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center">
                         <ArrowUp className="w-6 h-6" />
                    </button>
                    <div />
                    <button onMouseDown={() => move(-1, 0)} onTouchStart={() => move(-1, 0)} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center">
                         <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center text-xs font-bold">●</div>
                    <button onMouseDown={() => move(1, 0)} onTouchStart={() => move(1, 0)} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center">
                         <ArrowRight className="w-6 h-6" />
                    </button>
                    <div />
                    <button onMouseDown={() => move(0, 1)} onTouchStart={() => move(0, 1)} className="aspect-square bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center">
                         <ArrowDown className="w-6 h-6" />
                    </button>
                    <div />
               </div>
          </div>
     );
};

export default GangnamSnake;
