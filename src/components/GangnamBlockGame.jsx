import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Trophy, RotateCw, ArrowDown, ArrowRight, ArrowUp, Play, Pause, X, Zap } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

// === TETRIS CONSTANTS ===
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 36;
const SPEEDS = { 1: 800, 2: 700, 3: 600, 4: 500, 5: 400, 6: 300, 7: 200, 8: 100 };

// Premium Neon Colors — 입체감을 위한 그라데이션 + 베벨(윗면 하이라이트/아랫면 그림자) + 네온 글로우
const TETROMINOS = {
     I: { shape: [[1, 1, 1, 1]], color: 'bg-gradient-to-b from-cyan-300 to-cyan-600 shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-3px_0_rgba(0,0,0,.35),0_3px_5px_rgba(0,0,0,.5),0_0_12px_rgba(34,211,238,.7)] border border-cyan-200/80' },
     J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-gradient-to-b from-blue-400 to-blue-700 shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-3px_0_rgba(0,0,0,.35),0_3px_5px_rgba(0,0,0,.5),0_0_12px_rgba(59,130,246,.7)] border border-blue-300/80' },
     L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-gradient-to-b from-orange-400 to-orange-700 shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-3px_0_rgba(0,0,0,.35),0_3px_5px_rgba(0,0,0,.5),0_0_12px_rgba(249,115,22,.7)] border border-orange-300/80' },
     O: { shape: [[1, 1], [1, 1]], color: 'bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-3px_0_rgba(0,0,0,.35),0_3px_5px_rgba(0,0,0,.5),0_0_12px_rgba(250,204,21,.7)] border border-yellow-200/80' },
     S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-gradient-to-b from-green-400 to-green-700 shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-3px_0_rgba(0,0,0,.35),0_3px_5px_rgba(0,0,0,.5),0_0_12px_rgba(34,197,94,.7)] border border-green-300/80' },
     T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-gradient-to-b from-purple-400 to-purple-700 shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-3px_0_rgba(0,0,0,.35),0_3px_5px_rgba(0,0,0,.5),0_0_12px_rgba(168,85,247,.7)] border border-purple-300/80' },
     Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-gradient-to-b from-red-400 to-red-700 shadow-[inset_0_2px_0_rgba(255,255,255,.55),inset_0_-3px_0_rgba(0,0,0,.35),0_3px_5px_rgba(0,0,0,.5),0_0_12px_rgba(239,68,68,.7)] border border-red-300/80' }
};

const RANDOM_TETROMINO = () => {
     const keys = Object.keys(TETROMINOS);
     const randKey = keys[Math.floor(Math.random() * keys.length)];
     return { ...TETROMINOS[randKey], type: randKey };
};

const GangnamBlockGame = ({ onClose, user }) => {
     const [grid, setGrid] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
     const [activePiece, setActivePiece] = useState(null);
     const [nextPiece, setNextPiece] = useState(null);
     const [score, setScore] = useState(0);
     const [gameOver, setGameOver] = useState(false);
     const [isPaused, setIsPaused] = useState(false);
     const [dropTime, setDropTime] = useState(800);
     const [gameStarted, setGameStarted] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('block', true));
     const [shake, setShake] = useState(false);
     const gameLoopRef = useRef();

     useEffect(() => {
          if (gameStarted && gameOver && score > 0) {
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               const prevBest = getRankTop10('block', true)[0]?.score || 0;
               addScore('block', name, score, true);
               setRankList(getRankTop10('block', true));
               // 최고 기록 갱신이면 승리 팡파레, 아니면 게임오버 사운드
               playSound(score > prevBest ? 'win' : 'gameover');
          }
     }, [gameStarted, gameOver, score, user]);

     const startGame = useCallback(() => {
          playSound('click');
          setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
          setScore(0);
          setGameOver(false);
          setIsPaused(false);
          setDropTime(800);
          const first = RANDOM_TETROMINO();
          const next = RANDOM_TETROMINO();
          setNextPiece(next);
          const startPos = { x: Math.floor(COLS / 2) - Math.floor(first.shape[0].length / 2), y: 0 };
          setActivePiece({ ...first, pos: startPos });
          setGameStarted(true);
     }, []);

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

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 200);
     };

     const placePiece = (targetPiece = activePiece) => {
          if (!targetPiece) return;
          playSound('hit');
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
               playSound('combo');
               triggerShake();
               setScore(prev => {
                    const newScore = prev + (lines * 100 * (lines === 4 ? 2 : 1));
                    const newLevel = Math.floor(newScore / 500) + 1;
                    const newSpeed = Math.max(100, 800 - (newLevel * 50));
                    setDropTime(newSpeed);
                    return newScore;
               });
          }

          setGrid(newGrid);
          spawnNewPiece(newGrid);
     };

     const spawnNewPiece = (currentGrid = grid) => {
          const pieceToSpawn = nextPiece || RANDOM_TETROMINO();
          const next = RANDOM_TETROMINO();
          setNextPiece(next);
          const startPos = { x: Math.floor(COLS / 2) - Math.floor(pieceToSpawn.shape[0].length / 2), y: 0 };

          if (checkCollision(pieceToSpawn.shape, startPos, currentGrid)) {
               setGameOver(true);
          } else {
               setActivePiece({ ...pieceToSpawn, pos: startPos });
          }
     };

     const safeMove = (dx, dy) => {
          if (!activePiece || gameOver || isPaused) return;
          const newPos = { x: activePiece.pos.x + dx, y: activePiece.pos.y + dy };
          if (!checkCollision(activePiece.shape, newPos, grid)) {
               playSound('move');
               setActivePiece(prev => ({ ...prev, pos: newPos }));
          }
     };

     const handleRotate = () => {
          if (!activePiece || gameOver || isPaused) return;
          const rotated = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
          if (!checkCollision(rotated, activePiece.pos, grid)) {
               playSound('move');
               setActivePiece(prev => ({ ...prev, shape: rotated }));
          } else {
               if (!checkCollision(rotated, { ...activePiece.pos, x: activePiece.pos.x - 1 }, grid)) {
                    playSound('move');
                    setActivePiece(prev => ({ ...prev, shape: rotated, pos: { ...prev.pos, x: prev.pos.x - 1 } }));
               } else if (!checkCollision(rotated, { ...activePiece.pos, x: activePiece.pos.x + 1 }, grid)) {
                    playSound('move');
                    setActivePiece(prev => ({ ...prev, shape: rotated, pos: { ...prev.pos, x: prev.pos.x + 1 } }));
               }
          }
     };

     const handleHardDrop = () => {
          if (!activePiece || gameOver || isPaused) return;
          playSound('whoosh');
          let dropY = activePiece.pos.y;
          while (!checkCollision(activePiece.shape, { x: activePiece.pos.x, y: dropY + 1 }, grid)) {
               dropY++;
          }
          const droppedPiece = { ...activePiece, pos: { ...activePiece.pos, y: dropY } };
          placePiece(droppedPiece);
     };

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
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* 블록 고정 시 살짝 튀어나오는 팝 애니메이션 */}
               <style>{`@keyframes block-pop { 0% { transform: scale(.6); } 70% { transform: scale(1.08); } 100% { transform: scale(1); } }`}</style>
               {/* Ambient Background Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
               
               {/* Container */}
               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_0_80px_rgba(168,85,247,0.3)] max-w-6xl w-full flex flex-col md:flex-row gap-10 items-center md:items-start animate-in zoom-in-95 duration-500 ${shake ? 'animate-shake' : ''}`}>

                    {/* Left Panel: Score & Controls */}
                    <div className="flex-1 w-full md:w-auto flex flex-col gap-6 md:pr-4">
                         <div className="flex justify-between items-start">
                              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 w-full">
                                   <div className="text-xs font-black text-purple-400 tracking-[0.2em] mb-1">SCORE</div>
                                   <div className="text-5xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                                        {score.toLocaleString()}
                                   </div>
                              </div>
                              <button onClick={() => { playSound('click'); onClose(); }} className="ml-4 bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <X className="w-6 h-6" />
                              </button>
                         </div>

                         {/* Controls Guide (PC) */}
                         <div className="hidden md:block bg-black/40 rounded-2xl p-6 border border-white/5 space-y-3">
                              <div className="text-xs font-black text-gray-500 tracking-[0.2em] mb-2">CONTROLS</div>
                              <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">Move</span> <span className="bg-white/10 px-2 py-1 rounded text-white font-bold text-xs">← ↓ →</span></div>
                              <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">Rotate</span> <span className="bg-white/10 px-2 py-1 rounded text-white font-bold text-xs">↑</span></div>
                              <div className="flex justify-between items-center"><span className="text-gray-400 text-sm">Hard Drop</span> <span className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded font-bold text-xs">Space</span></div>
                         </div>
                    </div>

                    {/* Center Panel: Game Grid & Next Piece — perspective로 3D 테이블 느낌 */}
                    <div className="flex flex-col md:flex-row items-start gap-4" style={{ perspective: '900px' }}>
                         <div className="relative flex-shrink-0 bg-black/80 border-2 border-white/10 rounded-xl shadow-[0_25px_50px_rgba(0,0,0,.6),0_0_40px_rgba(168,85,247,0.25)] overflow-hidden p-1"
                              style={{ width: COLS * BLOCK_SIZE + 10, height: ROWS * BLOCK_SIZE + 10, transform: 'rotateX(3deg)', transformOrigin: 'top center' }}>
                         {/* Grid Pattern */}
                         <div className="absolute inset-0 opacity-[0.03]"
                              style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: `${BLOCK_SIZE}px ${BLOCK_SIZE}px` }}>
                         </div>

                         {/* Game Pieces */}
                         <div className="absolute top-1 left-1">
                              {/* Ghost Piece */}
                              {activePiece && !gameOver && activePiece.shape.map((row, y) => row.map((cell, x) => (
                                   cell ? <div key={`g-${y}-${x}`} className="absolute border-2 border-white/30 bg-white/5 rounded-[5px]"
                                        style={{ width: BLOCK_SIZE, height: BLOCK_SIZE, left: (activePiece.pos.x + x) * BLOCK_SIZE, top: (ghostY + y) * BLOCK_SIZE }} /> : null
                              )))}

                              {/* Static Grid — 새로 고정된 블록은 팝 애니메이션 */}
                              {grid.map((row, y) => row.map((cell, x) => (
                                   cell ? <div key={`s-${y}-${x}`} className={`absolute ${cell} rounded-[5px]`}
                                        style={{ width: BLOCK_SIZE, height: BLOCK_SIZE, left: x * BLOCK_SIZE, top: y * BLOCK_SIZE, animation: 'block-pop .18s ease-out' }} /> : null
                              )))}

                              {/* Active Piece */}
                              {activePiece && !gameOver && activePiece.shape.map((row, y) => row.map((cell, x) => (
                                   cell ? <div key={`a-${y}-${x}`} className={`absolute ${activePiece.color} rounded-[5px]`}
                                        style={{ width: BLOCK_SIZE, height: BLOCK_SIZE, left: (activePiece.pos.x + x) * BLOCK_SIZE, top: (activePiece.pos.y + y) * BLOCK_SIZE }} /> : null
                              )))}
                         </div>

                         {/* Overlays */}
                         {!gameStarted && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in">
                                   <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8 tracking-widest drop-shadow-lg">TETRIS</div>
                                   <button onClick={startGame}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all hover:scale-105 flex items-center justify-center gap-3 text-lg">
                                        <Play className="w-6 h-6 fill-white" /> START GAME
                                   </button>
                              </div>
                         )}

                         {gameStarted && gameOver && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                                   <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">GAME OVER</div>
                                   <div className="text-2xl text-white font-black mb-8 font-mono">Score: <span className="text-cyan-400">{score.toLocaleString()}</span></div>
                                   <button onClick={startGame}
                                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                        <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                   </button>
                              </div>
                         )}
                         </div>

                         {/* NEXT BLOCK PANEL (Moved right next to the grid) */}
                         {/* NEXT BLOCK PANEL (Moved right next to the grid) */}
                         <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 border-2 border-white/10 flex flex-col items-center shadow-[0_0_30px_rgba(34,211,238,0.15)] h-fit min-w-[160px]">
                              <div className="text-sm font-black text-cyan-400 mb-6 tracking-[0.3em]">NEXT</div>
                              <div className="w-40 h-40 flex items-center justify-center bg-gray-900/50 rounded-xl shadow-inner border border-white/5">
                                   {nextPiece && (
                                        <div className="relative">
                                             {nextPiece.shape.map((row, y) => (
                                                  <div key={y} className="flex justify-center">
                                                       {row.map((cell, x) => (
                                                            <div key={x} className={`w-8 h-8 rounded-[5px] ${cell ? nextPiece.color : 'bg-transparent'}`} />
                                                       ))}
                                                  </div>
                                             ))}
                                        </div>
                                   )}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Leaderboard & Mobile Controls */}
                    <div className="flex-1 w-full md:w-auto flex flex-col gap-6">
                         <div className="bg-black/40 rounded-2xl p-6 border border-white/5 w-full flex-1 min-h-[300px]">
                              <div className="flex items-center gap-3 mb-6">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                             <div className="flex items-center gap-3">
                                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-gray-400'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[100px]">{e.name}</span>
                                             </div>
                                             <span className="text-cyan-400 font-mono text-sm font-bold">{e.score.toLocaleString()}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-gray-500 text-sm text-center py-4">아직 기록이 없어요.</p>}
                              </div>
                         </div>

                         {/* Mobile Controls */}
                         <div className="w-full md:hidden grid grid-cols-3 gap-2 mt-2">
                              <div className="col-start-2">
                                   <button className="w-full aspect-square bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:bg-white/30 transition-colors shadow-lg border border-white/10"
                                        onClick={handleRotate}><RotateCw /></button>
                              </div>
                              <div className="col-start-1 row-start-2">
                                   <button className="w-full aspect-square bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:bg-white/30 transition-colors shadow-lg border border-white/10"
                                        onClick={() => safeMove(-1, 0)}><ArrowLeft /></button>
                              </div>
                              <div className="col-start-2 row-start-2">
                                   <button className="w-full aspect-square bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:bg-white/30 transition-colors shadow-lg border border-white/10"
                                        onClick={() => safeMove(0, 1)}><ArrowDown /></button>
                              </div>
                              <div className="col-start-3 row-start-2">
                                   <button className="w-full aspect-square bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white active:bg-white/30 transition-colors shadow-lg border border-white/10"
                                        onClick={() => safeMove(1, 0)}><ArrowRight /></button>
                              </div>
                              <div className="col-span-3 mt-1">
                                   <button className="w-full py-4 bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/50 rounded-xl text-white font-black tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                        onClick={handleHardDrop}>
                                        <Zap className="w-5 h-5 fill-current" /> HARD DROP
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamBlockGame;
