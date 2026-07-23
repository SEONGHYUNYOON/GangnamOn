import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCw, Trophy, Play, Users } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { playSound } from '../lib/gameSounds';

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
     const [shake, setShake] = useState(false);

     const triggerShake = () => {
          setShake(true);
          setTimeout(() => setShake(false), 200);
     };

     const addLog = (msg, type = 'info') => setLogs(l => [...l.slice(-10), { msg, type, id: Date.now() + Math.random() }]);

     const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

     const endGame = useCallback((surv, isClear = false) => {
          clearTimer();
          if (!isClear) playSound('gameover'); // 클리어 시엔 win 효과음이 이미 재생됨
          triggerShake();
          setCanTap(false);
          setPhase('over');
          if (surv > 0) addScore('nunchi', name, surv, true);
          setRankList(getRankTop10('nunchi', true));
     }, [name]);

     const runSequence = useCallback((num, surv) => {
          if (num >= MAX_NUM) {
               const next = surv + 1;
               survivedRef.current = next;
               setSurvived(next);
               playSound('win'); // 라운드 생존
               addLog(`✅ 라운드 ${next} 생존!`, 'success');
               if (next >= 10) {
                    addLog('🏆 10라운드 클리어! 대단해요!', 'success');
                    endGame(next, true);
                    return;
               }
               timerRef.current = setTimeout(() => {
                    setCurrentNum(0);
                    addLog(`--- 라운드 ${next + 1} ---`, 'info');
                    runSequence(0, next);
               }, 1500);
               return;
          }

          const isUserTurn = num === MAX_NUM - 1;
          const delay = isUserTurn ? 0 : 400 + Math.random() * 800; // slightly randomized AI wait

          timerRef.current = setTimeout(() => {
               const next = num + 1;
               setCurrentNum(next);
               playSound('tick'); // 숫자 카운트음

               if (isUserTurn) {
                    setCanTap(true);
                    addLog('👉 당신 차례! 지금 누르세요!', 'highlight');
                    timerRef.current = setTimeout(() => {
                         addLog('💥 너무 늦었어요!', 'error');
                         playSound('wrong'); // 타이밍 실패
                         endGame(surv);
                    }, 1500 - (surv * 50)); // Gets faster each round
               } else {
                    addLog(`${AI_NAMES[num % AI_NAMES.length]}: ${next}!`, 'normal');
                    runSequence(next, surv);
               }
          }, delay);
     }, [endGame]);

     const start = () => {
          playSound('click'); // 시작 버튼음
          clearTimer();
          survivedRef.current = 0;
          setPhase('playing');
          setCurrentNum(0);
          setSurvived(0);
          setCanTap(false);
          setLogs([{ msg: '🎮 눈치게임 시작!', type: 'info', id: Date.now() }]);
          setRankList(getRankTop10('nunchi', true));
          runSequence(0, 0);
     };

     const handleTap = () => {
          if (phase !== 'playing') return;
          if (!canTap) {
               addLog('💥 너무 빨랐어요!', 'error');
               playSound('wrong'); // 성급한 탭
               endGame(survivedRef.current);
               return;
          }
          clearTimer();
          playSound('coin'); // 성공 탭
          setCanTap(false);
          const next = currentNum + 1;
          setCurrentNum(next);
          addLog(`🫵 나: ${next}!`, 'user');
          runSequence(next, survivedRef.current);
     };

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* 3D 연출용 키프레임 (컴포넌트 스코프) */}
               <style>{`
                    @keyframes ngPop { 0% { opacity: 0.3; transform: scale(1.45); } 100% { opacity: 1; transform: scale(1); } }
                    .ng-pop { animation: ngPop 0.22s ease-out both; }
                    @keyframes ngTension { 0%, 100% { box-shadow: inset 0 0 40px rgba(20, 184, 166, 0.12); } 50% { box-shadow: inset 0 0 90px rgba(20, 184, 166, 0.32); } }
                    .ng-tension { animation: ngTension 1.6s ease-in-out infinite; }
                    @keyframes ngShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
                    .ng-shake { animation: ngShake 0.3s ease-in-out; }
               `}</style>

               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-900/20 rounded-full blur-[120px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-teal-500/30 shadow-[0_0_60px_rgba(20,184,166,0.2)] max-w-5xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start animate-in zoom-in-95 duration-500 ${shake ? 'ng-shake' : ''}`}>

                    {/* Left Panel: Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 tracking-wider">NUNCHI</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 drop-shadow-sm leading-tight">NEON<br/>NUNCHI</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="w-full">
                              <div className="bg-black/40 p-5 rounded-2xl border border-teal-500/30 shadow-[inset_0_0_15px_rgba(20,184,166,0.1)] w-full text-center lg:text-left">
                                   <div className="text-xs font-black text-teal-400 tracking-[0.2em] mb-1">SURVIVED ROUNDS</div>
                                   <div className="text-5xl font-black text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">
                                        {survived}
                                   </div>
                              </div>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-teal-500/20 w-full flex-1 hidden lg:block">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10</span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-teal-500/10 transition-colors">
                                             <div className="flex items-center gap-2">
                                                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-teal-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-teal-300 font-mono text-sm font-bold">{e.score}R</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-teal-500/50 text-sm py-2 text-center">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Area */}
                    <div className="w-full lg:w-2/3 flex flex-col relative min-h-[400px] [perspective:800px]">

                         {phase === 'idle' && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-3xl border-2 border-teal-500/30">
                                   <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 border border-teal-400/30 shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                                        <Users className="w-10 h-10 text-teal-400" />
                                   </div>
                                   <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 mb-6 drop-shadow-lg tracking-widest">NUNCHI GAME</div>
                                   <div className="bg-gray-800/80 rounded-2xl p-5 mb-8 text-left max-w-sm border border-teal-500/20">
                                        <div className="text-sm font-black text-teal-400 mb-3 tracking-wider">🎯 HOW TO PLAY</div>
                                        <ul className="text-gray-300 text-sm space-y-2 list-none">
                                             <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-teal-500 rounded-full"/>AI들과 1부터 7까지 순서대로 숫자를 외칩니다</li>
                                             <li className="flex items-center gap-2 text-yellow-400"><div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"/>"당신 차례!" 가 나오면 즉시 버튼을 누르세요</li>
                                             <li className="flex items-center gap-2 text-red-400"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"/>너무 빠르거나 늦으면 탈락입니다</li>
                                        </ul>
                                   </div>
                                   <button onClick={start} className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-lg">
                                        <Play className="w-6 h-6 fill-white" /> START
                                   </button>
                              </div>
                         )}

                         {(phase === 'playing' || phase === 'over') && (
                              <div className="flex flex-col h-full gap-4">

                                   {/* Current Number Display (살짝 기울인 3D 전광판) */}
                                   <div className="bg-black/60 rounded-3xl border-2 border-teal-500/30 p-8 text-center flex-1 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_40px_rgba(20,184,166,0.1),inset_0_2px_0_rgba(255,255,255,0.05)] [transform:rotateX(3deg)]">
                                        {/* 긴장 단계: 은은한 글로우 펄스 */}
                                        {phase === 'playing' && !canTap && <div className="absolute inset-0 ng-tension pointer-events-none" />}
                                        {canTap && <div className="absolute inset-0 bg-green-500/10 animate-pulse" />}
                                        <div key={currentNum} className="ng-pop text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-teal-300 to-cyan-600 z-10" style={{ filter: 'drop-shadow(0 5px 0 rgba(8,51,68,0.9)) drop-shadow(0 14px 24px rgba(34,211,238,0.35))' }}>
                                             {currentNum || '-'}
                                        </div>
                                        <div className={`text-xl font-bold mt-4 z-10 ${canTap ? 'text-green-400 animate-bounce' : 'text-gray-500'}`}>
                                             {canTap ? 'NOW! TAP!' : 'WAIT...'}
                                        </div>
                                   </div>

                                   {/* Action Button (아케이드 돔 버튼) */}
                                   <button
                                        onClick={handleTap}
                                        disabled={phase === 'over'}
                                        className={`w-full py-6 rounded-3xl font-black text-2xl transition-all duration-150 select-none relative
                                             ${canTap ? '[background:radial-gradient(circle_at_50%_25%,#86efac_0%,#22c55e_45%,#15803d_100%)] text-white border-2 border-green-300 shadow-[inset_0_3px_0_rgba(255,255,255,0.5),inset_0_-8px_16px_rgba(20,83,45,0.6),0_10px_0_#14532d,0_16px_45px_rgba(34,197,94,0.6)] animate-pulse hover:scale-[1.02] active:translate-y-2 active:shadow-[inset_0_3px_0_rgba(255,255,255,0.4),inset_0_-4px_10px_rgba(20,83,45,0.6),0_3px_0_#14532d,0_8px_20px_rgba(34,197,94,0.5)]'
                                             : phase === 'over' ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed shadow-xl'
                                             : '[background:radial-gradient(circle_at_50%_25%,#4b5563_0%,#1f2937_55%,#111827_100%)] text-gray-400 border border-gray-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.1),inset_0_-6px_12px_rgba(0,0,0,0.6),0_8px_0_#030712,0_14px_30px_rgba(0,0,0,0.5)] active:translate-y-2 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.08),inset_0_-3px_8px_rgba(0,0,0,0.6),0_2px_0_#030712,0_6px_14px_rgba(0,0,0,0.5)]'}`}
                                   >
                                        {canTap ? `${currentNum + 1} 외치기!` : phase === 'over' ? 'GAME OVER' : '대기 중...'}
                                   </button>

                                   {/* Logs Console */}
                                   <div className="bg-black/80 rounded-2xl p-4 h-40 border border-white/5 flex flex-col justify-end overflow-hidden custom-scrollbar">
                                        <div className="space-y-1">
                                             {logs.map((l) => (
                                                  <div key={l.id} className={`text-sm md:text-base font-medium flex items-center gap-2 animate-in slide-in-from-left-2
                                                       ${l.type === 'success' ? 'text-green-400' : l.type === 'error' ? 'text-red-400' : l.type === 'highlight' ? 'text-yellow-400' : l.type === 'user' ? 'text-cyan-400' : 'text-gray-400'}`}>
                                                       {l.type === 'success' && '✨'}
                                                       {l.type === 'error' && '❌'}
                                                       {l.type === 'highlight' && '⚠️'}
                                                       {l.msg}
                                                  </div>
                                             ))}
                                        </div>
                                   </div>
                              </div>
                         )}

                         {phase === 'over' && (
                              <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl border-2 border-red-500/30">
                                   <div className="ng-pop text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">OUT!</div>
                                   <div className="text-2xl text-white font-black mb-8 font-mono">Survived: <span className="text-teal-400">{survived} Rounds</span></div>
                                   <button onClick={start} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                                        <RotateCw className="w-5 h-5" /> PLAY AGAIN
                                   </button>
                              </div>
                         )}

                    </div>
               </div>
          </div>
     );
};

export default GangnamNunchiGame;
