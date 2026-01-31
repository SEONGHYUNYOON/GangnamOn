import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy, Zap, Shield, Swords } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

// === CARD DEFINITIONS ===
const CARD_DEFS = {
     strike: { id: 'strike', name: '강타', cost: 1, type: 'attack', value: 6, desc: '피해 6', icon: '⚔️' },
     defend: { id: 'defend', name: '방어', cost: 1, type: 'block', value: 5, desc: '방어 5', icon: '🛡️' },
     bash: { id: 'bash', name: '내려찍기', cost: 2, type: 'attack', value: 10, desc: '피해 10', icon: '🔨' },
     slash: { id: 'slash', name: '베기', cost: 0, type: 'attack', value: 3, desc: '피해 3', icon: '🗡️' },
     ironWave: { id: 'ironWave', name: '철파도', cost: 1, type: 'skill', value: 5, block: 5, desc: '피해 5, 방어 5', icon: '🌊' },
};
const STARTER_DECK_IDS = ['strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'bash', 'slash', 'ironWave'];

// === ENEMY INTENTS ===
const INTENTS = {
     attack: { icon: '⚔️', label: '공격', color: 'text-red-400' },
     block: { icon: '🛡️', label: '방어', color: 'text-blue-400' },
     buff: { icon: '⬆️', label: '강화', color: 'text-yellow-400' },
     skip: { icon: '😤', label: '대기', color: 'text-gray-400' },
};

function makeCard(definitionId, instanceId) {
     const def = CARD_DEFS[definitionId];
     return def ? { ...def, instanceId } : null;
}

function shuffle(arr) {
     const a = [...arr];
     for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
     }
     return a;
}

const CardBattle = ({ onClose, user }) => {
     const [gameState, setGameState] = useState('idle'); // idle | playing | victory | defeat
     const [floor, setFloor] = useState(0);
     const [score, setScore] = useState(0); // total damage dealt or floors cleared
     const [rankList, setRankList] = useState(() => getRankTop10('cardbattle', true));

     const [player, setPlayer] = useState({ hp: 70, maxHp: 70, block: 0, energy: 3, maxEnergy: 3 });
     const [drawPile, setDrawPile] = useState([]);
     const [discardPile, setDiscardPile] = useState([]);
     const [hand, setHand] = useState([]);
     const [enemy, setEnemy] = useState(null);
     const [turnPhase, setTurnPhase] = useState('player'); // player | enemy
     const [message, setMessage] = useState(null);
     const instanceIdRef = React.useRef(0);

     const getNextInstanceId = () => ++instanceIdRef.current;

     const createEnemy = useCallback((floorLevel) => {
          const baseHp = 28 + floorLevel * 6;
          const intents = [
               { type: 'attack', value: 5 + Math.floor(floorLevel * 1.5) },
               { type: 'block', value: 4 + floorLevel },
               { type: 'buff', value: 2 },
               { type: 'skip' },
          ];
          const intent = intents[Math.floor(Math.random() * intents.length)];
          return {
               id: `enemy-${Date.now()}`,
               name: floorLevel === 0 ? '연습용 허수아비' : `적 Lv.${floorLevel + 1}`,
               hp: baseHp,
               maxHp: baseHp,
               block: 0,
               strength: 0,
               intent,
          };
     }, []);

     const initDeck = useCallback(() => {
          const cards = STARTER_DECK_IDS.map((id) => makeCard(id, getNextInstanceId())).filter(Boolean);
          return shuffle(cards);
     }, []);

     const startRun = useCallback(() => {
          const deck = initDeck();
          const draw = deck.slice(0, 5);
          const rest = shuffle(deck.slice(5));
          const firstEnemy = createEnemy(0);

          setGameState('playing');
          setFloor(1);
          setScore(0);
          setPlayer({ hp: 70, maxHp: 70, block: 0, energy: 3, maxEnergy: 3 });
          setDrawPile(rest);
          setDiscardPile([]);
          setHand(draw.map((c) => ({ ...c, instanceId: getNextInstanceId() })));
          setEnemy(firstEnemy);
          setTurnPhase('player');
          setMessage(null);
          setRankList(getRankTop10('cardbattle', true));
     }, [initDeck, createEnemy]);

     const drawCards = useCallback((count) => {
          setDrawPile((pile) => {
               setDiscardPile((discard) => {
                    let drawn = 0;
                    let newPile = [...pile];
                    const newHand = [];
                    while (drawn < count && (newPile.length > 0 || discard.length > 0)) {
                         if (newPile.length === 0) {
                              newPile = shuffle(discard);
                              discard = [];
                         }
                         const card = newPile.pop();
                         if (card) {
                              newHand.push({ ...card, instanceId: getNextInstanceId() });
                              drawn++;
                         }
                    }
                    setHand((h) => [...h, ...newHand]);
                    return discard;
               });
               return newPile;
          });
     }, []);

     const playCard = useCallback((card, indexInHand) => {
          if (turnPhase !== 'player' || !enemy) return;
          const def = CARD_DEFS[card.id];
          if (!def || player.energy < def.cost) return;

          setPlayer((p) => ({ ...p, energy: p.energy - def.cost }));
          setHand((h) => h.filter((_, i) => i !== indexInHand));
          setDiscardPile((d) => [...d, { ...card }]);

          if (def.type === 'attack' || (def.type === 'skill' && def.value)) {
               const baseDmg = def.value || 0;
               setEnemy((e) => {
                    if (!e) return e;
                    const dmg = baseDmg;
                    const actual = Math.max(0, dmg - (e.block || 0));
                    const newBlock = Math.max(0, (e.block || 0) - dmg);
                    const newHp = Math.max(0, e.hp - actual);
                    setScore((s) => s + actual);
                    setMessage(actual > 0 ? `-${actual}` : '막힘');
                    setTimeout(() => setMessage(null), 600);
                    return { ...e, hp: newHp, block: newBlock };
               });
          }
          if (def.type === 'block' || (def.type === 'skill' && def.block)) {
               const block = def.block ?? def.value ?? 0;
               setPlayer((p) => ({ ...p, block: p.block + block }));
               setMessage(`+${block} 방어`);
               setTimeout(() => setMessage(null), 600);
          }
     }, [turnPhase, enemy, player.energy]);

     const endTurn = useCallback(() => {
          if (turnPhase !== 'player' || !enemy) return;
          setTurnPhase('enemy');
          setHand((h) => {
               setDiscardPile((d) => [...d, ...h]);
               return [];
          });

          setTimeout(() => {
               setEnemy((e) => {
                    if (!e || !e.intent) return e;
                    const intent = e.intent;
                    if (intent.type === 'attack') {
                         setPlayer((p) => {
                              const dmg = Math.max(0, (intent.value || 0) - p.block);
                              const newBlock = Math.max(0, p.block - (intent.value || 0));
                              if (dmg > 0) setMessage(`적이 ${dmg} 피해!`);
                              return { ...p, hp: Math.max(0, p.hp - dmg), block: newBlock };
                         });
                    } else if (intent.type === 'block') {
                         setEnemy((ev) => ({ ...ev, block: (ev.block || 0) + (intent.value || 0) }));
                    } else if (intent.type === 'buff') {
                         setEnemy((ev) => ({ ...ev, strength: (ev.strength || 0) + (intent.value || 2) }));
                    }
                    return e;
               });
          }, 400);

          setTimeout(() => {
               setPlayer((p) => ({ ...p, block: 0, energy: p.maxEnergy }));
               setTurnPhase('player');
               setDiscardPile((discard) => {
                    setDrawPile((pile) => {
                         const combined = [...pile, ...discard];
                         const shuffled = shuffle(combined);
                         const drawCount = Math.min(5, shuffled.length);
                         const drawn = shuffled.slice(0, drawCount).map((c) => ({ ...c, instanceId: getNextInstanceId() }));
                         const rest = shuffled.slice(drawCount);
                         setHand(drawn);
                         return rest;
                    });
                    return [];
               });
          }, 1000);
     }, [turnPhase, enemy]);

     useEffect(() => {
          if (gameState !== 'playing' || !enemy || enemy.hp > 0) return;
          const nextFloor = floor + 1;
          const nextEnemy = createEnemy(nextFloor - 1);
          setFloor(nextFloor);
          setEnemy(nextEnemy);
          setPlayer((p) => ({ ...p, energy: p.maxEnergy }));
          setMessage('다음 층!');
          setTimeout(() => setMessage(null), 1200);
          setHand((h) => {
               setDiscardPile((d) => {
                    const allDiscard = [...d, ...h];
                    setDrawPile((pile) => {
                         const combined = [...pile, ...allDiscard];
                         const shuffled = shuffle(combined);
                         const drawn = shuffled.slice(0, 5).map((c) => ({ ...c, instanceId: getNextInstanceId() }));
                         const rest = shuffled.slice(5);
                         setHand(drawn);
                         return rest;
                    });
                    return [];
               });
               return [];
          });
     }, [gameState, enemy?.hp, floor, createEnemy]);

     useEffect(() => {
          if (gameState !== 'playing') return;
          if (player.hp <= 0) {
               setGameState('defeat');
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               addScore('cardbattle', name, score, true);
               setRankList(getRankTop10('cardbattle', true));
          }
     }, [gameState, player.hp, score, user]);

     const canPlay = (card) => turnPhase === 'player' && player.energy >= (CARD_DEFS[card.id]?.cost ?? 0);

     return (
          <div className="min-h-full py-6 px-4 flex flex-col bg-gradient-to-b from-slate-900 to-black text-white max-w-4xl mx-auto w-full">
               <div className="flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                         <ArrowLeft className="w-6 h-6 text-gray-300" />
                    </button>
                    <h2 className="text-xl font-black tracking-wider">카드 배틀</h2>
                    <div className="flex items-center gap-4">
                         <span className="bg-amber-600/80 px-3 py-1 rounded-lg font-black text-sm">층 {floor}</span>
                         <span className="bg-purple-600 px-3 py-1 rounded-lg font-black text-sm">{score}</span>
                    </div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row flex-1 min-h-0">
                    <div className="flex-1 flex flex-col rounded-2xl border-2 border-slate-600 overflow-hidden bg-slate-800/50 min-h-[320px]">
                         {/* Enemy */}
                         <div className="p-6 border-b border-slate-600 flex items-center justify-between">
                              <div>
                                   <div className="text-lg font-bold text-slate-300">{enemy?.name ?? '—'}</div>
                                   <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-2">
                                             <span className="text-red-400 font-mono font-black text-2xl">{enemy?.hp ?? 0}</span>
                                             <span className="text-slate-500">/ {enemy?.maxHp ?? 0}</span>
                                        </div>
                                        {enemy?.block > 0 && (
                                             <span className="bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded font-bold text-sm flex items-center gap-1">
                                                  <Shield className="w-3 h-3" /> {enemy.block}
                                             </span>
                                        )}
                                        {enemy?.strength > 0 && (
                                             <span className="bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded text-sm">⬆️ {enemy.strength}</span>
                                        )}
                                   </div>
                              </div>
                              {enemy?.intent && (
                                   <div className={`text-right font-bold ${INTENTS[enemy.intent.type]?.color ?? 'text-gray-400'}`}>
                                        <div className="text-2xl">{INTENTS[enemy.intent.type]?.icon ?? '?'}</div>
                                        <div className="text-xs">
                                             {enemy.intent.type === 'attack' && `${enemy.intent.value} 피해`}
                                             {enemy.intent.type === 'block' && `방어 +${enemy.intent.value}`}
                                             {enemy.intent.type === 'buff' && `힘 +${enemy.intent.value}`}
                                             {enemy.intent.type === 'skip' && '아무것도 안 함'}
                                        </div>
                                   </div>
                              )}
                         </div>

                         {/* Message */}
                         {message && (
                              <div className="text-center py-2 text-yellow-300 font-black animate-pulse">{message}</div>
                         )}

                         {/* Player */}
                         <div className="p-4 flex items-center justify-between border-t border-slate-600 mt-auto">
                              <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2">
                                        <span className="text-red-400 font-mono font-black text-xl">{player.hp}</span>
                                        <span className="text-slate-500">/ {player.maxHp}</span>
                                   </div>
                                   {player.block > 0 && (
                                        <span className="bg-blue-500/30 text-blue-200 px-2 py-1 rounded font-bold flex items-center gap-1">
                                             <Shield className="w-4 h-4" /> {player.block}
                                        </span>
                                   )}
                                   <span className="bg-amber-500/30 text-amber-200 px-2 py-1 rounded font-bold flex items-center gap-1">
                                        <Zap className="w-4 h-4" /> {player.energy} / {player.maxEnergy}
                                   </span>
                              </div>
                              <button
                                   onClick={endTurn}
                                   disabled={turnPhase !== 'player'}
                                   className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold py-2 px-6 rounded-xl transition-colors"
                              >
                                   턴 종료
                              </button>
                         </div>
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600 w-full lg:w-56 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs font-bold text-gray-400 tracking-wider">TOP 10</span>
                         </div>
                         <div className="space-y-1.5 max-h-72 overflow-y-auto">
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

               {/* Hand */}
               {gameState === 'playing' && (
                    <div className="mt-6 flex flex-wrap justify-center gap-3 min-h-[120px]">
                         {hand.map((card, i) => {
                              const def = CARD_DEFS[card.id];
                              const playable = canPlay(card);
                              return (
                                   <button
                                        key={`${card.instanceId}-${i}`}
                                        onClick={() => playCard(card, i)}
                                        disabled={!playable}
                                        className={`w-24 rounded-xl border-2 p-2 text-left transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                                             ${def?.type === 'attack' ? 'border-red-500/60 bg-red-900/30' : def?.type === 'block' ? 'border-blue-500/60 bg-blue-900/30' : 'border-amber-500/60 bg-amber-900/30'}
                                             ${playable ? 'cursor-pointer hover:border-white/80' : 'cursor-not-allowed'}`}
                                   >
                                        <div className="flex justify-between items-start">
                                             <span className="text-lg">{def?.icon ?? '?'}</span>
                                             <span className="text-amber-300 font-mono text-xs">{def?.cost ?? 0}</span>
                                        </div>
                                        <div className="text-xs font-bold truncate mt-1">{def?.name ?? card.id}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{def?.desc ?? ''}</div>
                                   </button>
                              );
                         })}
                    </div>
               )}

               {/* Idle */}
               {gameState === 'idle' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                         <div className="text-3xl font-black mb-2">카드 배틀</div>
                         <div className="text-slate-400 text-sm mb-6 text-center max-w-sm">덱을 짜고, 카드를 내서 적을 쓰러뜨리세요.<br />층을 올릴수록 점수가 올라갑니다.</div>
                         <button onClick={startRun} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full shadow-lg flex items-center gap-2">
                              <Play className="w-5 h-5" /> 시작하기
                         </button>
                    </div>
               )}

               {/* Victory - optional: continue or end run for score */}
               {gameState === 'victory' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                         <div className="text-3xl font-black text-yellow-400 mb-2">승리!</div>
                         <div className="text-xl text-slate-300 mb-6">Score: {score}</div>
                         <button onClick={startRun} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2">
                              <RotateCw className="w-5 h-5" /> 다시 하기
                         </button>
                    </div>
               )}

               {/* Defeat */}
               {gameState === 'defeat' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                         <div className="text-3xl font-black text-red-400 mb-2">패배</div>
                         <div className="text-xl text-slate-300 mb-2">층 {floor} · Score: {score}</div>
                         <div className="text-slate-500 text-sm mb-6">TOP 10에 기록됐어요!</div>
                         <button onClick={startRun} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2">
                              <RotateCw className="w-5 h-5" /> 다시 하기
                         </button>
                    </div>
               )}
          </div>
     );
};

export default CardBattle;
