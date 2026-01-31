import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const ROWS = 2;
const COLS = 3;
const ROUND_SEC = 30;
const POP_MIN = 600;
const POP_MAX = 1200;

const MOLE_EMOJI = ['🐹', '🦫', '🐿️']; // 두더지/강남 느낌

const GangnamWhackAMole = ({ onClose, user }) => {
     const [score, setScore] = useState(0);
     const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
     const [activeHole, setActiveHole] = useState(null);
     const [gameStarted, setGameStarted] = useState(false);
     const [gameOver, setGameOver] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('whack', true));
     const timerRef = useRef(null);
     const popRef = useRef(null);
     const hideRef = useRef(null);
     const gameOverRef = useRef(gameOver);
     gameOverRef.current = gameOver;

     const schedulePop = useCallback(() => {
          if (!gameStarted || gameOverRef.current) return;
          const delay = POP_MIN + Math.random() * (POP_MAX - POP_MIN);
          popRef.current = setTimeout(() => {
               if (gameOverRef.current) return;
               const idx = Math.floor(Math.random() * (ROWS * COLS));
               setActiveHole(idx);
               const hideDelay = 800 + Math.random() * 600;
               hideRef.current = setTimeout(() => {
                    setActiveHole(null);
                    schedulePop();
               }, hideDelay);
          }, delay);
     }, [gameStarted]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          schedulePop();
          return () => {
               if (popRef.current) clearTimeout(popRef.current);
               if (hideRef.current) clearTimeout(hideRef.current);
          };
     }, [gameStarted, gameOver, schedulePop]);

     useEffect(() => {
          if (!gameStarted || gameOver) return;
          if (timeLeft <= 0) {
               setGameOver(true);
               return;
          }
          timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
          return () => clearInterval(timerRef.current);
     }, [gameStarted, gameOver, timeLeft]);

     const whack = (idx) => {
          if (activeHole === idx) {
               setScore(s => s + 10);
               setActiveHole(null);
               if (hideRef.current) clearTimeout(hideRef.current);
               hideRef.current = null;
               schedulePop();
          }
     };

     const startGame = useCallback(() => {
          setScore(0);
          setTimeLeft(ROUND_SEC);
          setActiveHole(null);
          setGameOver(false);
          setGameStarted(true);
     }, []);

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-amber-950/30 to-gray-900 text-white max-w-6xl mx-auto w-full">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                         <ArrowLeft className="w-6 h-6 text-gray-300" />
                    </button>
                    <h2 className="text-xl font-black tracking-wider">두더지</h2>
                    <div className="flex items-center gap-3">
                         <span className="bg-amber-600/80 px-3 py-1 rounded-lg font-black text-sm">{timeLeft}초</span>
                         <span className="bg-purple-600 px-3 py-1 rounded-lg font-black text-sm">{score}</span>
                    </div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="grid gap-5 mb-6 shrink-0" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                         {Array.from({ length: ROWS * COLS }).map((_, idx) => (
                              <button
                                   key={idx}
                                   onClick={() => whack(idx)}
                                   disabled={!gameStarted || gameOver}
                                   className="relative w-36 h-36 md:w-40 md:h-40 rounded-2xl bg-amber-900/60 border-2 border-amber-700/50 overflow-hidden hover:border-amber-500 transition-colors disabled:pointer-events-none"
                              >
                                   <div className="absolute inset-0 flex items-center justify-center text-5xl md:text-6xl">
                                        {activeHole === idx ? (
                                             <span className="animate-bounce select-none">{MOLE_EMOJI[idx % MOLE_EMOJI.length]}</span>
                                        ) : (
                                             <span className="text-amber-800/50 text-3xl">🕳️</span>
                                        )}
                                   </div>
                              </button>
                         ))}
                    </div>

                    <div className="bg-amber-900/50 rounded-xl p-4 border border-amber-700/50 w-full lg:w-52 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-amber-600/30 pb-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-amber-200/80 tracking-wider">TOP 10</span></div>
                         <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {rankList.map((e, i) => (
                                   <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                             <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${e.rank === 1 ? 'bg-yellow-500 text-black' : e.rank === 2 ? 'bg-gray-400 text-black' : e.rank === 3 ? 'bg-orange-600 text-white' : 'bg-amber-700 text-amber-100'}`}>{e.rank}</span>
                                             <span className="text-amber-100 truncate max-w-[80px]">{e.name}</span>
                                        </div>
                                        <span className="text-amber-200/80 font-mono text-xs">{e.score}</span>
                                   </div>
                              ))}
                              {rankList.length === 0 && <p className="text-amber-200/60 text-xs">아직 기록이 없어요.</p>}
                         </div>
                    </div>
               </div>

               {!gameStarted && (
                    <div className="flex flex-col items-center justify-center py-8">
                         <div className="text-2xl font-black text-white mb-3">두더지</div>
                         <div className="bg-amber-900/60 rounded-xl p-4 mb-5 text-left max-w-xs">
                              <div className="text-xs font-bold text-amber-300 mb-2">🎯 게임 방법</div>
                              <ul className="text-amber-100 text-xs space-y-1 list-disc list-inside">
                                   <li>구멍에서 두더지(🐹)가 튀어나오면 클릭!</li>
                                   <li>잡을 때마다 점수 +10</li>
                                   <li>30초 동안 최대한 많이 잡으세요</li>
                              </ul>
                         </div>
                         <button onClick={startGame} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-10 rounded-full shadow-lg flex items-center gap-2">
                              <Play className="w-5 h-5" /> 시작하기
                         </button>
                    </div>
               )}

               {gameStarted && gameOver && (
                    <div className="flex flex-col items-center py-6 animate-in fade-in">
                         <div className="text-2xl font-black text-amber-400 mb-2">시간 종료!</div>
                         <div className="text-3xl font-black text-white mb-6">Score: {score}</div>
                         <button onClick={startGame} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2">
                              <RotateCw className="w-5 h-5" /> 다시 하기
                         </button>
                    </div>
               )}

               {gameStarted && !gameOver && (
                    <p className="text-gray-500 text-xs">두더지가 나오면 눌러서 잡기</p>
               )}
          </div>
     );
};

export default GangnamWhackAMole;
