import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy, Keyboard } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

const WORDS = ['강남역', '역삼동', '테헤란로', '삼성동', '청담동', '압구정', '신사동', '논현동', '코엑스', '봉은사', '선릉역', '개포동', '수서역', '도곡동', '반포동', '대치동', '양재역', '신논현'];
const FALL_SPEED = 0.5;
const SPAWN_INTERVAL = 2000;
const GAME_W = 460;
const GAME_H = 420;
const MAX_MISS = 5;

const GangnamTypingGame = ({ onClose, user }) => {
     const [words, setWords] = useState([]);
     const [input, setInput] = useState('');
     const [score, setScore] = useState(0);
     const [miss, setMiss] = useState(0);
     const [totalChars, setTotalChars] = useState(0);
     const [startTime, setStartTime] = useState(0);
     const [cpm, setCpm] = useState(0);
     const [gameStarted, setGameStarted] = useState(false);
     const [gameOver, setGameOver] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('typing', true));
     const [shake, setShake] = useState(false);
     const wordsRef = useRef([]);
     const frameRef = useRef(0);
     const inputRef = useRef(null);
     const lastTickRef = useRef(0); // 타건음 스로틀
     const lastWrongRef = useRef(0); // 오타음 스로틀

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 300);
     };

     const startGame = useCallback(() => {
          playSound('click'); // 시작 버튼음
          setWords([]);
          wordsRef.current = [];
          setInput('');
          setScore(0);
          setMiss(0);
          setTotalChars(0);
          setStartTime(Date.now());
          setCpm(0);
          setGameOver(false);
          setGameStarted(true);
          setRankList(getRankTop10('typing', true));
          setTimeout(() => inputRef.current?.focus(), 100);
     }, []);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const spawn = () => {
               const word = WORDS[Math.floor(Math.random() * WORDS.length)];
               const id = Date.now() + Math.random();
               // Random horizontal position, keeping text within bounds (roughly)
               const x = 20 + Math.random() * (GAME_W - 120);
               wordsRef.current = [...wordsRef.current, { id, word, y: 0, x }];
               setWords(wordsRef.current.slice());
          };
          const t = setInterval(spawn, SPAWN_INTERVAL);
          return () => clearInterval(t);
     }, [gameStarted, gameOver]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          const loop = () => {
               frameRef.current = requestAnimationFrame(loop);

               // Adjust speed based on score to increase difficulty
               const currentSpeed = FALL_SPEED + (score / 500);

               // Update CPM
               if (startTime > 0) {
                    const elapsedMin = (Date.now() - startTime) / 60000;
                    if (elapsedMin > 0) {
                         setCpm(Math.floor(totalChars / elapsedMin));
                    }
               }

               wordsRef.current = wordsRef.current.map(w => ({ ...w, y: w.y + currentSpeed })).filter(w => {
                    if (w.y > GAME_H - 40) {
                         playSound('explosion'); // 단어 낙하 미스
                         triggerShake();
                         setMiss(m => {
                              if (m + 1 >= MAX_MISS) {
                                   setGameOver(true);
                              }
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
     }, [gameStarted, gameOver, score]);

     useEffect(() => {
          if (!gameStarted || gameOver || !input.trim()) return;
          const trimmed = input.trim();
          const idx = wordsRef.current.findIndex(w => w.word === trimmed);
          if (idx >= 0) {
               playSound('score'); // 단어 완성
               setScore(s => s + trimmed.length * 10);
               setTotalChars(prev => prev + trimmed.length);
               wordsRef.current = wordsRef.current.filter((_, i) => i !== idx);
               setWords(wordsRef.current.slice());
               setInput('');
          }
     }, [input, gameStarted, gameOver]);

     useEffect(() => {
          if (gameOver && gameStarted) {
               playSound('gameover');
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               if (score > 0) addScore('typing', name, score, true);
               setRankList(getRankTop10('typing', true));
          }
     }, [gameOver, gameStarted, score, user]);

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* 3D 연출용 키프레임 (컴포넌트 스코프) */}
               <style>{`
                    @keyframes tgPop { 0% { transform: scale(1.35); } 100% { transform: scale(1); } }
                    .tg-pop { animation: tgPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
                    @keyframes tgWordIn { 0% { opacity: 0; transform: scale(0.5) translateY(-8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                    .tg-word { animation: tgWordIn 0.25s ease-out both; }
                    @keyframes tgShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
                    .tg-shake { animation: tgShake 0.3s ease-in-out; }
               `}</style>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-900/20 rounded-full blur-[120px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-pink-500/30 shadow-[0_0_80px_rgba(236,72,153,0.2)] max-w-7xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'tg-shake' : ''}`}>

                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 tracking-wider">NEON TYPER</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-400 via-fuchsia-400 to-purple-500 drop-shadow-sm">NEON<br/>TYPER</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="flex flex-row lg:flex-col gap-4 w-full">
                              <div className="flex-1 bg-black/40 p-5 rounded-2xl border border-pink-500/30 shadow-[inset_0_0_15px_rgba(236,72,153,0.1)]">
                                   <div className="text-xs font-black text-pink-400 tracking-[0.2em] mb-1">SCORE</div>
                                   <div key={score} className="tg-pop text-4xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-purple-300">
                                        {score.toLocaleString()}
                                   </div>
                              </div>
                              <div className={`flex-1 bg-black/40 p-5 rounded-2xl border ${miss >= MAX_MISS - 1 ? 'border-red-500 animate-pulse shadow-[inset_0_0_15px_rgba(239,68,68,0.3)]' : 'border-pink-500/30 shadow-[inset_0_0_15px_rgba(236,72,153,0.1)]'}`}>
                                   <div className="text-xs font-black text-red-400 tracking-[0.2em] mb-1">MISSES</div>
                                   <div key={miss} className="tg-pop text-4xl font-black font-mono text-red-400">
                                        {miss} <span className="text-xl text-red-900">/ {MAX_MISS}</span>
                                   </div>
                              </div>
                         </div>

                         <div className="bg-black/40 p-5 rounded-2xl border border-pink-500/30 shadow-[inset_0_0_15px_rgba(236,72,153,0.1)] w-full">
                              <div className="text-xs font-black text-purple-400 tracking-[0.2em] mb-1">SPEED (타수)</div>
                              <div className="text-3xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-300">
                                   {cpm} <span className="text-sm font-sans text-purple-500">타/분</span>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-pink-500/20 w-full flex-1 hidden lg:block">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10 TYPERS</span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-pink-500/10 transition-colors">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-pink-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-pink-300 font-mono text-sm font-bold">{e.score}</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-pink-500/50 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Board */}
                    <div className="w-full lg:w-2/3 flex flex-col items-center relative [perspective:800px]">
                         {/* 살짝 기울인 3D 콘솔 */}
                         <div className="w-full [transform:rotateX(2deg)] [transform-style:preserve-3d]">
                              <div className="relative rounded-t-3xl overflow-hidden border-2 border-b-0 border-pink-500/50 bg-black/80 w-full shadow-[0_-10px_40px_rgba(236,72,153,0.15),inset_0_2px_0_rgba(255,255,255,0.05)]" style={{ height: GAME_H }}>

                                   {/* Background Pattern */}
                                   <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                                        style={{ backgroundImage: `linear-gradient(#f472b6 1px, transparent 1px), linear-gradient(90deg, #f472b6 1px, transparent 1px)`, backgroundSize: `40px 40px` }}>
                                   </div>
                                   <div className="absolute bottom-0 w-full h-10 bg-gradient-to-t from-red-500/20 to-transparent pointer-events-none" />

                                   {/* Words (입체 텍스트 그림자) */}
                                   {words.map(w => (
                                        <div key={w.id} className="tg-word absolute text-xl font-black text-white px-3 py-1 rounded-lg bg-gradient-to-b from-pink-500/40 to-fuchsia-900/40 border border-pink-400/50 backdrop-blur-sm shadow-[0_4px_0_rgba(131,24,67,0.6),0_10px_20px_rgba(236,72,153,0.45)] whitespace-nowrap" style={{ left: w.x, top: w.y, textShadow: '0 1px 0 #be185d, 0 2px 0 #9d174d, 0 3px 0 #831843, 0 6px 12px rgba(0,0,0,0.7)' }}>
                                             {w.word}
                                        </div>
                                   ))}

                                   {/* Overlays */}
                                   {!gameStarted && (
                                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                                             <div className="w-20 h-20 bg-pink-500/20 rounded-full flex items-center justify-center mb-6 border border-pink-400/30 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                                                  <Keyboard className="w-10 h-10 text-pink-400" />
                                             </div>
                                             <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6 drop-shadow-lg tracking-widest">NEON TYPER</div>
                                             <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-sm border border-pink-500/20">
                                                  <div className="text-sm font-black text-pink-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                                  <ul className="text-gray-300 text-sm space-y-2 list-none">
                                                       <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-pink-500 rounded-full"/>위에서 내려오는 단어를 확인하세요.</li>
                                                       <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full"/>아래 입력창에 단어를 빠르게 타이핑!</li>
                                                       <li className="flex items-center gap-2 text-red-400"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"/>단어가 바닥에 닿으면 MISS (최대 5회)</li>
                                                  </ul>
                                             </div>
                                             <button onClick={startGame} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                                  <Play className="w-6 h-6 fill-white" /> START
                                             </button>
                                        </div>
                                   )}

                                   {gameStarted && gameOver && (
                                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                             <div className="tg-pop text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">GAME OVER</div>
                                             <div className="text-2xl text-white font-black mb-8 font-mono">Score: <span className="text-pink-400">{score}</span></div>
                                             <button onClick={startGame} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                                  <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                             </button>
                                        </div>
                                   )}
                              </div>

                              {/* Input Area (3D 콘솔 패널) */}
                              <div className="w-full bg-gradient-to-b from-gray-800 via-gray-900 to-black border-2 border-pink-500/50 rounded-b-3xl p-4 flex gap-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.07),inset_0_-6px_14px_rgba(0,0,0,0.6),0_14px_35px_rgba(236,72,153,0.2)] relative z-10">
                                   <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={e => {
                                             const next = e.target.value;
                                             if (next.length > input.length && gameStarted && !gameOver) {
                                                  const trimmed = next.trim();
                                                  // 낙하 단어와 대조해 정타/오타 판별 (한글 조합 중인 마지막 글자는 오타로 치지 않음)
                                                  const isPrefix = trimmed.length > 0 && wordsRef.current.some(w => w.word.startsWith(trimmed));
                                                  const isComposing = wordsRef.current.some(w => w.word.startsWith(trimmed.slice(0, -1)));
                                                  const now = Date.now();
                                                  if (isPrefix || isComposing) {
                                                       if (now - lastTickRef.current > 90) { // 타건음 스로틀
                                                            lastTickRef.current = now;
                                                            playSound('tick');
                                                       }
                                                  } else if (now - lastWrongRef.current > 250) {
                                                       lastWrongRef.current = now;
                                                       playSound('wrong'); // 오타
                                                  }
                                             }
                                             setInput(next);
                                        }}
                                        disabled={!gameStarted || gameOver}
                                        placeholder={gameStarted && !gameOver ? "여기에 단어를 입력하세요..." : "게임을 시작해주세요"}
                                        className="w-full bg-black/60 border border-pink-500/30 rounded-xl px-6 py-4 text-2xl font-bold text-white placeholder-pink-900/50 shadow-[inset_0_3px_10px_rgba(0,0,0,0.7)] focus:outline-none focus:border-pink-400 focus:shadow-[inset_0_3px_10px_rgba(0,0,0,0.7),0_0_20px_rgba(236,72,153,0.4)] transition-all text-center"
                                   />
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamTypingGame;
