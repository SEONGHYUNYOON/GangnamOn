import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

const SIZE = 4;

const emptyGrid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const spawnTile = (grid) => {
     const empty = [];
     for (let r = 0; r < SIZE; r++) {
          for (let c = 0; c < SIZE; c++) {
               if (grid[r][c] === 0) empty.push([r, c]);
          }
     }
     if (empty.length === 0) return grid;
     const [r, c] = empty[Math.floor(Math.random() * empty.length)];
     const next = grid.map(row => [...row]);
     next[r][c] = Math.random() < 0.9 ? 2 : 4;
     return next;
};

const initGrid = () => spawnTile(spawnTile(emptyGrid()));

const slide = (line) => {
     const filtered = line.filter(v => v !== 0);
     const merged = [];
     let score = 0;
     for (let i = 0; i < filtered.length; i++) {
          if (filtered[i] === filtered[i + 1]) {
               const v = filtered[i] * 2;
               merged.push(v);
               score += v;
               i++;
          } else {
               merged.push(filtered[i]);
          }
     }
     while (merged.length < SIZE) merged.push(0);
     return { line: merged, score };
};

const moveGrid = (grid, dir) => {
     let total = 0;
     const next = emptyGrid();
     const rotate = (g) => g[0].map((_, i) => g.map(row => row[i]).reverse());
     let work = grid.map(r => [...r]);
     const turns = { left: 0, up: 1, right: 2, down: 3 }[dir];
     for (let t = 0; t < turns; t++) work = rotate(work);

     for (let r = 0; r < SIZE; r++) {
          const { line, score } = slide(work[r]);
          work[r] = line;
          total += score;
     }
     for (let t = 0; t < (4 - turns) % 4; t++) work = rotate(work);
     for (let r = 0; r < SIZE; r++) next[r] = work[r];
     return { grid: next, score: total, moved: JSON.stringify(next) !== JSON.stringify(grid) };
};

const canMove = (grid) => {
     for (let r = 0; r < SIZE; r++) {
          for (let c = 0; c < SIZE; c++) {
               if (grid[r][c] === 0) return true;
               if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
               if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
          }
     }
     return false;
};

// 그라데이션 + 베벨(윗면 하이라이트/아랫면 두꺼운 그림자)로 타일에 입체감, 네온 글로우는 유지
const tileColor = (v) => {
     const map = {
          2: 'bg-gradient-to-b from-slate-600 to-slate-800 text-slate-200 border-slate-500 shadow-[inset_0_2px_0_rgba(255,255,255,.15),0_4px_0_rgba(0,0,0,.4)]',
          4: 'bg-gradient-to-b from-slate-500 to-slate-700 text-white border-slate-400 shadow-[inset_0_2px_0_rgba(255,255,255,.2),0_4px_0_rgba(0,0,0,.4)]',
          8: 'bg-gradient-to-b from-amber-500 to-amber-700 text-white border-amber-400 shadow-[inset_0_2px_0_rgba(255,255,255,.35),0_4px_0_rgba(0,0,0,.35),0_0_10px_rgba(217,119,6,0.5)]',
          16: 'bg-gradient-to-b from-orange-400 to-orange-600 text-white border-orange-300 shadow-[inset_0_2px_0_rgba(255,255,255,.4),0_4px_0_rgba(0,0,0,.35),0_0_15px_rgba(249,115,22,0.6)]',
          32: 'bg-gradient-to-b from-red-400 to-red-600 text-white border-red-300 shadow-[inset_0_2px_0_rgba(255,255,255,.4),0_4px_0_rgba(0,0,0,.35),0_0_20px_rgba(239,68,68,0.7)]',
          64: 'bg-gradient-to-b from-rose-500 to-rose-700 text-white border-rose-400 shadow-[inset_0_2px_0_rgba(255,255,255,.4),0_4px_0_rgba(0,0,0,.35),0_0_20px_rgba(225,29,72,0.8)]',
          128: 'bg-gradient-to-b from-yellow-300 to-yellow-500 text-black border-yellow-200 shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_4px_0_rgba(0,0,0,.3),0_0_25px_rgba(250,204,21,0.9)] text-3xl',
          256: 'bg-gradient-to-b from-yellow-200 to-yellow-400 text-black border-yellow-100 shadow-[inset_0_2px_0_rgba(255,255,255,.7),0_4px_0_rgba(0,0,0,.3),0_0_30px_rgba(253,224,71,1)] text-3xl',
          512: 'bg-gradient-to-b from-lime-300 to-lime-500 text-black border-lime-200 shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_4px_0_rgba(0,0,0,.3),0_0_35px_rgba(163,230,53,1)] text-3xl',
          1024: 'bg-gradient-to-b from-emerald-300 to-emerald-500 text-black border-emerald-200 shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_4px_0_rgba(0,0,0,.3),0_0_40px_rgba(52,211,153,1)] text-2xl',
          2048: 'bg-gradient-to-b from-purple-400 to-purple-600 text-white border-purple-300 shadow-[inset_0_2px_0_rgba(255,255,255,.5),0_4px_0_rgba(0,0,0,.35),0_0_50px_rgba(168,85,247,1)] text-2xl',
     };
     return map[v] || 'bg-gradient-to-b from-fuchsia-500 to-fuchsia-700 text-white border-fuchsia-400 shadow-[inset_0_2px_0_rgba(255,255,255,.5),0_4px_0_rgba(0,0,0,.35),0_0_50px_rgba(192,38,211,1)] text-2xl';
};

const GangnamGame2048 = ({ onClose, user }) => {
     const [grid, setGrid] = useState(initGrid);
     const [score, setScore] = useState(0);
     const [gameOver, setGameOver] = useState(false);
     const [gameStarted, setGameStarted] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('game2048', true));
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';

     const start = () => {
          playSound('click');
          setGrid(initGrid());
          setScore(0);
          setGameOver(false);
          setGameStarted(true);
          setRankList(getRankTop10('game2048', true));
     };

     const reset = useCallback(() => {
          playSound('click');
          setGrid(initGrid());
          setScore(0);
          setGameOver(false);
          setRankList(getRankTop10('game2048', true));
     }, []);

     const handleMove = useCallback((dir) => {
          if (gameOver || !gameStarted) return;
          setGrid(prev => {
               const { grid: moved, score: gained, moved: didMove } = moveGrid(prev, dir);
               if (!didMove) return prev;

               // 2048 최초 달성 → 승리 팡파레 / 큰 합체 → 스코어음 / 일반 합체 → 팝 / 슬라이드 → 이동음
               const reached2048 = moved.flat().includes(2048) && !prev.flat().includes(2048);
               if (reached2048) playSound('win');
               else if (gained > 0) playSound(gained >= 64 ? 'score' : 'pop');
               else playSound('move');

               const withSpawn = spawnTile(moved);
               setScore(s => {
                    const nextScore = s + gained;
                    if (!canMove(withSpawn)) {
                         const prevBest = getRankTop10('game2048', true)[0]?.score || 0;
                         playSound(nextScore > prevBest ? 'win' : 'gameover');
                         setGameOver(true);
                         if (nextScore > 0) addScore('game2048', name, nextScore, true);
                         setRankList(getRankTop10('game2048', true));
                    }
                    return nextScore;
               });
               return withSpawn;
          });
     }, [gameOver, gameStarted, name]);

     useEffect(() => {
          const onKey = (e) => {
               const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
               if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
          };
          window.addEventListener('keydown', onKey);
          return () => window.removeEventListener('keydown', onKey);
     }, [handleMove]);

     const touchRef = React.useRef({ x: 0, y: 0 });
     const onTouchStart = (e) => {
          if(!gameStarted || gameOver) return;
          touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
     };
     const onTouchEnd = (e) => {
          if(!gameStarted || gameOver) return;
          const dx = e.changedTouches[0].clientX - touchRef.current.x;
          const dy = e.changedTouches[0].clientY - touchRef.current.y;
          if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
          if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left');
          else handleMove(dy > 0 ? 'down' : 'up');
     };

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* 타일 등장/변화 시 팝 애니메이션 */}
               <style>{`@keyframes tile-pop { 0% { transform: scale(.7); opacity: .6; } 60% { transform: scale(1.06); } 100% { transform: scale(1); opacity: 1; } }`}</style>
               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-900/10 rounded-full blur-[150px] pointer-events-none" />

               <div className={`relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-700 shadow-[0_0_80px_rgba(250,204,21,0.1)] max-w-5xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500`}>
                    
                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 tracking-wider">NEON 2048</h2>
                              <button onClick={() => { playSound('click'); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 drop-shadow-sm leading-tight">NEON<br/>2048</h2>
                              <button onClick={() => { playSound('click'); onClose(); }} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="w-full">
                              <div className="bg-black/60 p-5 rounded-2xl border border-yellow-500/30 shadow-[inset_0_0_20px_rgba(250,204,21,0.1)] w-full text-center lg:text-left">
                                   <div className="text-xs font-black text-yellow-400 tracking-[0.2em] mb-1">SCORE</div>
                                   <div className="text-5xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-300">
                                        {score.toLocaleString()}
                                   </div>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-slate-700 w-full flex-1 hidden lg:block shadow-inner">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-slate-600">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-slate-700 border border-slate-600 text-gray-300'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-yellow-400 font-mono text-sm font-bold">{e.score.toLocaleString()}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-gray-500 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Board — perspective + 살짝 기울여 3D 테이블 느낌 */}
                    <div className="w-full lg:w-2/3 flex flex-col items-center justify-center relative min-h-[400px]" style={{ perspective: '900px' }}>

                         <div
                              className="bg-[#0f172a] p-3 md:p-4 rounded-3xl border-4 border-[#1e293b] shadow-[0_25px_60px_rgba(0,0,0,.8),0_0_40px_rgba(250,204,21,0.08)] touch-none select-none w-full max-w-md relative overflow-hidden"
                              style={{ transform: 'rotateX(4deg)', transformOrigin: 'top center' }}
                              onTouchStart={onTouchStart}
                              onTouchEnd={onTouchEnd}
                         >
                              {/* Inner Glow */}
                              <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] pointer-events-none rounded-2xl" />

                              <div className="grid grid-cols-4 gap-2 md:gap-3 relative z-10">
                                   {grid.flat().map((v, i) => (
                                        <div key={`${i}-${v}`} className={`aspect-square rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-4xl font-black transition-all duration-150 border-2
                                             ${v ? tileColor(v) : 'bg-slate-900/70 border-slate-700/70 shadow-[inset_0_3px_6px_rgba(0,0,0,.6)] text-transparent'}`}
                                             style={v ? { animation: 'tile-pop .16s ease-out' } : undefined}>
                                             {v || ''}
                                        </div>
                                   ))}
                              </div>

                              {/* Overlays */}
                              {!gameStarted && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6 drop-shadow-lg tracking-widest">NEON 2048</div>
                                        <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-sm border border-yellow-500/20">
                                             <div className="text-sm font-black text-yellow-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                             <ul className="text-gray-300 text-sm space-y-2 list-none">
                                                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 shrink-0"/>방향키나 스와이프로 타일을 미세요.</li>
                                                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0"/>같은 숫자가 닿으면 하나로 합쳐집니다!</li>
                                                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"/>2048 타일을 만드는 것이 목표입니다.</li>
                                             </ul>
                                        </div>
                                        <button onClick={start} className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                             <Play className="w-6 h-6 fill-black" /> START GAME
                                        </button>
                                   </div>
                              )}

                              {gameStarted && gameOver && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-red-500/50 rounded-2xl">
                                        <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">NO MOVES!</div>
                                        <div className="text-2xl text-white font-black mb-8 font-mono">Score: <span className="text-yellow-400">{score.toLocaleString()}</span></div>
                                        <button onClick={reset} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                             <RotateCw className="w-5 h-5" /> RESTART
                                        </button>
                                   </div>
                              )}
                         </div>

                         {gameStarted && !gameOver && (
                              <div className="mt-6 flex flex-col items-center">
                                   <div className="flex gap-2 mb-2">
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-slate-400 shadow-inner">W</div>
                                   </div>
                                   <div className="flex gap-2">
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-slate-400 shadow-inner">A</div>
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-slate-400 shadow-inner">S</div>
                                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-slate-400 shadow-inner">D</div>
                                   </div>
                                   <p className="text-slate-500 text-xs mt-3 font-bold tracking-widest">USE ARROW KEYS OR SWIPE</p>
                              </div>
                         )}

                    </div>
               </div>
          </div>
     );
};

export default GangnamGame2048;
