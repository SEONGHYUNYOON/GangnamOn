import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Play, RotateCw, Trophy, Zap, Heart } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { awardGameReward, getRewardRemaining } from '../lib/gameReward';
import { playSound } from '../lib/gameSounds';

/* ============================================================
   강남 디펜스 (Gangnam Defense) — DOM-based tower defense
   Tower types + upgrades, enemy variety, boss waves, projectiles.
   ============================================================ */

const GAMEKEY = 'towerdefense';
const BEST_KEY = 'gangnam_td_best';

const COLS = 12;
const ROWS = 8;
const CELL = 48;
const GRID_W = COLS * CELL;
const GRID_H = ROWS * CELL;

const LOOP_MS = 33;          // ~30fps single game loop
const WAVES_TO_WIN = 15;
const START_GOLD = 120;
const START_LIVES = 20;
const MAX_PROJ = 30;

/* ---- Winding serpentine path (cell coordinates, off-board entry/exit) ---- */
const WAYPOINTS = [
     { x: -1, y: 1 },
     { x: 10, y: 1 },
     { x: 10, y: 3 },
     { x: 1, y: 3 },
     { x: 1, y: 5 },
     { x: 12, y: 5 },
];

const PATH = (() => {
     const segs = [];
     let total = 0;
     for (let i = 0; i < WAYPOINTS.length - 1; i += 1) {
          const a = WAYPOINTS[i];
          const b = WAYPOINTS[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy);
          segs.push({ ax: a.x, ay: a.y, dx, dy, len, start: total });
          total += len;
     }
     return { segs, total };
})();

// Distance (cell units) -> {cx, cy} on the polyline
const posAt = (d) => {
     const { segs, total } = PATH;
     const clamped = Math.max(0, Math.min(total, d));
     for (let i = 0; i < segs.length; i += 1) {
          const s = segs[i];
          if (clamped <= s.start + s.len || i === segs.length - 1) {
               const t = s.len === 0 ? 0 : (clamped - s.start) / s.len;
               return { cx: s.ax + s.dx * t, cy: s.ay + s.dy * t };
          }
     }
     const last = segs[segs.length - 1];
     return { cx: last.ax + last.dx, cy: last.ay + last.dy };
};

// Cells the path occupies (block building there)
const PATH_CELLS = (() => {
     const set = new Set();
     for (let d = 0; d <= PATH.total; d += 0.1) {
          const { cx, cy } = posAt(d);
          const gx = Math.round(cx);
          const gy = Math.round(cy);
          if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) set.add(`${gx},${gy}`);
     }
     return set;
})();

const isPath = (x, y) => PATH_CELLS.has(`${x},${y}`);

/* ---- Tower definitions ---- */
const TOWER_TYPES = {
     cannon: {
          id: 'cannon', name: '캐넌', icon: '🏢', cost: 60,
          hex: '#06b6d4', shadow: 'rgba(6,182,212,0.85)',
          damage: 12, range: 2.6, rate: 650, proj: 'bolt',
          desc: '균형형 단일 타격',
     },
     slow: {
          id: 'slow', name: '슬로우', icon: '❄️', cost: 70,
          hex: '#38bdf8', shadow: 'rgba(56,189,248,0.85)',
          damage: 3, range: 2.4, rate: 900, proj: 'chill',
          slow: { factor: 0.45, dur: 1200 },
          desc: '적을 둔화시킴',
     },
     splash: {
          id: 'splash', name: '스플래시', icon: '💥', cost: 100,
          hex: '#fb7185', shadow: 'rgba(251,113,133,0.85)',
          damage: 10, range: 2.3, rate: 1100, proj: 'burst',
          splash: 1.3,
          desc: '범위 광역 피해',
     },
};

/* ---- Enemy archetypes ---- */
const ENEMY_TYPES = {
     normal: { hpMul: 1, speed: 1.5, gold: 8, leak: 1, size: 30, main: '#f87171', dark: '#7f1d1d', ring: '#ef4444', label: '' },
     fast: { hpMul: 0.5, speed: 3.0, gold: 7, leak: 1, size: 22, main: '#4ade80', dark: '#14532d', ring: '#22c55e', label: '' },
     tank: { hpMul: 3.0, speed: 0.95, gold: 16, leak: 2, size: 36, main: '#c084fc', dark: '#4c1d95', ring: '#a855f7', label: '' },
     boss: { hpMul: 16, speed: 0.75, gold: 130, leak: 6, size: 46, main: '#f472b6', dark: '#831843', ring: '#ec4899', label: '👑' },
};

/* ---- Effective (level-scaled) tower stats ---- */
const effStats = (tower) => {
     const def = TOWER_TYPES[tower.type];
     const L = tower.level;
     return {
          damage: def.damage * Math.pow(1.55, L - 1),
          range: def.range + 0.35 * (L - 1),
          rate: def.rate * Math.pow(0.86, L - 1),
          slowFactor: def.slow ? def.slow.factor : 1,
          slowDur: def.slow ? (def.slow.dur / 1000) * (1 + 0.15 * (L - 1)) : 0,
          splashR: def.splash ? def.splash + 0.15 * (L - 1) : 0,
     };
};

const upgradeCost = (tower) => Math.round(TOWER_TYPES[tower.type].cost * tower.level * 0.9);
const sellValue = (tower) => Math.round(tower.invested * 0.6);

/* ---- Wave composition ---- */
const buildWaveQueue = (w) => {
     const hpBase = 16 + w * 9;
     const sScale = 1 + w * 0.02;
     const q = [];
     const mk = (type, gap = 0.6) => {
          const t = ENEMY_TYPES[type];
          return { type, hp: Math.round(hpBase * t.hpMul), speed: t.speed * sScale, gap };
     };
     if (w % 5 === 0) {
          const grunts = 4 + Math.floor(w / 2);
          for (let i = 0; i < grunts; i += 1) q.push(mk(i % 3 === 0 ? 'tank' : 'normal'));
          for (let i = 0; i < 2 + Math.floor(w / 4); i += 1) q.push(mk('fast'));
          q.push(mk('boss', 0.9));
     } else {
          const count = Math.min(30, 6 + w * 2);
          for (let i = 0; i < count; i += 1) {
               let type = 'normal';
               if (w >= 3 && i % 5 === 4) type = 'tank';
               else if (w >= 2 && i % 3 === 2) type = 'fast';
               q.push(mk(type));
          }
     }
     return q;
};

const readBest = () => {
     try { return Number(window.localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
};

const TowerDefense = ({ onClose, user, beanCount = 0, updateBeanCount }) => {
     /* ---------- UI state (mirrored from refs each tick) ---------- */
     const [gameState, setGameState] = useState('idle'); // idle | playing | victory | defeat
     const [gold, setGold] = useState(START_GOLD);
     const [lives, setLives] = useState(START_LIVES);
     const [wave, setWave] = useState(0);
     const [score, setScore] = useState(0);
     const [enemies, setEnemies] = useState([]);
     const [projectiles, setProjectiles] = useState([]);
     const [towers, setTowers] = useState([]);
     const [selectedCell, setSelectedCell] = useState(null);       // build menu target
     const [selectedTowerId, setSelectedTowerId] = useState(null); // upgrade panel target
     const [waveActive, setWaveActive] = useState(false);
     const [speed, setSpeed] = useState(1);
     const [rankList, setRankList] = useState(() => getRankTop10(GAMEKEY, true));
     const [rewardFloat, setRewardFloat] = useState(null);
     const [shake, setShake] = useState(false);
     const [rewardLeft, setRewardLeft] = useState(() => getRewardRemaining(GAMEKEY));

     /* ---------- Simulation refs (source of truth) ---------- */
     const gsRef = useRef('idle');
     const goldRef = useRef(START_GOLD);
     const livesRef = useRef(START_LIVES);
     const waveRef = useRef(0);
     const scoreRef = useRef(0);
     const enemiesRef = useRef([]);
     const towersRef = useRef([]);
     const projRef = useRef([]);
     const queueRef = useRef([]);
     const spawnCdRef = useRef(0);
     const waveActiveRef = useRef(false);
     const speedRef = useRef(1);
     const hitSndRef = useRef(0);
     const bestRef = useRef(readBest());
     const idRef = useRef(1);

     const loopRef = useRef(null);
     const tickRef = useRef(() => {});
     const rewardTimerRef = useRef(null);
     const shakeTimerRef = useRef(null);
     const propsRef = useRef({ user, updateBeanCount });

     const nextId = (p) => `${p}${idRef.current++}`;

     useEffect(() => { propsRef.current = { user, updateBeanCount }; }, [user, updateBeanCount]);

     const triggerShake = () => {
          setShake(true);
          clearTimeout(shakeTimerRef.current);
          shakeTimerRef.current = setTimeout(() => setShake(false), 200);
     };

     const award = (amount) => {
          const grant = awardGameReward(GAMEKEY, amount, propsRef.current.updateBeanCount);
          setRewardLeft(getRewardRemaining(GAMEKEY));
          if (grant > 0) {
               setRewardFloat({ id: idRef.current++, amount: grant });
               clearTimeout(rewardTimerRef.current);
               rewardTimerRef.current = setTimeout(() => setRewardFloat(null), 1500);
          }
          return grant;
     };

     const commit = () => {
          setGold(goldRef.current);
          setLives(livesRef.current);
          setWave(waveRef.current);
          setScore(scoreRef.current);
          setWaveActive(waveActiveRef.current);
          setEnemies(enemiesRef.current.slice());
          setProjectiles(projRef.current.slice());
     };

     const finish = (result) => {
          if (gsRef.current !== 'playing') return;
          gsRef.current = result;
          if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
          const sc = scoreRef.current;
          if (result === 'victory') { playSound('win'); award(15); }
          else playSound('gameover');
          const name = propsRef.current.user?.user_metadata?.username
               || propsRef.current.user?.email?.split('@')[0] || '게스트';
          if (sc > 0) addScore(GAMEKEY, name, sc, true);
          if (sc > bestRef.current) {
               bestRef.current = sc;
               try { window.localStorage.setItem(BEST_KEY, String(sc)); } catch { /* ignore */ }
               if (sc > 0) award(20);
          }
          setRankList(getRankTop10(GAMEKEY, true));
          commit();
          setGameState(result);
     };

     /* ---------- Enemy factory ---------- */
     const makeEnemy = (spec) => {
          const t = ENEMY_TYPES[spec.type];
          const p = posAt(0);
          return {
               id: nextId('e'),
               type: spec.type,
               hp: spec.hp,
               maxHp: spec.hp,
               d: 0,
               speed: spec.speed,
               gold: t.gold,
               leak: t.leak,
               size: t.size,
               main: t.main,
               dark: t.dark,
               ring: t.ring,
               label: t.label,
               slowT: 0,
               slowFactor: 1,
               hitFlash: 0,
               cx: p.cx,
               cy: p.cy,
               px: p.cx * CELL + CELL / 2,
               py: p.cy * CELL + CELL / 2,
          };
     };

     /* ---------- The single game-loop tick (invoked via tickRef) ---------- */
     const tick = () => {
          if (gsRef.current !== 'playing') return;
          const dt = (LOOP_MS / 1000) * speedRef.current;

          // --- spawn ---
          if (waveActiveRef.current && queueRef.current.length) {
               spawnCdRef.current -= dt;
               if (spawnCdRef.current <= 0) {
                    const spec = queueRef.current.shift();
                    if (enemiesRef.current.length < 60) enemiesRef.current.push(makeEnemy(spec));
                    spawnCdRef.current = spec.gap || 0.6;
               }
          }

          // --- move enemies ---
          const survivors = [];
          let leaked = false;
          for (const e of enemiesRef.current) {
               const factor = e.slowT > 0 ? e.slowFactor : 1;
               e.d += e.speed * factor * dt;
               if (e.slowT > 0) e.slowT -= dt;
               if (e.hitFlash > 0) e.hitFlash -= dt;
               if (e.d >= PATH.total) {
                    livesRef.current -= e.leak;
                    leaked = true;
                    continue;
               }
               const p = posAt(e.d);
               e.cx = p.cx; e.cy = p.cy;
               e.px = p.cx * CELL + CELL / 2;
               e.py = p.cy * CELL + CELL / 2;
               survivors.push(e);
          }
          enemiesRef.current = survivors;
          if (leaked) { playSound('wrong'); triggerShake(); }
          if (livesRef.current <= 0) { livesRef.current = 0; finish('defeat'); return; }

          // --- towers fire ---
          const list = enemiesRef.current;
          const newProj = [];
          let fired = false;
          for (const tower of towersRef.current) {
               if (tower.cd > 0) { tower.cd = Math.max(0, tower.cd - dt); continue; }
               if (list.length === 0) continue;
               const s = effStats(tower);
               const tx = tower.x + 0.5;
               const ty = tower.y + 0.5;
               let target = null;
               for (const e of list) {
                    if (e.hp <= 0) continue;
                    const dist = Math.hypot((e.cx + 0.5) - tx, (e.cy + 0.5) - ty);
                    if (dist <= s.range && (!target || e.d > target.d)) target = e;
               }
               if (!target) continue;
               tower.cd = s.rate / 1000;
               fired = true;
               const def = TOWER_TYPES[tower.type];

               if (tower.type === 'splash') {
                    for (const e of list) {
                         if (e.hp <= 0) continue;
                         if (Math.hypot(e.cx - target.cx, e.cy - target.cy) <= s.splashR) {
                              e.hp -= s.damage;
                              e.hitFlash = 0.13;
                         }
                    }
               } else {
                    target.hp -= s.damage;
                    target.hitFlash = 0.13;
                    if (tower.type === 'slow') { target.slowT = s.slowDur; target.slowFactor = s.slowFactor; }
               }

               newProj.push({
                    id: nextId('p'),
                    kind: def.proj,
                    x1: tx * CELL, y1: ty * CELL,
                    x2: target.px, y2: target.py,
                    age: 0,
                    ttl: def.proj === 'burst' ? 0.32 : def.proj === 'chill' ? 0.2 : 0.14,
                    color: def.shadow,
                    r: s.splashR * CELL,
               });
          }

          // --- resolve kills ---
          let killed = false;
          const alive = [];
          for (const e of list) {
               if (e.hp <= 0) { goldRef.current += e.gold; killed = true; }
               else alive.push(e);
          }
          enemiesRef.current = alive;

          // --- projectiles: age, prune, cap ---
          const keptProj = [];
          for (const p of projRef.current) {
               p.age += dt;
               if (p.age < p.ttl) keptProj.push(p);
          }
          projRef.current = keptProj.concat(newProj).slice(-MAX_PROJ);

          // --- sounds (throttled) ---
          hitSndRef.current = Math.max(0, hitSndRef.current - dt);
          if (fired && hitSndRef.current <= 0) { playSound('hit'); hitSndRef.current = 0.09; }
          if (killed) playSound('pop');

          // --- wave clear ---
          if (waveActiveRef.current && queueRef.current.length === 0 && enemiesRef.current.length === 0) {
               waveActiveRef.current = false;
               const w = waveRef.current;
               scoreRef.current = w;
               goldRef.current += 20 + w * 6;
               playSound('powerup');
               if (w % 5 === 0) award(10);
               if (w >= WAVES_TO_WIN) { finish('victory'); return; }
          }

          commit();
     };

     useEffect(() => { tickRef.current = tick; });

     // Start / stop the single loop with game state
     useEffect(() => {
          if (gameState === 'playing') {
               loopRef.current = setInterval(() => tickRef.current(), LOOP_MS);
               return () => { if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; } };
          }
          return undefined;
     }, [gameState]);

     // Unmount cleanup
     useEffect(() => () => {
          if (loopRef.current) clearInterval(loopRef.current);
          clearTimeout(rewardTimerRef.current);
          clearTimeout(shakeTimerRef.current);
     }, []);

     /* ---------- User actions ---------- */
     const startGame = () => {
          playSound('click');
          goldRef.current = START_GOLD;
          livesRef.current = START_LIVES;
          waveRef.current = 0;
          scoreRef.current = 0;
          enemiesRef.current = [];
          towersRef.current = [];
          projRef.current = [];
          queueRef.current = [];
          spawnCdRef.current = 0;
          waveActiveRef.current = false;
          speedRef.current = 1;
          hitSndRef.current = 0;
          bestRef.current = readBest();
          gsRef.current = 'playing';
          setSelectedCell(null);
          setSelectedTowerId(null);
          setSpeed(1);
          setRewardFloat(null);
          setRankList(getRankTop10(GAMEKEY, true));
          commit();
          setGameState('playing');
     };

     const startWave = () => {
          if (gsRef.current !== 'playing' || waveActiveRef.current) return;
          playSound('click');
          const w = waveRef.current + 1;
          waveRef.current = w;
          queueRef.current = buildWaveQueue(w);
          spawnCdRef.current = 0;
          waveActiveRef.current = true;
          setSelectedCell(null);
          setSelectedTowerId(null);
          commit();
     };

     const toggleSpeed = () => {
          playSound('click');
          speedRef.current = speedRef.current === 1 ? 2 : 1;
          setSpeed(speedRef.current);
     };

     const handleCellClick = (x, y) => {
          if (gsRef.current !== 'playing' || isPath(x, y)) return;
          const existing = towersRef.current.find((t) => t.x === x && t.y === y);
          if (existing) {
               playSound('tick');
               setSelectedTowerId(existing.id);
               setSelectedCell(null);
               return;
          }
          playSound('tick');
          setSelectedCell({ x, y });
          setSelectedTowerId(null);
     };

     const buildTower = (type) => {
          if (!selectedCell) return;
          const def = TOWER_TYPES[type];
          if (towersRef.current.some((t) => t.x === selectedCell.x && t.y === selectedCell.y)) return;
          if (goldRef.current < def.cost) { playSound('wrong'); return; }
          playSound('coin');
          goldRef.current -= def.cost;
          const t = { id: nextId('t'), x: selectedCell.x, y: selectedCell.y, type, level: 1, invested: def.cost, cd: 0 };
          towersRef.current = [...towersRef.current, t];
          setTowers(towersRef.current);
          setGold(goldRef.current);
          setSelectedCell(null);
          setSelectedTowerId(t.id);
     };

     const upgradeTower = () => {
          const t = towersRef.current.find((x) => x.id === selectedTowerId);
          if (!t) return;
          if (t.level >= 3) { playSound('wrong'); return; }
          const cost = upgradeCost(t);
          if (goldRef.current < cost) { playSound('wrong'); return; }
          playSound('coin');
          goldRef.current -= cost;
          t.level += 1;
          t.invested += cost;
          towersRef.current = [...towersRef.current];
          setTowers(towersRef.current);
          setGold(goldRef.current);
     };

     const sellTower = () => {
          const t = towersRef.current.find((x) => x.id === selectedTowerId);
          if (!t) return;
          playSound('coin');
          goldRef.current += sellValue(t);
          towersRef.current = towersRef.current.filter((x) => x.id !== t.id);
          setTowers(towersRef.current);
          setGold(goldRef.current);
          setSelectedTowerId(null);
     };

     const closeGame = () => { playSound('click'); onClose && onClose(); };

     /* ---------- Derived render data ---------- */
     const selectedTower = towers.find((t) => t.id === selectedTowerId) || null;
     const selStats = selectedTower ? effStats(selectedTower) : null;
     const nextWaveIsBoss = (wave + 1) % 5 === 0;

     // Static grid (only rebuilds when the selected cell changes)
     const gridCells = useMemo(() => (
          Array.from({ length: ROWS }).map((_, y) =>
               Array.from({ length: COLS }).map((_, x) => {
                    const path = isPath(x, y);
                    const sel = selectedCell && selectedCell.x === x && selectedCell.y === y;
                    return (
                         <button
                              key={`${x}-${y}`}
                              onClick={() => handleCellClick(x, y)}
                              disabled={path}
                              className={`absolute border border-slate-800/70 transition-all duration-150
                                   ${path ? 'cursor-not-allowed' : 'hover:bg-emerald-400/10 cursor-pointer'}
                                   ${sel ? 'bg-indigo-500/25 border-indigo-400/80 shadow-[inset_0_0_14px_rgba(99,102,241,0.55)] z-10 rounded-md' : ''}`}
                              style={{ left: x * CELL, top: y * CELL, width: CELL, height: CELL }}
                         >
                              {path && (
                                   <div className="w-full h-full bg-gradient-to-b from-black/50 via-slate-700/30 to-black/60 shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]" />
                              )}
                         </button>
                    );
               })
          )
     ), [selectedCell]); // eslint-disable-line react-hooks/exhaustive-deps

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               <style>{`
                    @keyframes tdBeamFade { from { opacity: .95; } to { opacity: 0; } }
                    @keyframes tdBurst { 0% { transform: translate(-50%,-50%) scale(.15); opacity:.9; } 100% { transform: translate(-50%,-50%) scale(1); opacity:0; } }
                    @keyframes tdFloatUp { 0% { transform: translateY(6px); opacity:0; } 20% { transform: translateY(0); opacity:1; } 80% { opacity:1; } 100% { transform: translateY(-26px); opacity:0; } }
                    @keyframes tdSpin { to { transform: rotate(360deg); } }
                    .td-float { animation: tdFloatUp 1.5s ease-out forwards; }
               `}</style>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none" />

               <div className={`relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-4 md:p-7 border border-slate-700 shadow-[0_0_80px_rgba(16,185,129,0.1)] max-w-[80rem] w-full flex flex-col items-center animate-in zoom-in-95 duration-500 ${shake ? 'animate-shake' : ''}`}>

                    {/* Header / HUD */}
                    <div className="w-full flex justify-between items-center mb-5 gap-2">
                         <div className="flex items-center gap-3">
                              <button onClick={closeGame} className="p-3 hover:bg-white/10 rounded-full transition-colors bg-white/5 backdrop-blur-md text-white border border-white/10">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                              <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-widest drop-shadow-md hidden sm:block">강남 디펜스</h2>
                         </div>
                         <div className="relative flex items-center gap-3 md:gap-5 bg-black/40 px-4 md:px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
                              <span className="flex items-center gap-1.5 text-amber-400 font-black text-base md:text-xl drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"><Zap className="w-5 h-5 fill-amber-400" /> {gold}</span>
                              <span className="w-px h-6 bg-white/20" />
                              <span className="flex items-center gap-1.5 text-red-500 font-black text-base md:text-xl drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]"><Heart className="w-5 h-5 fill-red-500" /> {lives}</span>
                              <span className="w-px h-6 bg-white/20" />
                              <span className="text-emerald-400 font-black text-base md:text-xl drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">W{wave}/{WAVES_TO_WIN}</span>
                              <span className="w-px h-6 bg-white/20 hidden md:block" />
                              <span className="text-white/60 font-bold text-xs hidden md:flex items-center gap-1"><Zap className="w-3 h-3" />{beanCount}</span>
                              {rewardFloat && (
                                   <span key={rewardFloat.id} className="td-float absolute -top-2 right-3 text-emerald-300 font-black text-lg drop-shadow-[0_0_10px_rgba(52,211,153,0.9)] pointer-events-none">
                                        +{rewardFloat.amount} ON
                                   </span>
                              )}
                         </div>
                    </div>

                    <div className="flex gap-6 w-full flex-col lg:flex-row justify-center">

                         {/* ---------- Game Board ---------- */}
                         <div className="flex-1 flex flex-col items-center [perspective:900px]">
                              <div
                                   className="relative rounded-2xl overflow-hidden border-2 border-slate-700 shadow-[0_30px_60px_rgba(0,0,0,0.75),0_0_40px_rgba(16,185,129,0.15)] [transform:rotateX(6deg)] origin-bottom mx-auto"
                                   style={{ width: GRID_W, height: GRID_H, maxWidth: '100%', background: 'radial-gradient(ellipse at 50% 15%, #0f1a2e 0%, #060a14 55%, #010204 100%)' }}
                              >
                                   {gridCells}

                                   {/* Entry portal & base marker */}
                                   <div className="absolute pointer-events-none rounded-full bg-emerald-500/25 blur-md" style={{ left: -6, top: 1 * CELL + CELL / 2 - 14, width: 28, height: 28 }} />
                                   <div className="absolute pointer-events-none flex items-center justify-center text-lg" style={{ left: GRID_W - 30, top: 5 * CELL + CELL / 2 - 16, width: 32, height: 32 }}>
                                        <span className="drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">🏰</span>
                                   </div>

                                   {/* Range preview for selected tower */}
                                   {selectedTower && selStats && (
                                        <div
                                             className="absolute pointer-events-none rounded-full border-2 border-emerald-400/50 bg-emerald-400/5 z-10"
                                             style={{
                                                  left: (selectedTower.x + 0.5) * CELL - selStats.range * CELL,
                                                  top: (selectedTower.y + 0.5) * CELL - selStats.range * CELL,
                                                  width: selStats.range * CELL * 2,
                                                  height: selStats.range * CELL * 2,
                                             }}
                                        />
                                   )}

                                   {/* Towers (3D pedestals) */}
                                   {towers.map((t) => {
                                        const def = TOWER_TYPES[t.type];
                                        const isSel = t.id === selectedTowerId;
                                        return (
                                             <button
                                                  key={t.id}
                                                  onClick={() => handleCellClick(t.x, t.y)}
                                                  className={`absolute flex flex-col items-center justify-center rounded-md border z-20 ${isSel ? 'border-emerald-300 ring-2 ring-emerald-400/70' : 'border-white/25'}`}
                                                  style={{
                                                       left: t.x * CELL + 3, top: t.y * CELL + 3,
                                                       width: CELL - 6, height: CELL - 6,
                                                       background: `radial-gradient(circle at 32% 25%, ${def.hex}77, ${def.hex}22 45%, rgba(0,0,0,0.7))`,
                                                       boxShadow: `0 6px 10px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -4px 6px rgba(0,0,0,0.5), 0 0 12px ${def.shadow}`,
                                                  }}
                                             >
                                                  <span className="text-lg leading-none" style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.8)) drop-shadow(0 0 5px ${def.shadow})` }}>{def.icon}</span>
                                                  <span className="absolute -bottom-0.5 flex gap-0.5">
                                                       {Array.from({ length: t.level }).map((_, i) => (
                                                            <span key={i} className="w-1 h-1 rounded-full bg-amber-300 shadow-[0_0_3px_rgba(251,191,36,0.9)]" />
                                                       ))}
                                                  </span>
                                             </button>
                                        );
                                   })}

                                   {/* Projectiles */}
                                   {projectiles.map((p) => {
                                        if (p.kind === 'burst') {
                                             return (
                                                  <div
                                                       key={p.id}
                                                       className="absolute pointer-events-none z-30 rounded-full"
                                                       style={{
                                                            left: p.x2, top: p.y2,
                                                            width: p.r * 2, height: p.r * 2,
                                                            background: `radial-gradient(circle, ${p.color}, rgba(251,113,133,0.15) 60%, transparent 70%)`,
                                                            animation: 'tdBurst 0.32s ease-out forwards',
                                                       }}
                                                  />
                                             );
                                        }
                                        const dx = p.x2 - p.x1;
                                        const dy = p.y2 - p.y1;
                                        const len = Math.hypot(dx, dy);
                                        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                                        const thick = p.kind === 'chill' ? 4 : 2.5;
                                        return (
                                             <div
                                                  key={p.id}
                                                  className="absolute pointer-events-none z-30 rounded-full"
                                                  style={{
                                                       left: p.x1, top: p.y1,
                                                       width: len, height: thick,
                                                       transformOrigin: '0 50%',
                                                       transform: `rotate(${angle}deg)`,
                                                       background: `linear-gradient(90deg, ${p.color}, rgba(255,255,255,0.95))`,
                                                       boxShadow: `0 0 7px ${p.color}`,
                                                       animation: `tdBeamFade ${p.ttl}s linear forwards`,
                                                  }}
                                             />
                                        );
                                   })}

                                   {/* Enemies (glossy orbs + HP bars) */}
                                   {enemies.map((e) => {
                                        const pct = Math.max(0, e.hp / e.maxHp);
                                        const flashing = e.hitFlash > 0;
                                        const slowed = e.slowT > 0;
                                        return (
                                             <div key={e.id} className="absolute pointer-events-none z-30" style={{ left: e.px, top: e.py, transform: 'translate(-50%,-50%)' }}>
                                                  {/* HP bar */}
                                                  <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/70 overflow-hidden border border-black/50" style={{ top: -e.size / 2 - 8, width: e.size, height: 4 }}>
                                                       <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${pct * 100}%`, background: pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#fbbf24' : '#ef4444' }} />
                                                  </div>
                                                  <div
                                                       className="flex items-center justify-center rounded-full font-black text-white"
                                                       style={{
                                                            width: e.size, height: e.size,
                                                            fontSize: e.size > 34 ? 16 : 9,
                                                            border: `2px solid ${slowed ? '#7dd3fc' : e.ring}`,
                                                            background: `radial-gradient(circle at 32% 28%, ${e.main}, ${e.main} 15%, ${e.dark} 70%, #000 100%)`,
                                                            boxShadow: `0 5px 8px rgba(0,0,0,0.55), 0 0 14px ${e.ring}bb, inset 0 -3px 5px rgba(0,0,0,0.5)`,
                                                            filter: flashing ? 'brightness(2.3) saturate(0.5)' : slowed ? 'saturate(0.6) brightness(0.85)' : 'none',
                                                       }}
                                                  >
                                                       {e.label || Math.ceil(e.hp)}
                                                       {slowed && <span className="absolute -top-1 -right-1 text-[9px]">❄️</span>}
                                                  </div>
                                             </div>
                                        );
                                   })}

                                   {/* Overlays */}
                                   {gameState === 'idle' && (
                                        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
                                             <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 drop-shadow-lg tracking-widest">강남 디펜스</div>
                                             <div className="bg-gray-800/80 rounded-2xl p-4 mb-6 text-left max-w-md border border-emerald-500/20">
                                                  <div className="text-xs font-black text-emerald-400 mb-2 tracking-wider">🎯 15 웨이브를 버텨라</div>
                                                  <ul className="text-gray-300 text-xs space-y-1.5 mb-3">
                                                       <li>· 빈 칸을 눌러 타워를 건설하고, 타워를 눌러 업그레이드/판매</li>
                                                       <li>· 적 처치 시 골드 획득, 성으로 통과되면 생명력 감소</li>
                                                       <li>· 5·10·15 웨이브엔 보스 👑 등장!</li>
                                                  </ul>
                                                  <div className="grid grid-cols-3 gap-2">
                                                       {Object.values(TOWER_TYPES).map((def) => (
                                                            <div key={def.id} className="bg-black/50 p-2 rounded-xl border border-white/5 text-center">
                                                                 <div className="text-xl mb-0.5">{def.icon}</div>
                                                                 <div className="text-[11px] font-bold text-gray-300">{def.name}</div>
                                                                 <div className="text-[10px] text-gray-500">{def.desc}</div>
                                                                 <div className="text-[10px] text-amber-400 font-bold">{def.cost}G</div>
                                                            </div>
                                                       ))}
                                                  </div>
                                             </div>
                                             <button onClick={startGame} className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black py-3.5 px-10 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                                  <Play className="w-6 h-6 fill-white" /> 방어 시작
                                             </button>
                                        </div>
                                   )}

                                   {gameState === 'defeat' && (
                                        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-red-500/50">
                                             <div className="text-4xl md:text-5xl font-black text-red-500 mb-3 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">성 함락!</div>
                                             <div className="text-xl text-white font-black mb-6 font-mono">방어한 웨이브: <span className="text-emerald-400">{score}</span></div>
                                             <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                                  <RotateCw className="w-5 h-5" /> 다시 도전
                                             </button>
                                        </div>
                                   )}

                                   {gameState === 'victory' && (
                                        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-emerald-400/60">
                                             <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 mb-3 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]">방어 성공! 🏆</div>
                                             <div className="text-xl text-white font-black mb-6 font-mono">{WAVES_TO_WIN} 웨이브 완전 방어</div>
                                             <button onClick={startGame} className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                                                  <RotateCw className="w-5 h-5" /> 다시 하기
                                             </button>
                                        </div>
                                   )}
                              </div>

                              {/* ---------- Control dock ---------- */}
                              <div className="min-h-[112px] w-full mt-4">
                                   {selectedCell ? (
                                        /* Build menu */
                                        <div className="flex gap-3 justify-center flex-wrap">
                                             {Object.entries(TOWER_TYPES).map(([id, def]) => {
                                                  const afford = gold >= def.cost;
                                                  return (
                                                       <button
                                                            key={id}
                                                            onClick={() => buildTower(id)}
                                                            disabled={!afford}
                                                            className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all ${afford ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-emerald-500 hover:-translate-y-1 shadow-lg' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}
                                                       >
                                                            <span className="text-3xl mb-0.5 drop-shadow-md">{def.icon}</span>
                                                            <span className="text-xs font-bold text-gray-300">{def.name}</span>
                                                            <span className={`text-xs font-black ${afford ? 'text-amber-400' : 'text-red-500'}`}>{def.cost}G</span>
                                                       </button>
                                                  );
                                             })}
                                             <button onClick={() => { playSound('click'); setSelectedCell(null); }} className="flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-500 transition-all text-gray-400 hover:text-white text-sm font-bold">
                                                  취소
                                             </button>
                                        </div>
                                   ) : selectedTower ? (
                                        /* Upgrade / sell panel */
                                        <div className="flex items-center justify-center gap-3 flex-wrap bg-black/40 rounded-2xl p-3 border border-slate-700 max-w-lg mx-auto">
                                             <div className="flex items-center gap-2 pr-2">
                                                  <span className="text-2xl">{TOWER_TYPES[selectedTower.type].icon}</span>
                                                  <div className="text-left">
                                                       <div className="text-sm font-black text-white">{TOWER_TYPES[selectedTower.type].name} <span className="text-emerald-400">Lv.{selectedTower.level}</span></div>
                                                       <div className="text-[10px] text-gray-400 font-mono">DMG {selStats.damage.toFixed(0)} · RNG {selStats.range.toFixed(1)} · {(1000 / selStats.rate).toFixed(1)}/s</div>
                                                  </div>
                                             </div>
                                             <button
                                                  onClick={upgradeTower}
                                                  disabled={selectedTower.level >= 3 || gold < upgradeCost(selectedTower)}
                                                  className={`px-4 py-3 rounded-xl font-black text-sm transition-all ${selectedTower.level >= 3 ? 'bg-slate-800 text-gray-500 cursor-not-allowed' : gold >= upgradeCost(selectedTower) ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-red-400 cursor-not-allowed'}`}
                                             >
                                                  {selectedTower.level >= 3 ? 'MAX' : `업그레이드 ${upgradeCost(selectedTower)}G`}
                                             </button>
                                             <button onClick={sellTower} className="px-4 py-3 rounded-xl font-black text-sm bg-amber-700/60 hover:bg-amber-600 text-amber-100 transition-all">
                                                  판매 +{sellValue(selectedTower)}G
                                             </button>
                                             <button onClick={() => { playSound('click'); setSelectedTowerId(null); }} className="px-3 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-gray-300">닫기</button>
                                        </div>
                                   ) : (
                                        /* Wave control */
                                        <div className="flex items-center justify-center gap-4 h-full">
                                             {!waveActive ? (
                                                  <button onClick={startWave} className={`text-white font-black py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-3 ${nextWaveIsBoss ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'} ${wave === 0 ? 'animate-pulse' : ''}`}>
                                                       <Play className="w-5 h-5 fill-white" />
                                                       {wave === 0 ? '웨이브 1 시작' : `다음 웨이브 (${wave + 1})`}
                                                       {nextWaveIsBoss && <span className="text-lg">👑</span>}
                                                  </button>
                                             ) : (
                                                  <div className="text-gray-400 font-bold tracking-wider flex items-center gap-2 text-sm">
                                                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 방어 중… 빈 칸을 눌러 건설
                                                  </div>
                                             )}
                                             <button onClick={toggleSpeed} className={`py-4 px-4 rounded-2xl font-black transition-all border-2 ${speed === 2 ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_16px_rgba(34,211,238,0.5)]' : 'bg-slate-800 border-slate-600 text-gray-300 hover:bg-slate-700'}`}>
                                                  x{speed}
                                             </button>
                                        </div>
                                   )}
                              </div>
                         </div>

                         {/* ---------- Leaderboard ---------- */}
                         <div className="bg-black/40 rounded-2xl p-4 border border-slate-700 w-full lg:w-60 shrink-0 flex flex-col shadow-inner">
                              <div className="flex items-center gap-3 mb-3">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 디펜더</span>
                              </div>
                              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[240px]">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-slate-600">
                                             <div className="flex items-center gap-2.5">
                                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-md ${e.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' : e.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : e.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-slate-800 border border-slate-600 text-gray-300'}`}>{e.rank}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[70px]">{e.name}</span>
                                             </div>
                                             <span className="text-emerald-400 font-mono text-sm font-bold">W{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-gray-500 text-sm py-4 text-center font-bold">기록이 없습니다.</p>}
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-gray-500 flex justify-between">
                                   <span>최고 기록</span>
                                   <span className="text-gray-300 font-bold">W{bestRef.current}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 flex justify-between mt-1">
                                   <span>오늘 남은 보상</span>
                                   <span className="text-emerald-400 font-bold">{rewardLeft} ON</span>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default TowerDefense;
