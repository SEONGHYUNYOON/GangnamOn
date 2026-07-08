import React, { useState, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import GameHelpDropdown from './GameHelpDropdown';

const EMOJIS = ['🏙️', '🚕', '🥟', '🏢', '🌃', '🚇', '🎡', '🏙️'];

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

     const reset = useCallback(() => {
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

          const next = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
          const nextFlipped = [...flipped, id];
          setCards(next);
          setFlipped(nextFlipped);

          if (nextFlipped.length === 2) {
               setAttempts(a => a + 1);
               const [a, b] = nextFlipped.map(i => next.find(c => c.id === i));
               if (a.emoji === b.emoji) {
                    setTimeout(() => {
                         setCards(prev => {
                              const updated = prev.map(c => (c.id === a.id || c.id === b.id) ? { ...c, matched: true, flipped: true } : c);
                              if (updated.every(c => c.matched)) {
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
                         setCards(prev => prev.map(c => (c.id === a.id || c.id === b.id) ? { ...c, flipped: false } : c));
                         setFlipped([]);
                    }, 700);
               }
          }
     };

     const elapsed = started && startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-6xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <div className="flex items-center gap-1.5">
                         <h2 className="text-xl font-black tracking-wider">추억의 짝맞추기</h2>
                         <GameHelpDropdown accent="pink">
                              <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside leading-relaxed">
                                   <li>카드를 눌러 뒤집고 <b className="text-white">같은 이모지 2장</b>을 찾아요</li>
                                   <li>8쌍(16장)을 모두 맞추면 클리어!</li>
                                   <li>시간·시도 횟수가 적을수록 점수가 높아요</li>
                              </ul>
                         </GameHelpDropdown>
                    </div>
                    <div className="w-24 text-right text-xs text-gray-400">{started ? `${attempts}회 · ${elapsed}s` : ''}</div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="flex-1 max-w-sm w-full">
                         {!started ? (
                              <div className="text-center py-12">
                                   <button onClick={start} className="bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto"><Play className="w-5 h-5" /> 시작하기</button>
                              </div>
                         ) : (
                              <>
                                   <div className="grid grid-cols-4 gap-2">
                                        {cards.map(c => (
                                             <button
                                                  key={c.id}
                                                  onClick={() => handleFlip(c.id)}
                                                  disabled={c.matched}
                                                  className={`aspect-square rounded-xl text-2xl font-bold transition-all border-2
                                                       ${c.matched ? 'bg-green-900/40 border-green-500/50 opacity-60' : ''}
                                                       ${c.flipped || c.matched ? 'bg-gray-700 border-purple-500' : 'bg-gray-800 border-gray-600 hover:border-purple-400'}`}
                                             >
                                                  {(c.flipped || c.matched) ? c.emoji : '?'}
                                             </button>
                                        ))}
                                   </div>
                                   {done && (
                                        <div className="mt-4 bg-green-900/30 border border-green-500/40 rounded-2xl p-4 text-center">
                                             <p className="font-black text-green-300">완료! 점수 {finalScore}</p>
                                             <button onClick={reset} className="mt-3 bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto"><RotateCw className="w-4 h-4" /> 다시하기</button>
                                        </div>
                                   )}
                              </>
                         )}
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

export default GangnamMemoryMatch;
