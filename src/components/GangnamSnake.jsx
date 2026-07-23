import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Trophy, Coffee, Snowflake, Flame } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';
import { awardGameReward, getRewardRemaining } from '../lib/gameReward';

const GAMEKEY = 'snake';

const COLS = 22;
const ROWS = 16;
const CELL_SIZE = 30;
const BOARD_W = COLS * CELL_SIZE;
const BOARD_H = ROWS * CELL_SIZE;

const COMBO_WINDOW = 2500;   // 콤보 유지 시간(ms)
const COMBO_CAP = 8;         // 콤보 배수 상한
const BUFF_MS = 5000;        // 카페인/빙수 지속(ms)
const GOLDEN_TTL = 4500;     // 황금 먹이 자동 소멸(ms)
const MAX_OBSTACLES = 14;    // 장애물 개수 상한
const PARTICLE_CAP = 40;
const PARTICLE_MS = 650;

// 먹이 종류 — 가중 랜덤 (weight 합 = 100)
const FOOD_TYPES = [
     { type: 'common', emoji: '🥐', weight: 68, points: 10, color: '#f59e0b', label: '크로플' },
     { type: 'golden', emoji: '⭐', weight: 12, points: 50, color: '#fde047', label: '황금' },
     { type: 'coffee', emoji: '☕', weight: 8, points: 20, color: '#d6a06a', label: '카페인' },
     { type: 'ice', emoji: '🧊', weight: 8, points: 10, color: '#67e8f9', label: '빙수' },
     { type: 'gem', emoji: '💎', weight: 4, points: 100, color: '#22d3ee', label: '보석' },
];

// 강남 랜드마크 테마 장애물
const LANDMARKS = ['🏢', '🏬', '🗼', '🚉', '⛲', '🏨'];

const pickFoodType = () => {
     const total = FOOD_TYPES.reduce((sum, f) => sum + f.weight, 0);
     let r = Math.random() * total;
     for (const f of FOOD_TYPES) {
          r -= f.weight;
          if (r <= 0) return f;
     }
     return FOOD_TYPES[0];
};

const emptyCell = (occupied) => {
     let attempts = 0;
     while (attempts < 600) {
          attempts += 1;
          const x = Math.floor(Math.random() * COLS);
          const y = Math.floor(Math.random() * ROWS);
          if (!occupied.has(`${x},${y}`)) return { x, y };
     }
     return null;
};

const makeFood = (occupied, now, forceCommon) => {
     const cell = emptyCell(occupied);
     if (!cell) return null;
     const t = forceCommon ? FOOD_TYPES[0] : pickFoodType();
     return {
          x: cell.x,
          y: cell.y,
          type: t.type,
          emoji: t.emoji,
          points: t.points,
          color: t.color,
          expireAt: t.type === 'golden' ? now + GOLDEN_TTL : 0,
     };
};

// 레벨이 오를수록 스텝 간격이 짧아짐(빨라짐) — 하한으로 플레이 가능성 확보
const baseInterval = (level) => Math.max(80, 165 - (level - 1) * 10);

const GangnamSnake = ({ onClose, user, beanCount = 0, updateBeanCount }) => {
     // ---- 렌더용 상태 ----
     const [snake, setSnake] = useState([{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }]);
     const [food, setFood] = useState(null);
     const [obstacles, setObstacles] = useState([]);
     const [score, setScore] = useState(0);
     const [level, setLevel] = useState(1);
     const [combo, setCombo] = useState(0);
     const [coffeeMs, setCoffeeMs] = useState(0);
     const [iceMs, setIceMs] = useState(0);
     const [particles, setParticles] = useState([]);
     const [rewardPops, setRewardPops] = useState([]);
     const [gameOver, setGameOver] = useState(false);
     const [gameStarted, setGameStarted] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10(GAMEKEY, true));
     const [shake, setShake] = useState(false);

     // ---- 게임 로직용 refs (스테일 클로저 방지) ----
     const snakeRef = useRef(snake);
     const dirRef = useRef({ dx: 1, dy: 0 });
     const nextDirRef = useRef({ dx: 1, dy: 0 });
     const foodRef = useRef(null);
     const obstaclesRef = useRef([]);
     const scoreRef = useRef(0);
     const levelRef = useRef(1);
     const foodsEatenRef = useRef(0);
     const comboRef = useRef(0);
     const lastEatRef = useRef(0);
     const buffRef = useRef({ coffee: 0, ice: 0 });
     const awardedLevelsRef = useRef(new Set());
     const particlesRef = useRef([]);
     const rewardPopsRef = useRef([]);
     const lastBuffTickRef = useRef(0);
     const idRef = useRef(0);
     const moveSoundRef = useRef(0);

     const runningRef = useRef(false);
     const gameOverRef = useRef(false);
     const startedRef = useRef(false);
     const rafRef = useRef(0);
     const lastTsRef = useRef(0);
     const accRef = useRef(0);
     const shakeTimeoutRef = useRef(null);

     // props를 ref로 미러링 → 루프에서 항상 최신값 사용
     const userRef = useRef(user);
     userRef.current = user;
     const updateBeanRef = useRef(updateBeanCount);
     updateBeanRef.current = updateBeanCount;

     const triggerShake = useCallback(() => {
          setShake(true);
          if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
          shakeTimeoutRef.current = setTimeout(() => setShake(false), 260);
     }, []);

     const tryTurn = useCallback((dx, dy) => {
          if (!startedRef.current || gameOverRef.current) return;
          const cur = dirRef.current;
          if (dx === -cur.dx && dy === -cur.dy) return; // 180도 반전 차단
          if (dx === cur.dx && dy === cur.dy) return;   // 같은 방향 무시
          nextDirRef.current = { dx, dy };
          const now = performance.now();
          if (now - moveSoundRef.current > 80) {
               moveSoundRef.current = now;
               playSound('move');
          }
     }, []);

     // refs → 상태 반영
     const flush = useCallback((now) => {
          setSnake(snakeRef.current);
          setFood(foodRef.current);
          setObstacles(obstaclesRef.current);
          setScore(scoreRef.current);
          setLevel(levelRef.current);
          setCombo(comboRef.current);
          setCoffeeMs(Math.max(0, buffRef.current.coffee - now));
          setIceMs(Math.max(0, buffRef.current.ice - now));
          particlesRef.current = particlesRef.current.filter((p) => now - p.t < PARTICLE_MS);
          setParticles(particlesRef.current);
          rewardPopsRef.current = rewardPopsRef.current.filter((r) => now - r.t < 1600);
          setRewardPops(rewardPopsRef.current);
     }, []);

     const spawnFood = useCallback((now, forceCommon) => {
          const occ = new Set();
          snakeRef.current.forEach((s) => occ.add(`${s.x},${s.y}`));
          obstaclesRef.current.forEach((o) => occ.add(`${o.x},${o.y}`));
          const f = makeFood(occ, now, forceCommon);
          if (f) foodRef.current = f;
     }, []);

     const regenObstacles = useCallback((lvl) => {
          const count = Math.min(MAX_OBSTACLES, Math.max(0, (lvl - 1) * 2));
          const occ = new Set();
          snakeRef.current.forEach((s) => occ.add(`${s.x},${s.y}`));
          const head = snakeRef.current[0];
          if (foodRef.current) occ.add(`${foodRef.current.x},${foodRef.current.y}`);
          const obs = [];
          let attempts = 0;
          while (obs.length < count && attempts < 400) {
               attempts += 1;
               const x = Math.floor(Math.random() * COLS);
               const y = Math.floor(Math.random() * ROWS);
               const key = `${x},${y}`;
               if (occ.has(key)) continue;
               // 머리 주변은 안전지대(불공정한 즉사 방지)
               if (head && Math.abs(x - head.x) + Math.abs(y - head.y) <= 3) continue;
               occ.add(key);
               obs.push({ x, y, emoji: LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)] });
          }
          obstaclesRef.current = obs;
     }, []);

     const addParticles = useCallback((cellX, cellY, color, emoji) => {
          const px = cellX * CELL_SIZE + CELL_SIZE / 2;
          const py = cellY * CELL_SIZE + CELL_SIZE / 2;
          const now = performance.now();
          const add = [];
          for (let i = 0; i < 6; i += 1) {
               idRef.current += 1;
               add.push({
                    id: idRef.current,
                    x: px,
                    y: py,
                    dx: (Math.random() * 2 - 1) * 26,
                    dy: Math.random() * -30 - 6,
                    color,
                    emoji: i === 0 ? emoji : null,
                    t: now,
               });
          }
          particlesRef.current = [...particlesRef.current, ...add].slice(-PARTICLE_CAP);
          setParticles(particlesRef.current);
     }, []);

     const pushReward = useCallback((amount) => {
          if (!(amount > 0)) return;
          idRef.current += 1;
          rewardPopsRef.current = [...rewardPopsRef.current, { id: idRef.current, amount, t: performance.now() }].slice(-6);
          setRewardPops(rewardPopsRef.current);
          playSound('coin');
     }, []);

     const finalizeGame = useCallback(() => {
          const u = userRef.current;
          const name = u?.user_metadata?.username || u?.email?.split('@')[0] || '게스트';
          const finalScore = scoreRef.current;
          const prevBest = getRankTop10(GAMEKEY, true)[0]?.score || 0;
          if (finalScore > 0) {
               addScore(GAMEKEY, name, finalScore, true);
               setRankList(getRankTop10(GAMEKEY, true));
          }
          if (finalScore > prevBest && finalScore > 0) {
               const g = awardGameReward(GAMEKEY, 20, updateBeanRef.current); // 신기록 보상
               if (g > 0) pushReward(g);
               playSound('win');
          } else {
               playSound('gameover');
          }
     }, [pushReward]);

     const die = useCallback(() => {
          if (gameOverRef.current) return;
          gameOverRef.current = true;
          runningRef.current = false;
          playSound('hit');
          triggerShake();
          finalizeGame();
          flush(performance.now());
          setGameOver(true);
     }, [finalizeGame, flush, triggerShake]);

     const applyEat = useCallback((eaten, now) => {
          const coffeeActive = now < buffRef.current.coffee;
          if (now - lastEatRef.current <= COMBO_WINDOW) comboRef.current += 1;
          else comboRef.current = 1;
          lastEatRef.current = now;
          const mult = Math.min(comboRef.current, COMBO_CAP);
          scoreRef.current += eaten.points * mult * (coffeeActive ? 2 : 1);
          addParticles(eaten.x, eaten.y, eaten.color, eaten.emoji);

          if (eaten.type === 'common') playSound('coin');
          else if (eaten.type === 'golden') playSound('score');
          else if (eaten.type === 'gem') playSound('combo');
          else if (eaten.type === 'coffee') {
               buffRef.current.coffee = now + BUFF_MS;
               buffRef.current.ice = 0;
               lastBuffTickRef.current = 0;
               playSound('powerup');
          } else if (eaten.type === 'ice') {
               buffRef.current.ice = now + BUFF_MS;
               buffRef.current.coffee = 0;
               lastBuffTickRef.current = 0;
               playSound('whoosh');
          }

          foodsEatenRef.current += 1;
          const newLevel = Math.floor(foodsEatenRef.current / 5) + 1;
          if (newLevel > levelRef.current) {
               levelRef.current = newLevel;
               regenObstacles(newLevel); // 레벨업마다 랜드마크 장애물 재배치
               playSound('powerup');
               if (newLevel % 3 === 0 && !awardedLevelsRef.current.has(newLevel)) {
                    awardedLevelsRef.current.add(newLevel);
                    const g = awardGameReward(GAMEKEY, 10, updateBeanRef.current); // 3레벨마다 보상
                    if (g > 0) pushReward(g);
               }
          }

          spawnFood(now, false);
     }, [addParticles, regenObstacles, spawnFood, pushReward]);

     const advance = useCallback((now) => {
          const body = snakeRef.current;
          const nd = nextDirRef.current;
          dirRef.current = nd;
          const head = body[0];
          const nx = head.x + nd.dx;
          const ny = head.y + nd.dy;

          // 벽(랩어라운드 없음)
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) { die(); return; }
          // 장애물
          if (obstaclesRef.current.some((o) => o.x === nx && o.y === ny)) { die(); return; }

          const f = foodRef.current;
          const ate = !!f && nx === f.x && ny === f.y;
          const grows = ate && f.type === 'common';
          // 몸통 충돌: 성장하지 않으면 꼬리는 비켜나므로 검사에서 제외
          const collideBody = grows ? body : body.slice(0, body.length - 1);
          if (collideBody.some((s) => s.x === nx && s.y === ny)) { die(); return; }

          const newSnake = [{ x: nx, y: ny }, ...body];
          if (!grows) newSnake.pop();
          snakeRef.current = newSnake;

          if (ate) applyEat(f, now);
     }, [applyEat, die]);

     const tick = useCallback((ts) => {
          const now = ts;
          if (!lastTsRef.current) lastTsRef.current = now;
          // 탭 백그라운드 복귀 시 델타가 폭증해 순간 질주→불공정 사망하는 것을 방지(최대 120ms로 클램프)
          accRef.current += Math.min(now - lastTsRef.current, 120);
          lastTsRef.current = now;

          // 콤보 만료
          if (comboRef.current > 0 && now - lastEatRef.current > COMBO_WINDOW) comboRef.current = 0;
          // 황금 먹이 자동 소멸
          const f = foodRef.current;
          if (f && f.type === 'golden' && f.expireAt && now > f.expireAt) spawnFood(now, false);
          // 버프 종료 3초 전 카운트다운 틱
          const buffEnd = Math.max(buffRef.current.coffee, buffRef.current.ice);
          if (buffEnd > now) {
               const remSec = Math.ceil((buffEnd - now) / 1000);
               if (remSec <= 3 && remSec !== lastBuffTickRef.current) {
                    lastBuffTickRef.current = remSec;
                    playSound('tick');
               }
          } else {
               lastBuffTickRef.current = 0;
          }

          // 유효 속도 = 레벨 기반 간격 × 버프 배수
          let m = 1;
          if (now < buffRef.current.coffee) m = 1 / 1.5;       // 카페인: 빠름
          else if (now < buffRef.current.ice) m = 1 / 0.6;     // 빙수: 느림
          const interval = baseInterval(levelRef.current) * m;

          let steps = 0;
          while (accRef.current >= interval && !gameOverRef.current && steps < 4) {
               accRef.current -= interval;
               advance(now);
               steps += 1;
          }
          flush(now);
     }, [advance, flush, spawnFood]);

     const startGame = useCallback(() => {
          playSound('click');
          const start = [{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }];
          snakeRef.current = start;
          dirRef.current = { dx: 1, dy: 0 };
          nextDirRef.current = { dx: 1, dy: 0 };
          obstaclesRef.current = [];
          scoreRef.current = 0;
          levelRef.current = 1;
          foodsEatenRef.current = 0;
          comboRef.current = 0;
          lastEatRef.current = 0;
          buffRef.current = { coffee: 0, ice: 0 };
          awardedLevelsRef.current = new Set();
          particlesRef.current = [];
          rewardPopsRef.current = [];
          lastBuffTickRef.current = 0;
          idRef.current = 0;
          gameOverRef.current = false;
          runningRef.current = false;
          spawnFood(performance.now(), true); // 첫 먹이는 일반으로 부드럽게 시작

          setSnake(start);
          setObstacles([]);
          setScore(0);
          setLevel(1);
          setCombo(0);
          setCoffeeMs(0);
          setIceMs(0);
          setParticles([]);
          setRewardPops([]);
          setFood(foodRef.current);
          setGameOver(false);
          setRankList(getRankTop10(GAMEKEY, true));
          startedRef.current = true;
          setGameStarted(true);
     }, [spawnFood]);

     // 게임 루프 (rAF) — 시작/종료에만 재구동
     useEffect(() => {
          if (!gameStarted || gameOver) return undefined;
          runningRef.current = true;
          lastTsRef.current = 0;
          accRef.current = 0;
          const frame = (ts) => {
               if (!runningRef.current || gameOverRef.current) return;
               tick(ts);
               if (runningRef.current && !gameOverRef.current) rafRef.current = requestAnimationFrame(frame);
          };
          rafRef.current = requestAnimationFrame(frame);
          return () => {
               runningRef.current = false;
               cancelAnimationFrame(rafRef.current);
          };
     }, [gameStarted, gameOver, tick]);

     // 키보드 입력 (방향키 + WASD)
     useEffect(() => {
          const handleKey = (e) => {
               const k = e.key.toLowerCase();
               if (k === 'arrowup' || k === 'w') { e.preventDefault(); tryTurn(0, -1); }
               else if (k === 'arrowdown' || k === 's') { e.preventDefault(); tryTurn(0, 1); }
               else if (k === 'arrowleft' || k === 'a') { e.preventDefault(); tryTurn(-1, 0); }
               else if (k === 'arrowright' || k === 'd') { e.preventDefault(); tryTurn(1, 0); }
          };
          window.addEventListener('keydown', handleKey);
          return () => window.removeEventListener('keydown', handleKey);
     }, [tryTurn]);

     // 언마운트 정리
     useEffect(() => () => {
          runningRef.current = false;
          cancelAnimationFrame(rafRef.current);
          if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
     }, []);

     const comboMult = Math.min(combo, COMBO_CAP);
     const rewardLeft = getRewardRemaining(GAMEKEY);

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4 overflow-auto">
               <style>{`
                    @keyframes gs-food-bob { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.12); } }
                    @keyframes gs-particle { from { transform: translate(-50%,-50%) translate(0,0) scale(1); opacity: 1; } to { transform: translate(-50%,-50%) translate(var(--dx), var(--dy)) scale(.3); opacity: 0; } }
                    @keyframes gs-reward { 0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(.8); } 18% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) translateY(-26px) scale(.9); } }
                    @keyframes gs-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
                    .gs-shake { animation: gs-shake .28s ease-in-out; }
                    .gs-scale { width: ${BOARD_W}px; height: ${BOARD_H}px; }
                    @media (max-width: 700px) {
                         .gs-scale { width: ${Math.round(BOARD_W * 0.54)}px; height: ${Math.round(BOARD_H * 0.54)}px; }
                         .gs-scale > .gs-board { transform: scale(0.54) rotateX(3deg); transform-origin: top left; }
                    }
               `}</style>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.2)] max-w-7xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start ${shake ? 'gs-shake' : ''}`}>

                    {/* Header / Mobile Title */}
                    <div className="w-full flex justify-between items-center lg:hidden mb-2">
                         <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider">강남 먹방 스네이크</h2>
                         <button onClick={() => { playSound('click'); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                              <ArrowLeft className="w-6 h-6" />
                         </button>
                    </div>

                    {/* HUD (상단 스탯) */}
                    <div className="w-full lg:hidden grid grid-cols-3 gap-2 mb-1">
                         <div className="bg-black/40 rounded-xl p-2 border border-emerald-500/20 text-center">
                              <div className="text-[10px] font-black text-emerald-500 tracking-widest">LV</div>
                              <div className="text-lg font-black text-white font-mono">{level}</div>
                         </div>
                         <div className="bg-black/40 rounded-xl p-2 border border-emerald-500/20 text-center">
                              <div className="text-[10px] font-black text-emerald-500 tracking-widest">SCORE</div>
                              <div className="text-lg font-black text-white font-mono">{score.toLocaleString()}</div>
                         </div>
                         <div className="bg-black/40 rounded-xl p-2 border border-orange-500/20 text-center">
                              <div className="text-[10px] font-black text-orange-400 tracking-widest">COMBO</div>
                              <div className="text-lg font-black text-white font-mono">{comboMult >= 2 ? `x${comboMult}` : '-'}</div>
                         </div>
                    </div>

                    {/* Game Board — perspective + rotateX 로 3D 테이블 느낌 */}
                    <div className="shrink-0" style={{ perspective: '1000px' }}>
                         <div className="gs-scale relative">
                              <div
                                   className="gs-board absolute top-0 left-0 rounded-2xl overflow-hidden bg-black/60 border-2 border-emerald-500/50 shadow-[0_25px_55px_rgba(0,0,0,.55),0_0_30px_rgba(16,185,129,0.3)]"
                                   style={{ width: BOARD_W, height: BOARD_H, transform: 'rotateX(3deg)', transformOrigin: 'top center' }}
                              >
                                   {/* Grid Pattern */}
                                   <div className="absolute inset-0 opacity-10"
                                        style={{ backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`, backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px` }} />

                                   {/* Obstacles — 강남 랜드마크 블록 */}
                                   {obstacles.map((o, i) => (
                                        <div
                                             key={`ob-${i}`}
                                             className="absolute flex items-center justify-center rounded-md bg-gradient-to-b from-slate-600 to-slate-900 border border-slate-500/40 shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_2px_4px_rgba(0,0,0,.5)]"
                                             style={{ left: o.x * CELL_SIZE + 1, top: o.y * CELL_SIZE + 1, width: CELL_SIZE - 2, height: CELL_SIZE - 2, fontSize: CELL_SIZE * 0.6 }}
                                        >
                                             {o.emoji}
                                        </div>
                                   ))}

                                   {/* Snake — 그라데이션 + 베벨, 머리는 살짝 크게 + 강한 글로우 */}
                                   {snake.map((seg, i) => {
                                        const isHead = i === 0;
                                        return (
                                             <div
                                                  key={`sn-${i}`}
                                                  className={`absolute rounded-md ${isHead ? 'bg-gradient-to-b from-emerald-200 to-emerald-500 shadow-[inset_0_2px_0_rgba(255,255,255,.6),0_3px_6px_rgba(0,0,0,.45),0_0_18px_rgba(110,231,183,1)] z-10' : 'bg-gradient-to-b from-emerald-500 to-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_3px_5px_rgba(0,0,0,.4),0_0_8px_rgba(5,150,105,.5)]'}`}
                                                  style={{ left: seg.x * CELL_SIZE + 2, top: seg.y * CELL_SIZE + 2, width: CELL_SIZE - 4, height: CELL_SIZE - 4 }}
                                             >
                                                  {isHead && <div className="w-full h-full relative"><div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 left-1" /><div className="absolute w-1.5 h-1.5 bg-black rounded-full top-1 right-1" /></div>}
                                             </div>
                                        );
                                   })}

                                   {/* Food — 종류별 색/광채 + 둥실거림 */}
                                   {food && (
                                        <div
                                             className="absolute flex items-center justify-center select-none"
                                             style={{ left: food.x * CELL_SIZE, top: food.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE, animation: 'gs-food-bob 1.1s ease-in-out infinite' }}
                                        >
                                             <div className="absolute rounded-full" style={{ width: CELL_SIZE * 0.78, height: CELL_SIZE * 0.78, background: `radial-gradient(circle, ${food.color}55, transparent 70%)`, boxShadow: `0 0 14px ${food.color}` }} />
                                             <span style={{ fontSize: CELL_SIZE * 0.66, filter: 'drop-shadow(0 5px 3px rgba(0,0,0,.5))' }}>{food.emoji}</span>
                                        </div>
                                   )}

                                   {/* Particles */}
                                   {particles.map((p) => (
                                        <div
                                             key={p.id}
                                             className="absolute pointer-events-none z-20"
                                             style={{ left: p.x, top: p.y, ['--dx']: `${p.dx}px`, ['--dy']: `${p.dy}px`, animation: 'gs-particle .65s ease-out forwards' }}
                                        >
                                             {p.emoji
                                                  ? <span style={{ fontSize: CELL_SIZE * 0.5 }}>{p.emoji}</span>
                                                  : <span className="block rounded-full" style={{ width: 6, height: 6, background: p.color, boxShadow: `0 0 6px ${p.color}` }} />}
                                        </div>
                                   ))}

                                   {/* Reward pops (+N ON) */}
                                   {rewardPops.map((r, i) => (
                                        <div
                                             key={r.id}
                                             className="absolute left-1/2 z-40 pointer-events-none font-black text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]"
                                             style={{ top: 12 + i * 26, fontSize: 20, animation: 'gs-reward 1.6s ease-out forwards' }}
                                        >
                                             +{r.amount} ON
                                        </div>
                                   ))}

                                   {/* Start overlay */}
                                   {!gameStarted && (
                                        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center">
                                             <div className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 drop-shadow-lg tracking-widest">강남 먹방 스네이크</div>
                                             <div className="bg-gray-800/80 rounded-2xl p-4 mb-5 text-left max-w-xs border border-emerald-500/20">
                                                  <div className="text-xs font-black text-emerald-400 mb-2 tracking-wider">🍽️ 먹이 도감</div>
                                                  <ul className="text-gray-300 text-xs space-y-1.5 list-none">
                                                       <li>🥐 일반 +10 · 몸 길어짐</li>
                                                       <li className="text-yellow-300">⭐ 황금 +50 · 곧 사라짐</li>
                                                       <li className="text-amber-300">☕ 카페인 · 5초 스피드+점수x2</li>
                                                       <li className="text-cyan-300">🧊 빙수 · 5초 느려짐(쉬움)</li>
                                                       <li className="text-cyan-200">💎 보석 +100</li>
                                                       <li className="text-red-400 pt-1 border-t border-white/10">🏢 랜드마크·벽·몸통 = GAME OVER</li>
                                                  </ul>
                                             </div>
                                             <button onClick={startGame} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3 px-10 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform hover:scale-105 flex items-center gap-2 text-lg">
                                                  <Play className="w-5 h-5 fill-white" /> START
                                             </button>
                                        </div>
                                   )}

                                   {/* Game over overlay */}
                                   {gameStarted && gameOver && (
                                        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center">
                                             <div className="text-4xl md:text-5xl font-black text-red-500 mb-3 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">CRASH!</div>
                                             <div className="text-lg text-white font-black mb-1 font-mono">Score: <span className="text-emerald-400">{score.toLocaleString()}</span></div>
                                             <div className="text-sm text-emerald-300/80 font-bold mb-6 font-mono">Lv.{level} 도달</div>
                                             <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                                  <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                             </button>
                                        </div>
                                   )}
                              </div>
                         </div>

                         {/* Active buff bars (아래) */}
                         <div className="mt-4 space-y-2 w-full" style={{ maxWidth: BOARD_W }}>
                              {coffeeMs > 0 && (
                                   <div className="bg-black/50 rounded-xl p-2 border border-amber-500/40">
                                        <div className="flex items-center justify-between text-xs font-black text-amber-300 mb-1">
                                             <span className="flex items-center gap-1"><Coffee className="w-3.5 h-3.5" /> 카페인 (스피드 · 점수 x2)</span>
                                             <span className="font-mono">{(coffeeMs / 1000).toFixed(1)}s</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                             <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${(coffeeMs / BUFF_MS) * 100}%` }} />
                                        </div>
                                   </div>
                              )}
                              {iceMs > 0 && (
                                   <div className="bg-black/50 rounded-xl p-2 border border-cyan-500/40">
                                        <div className="flex items-center justify-between text-xs font-black text-cyan-300 mb-1">
                                             <span className="flex items-center gap-1"><Snowflake className="w-3.5 h-3.5" /> 빙수 (슬로우)</span>
                                             <span className="font-mono">{(iceMs / 1000).toFixed(1)}s</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                             <div className="h-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${(iceMs / BUFF_MS) * 100}%` }} />
                                        </div>
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* Right Panel */}
                    <div className="flex-1 w-full lg:w-72 flex flex-col gap-5">
                         <div className="hidden lg:flex justify-between items-start w-full">
                              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider leading-tight">강남 먹방<br/>스네이크</h2>
                              <button onClick={() => { playSound('click'); onClose(); }} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         {/* Desktop HUD */}
                         <div className="hidden lg:grid grid-cols-3 gap-3">
                              <div className="bg-black/40 rounded-2xl p-3 border border-emerald-500/20 text-center">
                                   <div className="text-[10px] font-black text-emerald-500 tracking-widest mb-1">LEVEL</div>
                                   <div className="text-2xl font-black text-white font-mono">{level}</div>
                              </div>
                              <div className="bg-black/40 rounded-2xl p-3 border border-orange-500/20 text-center">
                                   <div className="text-[10px] font-black text-orange-400 tracking-widest mb-1 flex items-center justify-center gap-1"><Flame className="w-3 h-3" />COMBO</div>
                                   <div className="text-2xl font-black text-white font-mono">{comboMult >= 2 ? `x${comboMult}` : '-'}</div>
                              </div>
                              <div className="bg-black/40 rounded-2xl p-3 border border-yellow-500/20 text-center">
                                   <div className="text-[10px] font-black text-yellow-400 tracking-widest mb-1">남은ON</div>
                                   <div className="text-2xl font-black text-white font-mono">{rewardLeft}</div>
                              </div>
                         </div>

                         <div className="bg-black/40 p-5 rounded-2xl border border-emerald-500/20 w-full shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
                              <div className="flex items-center justify-between">
                                   <div className="text-xs font-black text-emerald-500 tracking-[0.2em]">SCORE</div>
                                   <div className="text-[11px] font-bold text-emerald-300/70">보유 {Number(beanCount).toLocaleString()} ON</div>
                              </div>
                              <div className="text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 mt-1">
                                   {score.toLocaleString()}
                              </div>
                         </div>

                         <div className="bg-black/40 rounded-2xl p-5 border border-emerald-500/20 w-full flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={`rk-${i}`} className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 transition-colors border border-transparent hover:border-emerald-500/20">
                                             <div className="flex items-center gap-3">
                                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-emerald-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[100px]">{e.name}</span>
                                             </div>
                                             <span className="text-emerald-400 font-mono text-sm font-bold">{e.score.toLocaleString()}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-emerald-500/50 text-sm text-center py-4 font-bold">아직 기록이 없어요.</p>}
                              </div>
                         </div>

                         {/* Mobile / Touch D-Pad */}
                         <div className="w-full lg:hidden flex justify-center mt-1">
                              <div className="grid grid-cols-3 gap-3 w-48">
                                   <div />
                                   <button onMouseDown={() => tryTurn(0, -1)} onTouchStart={(e) => { e.preventDefault(); tryTurn(0, -1); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <ArrowUp className="w-8 h-8" />
                                   </button>
                                   <div />
                                   <button onMouseDown={() => tryTurn(-1, 0)} onTouchStart={(e) => { e.preventDefault(); tryTurn(-1, 0); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <ArrowLeftIcon className="w-8 h-8" />
                                   </button>
                                   <div className="aspect-square bg-emerald-900/50 border border-emerald-700 rounded-2xl flex items-center justify-center">
                                        <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                   </div>
                                   <button onMouseDown={() => tryTurn(1, 0)} onTouchStart={(e) => { e.preventDefault(); tryTurn(1, 0); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <ArrowRight className="w-8 h-8" />
                                   </button>
                                   <div />
                                   <button onMouseDown={() => tryTurn(0, 1)} onTouchStart={(e) => { e.preventDefault(); tryTurn(0, 1); }} className="aspect-square bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded-2xl flex items-center justify-center text-emerald-300 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
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
