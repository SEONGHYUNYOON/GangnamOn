import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const WORDS = ['강남역', '역삼동', '테헤란로', '삼성동', '청담동', '압구정', '신사동', '논현동', '코엑스', '봉은사', '선릉역', '개포동', '수서역', '도곡동', '반포동'];
const FALL_SPEED = 1.2;
const SPAWN_INTERVAL = 2200;
const GAME_W = 420;
const GAME_H = 380;
const MAX_MISS = 5;

const GangnamTypingGame = ({ onClose, user }) => {
     const [words, setWords] = useState([]);
     const [input, setInput] = useState('');
     const [score, setScore] = useState(0);
     const [miss, setMiss] = useState(0);
     const [gameStarted, setGameStarted] = useState(false);
     const [gameOver, setGameOver] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('typing', true));
     const wordsRef = useRef([]);
     const frameRef = useRef(0);

     const startGame = useCallback(() => {
          setWords([]);
          wordsRef.current = [];
          setInput('');
          setScore(0);
          setMiss(0);
          setGameOver(false);
          setGameStarted(true);
          setRankList(getRankTop10('typing', true));
     }, []);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const spawn = () => {
               const word = WORDS[Math.floor(Math.random() * WORDS.length)];
               const id = Date.now() + Math.random();
               wordsRef.current = [...wordsRef.current, { id, word, y: 0 }];
               setWords(wordsRef.current.slice());
          };
          const t = setInterval(spawn, SPAWN_INTERVAL);
          return () => clearInterval(t);
     }, [gameStarted, gameOver]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const loop = () => {
               frameRef.current = requestAnimationFrame(loop);
               wordsRef.current = wordsRef.current.map(w => ({ ...w, y: w.y + FALL_SPEED })).filter(w => {
                    if (w.y > GAME_H - 30) {
                         setMiss(m => {
                              if (m + 1 >= MAX_MISS) setGameOver(true);
                              return m + 1;
                         });
                         return false;
                    }
                    return true;
               });
               setWords(wordsRef.current.slice());
          };
          frameRef.current = requestAnimationFrame(loop);
          return () => cancelAnimationFrame(frameRef.current);
     }, [gameStarted, gameOver]);

     useEffect(() => {
          if (!gameStarted || gameOver || !input.trim()) return;
          const trimmed = input.trim();
          const idx = wordsRef.current.findIndex(w => w.word === trimmed);
          if (idx >= 0) {
               setScore(s => s + trimmed.length * 10);
               wordsRef.current = wordsRef.current.filter((_, i) => i !== idx);
               setWords(wordsRef.current.slice());
               setInput('');
          }
     }, [input, gameStarted, gameOver]);

     useEffect(() => {
          if (gameOver && gameStarted) {
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               addScore('typing', name, score, true);
               setRankList(getRankTop10('typing', true));
          }
     }, [gameOver, gameStarted, score, user]);

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-indigo-950/50 to-black text-white max-w-6xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <h2 className="text-xl font-black tracking-wider">격파</h2>
                    <div className="flex items-center gap-4">
                         <span className="bg-red-600/80 px-3 py-1 rounded-lg font-black text-sm">❌ {miss}/{MAX_MISS}</span>
                         <span className="bg-purple-600 px-3 py-1 rounded-lg font-black text-sm">{score}</span>
                    </div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="flex-1 flex flex-col items-center">
                         <div className="relative rounded-2xl border-2 border-indigo-500/50 overflow-hidden bg-gray-900/80" style={{ width: GAME_W, height: GAME_H }}>
                              {words.map(w => (
                                   <div key={w.id} className="absolute left-4 text-xl font-bold text-indigo-200" style={{ top: w.y }}>{w.word}</div>
                              ))}

                              {!gameStarted && (
                                   <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                                        <div className="text-2xl font-black mb-3">격파</div>
                                        <div className="bg-indigo-900/80 rounded-xl p-4 mb-5 text-left max-w-xs">
                                             <div className="text-xs font-bold text-indigo-300 mb-2">🎯 게임 방법</div>
                                             <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside">
                                                  <li>위에서 단어가 떨어집니다</li>
                                                  <li>하단 입력창에 단어를 정확히 입력!</li>
                                                  <li>맞추면 점수 획득, 글자수 × 10점</li>
                                                  <li>5개 놓치면 게임 오버</li>
                                             </ul>
                                        </div>
                                        <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full flex items-center gap-2"><Play className="w-5 h-5" /> 시작하기</button>
                                   </div>
                              )}

                              {gameStarted && gameOver && (
                                   <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                                        <div className="text-3xl font-black mb-2">GAME OVER</div>
                                        <div className="text-xl text-yellow-400 font-bold mb-6">Score: {score}</div>
                                        <button onClick={startGame} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2"><RotateCw className="w-5 h-5" /> 다시 하기</button>
                                   </div>
                              )}
                         </div>

                         {gameStarted && !gameOver && (
                              <input
                                   type="text"
                                   value={input}
                                   onChange={e => setInput(e.target.value)}
                                   placeholder="단어 입력 후 Enter"
                                   className="mt-4 w-full max-w-md px-4 py-3 rounded-xl bg-gray-800 border-2 border-indigo-500 text-white placeholder-gray-500 text-center font-bold focus:outline-none focus:border-indigo-400"
                                   autoFocus
                              />
                         )}
                    </div>

                    <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-600 w-full lg:w-56 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-gray-400 tracking-wider">TOP 10</span></div>
                         <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {rankList.map((e, i) => (
                                   <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                             <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${e.rank === 1 ? 'bg-yellow-500 text-black' : e.rank === 2 ? 'bg-gray-400 text-black' : e.rank === 3 ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'}`}>{e.rank}</span>
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

export default GangnamTypingGame;
