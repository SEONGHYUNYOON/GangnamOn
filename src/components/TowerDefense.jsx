import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy, Zap, Heart } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { soundManager } from '../lib/soundManager';

const COLS = 16;
const ROWS = 10;
const PATH_ROW = 5;
const CELL_SIZE = 44;
const GRID_W = COLS * CELL_SIZE;
const GRID_H = ROWS * CELL_SIZE;

const TOWERS = {
     basic: { id: 'basic', name: '기본포탑', cost: 50, damage: 8, range: 4, rate: 800, icon: '🔫', color: 'bg-cyan-500', shadow: 'rgba(6,182,212,0.8)' },
     fast: { id: 'fast', name: '연사포탑', cost: 75, damage: 4, range: 5, rate: 300, icon: '⚡', color: 'bg-yellow-400', shadow: 'rgba(250,204,21,0.8)' },
     heavy: { id: 'heavy', name: '저격포탑', cost: 150, damage: 35, range: 4, rate: 1400, icon: '💥', color: 'bg-red-500', shadow: 'rgba(239,68,68,0.8)' },
};

const isPath = (x, y) => y === PATH_ROW;

const TowerDefense = ({ onClose, user }) => {
     const [gameState, setGameState] = useState('idle');
     const [gold, setGold] = useState(100);
     const [lives, setLives] = useState(10);
     const [wave, setWave] = useState(0);
     const [score, setScore] = useState(0);
     const [towers, setTowers] = useState([]);
     const [enemies, setEnemies] = useState([]);
     const [selectedCell, setSelectedCell] = useState(null);
     const [pendingBuild, setPendingBuild] = useState(null);
     const [rankList, setRankList] = useState(() => getRankTop10('towerdefense', true));
     const [shake, setShake] = useState(false);
     const moveRef = useRef(null);
     const spawnRef = useRef(null);
     const lastAttackRef = useRef({});

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 200);
     };

     const startGame = useCallback(() => {
          soundManager.init();
          soundManager.playCoin();
          setGameState('playing');
          setGold(100);
          setLives(10);
          setWave(0);
          setScore(0);
          setTowers([]);
          setEnemies([]);
          setSelectedCell(null);
          setPendingBuild(null);
          setRankList(getRankTop10('towerdefense', true));
     }, []);

     const startWave = useCallback(() => {
          soundManager.playJump();
          setWave((w) => w + 1);
     }, []);

     useEffect(() => {
          if (gameState !== 'playing' || wave === 0) return;
          const w = wave;
          const count = 5 + Math.floor(w * 3.5);
          const hpBase = 20 + w * 12;
          let spawned = 0;
          const id = setInterval(() => {
               if (spawned >= count) {
                    clearInterval(id);
                    return;
               }
               spawned++;
               setEnemies((prev) => [...prev, {
                    id: `e-${Date.now()}-${spawned}`,
                    x: 0, y: PATH_ROW,
                    hp: hpBase, maxHp: hpBase,
                    progress: 0,
               }]);
          }, 800);
          return () => clearInterval(id);
     }, [gameState, wave]);

     useEffect(() => {
          if (gameState !== 'playing') return;
          moveRef.current = setInterval(() => {
               setEnemies((prev) => prev.map((e) => {
                    const np = Math.min(1, e.progress + 0.025);
                    if (np >= 1) {
                         soundManager.playExplosion();
                         triggerShake();
                         setLives((l) => l - 1);
                         return null;
                    }
                    return { ...e, progress: np };
               }).filter(Boolean));
          }, 80);
          return () => clearInterval(moveRef.current);
     }, [gameState]);

     useEffect(() => {
          if (gameState !== 'playing') return;
          const interval = setInterval(() => {
               setTowers((currentTowers) => {
                    if (currentTowers.length === 0) return currentTowers;
                    setEnemies((prev) => {
                         if (prev.length === 0) return prev;
                         const next = prev.map((e) => ({ ...e }));
                         let didHit = false;

                         currentTowers.forEach((tower) => {
                              const def = TOWERS[tower.type];
                              if (!def) return;
                              const now = Date.now();
                              if (now - (lastAttackRef.current[tower.id] || 0) < def.rate) return;
                              const tx = tower.x;
                              const ty = tower.y;
                              const inRange = next.filter((e) => {
                                   const ex = e.progress * (COLS - 1);
                                   const ey = PATH_ROW;
                                   const dist = Math.sqrt((ex - tx) ** 2 + (ey - ty) ** 2);
                                   return dist <= def.range;
                              });
                              if (inRange.length === 0) return;
                              
                              // Target furthest enemy
                              const target = inRange.reduce((a, b) => (a.progress > b.progress ? a : b));
                              const idx = next.findIndex((e) => e.id === target.id);
                              if (idx < 0) return;
                              
                              next[idx].hp -= def.damage;
                              lastAttackRef.current[tower.id] = now;
                              didHit = true;

                              if (next[idx].hp <= 0) {
                                   setGold((g) => g + 10 + wave * 2);
                                   setScore((s) => s + 15 + wave * 5);
                                   next.splice(idx, 1);
                              }
                         });
                         
                         if (didHit && Math.random() > 0.5) soundManager.playHit(); // Only play sometimes so it doesn't overlap crazy

                         return next;
                    });
                    return currentTowers;
               });
          }, 100);
          return () => clearInterval(interval);
     }, [gameState, wave]);


     useEffect(() => {
          if (lives <= 0 && gameState === 'playing') {
               soundManager.playGameOver();
               setGameState('defeat');
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               if (score > 0) addScore('towerdefense', name, score, true);
               setRankList(getRankTop10('towerdefense', true));
          }
     }, [lives, gameState, score, user]);

     const placeTower = (type) => {
          if (!pendingBuild || !TOWERS[type]) return;
          const { x, y } = pendingBuild;
          const def = TOWERS[type];
          if (gold < def.cost) {
               soundManager.playExplosion(); // error sound
               return;
          }
          soundManager.playCoin(); // success build sound
          setGold((g) => g - def.cost);
          setTowers((t) => [...t, { id: `t-${Date.now()}`, x, y, type }]);
          setPendingBuild(null);
          setSelectedCell(null);
     };

     const handleCellClick = (x, y) => {
          if (isPath(x, y)) return;
          const existing = towers.find((t) => t.x === x && t.y === y);
          if (existing) {
               setSelectedCell(null);
               setPendingBuild(null);
               return;
          }
          soundManager.playTick();
          setSelectedCell({ x, y });
          setPendingBuild({ x, y });
     };

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none" />

               <div className={`relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-700 shadow-[0_0_80px_rgba(16,185,129,0.1)] max-w-7xl w-full flex flex-col items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'animate-shake' : ''}`}>
                    
                    {/* Header */}
                    <div className="w-full flex justify-between items-center mb-6">
                         <div className="flex items-center gap-4">
                              <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors bg-white/5 backdrop-blur-md text-white border border-white/10">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-widest drop-shadow-md hidden md:block">NEON DEFENSE</h2>
                         </div>
                         <div className="flex items-center gap-3 md:gap-6 bg-black/40 px-4 md:px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
                              <span className="flex items-center gap-2 text-amber-400 font-black text-lg md:text-xl drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"><Zap className="w-5 h-5 fill-amber-400" /> {gold}</span>
                              <span className="w-px h-6 bg-white/20"></span>
                              <span className="flex items-center gap-2 text-red-500 font-black text-lg md:text-xl drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]"><Heart className="w-5 h-5 fill-red-500" /> {lives}</span>
                              <span className="w-px h-6 bg-white/20"></span>
                              <span className="text-emerald-400 font-black text-lg md:text-xl drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">WAVE {wave}</span>
                              <span className="w-px h-6 bg-white/20 hidden md:block"></span>
                              <span className="text-white font-black text-xl hidden md:block">{score.toLocaleString()}</span>
                         </div>
                    </div>

                    <div className="flex gap-8 w-full flex-col lg:flex-row justify-center">
                         
                         {/* Game Board */}
                         <div className="flex-1 flex flex-col items-center">
                              <div
                                   className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shadow-[0_0_40px_rgba(0,0,0,0.8)]"
                                   style={{ width: GRID_W, height: GRID_H }}
                              >
                                   {/* Grid Base */}
                                   {Array.from({ length: ROWS }).map((_, y) =>
                                        Array.from({ length: COLS }).map((_, x) => (
                                             <button
                                                  key={`${x}-${y}`}
                                                  onClick={() => handleCellClick(x, y)}
                                                  disabled={isPath(x, y)}
                                                  className={`absolute transition-all duration-200 border border-slate-800
                                                       ${isPath(x, y) ? 'bg-slate-800/80 cursor-not-allowed border-none' : 'bg-transparent hover:bg-slate-800 cursor-pointer'}
                                                       ${selectedCell?.x === x && selectedCell?.y === y ? 'bg-indigo-500/30 border-indigo-400/80 shadow-[inset_0_0_15px_rgba(99,102,241,0.5)] z-10 scale-105 rounded-md' : ''}`}
                                                  style={{ left: x * CELL_SIZE, top: y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                                             >
                                                  {/* Placed Tower */}
                                                  {towers.find((t) => t.x === x && t.y === y) && (() => {
                                                       const t = towers.find((t) => t.x === x && t.y === y);
                                                       const def = TOWERS[t.type];
                                                       return (
                                                            <div className={`w-full h-full flex flex-col items-center justify-center ${def.color} bg-opacity-20 rounded-md border border-white/20 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]`}>
                                                                 <span className="text-xl filter drop-shadow-md">{def.icon}</span>
                                                            </div>
                                                       );
                                                  })()}

                                                  {/* Path Decorators */}
                                                  {isPath(x, y) && (
                                                       <div className="w-full h-full flex items-center justify-center">
                                                            <div className="w-full h-2 bg-slate-700 opacity-50" />
                                                       </div>
                                                  )}
                                             </button>
                                        ))
                                   )}
                                   
                                   {/* Path Highlight Line */}
                                   <div className="absolute h-1 bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.5)] pointer-events-none" style={{ left: 0, right: 0, top: PATH_ROW * CELL_SIZE + CELL_SIZE / 2 - 2 }} />

                                   {/* Enemies */}
                                   {enemies.map((e) => {
                                        const hpPercent = e.hp / e.maxHp;
                                        return (
                                             <div
                                                  key={e.id}
                                                  className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center bg-red-950 rounded-full border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] text-[10px] font-black pointer-events-none"
                                                  style={{ left: e.progress * (COLS - 1) * CELL_SIZE + CELL_SIZE / 2, top: PATH_ROW * CELL_SIZE + CELL_SIZE / 2 }}
                                             >
                                                  <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-50" />
                                                  <div className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all" style={{ width: `${hpPercent * 100}%`, opacity: 0.5 }} />
                                                  <span className="relative z-10 text-white drop-shadow-md">{Math.ceil(e.hp)}</span>
                                             </div>
                                        );
                                   })}

                                   {/* Game States Overlays */}
                                   {gameState === 'idle' && (
                                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                             <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6 drop-shadow-lg tracking-widest">NEON DEFENSE</div>
                                             <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-md border border-emerald-500/20">
                                                  <div className="text-sm font-black text-emerald-400 mb-3 tracking-wider">🎯 RULES & TOWERS</div>
                                                  <ul className="text-gray-300 text-sm space-y-2 list-none mb-4">
                                                       <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"/>가운데 라인 주변의 빈 칸을 클릭하여 타워 설치.</li>
                                                       <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0"/>적 처치 시 골드 획득, 적이 통과하면 생명력 감소.</li>
                                                  </ul>
                                                  <div className="grid grid-cols-3 gap-2">
                                                       {Object.values(TOWERS).map(def => (
                                                            <div key={def.id} className="bg-black/50 p-2 rounded-xl border border-white/5 text-center">
                                                                 <div className="text-xl mb-1">{def.icon}</div>
                                                                 <div className="text-xs font-bold text-gray-300">{def.name}</div>
                                                                 <div className="text-[10px] text-amber-400 font-bold">{def.cost}G</div>
                                                            </div>
                                                       ))}
                                                  </div>
                                             </div>
                                             <button onClick={startGame} className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                                  <Play className="w-6 h-6 fill-white" /> START BATTLE
                                             </button>
                                        </div>
                                   )}

                                   {gameState === 'defeat' && (
                                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-red-500/50">
                                             <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">BASE DESTROYED</div>
                                             <div className="text-2xl text-white font-black mb-8 font-mono">Final Score: <span className="text-emerald-400">{score.toLocaleString()}</span></div>
                                             <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                                  <RotateCw className="w-5 h-5" /> RESTART
                                             </button>
                                        </div>
                                   )}
                              </div>

                              {/* Build Menu UI - Floating below board */}
                              <div className="h-24 w-full mt-4">
                                   {pendingBuild ? (
                                        <div className="flex gap-4 justify-center animate-in slide-in-from-bottom-4">
                                             {Object.entries(TOWERS).map(([id, def]) => {
                                                  const canAfford = gold >= def.cost;
                                                  return (
                                                       <button
                                                            key={id}
                                                            onClick={() => placeTower(id)}
                                                            disabled={!canAfford}
                                                            className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all ${canAfford ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-emerald-500 hover:-translate-y-1 shadow-lg' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}
                                                       >
                                                            <span className="text-3xl mb-1 filter drop-shadow-md">{def.icon}</span>
                                                            <span className="text-xs font-bold text-gray-300">{def.name}</span>
                                                            <span className={`text-xs font-black ${canAfford ? 'text-amber-400' : 'text-red-500'}`}>{def.cost}G</span>
                                                       </button>
                                                  );
                                             })}
                                             <button onClick={() => { setPendingBuild(null); setSelectedCell(null); }} className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-500 transition-all text-gray-400 hover:text-white">
                                                  <span className="text-sm font-bold mt-1">CANCEL</span>
                                             </button>
                                        </div>
                                   ) : gameState === 'playing' && (
                                        <div className="flex items-center justify-center h-full gap-6">
                                             {wave === 0 ? (
                                                  <button onClick={startWave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse hover:animate-none transition-all">
                                                       START WAVE 1
                                                  </button>
                                             ) : enemies.length === 0 ? (
                                                  <button onClick={startWave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-3">
                                                       <Play className="w-5 h-5 fill-white" /> NEXT WAVE ({wave + 1})
                                                  </button>
                                             ) : (
                                                  <div className="text-gray-400 font-bold tracking-widest flex items-center gap-2">
                                                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> IN BATTLE... CLICK EMPTY CELL TO BUILD
                                                  </div>
                                             )}
                                        </div>
                                   )}
                              </div>
                         </div>

                         {/* Right Panel: Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-slate-700 w-full lg:w-64 shrink-0 flex flex-col shadow-inner">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP DEFENDERS</span>
                              </div>
                              <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-slate-600">
                                             <div className="flex items-center gap-3">
                                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-md ${e.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' : e.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : e.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-slate-800 border border-slate-600 text-gray-300'}`}>{e.rank}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-emerald-400 font-mono text-sm font-bold">{e.score.toLocaleString()}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-gray-500 text-sm py-4 text-center font-bold">기록이 없습니다.</p>}
                              </div>
                         </div>

                    </div>
               </div>
          </div>
     );
};

export default TowerDefense;
