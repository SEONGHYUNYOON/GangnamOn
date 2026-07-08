import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCw, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

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

const tileColor = (v) => {
     const map = {
          2: 'bg-slate-600 text-white', 4: 'bg-slate-500 text-white',
          8: 'bg-amber-600 text-white', 16: 'bg-amber-500 text-white',
          32: 'bg-orange-500 text-white', 64: 'bg-orange-600 text-white',
          128: 'bg-yellow-400 text-black', 256: 'bg-yellow-300 text-black',
          512: 'bg-lime-400 text-black', 1024: 'bg-green-400 text-black',
          2048: 'bg-purple-500 text-white',
     };
     return map[v] || 'bg-violet-600 text-white';
};

const GangnamGame2048 = ({ onClose, user }) => {
     const [grid, setGrid] = useState(initGrid);
     const [score, setScore] = useState(0);
     const [gameOver, setGameOver] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('game2048', true));
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';

     const reset = useCallback(() => {
          setGrid(initGrid());
          setScore(0);
          setGameOver(false);
          setRankList(getRankTop10('game2048', true));
     }, []);

     const handleMove = useCallback((dir) => {
          if (gameOver) return;
          setGrid(prev => {
               const { grid: moved, score: gained, moved: didMove } = moveGrid(prev, dir);
               if (!didMove) return prev;
               const withSpawn = spawnTile(moved);
               setScore(s => {
                    const nextScore = s + gained;
                    if (!canMove(withSpawn)) {
                         setGameOver(true);
                         addScore('game2048', name, nextScore, true);
                         setRankList(getRankTop10('game2048', true));
                    }
                    return nextScore;
               });
               return withSpawn;
          });
     }, [gameOver, name]);

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
          touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
     };
     const onTouchEnd = (e) => {
          const dx = e.changedTouches[0].clientX - touchRef.current.x;
          const dy = e.changedTouches[0].clientY - touchRef.current.y;
          if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
          if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left');
          else handleMove(dy > 0 ? 'down' : 'up');
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-6xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <h2 className="text-xl font-black tracking-wider">2048 강남온</h2>
                    <div className="w-24" />
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="flex-1 max-w-md w-full">
                         <div className="flex gap-3 mb-4">
                              <div className="flex-1 bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                                   <div className="text-xs text-gray-400">점수</div>
                                   <div className="text-2xl font-black text-amber-400">{score}</div>
                              </div>
                              <button onClick={reset} className="bg-purple-600 hover:bg-purple-500 px-4 rounded-xl font-bold text-sm flex items-center gap-1"><RotateCw className="w-4 h-4" /> 새 게임</button>
                         </div>

                         <div
                              className="bg-gray-800 p-3 rounded-2xl border border-gray-600 select-none"
                              onTouchStart={onTouchStart}
                              onTouchEnd={onTouchEnd}
                         >
                              <div className="grid grid-cols-4 gap-2">
                                   {grid.flat().map((v, i) => (
                                        <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-lg font-black ${v ? tileColor(v) : 'bg-gray-900/80'}`}>
                                             {v || ''}
                                        </div>
                                   ))}
                              </div>
                         </div>

                         {gameOver && (
                              <div className="mt-4 bg-red-900/40 border border-red-500/40 rounded-2xl p-4 text-center">
                                   <p className="font-black text-red-300 mb-2">게임 오버!</p>
                                   <p className="text-sm text-gray-300 mb-3">최종 점수: {score}</p>
                                   <button onClick={reset} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold">다시하기</button>
                              </div>
                         )}
                         <p className="text-gray-500 text-xs mt-3 text-center">방향키 또는 스와이프로 이동</p>
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

export default GangnamGame2048;
