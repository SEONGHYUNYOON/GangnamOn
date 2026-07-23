import React, { useState, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play, CheckCircle } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

const EMOJIS = ['🏙️', '🚕', '🥟', '🏢', '🌃', '🚇', '🎡', '🌉'];

const calcScore = (attempts, seconds) => Math.max(100, 1000 - attempts * 25 - seconds * 3);

const GangnamMemoryMatch = ({ onClose, user }) => {
     const [cards, setCards] = useState(() => {
          const shuffled = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
          return shuffled.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
     });
     const [flipped, setFlipped] = useState([]);
     const [attempts, setAttempts] = useState(0);
     const [started, setStarted] = useState(false);
     const [startTime, setStartTime] = useState(null);
     const [done, setDone] = useState(false);
     const [finalScore, setFinalScore] = useState(0);
     const [rankList, setRankList] = useState(() => getRankTop10('memory', true));
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
     const [shake, setShake] = useState(false);

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 200);
     };

     const reset = useCallback(() => {
          playSound('click');
          const shuffled = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
          setCards(shuffled.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false })));
          setFlipped([]);
          setAttempts(0);
          setStarted(false);
          setDone(false);
          setFinalScore(0);
          setRankList(getRankTop10('memory', true));
     }, []);

     const start = () => {
          playSound('click');
          const shuffled = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
          setCards(shuffled.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false })));
          setFlipped([]);
          setAttempts(0);
          setDone(false);
          setFinalScore(0);
          setStarted(true);
          setStartTime(Date.now());
          setRankList(getRankTop10('memory', true));
     };

     const handleFlip = (id) => {
          if (!started || done) return;
          const card = cards.find(c => c.id === id);
          if (!card || card.flipped || card.matched || flipped.length >= 2) return;

          playSound('click');
          const next = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
          const nextFlipped = [...flipped, id];
          setCards(next);
          setFlipped(nextFlipped);

          if (nextFlipped.length === 2) {
               setAttempts(a => a + 1);
               const [a, b] = nextFlipped.map(i => next.find(c => c.id === i));
               if (a.emoji === b.emoji) {
                    setTimeout(() => {
                         playSound('pop');
                         setCards(prev => {
                              const updated = prev.map(c => (c.id === a.id || c.id === b.id) ? { ...c, matched: true, flipped: true } : c);
                              if (updated.every(c => c.matched)) {
                                   playSound('win');
                                   const sec = Math.round((Date.now() - startTime) / 1000);
                                   const sc = calcScore(attempts + 1, sec);
                                   setFinalScore(sc);
                                   setDone(true);
                                   addScore('memory', name, sc, true);
                                   setRankList(getRankTop10('memory', true));
                              }
                              return updated;
                         });
                         setFlipped([]);
                    }, 400);
               } else {
                    setTimeout(() => {
                         playSound('wrong');
                         triggerShake();
                         setCards(prev => prev.map(c => (c.id === a.id || c.id === b.id) ? { ...c, flipped: false } : c));
                         setFlipped([]);
                    }, 700);
               }
          }
     };

     const elapsed = started && startTime && !done ? Math.round((Date.now() - startTime) / 1000) : 0;

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* 카드 매치/셰이크 이펙트 키프레임 (이 컴포넌트 전용) */}
               <style>{`
                    @keyframes mmMatchGlow {
                         0% { box-shadow: 0 0 0 rgba(217, 70, 239, 0); }
                         50% { box-shadow: 0 0 30px rgba(217, 70, 239, 0.8); }
                         100% { box-shadow: 0 0 12px rgba(217, 70, 239, 0.3); }
                    }
                    @keyframes mmShake {
                         0%, 100% { transform: translateX(0); }
                         25% { transform: translateX(-5px); }
                         75% { transform: translateX(5px); }
                    }
                    .mm-shake { animation: mmShake 0.2s ease-in-out; }
               `}</style>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-900/20 rounded-full blur-[120px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-fuchsia-500/30 shadow-[0_0_60px_rgba(217,70,239,0.2)] max-w-6xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'mm-shake' : ''}`}>

                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400 tracking-wider">NEON MATCH</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 via-pink-400 to-rose-400 drop-shadow-sm leading-tight">NEON<br/>MATCH</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="flex flex-row lg:flex-col gap-4 w-full">
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-fuchsia-500/30 shadow-[inset_0_0_15px_rgba(217,70,239,0.1)]">
                                   <div className="text-xs font-black text-fuchsia-400 tracking-[0.2em] mb-1">ATTEMPTS</div>
                                   <div className="text-4xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 to-pink-300">
                                        {attempts}
                                   </div>
                              </div>
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-fuchsia-500/30 shadow-[inset_0_0_15px_rgba(217,70,239,0.1)]">
                                   <div className="text-xs font-black text-pink-400 tracking-[0.2em] mb-1">TIME</div>
                                   <div className="text-4xl font-black font-mono text-pink-400">
                                        {elapsed}s
                                   </div>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-fuchsia-500/20 w-full flex-1 hidden lg:block">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-fuchsia-500/10 transition-colors">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-fuchsia-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-fuchsia-300 font-mono text-sm font-bold">{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-fuchsia-500/50 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Board */}
                    <div className="w-full lg:w-2/3 flex justify-center relative min-h-[400px]">

                         {/* Grid Board — 카드마다 원근감을 주는 3D 필드 */}
                         <div className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-md bg-black/60 p-4 md:p-6 rounded-3xl border-2 border-fuchsia-500/30 shadow-[0_0_40px_rgba(217,70,239,0.15),inset_0_2px_12px_rgba(0,0,0,0.6)]">
                              {cards.map(c => (
                                   <button
                                        key={c.id}
                                        onClick={() => handleFlip(c.id)}
                                        disabled={!started || c.matched || done}
                                        className="relative aspect-square [perspective:1000px] group disabled:cursor-default"
                                   >
                                        {/* 회전축 래퍼 — 진짜 3D 카드 플립 */}
                                        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${(c.flipped || c.matched) ? '[transform:rotateY(180deg)]' : ''} ${c.matched ? 'scale-95' : ''}`}>

                                             {/* 뒷면 (물음표) */}
                                             <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl md:rounded-3xl border-2 border-gray-600 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 flex items-center justify-center text-3xl md:text-4xl font-black text-fuchsia-300/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-4px_8px_rgba(0,0,0,0.5),0_6px_14px_rgba(0,0,0,0.5)] transition-colors group-hover:border-fuchsia-400/70">
                                                  {/* 뒷면 광택 */}
                                                  <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_55%)] pointer-events-none" />
                                                  ?
                                             </div>

                                             {/* 앞면 (이모지) */}
                                             <div
                                                  className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl md:rounded-3xl border-2 flex items-center justify-center text-4xl md:text-5xl
                                                       ${c.matched
                                                            ? 'bg-fuchsia-900/50 border-fuchsia-500/50 opacity-60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'
                                                            : 'bg-gradient-to-br from-fuchsia-600 to-pink-600 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.5),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-4px_10px_rgba(0,0,0,0.3)]'}`}
                                                  style={c.matched ? { animation: 'mmMatchGlow 0.5s ease-out both' } : undefined}
                                             >
                                                  {/* 앞면 광택 */}
                                                  <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.22),transparent_60%)] pointer-events-none" />
                                                  <span className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">{c.emoji}</span>
                                             </div>
                                        </div>
                                   </button>
                              ))}
                         </div>

                         {/* Overlays */}
                         {!started && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl">
                                   <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400 mb-6 drop-shadow-lg tracking-widest">NEON MATCH</div>
                                   <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-sm border border-fuchsia-500/20">
                                        <div className="text-sm font-black text-fuchsia-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                        <ul className="text-gray-300 text-sm space-y-2 list-none">
                                             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full"/>카드를 뒤집어 같은 그림 짝을 찾으세요</li>
                                             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-pink-500 rounded-full"/>시도 횟수와 클리어 시간이 짧을수록 고득점!</li>
                                             <li className="flex items-center gap-2 text-rose-400"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"/>틀리면 카드가 다시 뒤집어집니다</li>
                                        </ul>
                                   </div>
                                   <button onClick={start} className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                        <Play className="w-6 h-6 fill-white" /> START
                                   </button>
                              </div>
                         )}

                         {started && done && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                                   <div className="text-5xl font-black text-emerald-400 mb-4 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)] flex items-center gap-3"><CheckCircle className="w-12 h-12" /> CLEARED!</div>
                                   <div className="text-2xl text-white font-black mb-2 font-mono">Final Score: <span className="text-fuchsia-400">{finalScore}</span></div>
                                   <div className="text-gray-400 mb-8 font-bold">{attempts} attempts in {elapsed}s</div>
                                   <button onClick={reset} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                        <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                   </button>
                              </div>
                         )}
                    </div>
               </div>
          </div>
     );
};

export default GangnamMemoryMatch;
