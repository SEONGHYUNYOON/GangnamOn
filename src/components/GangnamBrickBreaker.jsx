import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy, Heart, Zap, Maximize2, Crosshair, Timer, Plus } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';
import { awardGameReward } from '../lib/gameReward';

const GAMEKEY = 'brick';

// ---- Board geometry -------------------------------------------------------
const COLS = 10;
const CANVAS_W = 800;
const CANVAS_H = 600;
const BRICK_W = CANVAS_W / COLS; // 80
const BRICK_H = 26;
const BRICK_TOP = 64;
const PADDLE_H = 16;
const PADDLE_BASE_W = 120;
const PADDLE_WIDE_W = 190;
const PADDLE_Y = CANVAS_H - 54;
const BALL_R = 9;

// ---- Caps (keep 60fps) ----------------------------------------------------
const MAX_BALLS = 8;
const MAX_LASERS = 24;
const MAX_CAPSULES = 12;
const MAX_PARTICLES = 150;

// ---- Tuning ---------------------------------------------------------------
const DROP_CHANCE = 0.18;
const EXPLO_R = 92;
const CAPSULE_VY = 2.4;
const LASER_VY = 9;
const LASER_INTERVAL = 340;
const POWER_MS = { wide: 10000, laser: 10000, slow: 8000 };

// ---- Brick visual palettes ------------------------------------------------
const NORMAL_COLORS = [
     { light: '#fca5a5', bg: '#ef4444', dark: '#991b1b', glow: 'rgba(239,68,68,0.7)' },
     { light: '#fdba74', bg: '#f97316', dark: '#9a3412', glow: 'rgba(249,115,22,0.7)' },
     { light: '#fde047', bg: '#eab308', dark: '#854d0e', glow: 'rgba(234,179,8,0.7)' },
     { light: '#86efac', bg: '#22c55e', dark: '#166534', glow: 'rgba(34,197,94,0.7)' },
     { light: '#93c5fd', bg: '#3b82f6', dark: '#1e40af', glow: 'rgba(59,130,246,0.7)' },
     { light: '#c4b5fd', bg: '#8b5cf6', dark: '#5b21b6', glow: 'rgba(139,92,246,0.7)' },
];
const TOUGH2 = { light: '#67e8f9', bg: '#0891b2', dark: '#155e75', glow: 'rgba(8,145,178,0.7)' };
const TOUGH3 = { light: '#f0abfc', bg: '#a21caf', dark: '#701a75', glow: 'rgba(162,28,175,0.7)' };
const STEEL = { light: '#e5e7eb', bg: '#9ca3af', dark: '#4b5563', glow: 'rgba(148,163,184,0.5)' };
const EXPLOSIVE = { light: '#fecaca', bg: '#f43f5e', dark: '#881337', glow: 'rgba(244,63,94,0.9)' };

// ---- Stage patterns (10 cols wide). Chars:
//   .  empty      1 normal(1hp)   2 tough(2hp)   3 tough(3hp)
//   S  steel(unbreakable)         E explosive
const PATTERNS = [
     { // 1. Pyramid — approachable warm-up
          name: '피라미드',
          rows: [
               '....11....',
               '...1111...',
               '..111111..',
               '.11111111.',
               '1111111111',
          ],
     },
     { // 2. Fortress — steel corners, tough walls, explosive core
          name: '요새',
          rows: [
               'S22222222S',
               '2........2',
               '2.1E11E1.2',
               '2..1111..2',
               'S22222222S',
          ],
     },
     { // 3. Gaps — offset columns, easy to lose the ball between
          name: '틈새',
          rows: [
               '1.2.1.2.1.',
               '.1.2.1.2.1',
               '2.1.2.1.2.',
               '.2.1.2.1.2',
               '1.2.1.2.1.',
          ],
     },
     { // 4. Checkerboard — tough grid with steel studs
          name: '체커보드',
          rows: [
               '2S21212S12',
               '1212S21212',
               '2121213121',
               '12S2121S21',
               '2121213121',
          ],
     },
     { // 5. Boss — dense mix, steel blockers, explosive clusters
          name: '보스',
          rows: [
               'S3E1221E3S',
               '3221EE1223',
               'E1S2332S1E',
               '3221EE1223',
               'S3E1221E3S',
          ],
     },
];

const TYPE_META = {
     '1': { type: 'normal', hp: 1, score: 10 },
     '2': { type: 'tough', hp: 2, score: 20 },
     '3': { type: 'tough', hp: 3, score: 30 },
     'S': { type: 'steel', hp: Infinity, score: 0 },
     'E': { type: 'explosive', hp: 1, score: 25 },
};

const playerName = (user) =>
     user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';

const GangnamBrickBreaker = ({ onClose, user, beanCount = 0, updateBeanCount }) => {
     void beanCount;
     // ---- HUD state (synced from refs, not per-frame) ---------------------
     const [hud, setHud] = useState({ score: 0, lives: 3, stage: 1, powers: {} });
     const [gameStarted, setGameStarted] = useState(false);
     const [gameOver, setGameOver] = useState(false);
     const [won, setWon] = useState(false);
     const [shake, setShake] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10(GAMEKEY, true));
     const [floats, setFloats] = useState([]); // +N ON indicators

     const canvasRef = useRef(null);

     // ---- Mutable game world (refs → no stale closures) -------------------
     const ballsRef = useRef([]);
     const bricksRef = useRef([]);
     const capsulesRef = useRef([]);
     const lasersRef = useRef([]);
     const particlesRef = useRef([]);
     const paddleRef = useRef({ x: (CANVAS_W - PADDLE_BASE_W) / 2, w: PADDLE_BASE_W });
     const powerRef = useRef({ wide: 0, laser: 0, slow: 0 }); // expiry timestamps
     const stageRef = useRef(0);
     const scoreRef = useRef(0);
     const livesRef = useRef(3);
     const baseSpeedRef = useRef(3.0);
     const bestRef = useRef(0);
     const overRef = useRef(false);

     // input
     const keyDirRef = useRef(0);
     const touchDirRef = useRef(0);
     const pointerXRef = useRef(null);
     const fireQueuedRef = useRef(false);

     // timing / throttles
     const lastBounceRef = useRef(0);
     const lastHitRef = useRef(0);
     const lastLaserRef = useRef(0);
     const streakRef = useRef({ count: 0, last: 0 });

     // cleanup bookkeeping
     const savedRef = useRef(false);
     const floatIdRef = useRef(0);
     const floatTimeoutsRef = useRef(new Set());

     const triggerShake = useCallback(() => {
          setShake(true);
          const t = setTimeout(() => {
               setShake(false);
               floatTimeoutsRef.current.delete(t);
          }, 220);
          floatTimeoutsRef.current.add(t);
     }, []);

     const showFloat = useCallback((amount) => {
          const id = ++floatIdRef.current;
          setFloats((f) => [...f.slice(-4), { id, amount }]);
          const t = setTimeout(() => {
               setFloats((f) => f.filter((x) => x.id !== id));
               floatTimeoutsRef.current.delete(t);
          }, 1600);
          floatTimeoutsRef.current.add(t);
     }, []);

     const award = useCallback((amount) => {
          const granted = awardGameReward(GAMEKEY, amount, updateBeanCount);
          if (granted > 0) {
               playSound('coin');
               showFloat(granted);
          }
     }, [updateBeanCount, showFloat]);

     // ---- throttled sounds ------------------------------------------------
     const playBounce = useCallback(() => {
          const now = performance.now();
          if (now - lastBounceRef.current < 70) return;
          lastBounceRef.current = now;
          playSound('bounce');
     }, []);
     const playHit = useCallback(() => {
          const now = performance.now();
          if (now - lastHitRef.current < 45) return;
          lastHitRef.current = now;
          playSound('hit');
     }, []);

     // ---- particles -------------------------------------------------------
     const spawnParticles = useCallback((x, y, color, count = 8) => {
          const arr = particlesRef.current;
          for (let i = 0; i < count; i++) {
               if (arr.length >= MAX_PARTICLES) break;
               const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
               const speed = 1.5 + Math.random() * 2.8;
               arr.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life: 1, color });
          }
     }, []);

     // ---- ball helpers ----------------------------------------------------
     const makeBall = (x, y, dx, dy) => ({ x, y, dx, dy });

     const normalizeBall = useCallback((b, speed) => {
          let { dx, dy } = b;
          const mag = Math.hypot(dx, dy) || 1;
          dx = (dx / mag) * speed;
          dy = (dy / mag) * speed;
          // keep a minimum vertical component so it never stalls horizontally
          const minY = speed * 0.32;
          if (Math.abs(dy) < minY) {
               dy = (dy < 0 ? -1 : 1) * minY;
               const rem = Math.max(0, speed * speed - dy * dy);
               dx = (dx < 0 ? -1 : 1) * Math.sqrt(rem);
          }
          b.dx = dx;
          b.dy = dy;
     }, []);

     const resetBallsOnPaddle = useCallback(() => {
          const p = paddleRef.current;
          const cx = p.x + p.w / 2;
          const b = makeBall(cx, PADDLE_Y - BALL_R - 4, baseSpeedRef.current * 0.55, -baseSpeedRef.current);
          normalizeBall(b, baseSpeedRef.current);
          ballsRef.current = [b];
     }, [normalizeBall]);

     // ---- stage loader ----------------------------------------------------
     const loadStage = useCallback((idx) => {
          const pat = PATTERNS[idx];
          const bricks = [];
          pat.rows.forEach((row, gy) => {
               for (let gx = 0; gx < COLS && gx < row.length; gx++) {
                    const ch = row[gx];
                    const meta = TYPE_META[ch];
                    if (!meta) continue;
                    const palette =
                         meta.type === 'steel' ? STEEL :
                         meta.type === 'explosive' ? EXPLOSIVE :
                         ch === '2' ? TOUGH2 :
                         ch === '3' ? TOUGH3 :
                         NORMAL_COLORS[gy % NORMAL_COLORS.length];
                    bricks.push({
                         x: gx * BRICK_W + 2,
                         y: gy * BRICK_H + BRICK_TOP + 2,
                         w: BRICK_W - 4,
                         h: BRICK_H - 4,
                         cx: gx * BRICK_W + BRICK_W / 2,
                         cy: gy * BRICK_H + BRICK_TOP + BRICK_H / 2,
                         type: meta.type,
                         hp: meta.hp,
                         maxHp: meta.hp,
                         score: meta.score,
                         palette,
                         alive: true,
                    });
               }
          });
          bricksRef.current = bricks;
          stageRef.current = idx;
          baseSpeedRef.current = 3.0 + idx * 0.32;
          capsulesRef.current = [];
          lasersRef.current = [];
          powerRef.current = { wide: 0, laser: 0, slow: 0 };
          paddleRef.current = { x: (CANVAS_W - PADDLE_BASE_W) / 2, w: PADDLE_BASE_W };
          streakRef.current = { count: 0, last: 0 };
          resetBallsOnPaddle();
     }, [resetBallsOnPaddle]);

     const breakableLeft = () =>
          bricksRef.current.some((b) => b.alive && b.type !== 'steel');

     // ---- explosive chain -------------------------------------------------
     const explode = useCallback((origin) => {
          playSound('explosion');
          spawnParticles(origin.cx, origin.cy, EXPLOSIVE.bg, 16);
          const queue = [origin];
          while (queue.length) {
               const src = queue.shift();
               bricksRef.current.forEach((b) => {
                    if (!b.alive || b === src || b.type === 'steel') return;
                    if (Math.hypot(b.cx - src.cx, b.cy - src.cy) <= EXPLO_R) {
                         b.alive = false;
                         scoreRef.current += b.score || 10;
                         spawnParticles(b.cx, b.cy, b.palette.bg, 6);
                         if (b.type === 'explosive') queue.push(b);
                    }
               });
          }
     }, [spawnParticles]);

     // ---- capsule / power-ups --------------------------------------------
     const maybeDropCapsule = useCallback((brick) => {
          if (Math.random() > DROP_CHANCE) return;
          if (capsulesRef.current.length >= MAX_CAPSULES) return;
          const types = ['multiball', 'wide', 'laser', 'slow', 'multiball', 'wide', 'laser', 'life'];
          const type = types[Math.floor(Math.random() * types.length)];
          capsulesRef.current.push({ x: brick.cx, y: brick.cy, vy: CAPSULE_VY, type });
     }, []);

     const activatePower = useCallback((type) => {
          playSound('powerup');
          const now = performance.now();
          if (type === 'wide') {
               powerRef.current.wide = now + POWER_MS.wide;
          } else if (type === 'laser') {
               powerRef.current.laser = now + POWER_MS.laser;
          } else if (type === 'slow') {
               powerRef.current.slow = now + POWER_MS.slow;
          } else if (type === 'life') {
               livesRef.current = Math.min(9, livesRef.current + 1);
          } else if (type === 'multiball') {
               const balls = ballsRef.current;
               const src = balls[0];
               if (src) {
                    for (let i = 0; i < 2 && balls.length < MAX_BALLS; i++) {
                         const ang = (i === 0 ? -0.5 : 0.5);
                         const cos = Math.cos(ang), sin = Math.sin(ang);
                         const nb = makeBall(src.x, src.y, src.dx * cos - src.dy * sin, src.dx * sin + src.dy * cos);
                         normalizeBall(nb, Math.hypot(src.dx, src.dy) || baseSpeedRef.current);
                         balls.push(nb);
                    }
               }
          }
     }, [normalizeBall]);

     // ---- brick hit -------------------------------------------------------
     const damageBrick = useCallback((b, fromLaser) => {
          if (b.type === 'steel') return false;
          b.hp -= 1;
          if (b.hp > 0) {
               if (!fromLaser) playHit();
               spawnParticles(b.cx, b.cy, b.palette.light, 4);
               return false; // survived
          }
          // broken
          b.alive = false;
          const now = performance.now();
          const streak = streakRef.current;
          streak.count = now - streak.last < 850 ? streak.count + 1 : 1;
          streak.last = now;
          scoreRef.current += b.score;
          if (b.type === 'explosive') {
               explode(b);
          } else {
               spawnParticles(b.cx, b.cy, b.palette.bg, 8);
               if (streak.count >= 3) playSound('combo');
               else if (!fromLaser) playHit();
          }
          maybeDropCapsule(b);
          return true;
     }, [playHit, spawnParticles, explode, maybeDropCapsule]);

     // ---- start / restart -------------------------------------------------
     const startGame = useCallback(() => {
          playSound('click');
          savedRef.current = false;
          overRef.current = false;
          particlesRef.current = [];
          scoreRef.current = 0;
          livesRef.current = 3;
          bestRef.current = getRankTop10(GAMEKEY, true)[0]?.score || 0;
          loadStage(0);
          setHud({ score: 0, lives: 3, stage: 1, powers: {} });
          setGameOver(false);
          setWon(false);
          setGameStarted(true);
     }, [loadStage]);

     // ---- end handling ----------------------------------------------------
     const endGame = useCallback((victory) => {
          if (overRef.current) return;
          overRef.current = true;
          const finalScore = scoreRef.current;
          const prevBest = getRankTop10(GAMEKEY, true)[0]?.score || 0;
          if (finalScore > 0) addScore(GAMEKEY, playerName(user), finalScore, true);
          setRankList(getRankTop10(GAMEKEY, true));
          if (finalScore > prevBest && finalScore > 0) award(20); // new personal best
          setWon(victory);
          setGameOver(true);
          playSound(victory ? 'win' : 'gameover');
     }, [user, award]);

     // ---- advance stage ---------------------------------------------------
     const advanceStage = useCallback(() => {
          award(10); // stage clear reward
          const next = stageRef.current + 1;
          if (next >= PATTERNS.length) {
               scoreRef.current += 500; // win bonus
               endGame(true);
               return;
          }
          playSound('score');
          loadStage(next);
     }, [award, endGame, loadStage]);

     // keep advance/end reachable from the animation frame without stale refs
     const advanceRef = useRef(advanceStage);
     const endRef = useRef(endGame);
     advanceRef.current = advanceStage;
     endRef.current = endGame;

     // ---- MAIN LOOP -------------------------------------------------------
     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!ctx) return;

          let rafId = 0;

          const step = () => {
               const now = performance.now();
               const paddle = paddleRef.current;
               const power = powerRef.current;

               // paddle target width (wide power)
               const targetW = now < power.wide ? PADDLE_WIDE_W : PADDLE_BASE_W;
               if (paddle.w !== targetW) {
                    const c = paddle.x + paddle.w / 2;
                    paddle.w += (targetW - paddle.w) * 0.35;
                    if (Math.abs(paddle.w - targetW) < 1) paddle.w = targetW;
                    paddle.x = c - paddle.w / 2;
               }

               // paddle movement (pointer overrides; else keys/touch)
               const dir = keyDirRef.current || touchDirRef.current;
               if (pointerXRef.current != null) {
                    paddle.x = pointerXRef.current - paddle.w / 2;
                    pointerXRef.current = null;
               } else if (dir) {
                    paddle.x += dir * 9;
               }
               paddle.x = Math.max(0, Math.min(CANVAS_W - paddle.w, paddle.x));

               // speed (slow power)
               const speed = baseSpeedRef.current * (now < power.slow ? 0.6 : 1);

               // ---- balls physics ----
               const balls = ballsRef.current;
               for (let i = balls.length - 1; i >= 0; i--) {
                    const b = balls[i];
                    normalizeBall(b, speed);
                    b.x += b.dx;
                    b.y += b.dy;

                    if (b.x <= BALL_R) { b.x = BALL_R; b.dx = Math.abs(b.dx); playBounce(); }
                    else if (b.x >= CANVAS_W - BALL_R) { b.x = CANVAS_W - BALL_R; b.dx = -Math.abs(b.dx); playBounce(); }
                    if (b.y <= BALL_R) { b.y = BALL_R; b.dy = Math.abs(b.dy); playBounce(); }

                    // paddle
                    if (b.dy > 0 && b.y >= PADDLE_Y - BALL_R && b.y <= PADDLE_Y + PADDLE_H + BALL_R &&
                         b.x >= paddle.x - BALL_R && b.x <= paddle.x + paddle.w + BALL_R) {
                         b.y = PADDLE_Y - BALL_R;
                         const hitPos = (b.x - paddle.x) / paddle.w - 0.5; // -0.5..0.5
                         b.dx = hitPos * 2.2 * speed;
                         b.dy = -Math.abs(b.dy);
                         normalizeBall(b, speed);
                         playBounce();
                    }

                    // bricks
                    const bricks = bricksRef.current;
                    for (let k = 0; k < bricks.length; k++) {
                         const br = bricks[k];
                         if (!br.alive) continue;
                         if (Math.abs(b.x - br.cx) < br.w / 2 + BALL_R && Math.abs(b.y - br.cy) < br.h / 2 + BALL_R) {
                              const overlapX = (br.w / 2 + BALL_R) - Math.abs(b.x - br.cx);
                              const overlapY = (br.h / 2 + BALL_R) - Math.abs(b.y - br.cy);
                              if (overlapX < overlapY) b.dx = b.x < br.cx ? -Math.abs(b.dx) : Math.abs(b.dx);
                              else b.dy = b.y < br.cy ? -Math.abs(b.dy) : Math.abs(b.dy);
                              damageBrick(br, false);
                              break; // one brick per ball per frame
                         }
                    }

                    // fell off
                    if (b.y > CANVAS_H + BALL_R) balls.splice(i, 1);
               }

               // lost all balls → lose a life
               if (balls.length === 0) {
                    playSound('wrong');
                    triggerShake();
                    livesRef.current -= 1;
                    if (livesRef.current <= 0) {
                         livesRef.current = 0;
                         endRef.current(false);
                         return;
                    }
                    resetBallsOnPaddle();
               }

               // ---- lasers ----
               if (now < power.laser && now - lastLaserRef.current > LASER_INTERVAL) {
                    lastLaserRef.current = now;
                    playSound('tick');
                    if (lasersRef.current.length < MAX_LASERS - 1) {
                         lasersRef.current.push({ x: paddle.x + 10, y: PADDLE_Y });
                         lasersRef.current.push({ x: paddle.x + paddle.w - 10, y: PADDLE_Y });
                    }
               }
               if (fireQueuedRef.current) {
                    fireQueuedRef.current = false;
                    if (now < power.laser && lasersRef.current.length < MAX_LASERS - 1) {
                         lasersRef.current.push({ x: paddle.x + paddle.w / 2, y: PADDLE_Y });
                    }
               }
               const lasers = lasersRef.current;
               for (let i = lasers.length - 1; i >= 0; i--) {
                    const L = lasers[i];
                    L.y -= LASER_VY;
                    let hit = false;
                    const bricks = bricksRef.current;
                    for (let k = 0; k < bricks.length; k++) {
                         const br = bricks[k];
                         if (!br.alive) continue;
                         if (L.x >= br.x && L.x <= br.x + br.w && L.y <= br.y + br.h && L.y >= br.y) {
                              if (br.type !== 'steel') damageBrick(br, true);
                              hit = true;
                              break;
                         }
                    }
                    if (hit || L.y < -10) lasers.splice(i, 1);
               }

               // ---- capsules ----
               const caps = capsulesRef.current;
               for (let i = caps.length - 1; i >= 0; i--) {
                    const c = caps[i];
                    c.y += c.vy;
                    if (c.y >= PADDLE_Y - 6 && c.y <= PADDLE_Y + PADDLE_H + 10 &&
                         c.x >= paddle.x && c.x <= paddle.x + paddle.w) {
                         activatePower(c.type);
                         caps.splice(i, 1);
                    } else if (c.y > CANVAS_H + 20) {
                         caps.splice(i, 1);
                    }
               }

               // ---- stage clear ----
               if (!breakableLeft()) {
                    advanceRef.current();
                    if (overRef.current) return; // game ended (win)
               }

               // ============ RENDER ============
               ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
               const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
               bg.addColorStop(0, '#0d1530');
               bg.addColorStop(0.55, '#070b18');
               bg.addColorStop(1, '#02040a');
               ctx.fillStyle = bg;
               ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
               const topLight = ctx.createRadialGradient(CANVAS_W / 2, 90, 40, CANVAS_W / 2, 90, 520);
               topLight.addColorStop(0, 'rgba(59,130,246,0.14)');
               topLight.addColorStop(1, 'rgba(59,130,246,0)');
               ctx.fillStyle = topLight;
               ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

               // bricks
               const bricks = bricksRef.current;
               for (let k = 0; k < bricks.length; k++) {
                    const b = bricks[k];
                    if (!b.alive) continue;
                    const dmg = b.maxHp > 1 ? b.hp / b.maxHp : 1;
                    const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
                    grad.addColorStop(0, b.palette.light);
                    grad.addColorStop(0.5, b.palette.bg);
                    grad.addColorStop(1, b.palette.dark);
                    ctx.shadowBlur = b.type === 'explosive' ? 20 : 12;
                    ctx.shadowColor = b.palette.glow;
                    ctx.globalAlpha = b.type === 'tough' ? 0.55 + dmg * 0.45 : 1;
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.roundRect(b.x, b.y, b.w, b.h, 4);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1;

                    // gloss highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.26)';
                    ctx.beginPath();
                    ctx.roundRect(b.x + 2, b.y + 2, b.w - 4, b.h / 2 - 2, 3);
                    ctx.fill();
                    // bottom bevel
                    ctx.fillStyle = 'rgba(0,0,0,0.32)';
                    ctx.beginPath();
                    ctx.roundRect(b.x + 2, b.y + b.h - 5, b.w - 4, 3, 2);
                    ctx.fill();

                    if (b.type === 'steel') {
                         // rivets
                         ctx.fillStyle = 'rgba(255,255,255,0.5)';
                         [[b.x + 6, b.y + 6], [b.x + b.w - 6, b.y + 6], [b.x + 6, b.y + b.h - 6], [b.x + b.w - 6, b.y + b.h - 6]].forEach(([rx, ry]) => {
                              ctx.beginPath(); ctx.arc(rx, ry, 1.6, 0, Math.PI * 2); ctx.fill();
                         });
                    } else if (b.type === 'explosive') {
                         const pulse = 0.5 + 0.5 * Math.sin(now / 140);
                         ctx.fillStyle = `rgba(255,255,255,${0.35 + pulse * 0.4})`;
                         ctx.beginPath(); ctx.arc(b.cx, b.cy, 4, 0, Math.PI * 2); ctx.fill();
                         ctx.strokeStyle = `rgba(255,220,120,${0.4 + pulse * 0.4})`;
                         ctx.lineWidth = 1.5;
                         ctx.beginPath(); ctx.arc(b.cx, b.cy, 7, 0, Math.PI * 2); ctx.stroke();
                    } else if (b.type === 'tough' && b.hp < b.maxHp) {
                         // cracks as it weakens
                         ctx.strokeStyle = 'rgba(0,0,0,0.45)';
                         ctx.lineWidth = 1;
                         ctx.beginPath();
                         ctx.moveTo(b.cx - 8, b.y + 4); ctx.lineTo(b.cx, b.cy); ctx.lineTo(b.cx + 7, b.y + b.h - 4);
                         ctx.moveTo(b.cx, b.cy); ctx.lineTo(b.cx - 6, b.y + b.h - 3);
                         ctx.stroke();
                    }
               }

               // particles
               const parts = particlesRef.current;
               for (let i = parts.length - 1; i >= 0; i--) {
                    const p = parts[i];
                    p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.035;
                    if (p.life <= 0) { parts.splice(i, 1); continue; }
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 1.5 + p.life * 3, 0, Math.PI * 2);
                    ctx.fill();
               }
               ctx.globalAlpha = 1;

               // capsules
               const capColors = {
                    multiball: '#22d3ee', wide: '#a855f7', laser: '#f43f5e', slow: '#38bdf8', life: '#f472b6',
               };
               const capLetters = { multiball: 'M', wide: 'W', laser: 'L', slow: 'S', life: '+' };
               for (let i = 0; i < caps.length; i++) {
                    const c = caps[i];
                    const col = capColors[c.type] || '#fff';
                    ctx.shadowBlur = 14; ctx.shadowColor = col;
                    const cg = ctx.createLinearGradient(c.x - 14, c.y - 9, c.x + 14, c.y + 9);
                    cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.5, col); cg.addColorStop(1, col);
                    ctx.fillStyle = cg;
                    ctx.beginPath(); ctx.roundRect(c.x - 15, c.y - 9, 30, 18, 9); ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(0,0,0,0.75)';
                    ctx.font = 'bold 13px system-ui, sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(capLetters[c.type] || '?', c.x, c.y + 1);
               }
               ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';

               // lasers
               for (let i = 0; i < lasers.length; i++) {
                    const L = lasers[i];
                    ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(244,63,94,0.9)';
                    const lg = ctx.createLinearGradient(L.x, L.y - 16, L.x, L.y + 4);
                    lg.addColorStop(0, 'rgba(255,255,255,0.95)');
                    lg.addColorStop(1, 'rgba(244,63,94,0.2)');
                    ctx.strokeStyle = lg; ctx.lineWidth = 3; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(L.x, L.y - 16); ctx.lineTo(L.x, L.y + 4); ctx.stroke();
                    ctx.shadowBlur = 0;
               }

               // paddle
               const laserOn = now < power.laser;
               const pGrad = ctx.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + PADDLE_H);
               if (laserOn) { pGrad.addColorStop(0, '#fecaca'); pGrad.addColorStop(0.45, '#f43f5e'); pGrad.addColorStop(1, '#881337'); }
               else { pGrad.addColorStop(0, '#d8b4fe'); pGrad.addColorStop(0.45, '#a855f7'); pGrad.addColorStop(1, '#6b21a8'); }
               ctx.shadowBlur = 20; ctx.shadowColor = laserOn ? 'rgba(244,63,94,0.8)' : 'rgba(168,85,247,0.8)';
               ctx.fillStyle = pGrad;
               ctx.beginPath(); ctx.roundRect(paddle.x, PADDLE_Y, paddle.w, PADDLE_H, 8); ctx.fill();
               ctx.shadowBlur = 0;
               ctx.fillStyle = 'rgba(255,255,255,0.35)';
               ctx.beginPath(); ctx.roundRect(paddle.x + 6, PADDLE_Y + 2, paddle.w - 12, 4, 2); ctx.fill();
               if (laserOn) {
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    [paddle.x + 8, paddle.x + paddle.w - 8].forEach((tx) => {
                         ctx.beginPath(); ctx.moveTo(tx - 3, PADDLE_Y); ctx.lineTo(tx + 3, PADDLE_Y); ctx.lineTo(tx, PADDLE_Y - 6); ctx.closePath(); ctx.fill();
                    });
               }

               // balls
               for (let i = 0; i < balls.length; i++) {
                    const b = balls[i];
                    const bgr = ctx.createRadialGradient(b.x - BALL_R * 0.4, b.y - BALL_R * 0.4, BALL_R * 0.15, b.x, b.y, BALL_R);
                    bgr.addColorStop(0, '#ffffff');
                    bgr.addColorStop(0.6, '#dbeafe');
                    bgr.addColorStop(1, '#60a5fa');
                    ctx.shadowBlur = 16; ctx.shadowColor = 'rgba(147,197,253,0.9)';
                    ctx.fillStyle = bgr;
                    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
               }

               // vignette
               const vig = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.35, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.85);
               vig.addColorStop(0, 'rgba(0,0,0,0)');
               vig.addColorStop(1, 'rgba(0,0,0,0.45)');
               ctx.fillStyle = vig;
               ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

               rafId = requestAnimationFrame(step);
          };

          rafId = requestAnimationFrame(step);

          // HUD sync (throttled, avoids per-frame React renders)
          const hudTimer = setInterval(() => {
               const now = performance.now();
               const p = powerRef.current;
               const powers = {};
               if (now < p.wide) powers.wide = Math.ceil((p.wide - now) / 1000);
               if (now < p.laser) powers.laser = Math.ceil((p.laser - now) / 1000);
               if (now < p.slow) powers.slow = Math.ceil((p.slow - now) / 1000);
               setHud({ score: scoreRef.current, lives: livesRef.current, stage: stageRef.current + 1, powers });
          }, 120);

          return () => {
               cancelAnimationFrame(rafId);
               clearInterval(hudTimer);
          };
     }, [gameStarted, gameOver, normalizeBall, playBounce, damageBrick, activatePower, resetBallsOnPaddle, triggerShake]);

     // ---- input listeners -------------------------------------------------
     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const canvas = canvasRef.current;

          const mapX = (clientX) => {
               const rect = canvas?.getBoundingClientRect();
               if (!rect || !rect.width) return null;
               return (clientX - rect.left) * (CANVAS_W / rect.width);
          };
          const onMove = (e) => {
               const cx = e.clientX ?? e.touches?.[0]?.clientX;
               if (cx == null) return;
               const x = mapX(cx);
               if (x != null) pointerXRef.current = Math.max(0, Math.min(CANVAS_W, x));
          };
          const onKeyDown = (e) => {
               if (e.key === 'ArrowLeft') keyDirRef.current = -1;
               else if (e.key === 'ArrowRight') keyDirRef.current = 1;
               else if (e.key === ' ' || e.code === 'Space') { fireQueuedRef.current = true; e.preventDefault(); }
          };
          const onKeyUp = (e) => {
               if ((e.key === 'ArrowLeft' && keyDirRef.current === -1) ||
                    (e.key === 'ArrowRight' && keyDirRef.current === 1)) keyDirRef.current = 0;
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('touchmove', onMove, { passive: true });
          window.addEventListener('keydown', onKeyDown);
          window.addEventListener('keyup', onKeyUp);
          return () => {
               window.removeEventListener('mousemove', onMove);
               window.removeEventListener('touchmove', onMove);
               window.removeEventListener('keydown', onKeyDown);
               window.removeEventListener('keyup', onKeyUp);
          };
     }, [gameStarted, gameOver]);

     // ---- cleanup timeouts on unmount ------------------------------------
     useEffect(() => {
          const timers = floatTimeoutsRef.current;
          return () => {
               timers.forEach((t) => clearTimeout(t));
               timers.clear();
          };
     }, []);

     // ---- touch control handlers -----------------------------------------
     const holdDir = (d) => () => { touchDirRef.current = d; };
     const releaseDir = () => { touchDirRef.current = 0; };
     const fire = () => { fireQueuedRef.current = true; };

     const powerMeta = {
          wide: { icon: Maximize2, label: '와이드', color: 'text-purple-300' },
          laser: { icon: Crosshair, label: '레이저', color: 'text-rose-300' },
          slow: { icon: Timer, label: '슬로우', color: 'text-sky-300' },
     };

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4 overflow-y-auto">
               <style>{`
                    @keyframes brickShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
                    .animate-brickshake { animation: brickShake 0.22s ease-in-out; }
                    @keyframes floatUp { 0%{opacity:0;transform:translateY(6px) scale(0.9)} 15%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-34px) scale(1)} }
                    .animate-floatup { animation: floatUp 1.6s ease-out forwards; }
               `}</style>

               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-5 md:p-8 border border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.2)] max-w-7xl w-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start ${shake ? 'animate-brickshake' : ''}`}>

                    {/* Left Panel */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-5">
                         <div className="flex justify-between items-center w-full">
                              <h2 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-400 drop-shadow-sm tracking-wider">강남 벽돌깨기</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-2.5 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="grid grid-cols-3 gap-3 w-full">
                              <div className="bg-black/40 p-3 rounded-2xl border border-blue-500/30">
                                   <div className="text-[10px] font-black text-cyan-400 tracking-[0.15em] mb-1">STAGE</div>
                                   <div className="text-2xl font-black text-white font-mono">{hud.stage}<span className="text-sm text-blue-400/70">/{PATTERNS.length}</span></div>
                              </div>
                              <div className="col-span-2 bg-black/40 p-3 rounded-2xl border border-blue-500/30">
                                   <div className="text-[10px] font-black text-cyan-400 tracking-[0.15em] mb-1">SCORE</div>
                                   <div className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">{hud.score.toLocaleString()}</div>
                              </div>
                         </div>

                         <div className="bg-black/40 p-3 rounded-2xl border border-blue-500/30 flex items-center justify-between">
                              <div className="text-[10px] font-black text-red-400 tracking-[0.15em]">LIVES</div>
                              <div className="flex items-center gap-1.5">
                                   {Array.from({ length: Math.max(3, hud.lives) }).map((_, i) => (
                                        <Heart key={i} className={`w-6 h-6 ${i < hud.lives ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'fill-transparent text-gray-700'}`} />
                                   ))}
                              </div>
                         </div>

                         {/* Active power-ups */}
                         <div className="flex gap-2 min-h-[2.5rem]">
                              {Object.keys(hud.powers).length === 0 && (
                                   <div className="text-blue-500/40 text-xs flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> 활성 파워업 없음</div>
                              )}
                              {Object.entries(hud.powers).map(([key, sec]) => {
                                   const m = powerMeta[key];
                                   if (!m) return null;
                                   const Icon = m.icon;
                                   return (
                                        <div key={key} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
                                             <Icon className={`w-4 h-4 ${m.color}`} />
                                             <span className={`text-xs font-bold ${m.color}`}>{m.label}</span>
                                             <span className="text-[11px] font-mono text-white/70">{sec}s</span>
                                        </div>
                                   );
                              })}
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-4 border border-blue-500/20 w-full hidden lg:block">
                              <div className="flex items-center gap-3 mb-3">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-44 overflow-y-auto pr-2">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-cyan-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-cyan-300 font-mono text-sm font-bold">{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-blue-500/50 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Board */}
                    <div className="w-full lg:w-2/3 flex flex-col items-center gap-3 relative [perspective:800px]">
                         <div className="relative rounded-3xl overflow-hidden border-2 border-blue-500/50 shadow-[0_35px_70px_rgba(0,0,0,0.65),0_0_50px_rgba(59,130,246,0.3)] bg-black/80 [transform:rotateX(3deg)] origin-bottom w-full" style={{ maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}>

                              <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="block w-full h-full touch-none" />

                              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                   style={{ backgroundImage: `linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)`, backgroundSize: `32px 32px` }} />

                              {/* +N ON floats */}
                              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-1">
                                   {floats.map((f) => (
                                        <div key={f.id} className="animate-floatup flex items-center gap-1 bg-yellow-400/90 text-black font-black px-3 py-1 rounded-full text-sm shadow-[0_0_20px_rgba(250,204,21,0.6)]">
                                             <Plus className="w-3.5 h-3.5" strokeWidth={3} />{f.amount} ON
                                        </div>
                                   ))}
                              </div>

                              {!gameStarted && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                        <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-5 drop-shadow-lg tracking-widest">강남 벽돌깨기</div>
                                        <div className="bg-gray-800/80 rounded-2xl p-5 mb-6 text-left max-w-sm border border-blue-500/20">
                                             <div className="text-sm font-black text-blue-400 mb-3 tracking-wider">🎯 플레이 방법</div>
                                             <ul className="text-gray-300 text-sm space-y-2 list-none">
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />마우스·터치·방향키로 패들 조작</li>
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />5개 스테이지의 모든 벽돌을 격파</li>
                                                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />캡슐을 받아 파워업 (멀티볼·레이저 등)</li>
                                                  <li className="flex items-center gap-2 text-yellow-300"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />스테이지 클리어·최고기록 시 ON 획득</li>
                                             </ul>
                                        </div>
                                        <button onClick={startGame} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                             <Play className="w-6 h-6 fill-white" /> START
                                        </button>
                                   </div>
                              )}

                              {gameStarted && gameOver && (
                                   <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <div className={`text-4xl md:text-5xl font-black mb-4 ${won ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]'}`}>{won ? 'CLEAR!' : 'GAME OVER'}</div>
                                        <div className="text-2xl text-white font-black mb-8 font-mono">Score: <span className="text-cyan-400">{hud.score.toLocaleString()}</span></div>
                                        <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                             <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                        </button>
                                   </div>
                              )}
                         </div>

                         {/* Touch controls */}
                         {gameStarted && !gameOver && (
                              <div className="flex items-center justify-center gap-3 w-full select-none lg:opacity-70">
                                   <button
                                        onPointerDown={holdDir(-1)} onPointerUp={releaseDir} onPointerLeave={releaseDir} onPointerCancel={releaseDir}
                                        className="flex-1 max-w-[140px] bg-white/5 active:bg-blue-500/30 border border-white/10 rounded-2xl py-4 text-white font-black text-xl backdrop-blur-md touch-none">◀</button>
                                   <button
                                        onPointerDown={fire}
                                        className="bg-rose-500/20 active:bg-rose-500/40 border border-rose-400/30 rounded-2xl px-6 py-4 text-rose-200 font-black backdrop-blur-md touch-none flex items-center gap-1">
                                        <Crosshair className="w-5 h-5" />
                                   </button>
                                   <button
                                        onPointerDown={holdDir(1)} onPointerUp={releaseDir} onPointerLeave={releaseDir} onPointerCancel={releaseDir}
                                        className="flex-1 max-w-[140px] bg-white/5 active:bg-blue-500/30 border border-white/10 rounded-2xl py-4 text-white font-black text-xl backdrop-blur-md touch-none">▶</button>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};

export default GangnamBrickBreaker;
