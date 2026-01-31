import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy, Zap, Heart } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const COLS = 16;
const ROWS = 10;
const PATH_ROW = 5;
const CELL_SIZE = 44;
const GRID_W = COLS * CELL_SIZE;
const GRID_H = ROWS * CELL_SIZE;

const TOWERS = {
     basic: { id: 'basic', name: '기본', cost: 50, damage: 8, range: 4, rate: 800, icon: '🔫', color: 'bg-blue-600' },
     fast: { id: 'fast', name: '빠름', cost: 75, damage: 4, range: 5, rate: 400, icon: '⚡', color: 'bg-yellow-500' },
     heavy: { id: 'heavy', name: '강력', cost: 150, damage: 25, range: 3, rate: 1200, icon: '💥', color: 'bg-red-600' },
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
     const moveRef = useRef(null);
     const attackRef = useRef(null);
     const spawnRef = useRef(null);
     const lastAttackRef = useRef({});

     const startGame = useCallback(() => {
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
          setWave((w) => w + 1);
     }, []);

     useEffect(() => {
          if (gameState !== 'playing' || wave === 0) return;
          const w = wave;
          const count = 4 + w * 3;
          const hpBase = 18 + w * 6;
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
          }, 700);
          return () => clearInterval(id);
     }, [gameState, wave]);

     useEffect(() => {
          if (gameState !== 'playing') return;
          moveRef.current = setInterval(() => {
               setEnemies((prev) => prev.map((e) => {
                    const np = Math.min(1, e.progress + 0.03);
                    if (np >= 1) {
                         setLives((l) => l - 1);
                         setGold((g) => g - 5);
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
                              const target = inRange.reduce((a, b) => (a.progress > b.progress ? a : b));
                              const idx = next.findIndex((e) => e.id === target.id);
                              if (idx < 0) return;
                              next[idx].hp -= def.damage;
                              lastAttackRef.current[tower.id] = now;
                              if (next[idx].hp <= 0) {
                                   setGold((g) => g + 10 + wave * 2);
                                   setScore((s) => s + 10 + wave * 2);
                                   next.splice(idx, 1);
                              }
                         });
                         return next;
                    });
                    return currentTowers;
               });
          }, 100);
          return () => clearInterval(interval);
     }, [gameState, wave]);


     useEffect(() => {
          if (lives <= 0 && gameState === 'playing') {
               setGameState('defeat');
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               addScore('towerdefense', name, score, true);
               setRankList(getRankTop10('towerdefense', true));
          }
     }, [lives, gameState, score, user]);

     const placeTower = (type) => {
          if (!pendingBuild || !TOWERS[type]) return;
          const { x, y } = pendingBuild;
          const def = TOWERS[type];
          if (gold < def.cost) return;
          setGold((g) => g - def.cost);
          setTowers((t) => [...t, { id: `t-${Date.now()}`, x, y, type }]);
          setPendingBuild(null);
          setSelectedCell(null);
     };

     const handleCellClick = (x, y) => {
          if (isPath(x, y)) return;
          const existing = towers.find((t) => t.x === x && t.y === y);
          if (existing) return;
          setSelectedCell({ x, y });
          setPendingBuild({ x, y });
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col bg-gradient-to-b from-slate-900 to-black text-white max-w-7xl mx-auto w-full">
               <div className="flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                         <ArrowLeft className="w-6 h-6 text-gray-300" />
                    </button>
                    <h2 className="text-xl font-black tracking-wider">타워 디펜스</h2>
                    <div className="flex items-center gap-4">
                         <span className="bg-amber-600/80 px-3 py-1 rounded-lg font-black text-sm flex items-center gap-1"><Zap className="w-4 h-4" /> {gold}</span>
                         <span className="bg-red-600/80 px-3 py-1 rounded-lg font-black text-sm flex items-center gap-1"><Heart className="w-4 h-4" /> {lives}</span>
                         <span className="bg-purple-600 px-3 py-1 rounded-lg font-black text-sm">웨이브 {wave}</span>
                         <span className="bg-slate-600 px-3 py-1 rounded-lg font-black text-sm">{score}</span>
                    </div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row">
                    <div className="flex-1 flex flex-col">
                         <div
                              className="relative rounded-2xl overflow-hidden border-2 border-slate-600 bg-slate-800/50"
                              style={{ width: GRID_W, height: GRID_H }}
                         >
                              {Array.from({ length: ROWS }).map((_, y) =>
                                   Array.from({ length: COLS }).map((_, x) => (
                                        <button
                                             key={`${x}-${y}`}
                                             onClick={() => handleCellClick(x, y)}
                                             disabled={isPath(x, y)}
                                             className={`absolute border border-slate-600/50 transition-colors
                                                  ${isPath(x, y) ? 'bg-slate-700/80 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 cursor-pointer'}
                                                  ${selectedCell?.x === x && selectedCell?.y === y ? 'ring-2 ring-violet-400' : ''}`}
                                             style={{ left: x * CELL_SIZE, top: y * CELL_SIZE, width: CELL_SIZE - 1, height: CELL_SIZE - 1 }}
                                        >
                                             {towers.find((t) => t.x === x && t.y === y) && (
                                                  <span className="text-2xl">{TOWERS[towers.find((t) => t.x === x && t.y === y).type]?.icon}</span>
                                             )}
                                             {isPath(x, y) && (x === 0 || x === COLS - 1) && (
                                                  <span className="text-xs text-slate-400">{x === 0 ? '▶' : '◀'}</span>
                                             )}
                                        </button>
                                   ))
                              )}
                              {enemies.map((e) => (
                                   <div
                                        key={e.id}
                                        className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center bg-red-600 rounded-full border-2 border-red-400 text-xs font-bold"
                                        style={{ left: e.progress * (COLS - 1) * CELL_SIZE + CELL_SIZE / 2, top: PATH_ROW * CELL_SIZE + CELL_SIZE / 2 }}
                                   >
                                        {e.hp}
                                   </div>
                              ))}
                         </div>

                         {pendingBuild && (
                              <div className="mt-4 flex gap-3 flex-wrap">
                                   {Object.entries(TOWERS).map(([id, def]) => (
                                        <button
                                             key={id}
                                             onClick={() => placeTower(id)}
                                             disabled={gold < def.cost}
                                             className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors
                                                  ${gold >= def.cost ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                        >
                                             <span className="text-xl">{def.icon}</span>
                                             <span>{def.name}</span>
                                             <span className="text-amber-400">{def.cost}G</span>
                                        </button>
                                   ))}
                                   <button onClick={() => { setPendingBuild(null); setSelectedCell(null); }} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
                                        취소
                                   </button>
                              </div>
                         )}

                         {gameState === 'idle' && (
                              <div className="mt-8 flex flex-col items-center py-8">
                                   <div className="text-2xl font-black mb-4">타워 디펜스</div>
                                   <div className="bg-slate-700/60 rounded-xl p-5 mb-6 text-left max-w-md">
                                        <div className="text-sm font-bold text-violet-300 mb-2">🎯 게임 방법</div>
                                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                                             <li>가운데 줄(경로)이 아닌 <b>빈 칸</b>을 클릭하세요</li>
                                             <li>타워를 골라 설치하면 적을 자동 공격합니다</li>
                                             <li>적이 오른쪽 끝까지 도달하면 <b>생명 -1</b></li>
                                             <li>생명이 0이 되면 게임 오버!</li>
                                        </ul>
                                        <div className="text-sm font-bold text-amber-300 mt-3 mb-1">🏰 타워 종류</div>
                                        <ul className="text-slate-300 text-xs space-y-0.5">
                                             <li>🔫 기본 (50G) – 균형 잡힌 공격</li>
                                             <li>⚡ 빠름 (75G) – 빠른 연사, 넓은 사거리</li>
                                             <li>💥 강력 (150G) – 느리지만 강한 한방</li>
                                        </ul>
                                   </div>
                                   <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full flex items-center gap-2">
                                        <Play className="w-5 h-5" /> 시작하기
                                   </button>
                              </div>
                         )}

                         {gameState === 'playing' && wave === 0 && (
                              <div className="mt-6 flex justify-center">
                                   <button onClick={startWave} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full">
                                        웨이브 1 시작
                                   </button>
                              </div>
                         )}

                         {gameState === 'playing' && wave > 0 && enemies.length === 0 && (
                              <div className="mt-6 flex justify-center">
                                   <button onClick={startWave} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full">
                                        다음 웨이브 ({wave + 1})
                                   </button>
                              </div>
                         )}

                         {gameState === 'defeat' && (
                              <div className="mt-8 flex flex-col items-center py-8">
                                   <div className="text-3xl font-black text-red-400 mb-2">패배</div>
                                   <div className="text-xl text-slate-300 mb-6">Score: {score}</div>
                                   <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2">
                                        <RotateCw className="w-5 h-5" /> 다시 하기
                                   </button>
                              </div>
                         )}
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600 w-full lg:w-56 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs font-bold text-gray-400 tracking-wider">TOP 10</span>
                         </div>
                         <div className="space-y-1.5 max-h-80 overflow-y-auto">
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

export default TowerDefense;
