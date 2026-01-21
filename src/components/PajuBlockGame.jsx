import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCw, ArrowDown, ArrowRight, ArrowUp, Play, Pause, X, Zap } from 'lucide-react';

// === TETRIS CONSTANTS ===
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 25; // Base size
const SPEEDS = { 1: 800, 2: 700, 3: 600, 4: 500, 5: 400, 6: 300, 7: 200, 8: 100 };

// Neon Colors with styled shadows for 3D/Bevel effect
const TETROMINOS = {
     I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-400 shadow-[inset_-3px_-3px_rgba(0,0,0,0.3),inset_3px_3px_rgba(255,255,255,0.4)] border border-cyan-300' },
     J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500 shadow-[inset_-3px_-3px_rgba(0,0,0,0.3),inset_3px_3px_rgba(255,255,255,0.4)] border border-blue-400' },
     L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500 shadow-[inset_-3px_-3px_rgba(0,0,0,0.3),inset_3px_3px_rgba(255,255,255,0.4)] border border-orange-400' },
     O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400 shadow-[inset_-3px_-3px_rgba(0,0,0,0.3),inset_3px_3px_rgba(255,255,255,0.4)] border border-yellow-300' },
     S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500 shadow-[inset_-3px_-3px_rgba(0,0,0,0.3),inset_3px_3px_rgba(255,255,255,0.4)] border border-green-400' },
     T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500 shadow-[inset_-3px_-3px_rgba(0,0,0,0.3),inset_3px_3px_rgba(255,255,255,0.4)] border border-purple-400' },
     Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500 shadow-[inset_-3px_-3px_rgba(0,0,0,0.3),inset_3px_3px_rgba(255,255,255,0.4)] border border-red-400' }
};

const RANDOM_TETROMINO = () => {
     const keys = Object.keys(TETROMINOS);
     const randKey = keys[Math.floor(Math.random() * keys.length)];
     return { ...TETROMINOS[randKey], type: randKey };
};

const PajuBlockGame = ({ onClose, user }) => {
     const [grid, setGrid] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
     const [activePiece, setActivePiece] = useState(null);
     const [nextPiece, setNextPiece] = useState(null); // Next Block State
     const [score, setScore] = useState(0);
     const [gameOver, setGameOver] = useState(false);
     const [isPaused, setIsPaused] = useState(false);
     const [dropTime, setDropTime] = useState(800);
     const gameLoopRef = useRef();

     // Helper: Check Collision
     const checkCollision = (shape, pos, currentGrid) => {
          for (let y = 0; y < shape.length; y++) {
               for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x] !== 0) {
                         const newY = y + pos.y;
                         const newX = x + pos.x;
                         if (
                              newY >= ROWS ||
                              newX < 0 ||
                              newX >= COLS ||
                              (newY >= 0 && currentGrid[newY][newX] !== 0)
                         ) {
                              return true;
                         }
                    }
               }
          }
          return false;
     };

     // Helper: Lock Piece to Grid
     const placePiece = (targetPiece = activePiece) => {
          if (!targetPiece) return;
          const { shape, pos, color } = targetPiece;
          const newGrid = grid.map(row => [...row]);

          let collisionDetected = false;

          shape.forEach((row, y) => {
               row.forEach((val, x) => {
                    if (val !== 0) {
                         if (pos.y + y >= 0) {
                              newGrid[pos.y + y][pos.x + x] = color;
                         } else {
                              collisionDetected = true;
                         }
                    }
               });
          });

          if (collisionDetected) {
               setGameOver(true);
               setGrid(newGrid);
               return;
          }

          // Line Clear Logic
          let lines = 0;
          for (let y = ROWS - 1; y >= 0; y--) {
               if (newGrid[y].every(cell => cell !== 0)) {
                    newGrid.splice(y, 1);
                    newGrid.unshift(Array(COLS).fill(0));
                    lines++;
                    y++;
               }
          }

          if (lines > 0) {
               setScore(prev => {
                    const newScore = prev + (lines * 100 * (lines === 4 ? 2 : 1)); // Bonus for Tetris
                    // Speed up logic: Every 500 points, speed increases
                    const newLevel = Math.floor(newScore / 500) + 1;
                    const newSpeed = Math.max(100, 800 - (newLevel * 50));

                    setDropTime(newSpeed);
                    return newScore;
               });
          }

          setGrid(newGrid);

          // Spawn Next Helper
          spawnNewPiece(newGrid);
     };

     // Spawn Logic
     const spawnNewPiece = (currentGrid = grid) => {
          const pieceToSpawn = nextPiece || RANDOM_TETROMINO(); // Use next or rand (first)
          const next = RANDOM_TETROMINO();

          // Set new active and next
          setNextPiece(next); // Queue next

          const startPos = { x: Math.floor(COLS / 2) - Math.floor(pieceToSpawn.shape[0].length / 2), y: 0 };

          if (checkCollision(pieceToSpawn.shape, startPos, currentGrid)) {
               setGameOver(true);
          } else {
               setActivePiece({ ...pieceToSpawn, pos: startPos });
          }
     };

     // Movement Logic
     const safeMove = (dx, dy) => {
          if (!activePiece || gameOver || isPaused) return;
          const newPos = { x: activePiece.pos.x + dx, y: activePiece.pos.y + dy };

          if (!checkCollision(activePiece.shape, newPos, grid)) {
               setActivePiece(prev => ({ ...prev, pos: newPos }));
          }
     };

     // Rotate Logic
     const handleRotate = () => {
          if (!activePiece || gameOver || isPaused) return;
          const rotated = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
          if (!checkCollision(rotated, activePiece.pos, grid)) {
               setActivePiece(prev => ({ ...prev, shape: rotated }));
          } else {
               // Wall kick attempt
               if (!checkCollision(rotated, { ...activePiece.pos, x: activePiece.pos.x - 1 }, grid)) {
                    setActivePiece(prev => ({ ...prev, shape: rotated, pos: { ...prev.pos, x: prev.pos.x - 1 } }));
               } else if (!checkCollision(rotated, { ...activePiece.pos, x: activePiece.pos.x + 1 }, grid)) {
                    setActivePiece(prev => ({ ...prev, shape: rotated, pos: { ...prev.pos, x: prev.pos.x + 1 } }));
               }
          }
     };

     // Hard Drop Logic
     const handleHardDrop = () => {
          if (!activePiece || gameOver || isPaused) return;
          let dropY = activePiece.pos.y;
          // Calculate lowest valid Y
          while (!checkCollision(activePiece.shape, { x: activePiece.pos.x, y: dropY + 1 }, grid)) {
               dropY++;
          }
          // Immediate Place
          const droppedPiece = { ...activePiece, pos: { ...activePiece.pos, y: dropY } };
          placePiece(droppedPiece);
     };

     // Init Game
     useEffect(() => {
          setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
          setScore(0);
          setGameOver(false);
          // Initial Init
          const first = RANDOM_TETROMINO();
          const next = RANDOM_TETROMINO();
          setNextPiece(next); // Set next immediately

          const startPos = { x: Math.floor(COLS / 2) - Math.floor(first.shape[0].length / 2), y: 0 };
          setActivePiece({ ...first, pos: startPos });

     }, []);

     // Game Loop
     useEffect(() => {
          if (!activePiece || gameOver || isPaused) return;

          const tick = () => {
               const newPos = { x: activePiece.pos.x, y: activePiece.pos.y + 1 };
               if (checkCollision(activePiece.shape, newPos, grid)) {
                    placePiece();
               } else {
                    setActivePiece(prev => ({ ...prev, pos: newPos }));
               }
          };

          gameLoopRef.current = setInterval(tick, dropTime);
          return () => clearInterval(gameLoopRef.current);
     }, [activePiece, gameOver, isPaused, dropTime, grid]);

     // Controls
     useEffect(() => {
          const handleKeyDown = (e) => {
               if (gameOver || isPaused) return;
               switch (e.key) {
                    case 'ArrowLeft': safeMove(-1, 0); break;
                    case 'ArrowRight': safeMove(1, 0); break;
                    case 'ArrowDown': safeMove(0, 1); break;
                    case 'ArrowUp': handleRotate(); e.preventDefault(); break;
                    case ' ': handleHardDrop(); e.preventDefault(); break;
                    default: break;
               }
          };
          window.addEventListener('keydown', handleKeyDown);
          return () => window.removeEventListener('keydown', handleKeyDown);
     }, [activePiece, gameOver, isPaused, grid]);

     // Render Ghost Piece
     const getGhostY = () => {
          if (!activePiece) return null;
          let ghostY = activePiece.pos.y;
          while (!checkCollision(activePiece.shape, { x: activePiece.pos.x, y: ghostY + 1 }, grid)) {
               ghostY++;
          }
          return ghostY;
     };
     const ghostY = getGhostY();

     return (
          <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4">
               {/* Container */}
               <div className="relative bg-gray-900 rounded-3xl p-6 border-4 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.4)] max-w-4xl w-full flex flex-col md:flex-row gap-8 items-start animate-in zoom-in-95 duration-300">

                    {/* Header / Info */}
                    <div className="flex-1 w-full md:w-auto flex flex-col gap-6">
                         <div className="flex justify-between items-center">
                              <div>
                                   <div className="text-xs font-bold text-gray-500 tracking-widest mb-1">SCORE</div>
                                   <div className="text-4xl font-black text-white font-mono">{score.toLocaleString()}</div>
                              </div>
                              <button onClick={onClose} className="bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 p-2 rounded-full transition-colors">
                                   <X className="w-6 h-6" />
                              </button>
                         </div>

                         {/* NEXT BLOCK PANEL */}
                         <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5 flex flex-col items-center">
                              <div className="text-xs font-bold text-yellow-400 mb-2 tracking-widest">NEXT</div>
                              <div className="w-20 h-16 flex items-center justify-center">
                                   {nextPiece && (
                                        <div className="relative">
                                             {nextPiece.shape.map((row, y) => (
                                                  <div key={y} className="flex">
                                                       {row.map((cell, x) => (
                                                            <div key={x} className={`w-4 h-4 ${cell ? nextPiece.color : 'bg-transparent'}`} />
                                                       ))}
                                                  </div>
                                             ))}
                                        </div>
                                   )}
                              </div>
                         </div>

                         {/* Controls Guide (PC) */}
                         <div className="hidden md:block bg-gray-800/50 rounded-xl p-4 border border-white/5 space-y-2 text-sm text-gray-400">
                              <div className="flex justify-between"><span>이동</span> <span className="text-white font-bold">← ↓ →</span></div>
                              <div className="flex justify-between"><span>회전</span> <span className="text-white font-bold">↑</span></div>
                              <div className="flex justify-between"><span>한방에 내리기</span> <span className="text-yellow-400 font-bold">Space</span></div>
                         </div>

                         {/* Mock Leaderboard */}
                         <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5 w-full">
                              <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                                   <Trophy className="w-4 h-4 text-yellow-400" />
                                   <span className="text-xs font-bold text-gray-400 tracking-wider">HALL OF FAME</span>
                              </div>
                              <div className="space-y-2">
                                   {[
                                        { rank: 1, name: '파주불주먹', score: 12500 },
                                        { rank: 2, name: '운정테트신', score: 8900 },
                                        { rank: 3, name: '교하짱', score: 5400 },
                                   ].map((user) => (
                                        <div key={user.rank} className="flex justify-between items-center text-sm">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${user.rank === 1 ? 'bg-yellow-500 text-black' :
                                                       user.rank === 2 ? 'bg-gray-400 text-black' :
                                                            'bg-orange-700 text-white'
                                                       }`}>{user.rank}</span>
                                                  <span className="text-gray-300 font-medium">{user.name}</span>
                                             </div>
                                             <span className="text-gray-500 font-mono text-xs">{user.score.toLocaleString()}</span>
                                        </div>
                                   ))}
                                   <div className="border-t border-white/5 pt-2 mt-2">
                                        <div className="flex justify-between items-center text-sm opacity-50">
                                             <div className="flex items-center gap-2">
                                                  <span className="w-5 text-center text-xs text-gray-500">-</span>
                                                  <span className="text-gray-400">나</span>
                                             </div>
                                             <span className="font-mono text-xs">{score > 0 ? score.toLocaleString() : '-'}</span>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* Game Grid */}
                    <div className="relative mx-auto bg-gray-950 border-4 border-gray-800 rounded-lg shadow-2xl overflow-hidden"
                         style={{ width: COLS * 25 + 8, height: ROWS * 25 + 8 }}>
                         {/* Grid Background Pattern */}
                         <div className="absolute inset-0 opacity-20"
                              style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '25px 25px' }}>
                         </div>

                         {/* Active Piece Layer */}
                         <div className="absolute top-1 left-1">
                              {/* Ghost Piece */}
                              {activePiece && !gameOver && activePiece.shape.map((row, y) => row.map((cell, x) => (
                                   cell ? <div key={`g-${y}-${x}`} className="absolute w-[25px] h-[25px] border-2 border-white/20 bg-white/5 rounded-sm"
                                        style={{ left: (activePiece.pos.x + x) * 25, top: (ghostY + y) * 25 }} /> : null
                              )))}

                              {/* Static Grid */}
                              {grid.map((row, y) => row.map((cell, x) => (
                                   cell ? <div key={`s-${y}-${x}`} className={`absolute w-[25px] h-[25px] ${cell} rounded-sm border border-black/10`}
                                        style={{ left: x * 25, top: y * 25 }} /> : null
                              )))}

                              {/* Active Piece */}
                              {activePiece && !gameOver && activePiece.shape.map((row, y) => row.map((cell, x) => (
                                   cell ? <div key={`a-${y}-${x}`} className={`absolute w-[25px] h-[25px] ${activePiece.color} rounded-sm border border-black/10`}
                                        style={{ left: (activePiece.pos.x + x) * 25, top: (activePiece.pos.y + y) * 25 }} /> : null
                              )))}
                         </div>

                         {/* Game Over Overlay */}
                         {gameOver && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                                   <div className="text-5xl font-black text-white mb-2 drop-shadow-lg">GAME OVER</div>
                                   <div className="text-xl text-yellow-400 font-bold mb-6">Score: {score}</div>
                                   <button onClick={() => { setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0))); setScore(0); setGameOver(false); setIsPaused(false); setActivePiece(RANDOM_TETROMINO()); }}
                                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                                        <RotateCw className="w-5 h-5" /> 다시 하기
                                   </button>
                              </div>
                         )}
                    </div>

                    {/* Mobile Controls */}
                    <div className="w-full md:w-auto md:hidden grid grid-cols-3 gap-3 mt-4">
                         <div className="col-start-2">
                              <button className="w-full aspect-square bg-gray-800 rounded-2xl flex items-center justify-center text-white active:bg-purple-600 transition-colors shadow-lg border border-gray-700"
                                   onClick={handleRotate}><RotateCw /></button>
                         </div>

                         <div className="col-start-1 row-start-2">
                              <button className="w-full aspect-square bg-gray-800 rounded-2xl flex items-center justify-center text-white active:bg-gray-700 transition-colors shadow-lg border border-gray-700"
                                   onClick={() => safeMove(-1, 0)}><ArrowLeft /></button>
                         </div>
                         <div className="col-start-2 row-start-2">
                              <button className="w-full aspect-square bg-gray-800 rounded-2xl flex items-center justify-center text-white active:bg-gray-700 transition-colors shadow-lg border border-gray-700"
                                   onClick={() => safeMove(0, 1)}><ArrowDown /></button>
                         </div>
                         <div className="col-start-3 row-start-2">
                              <button className="w-full aspect-square bg-gray-800 rounded-2xl flex items-center justify-center text-white active:bg-gray-700 transition-colors shadow-lg border border-gray-700"
                                   onClick={() => safeMove(1, 0)}><ArrowRight /></button>
                         </div>

                         <div className="col-span-3 mt-2">
                              <button className="w-full py-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-500 font-black tracking-widest active:bg-yellow-500 active:text-black transition-all flex items-center justify-center gap-2"
                                   onClick={handleHardDrop}>
                                   <Zap className="w-5 h-5" /> DROP!
                              </button>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default PajuBlockGame;
