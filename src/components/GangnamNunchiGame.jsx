import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import GameHelpDropdown from './GameHelpDropdown';

const AI_NAMES = ['민수', '지영', '현우', '수진', '태호', '유나'];
const MAX_NUM = 7;

const GangnamNunchiGame = ({ onClose, user }) => {
     const [phase, setPhase] = useState('idle');
     const [currentNum, setCurrentNum] = useState(0);
     const [survived, setSurvived] = useState(0);
     const [logs, setLogs] = useState([]);
     const [canTap, setCanTap] = useState(false);
     const [rankList, setRankList] = useState(() => getRankTop10('nunchi', true));
     const timerRef = useRef(null);
     const survivedRef = useRef(0);
     const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';

     const addLog = (msg) => setLogs(l => [...l.slice(-12), msg]);

     const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

     const endGame = useCallback((surv) => {
          clearTimer();
          setCanTap(false);
          setPhase('over');
          addScore('nunchi', name, surv, true);
          setRankList(getRankTop10('nunchi', true));
     }, [name]);

     const runSequence = useCallback((num, surv) => {
          if (num >= MAX_NUM) {
               const next = surv + 1;
               survivedRef.current = next;
               setSurvived(next);
               addLog(`✅ 라운드 ${next} 생존!`);
               if (next >= 5) {
                    addLog('🏆 5라운드 클리어!');
                    endGame(next);
                    return;
               }
               timerRef.current = setTimeout(() => {
                    setCurrentNum(0);
                    addLog(`--- 라운드 ${next + 1} ---`);
                    runSequence(0, next);
               }, 1500);
               return;
          }

          const isUserTurn = num === MAX_NUM - 1;
          const delay = isUserTurn ? 0 : 500 + Math.random() * 700;

          timerRef.current = setTimeout(() => {
               const next = num + 1;
               setCurrentNum(next);
               if (isUserTurn) {
                    setCanTap(true);
                    addLog('👉 당신 차례! 지금 누르세요!');
                    timerRef.current = setTimeout(() => {
                         addLog('💥 너무 늦었어요!');
                         endGame(surv);
                    }, 1800);
               } else {
                    addLog(`${AI_NAMES[num % AI_NAMES.length]}: ${next}!`);
                    runSequence(next, surv);
               }
          }, delay);
     }, [endGame]);

     const start = () => {
          clearTimer();
          survivedRef.current = 0;
          setPhase('playing');
          setCurrentNum(0);
          setSurvived(0);
          setCanTap(false);
          setLogs(['🎮 눈치게임 시작!']);
          setRankList(getRankTop10('nunchi', true));
          runSequence(0, 0);
     };

     const handleTap = () => {
          if (phase !== 'playing') return;
          if (!canTap) {
               addLog('💥 너무 빨랐어요!');
               endGame(survivedRef.current);
               return;
          }
          clearTimer();
          setCanTap(false);
          const next = currentNum + 1;
          setCurrentNum(next);
          addLog(`🫵 나: ${next}!`);
          runSequence(next, survivedRef.current);
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-6xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <div className="flex items-center gap-1.5">
                         <h2 className="text-xl font-black tracking-wider">눈치게임</h2>
                         <GameHelpDropdown accent="teal">
                              <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside leading-relaxed">
                                   <li>AI 6명과 <b className="text-white">1부터 7까지</b> 순서대로 숫자를 외쳐요</li>
                                   <li><b className="text-green-400">내 차례</b>가 되면 버튼을 눌러 다음 숫자를 외치세요</li>
                                   <li>너무 빠르거나 늦으면 탈락 · 살아남은 라운드가 점수!</li>
                              </ul>
                         </GameHelpDropdown>
                    </div>
                    <div className="text-sm text-amber-400 font-bold min-w-[5rem] text-right">생존 {survived}라운드</div>
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div className="flex-1 max-w-md w-full">
                         {phase === 'idle' && (
                              <div className="text-center py-12">
                                   <button onClick={start} className="bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto"><Play className="w-5 h-5" /> 시작하기</button>
                              </div>
                         )}

                         {(phase === 'playing' || phase === 'over') && (
                              <>
                                   <div className="bg-gray-800 rounded-2xl border border-gray-600 p-6 text-center mb-4">
                                        <div className="text-6xl font-black text-amber-400 mb-2">{currentNum || '—'}</div>
                                        <div className="text-sm text-gray-400">{canTap ? '지금 누르세요!' : '눈치를 보는 중...'}</div>
                                   </div>

                                   <button
                                        onClick={handleTap}
                                        disabled={phase === 'over'}
                                        className={`w-full py-6 rounded-2xl font-black text-xl transition-all mb-4
                                             ${canTap ? 'bg-green-600 hover:bg-green-500 animate-pulse' : phase === 'over' ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                                   >
                                        {canTap ? `${currentNum + 1}!` : '눈치 보기'}
                                   </button>

                                   <div className="bg-gray-900/60 rounded-xl p-3 max-h-40 overflow-y-auto text-sm space-y-1">
                                        {logs.map((l, i) => <div key={i} className="text-gray-400">{l}</div>)}
                                   </div>

                                   {phase === 'over' && (
                                        <div className="mt-4 text-center">
                                             <p className="text-lg font-black text-amber-300 mb-2">{survived}라운드 생존!</p>
                                             <button onClick={start} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto"><RotateCw className="w-4 h-4" /> 다시하기</button>
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

export default GangnamNunchiGame;
