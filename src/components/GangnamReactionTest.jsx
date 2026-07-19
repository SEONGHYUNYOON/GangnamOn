import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy, Zap } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';
import { soundManager } from '../lib/soundManager';

const GangnamReactionTest = ({ onClose, user }) => {
     const [phase, setPhase] = useState('idle'); // 'idle' | 'wait' | 'ready' | 'result' | 'early'
     const [resultMs, setResultMs] = useState(null);
     const [rankList, setRankList] = useState(() => getRankTop10('reaction', false));
     const waitTimeoutRef = useRef(null);
     const startTimeRef = useRef(0);

     const startGame = useCallback(() => {
          soundManager.init();
          soundManager.playCoin();
          setPhase('wait');
          setResultMs(null);
          setRankList(getRankTop10('reaction', false));
          const delay = 2000 + Math.random() * 4000; // 2~6 seconds random delay
          waitTimeoutRef.current = setTimeout(() => {
               setPhase('ready');
               soundManager.playJump(); // Audio cue when it's ready
               startTimeRef.current = Date.now();
          }, delay);
     }, []);

     const handleClick = useCallback(() => {
          if (phase === 'wait') {
               clearTimeout(waitTimeoutRef.current);
               soundManager.playExplosion(); // Early click sound
               setPhase('early');
               return;
          }
          if (phase === 'ready') {
               const ms = Date.now() - startTimeRef.current;
               setResultMs(ms);
               setPhase('result');
               soundManager.playHit(); // Success click sound
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               addScore('reaction', name, ms, false);
               setRankList(getRankTop10('reaction', false));
          }
          if (phase === 'early' || phase === 'result') {
               startGame(); // Quick restart
          }
     }, [phase, user, startGame]);

     return (
          <div className="fixed inset-0 z-[70] bg-[#0A0A10] flex items-center justify-center p-4">
               {/* Ambient Glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

               <div className={`relative bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.2)] max-w-5xl w-full flex flex-col lg:flex-row gap-10 items-center lg:items-stretch animate-in zoom-in-95 duration-500`}>
                    
                    {/* Left Panel: Leaderboard & Info */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                         <div className="flex justify-between items-start lg:hidden mb-2">
                              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">REACTION</h2>
                              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         <div className="hidden lg:flex justify-between items-center w-full">
                              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400 drop-shadow-sm">LIGHTNING<br/>REACTION</h2>
                              <button onClick={onClose} className="bg-white/5 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md">
                                   <ArrowLeft className="w-6 h-6" />
                              </button>
                         </div>

                         {/* Leaderboard */}
                         <div className="bg-black/40 rounded-2xl p-5 border border-indigo-500/20 w-full flex-1 flex flex-col">
                              <div className="flex items-center gap-3 mb-4">
                                   <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-black text-white tracking-widest">TOP 10 FASTEST</span>
                              </div>
                              <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
                                   {rankList.map((e, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-indigo-500/10 transition-colors border border-transparent hover:border-indigo-500/20">
                                             <div className="flex items-center gap-3">
                                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-white/10 text-indigo-200'}`}>{i + 1}</span>
                                                  <span className="text-gray-200 font-bold text-sm truncate max-w-[80px]">{e.name}</span>
                                             </div>
                                             <span className="text-cyan-300 font-mono text-sm font-bold flex items-center gap-1"><Zap className="w-3 h-3"/>{e.score}ms</span>
                                        </div>
                                   ))}
                                   {rankList.length === 0 && <p className="text-indigo-500/50 text-sm py-8 text-center font-bold">기록이 없습니다.</p>}
                              </div>
                         </div>
                    </div>

                    {/* Right Panel: Game Area */}
                    <div className="w-full lg:w-2/3 flex justify-center relative min-h-[400px]">
                         <div
                              onClick={handleClick}
                              className={`w-full h-full rounded-3xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 select-none shadow-2xl relative overflow-hidden
                                   ${phase === 'idle' ? 'bg-gray-800/80 border-indigo-500/30 hover:bg-gray-800' : ''}
                                   ${phase === 'wait' ? 'bg-amber-500 border-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.6)] animate-pulse' : ''}
                                   ${phase === 'ready' ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_100px_rgba(16,185,129,0.8)] scale-[1.02]' : ''}
                                   ${phase === 'result' ? 'bg-indigo-900 border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.4)]' : ''}
                                   ${phase === 'early' ? 'bg-red-900 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-shake' : ''}`}
                         >
                              {/* Background Pattern for Idle */}
                              {phase === 'idle' && (
                                   <div className="absolute inset-0 opacity-10 pointer-events-none"
                                        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: `24px 24px` }}>
                                   </div>
                              )}

                              {phase === 'idle' && (
                                   <div className="z-10 flex flex-col items-center text-center p-8">
                                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 border border-indigo-400/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                             <Zap className="w-10 h-10 text-cyan-400" />
                                        </div>
                                        <div className="text-3xl font-black text-white mb-6 tracking-widest drop-shadow-md">HOW TO PLAY</div>
                                        <div className="space-y-4 mb-10 text-lg font-bold text-gray-300">
                                             <p className="flex items-center justify-center gap-3"><span className="w-4 h-4 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"/> 화면이 <span className="text-amber-400">노란색</span>일 땐 대기!</p>
                                             <p className="flex items-center justify-center gap-3"><span className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"/> 화면이 <span className="text-emerald-400">초록색</span>으로 바뀌면 즉시 클릭!</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 px-12 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-transform hover:scale-105 flex items-center gap-3 text-xl">
                                             <Play className="w-7 h-7 fill-white" /> START GAME
                                        </button>
                                   </div>
                              )}

                              {phase === 'wait' && (
                                   <div className="text-5xl font-black text-amber-950 flex items-center gap-4 animate-in zoom-in">
                                        WAIT FOR GREEN...
                                   </div>
                              )}

                              {phase === 'ready' && (
                                   <div className="text-7xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] flex flex-col items-center gap-4">
                                        <Zap className="w-20 h-20 fill-white" />
                                        CLICK NOW!
                                   </div>
                              )}

                              {phase === 'result' && (
                                   <div className="z-10 flex flex-col items-center animate-in slide-in-from-bottom-8">
                                        <div className="text-sm font-black tracking-[0.3em] text-cyan-400 mb-2">REACTION TIME</div>
                                        <div className="text-7xl md:text-8xl font-black text-white font-mono drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] mb-2">
                                             {resultMs}<span className="text-4xl text-indigo-300">ms</span>
                                        </div>
                                        <div className="text-indigo-200 text-lg mb-10 font-bold">
                                             {resultMs < 200 ? '⚡ LIGHTNING FAST! ⚡' : resultMs < 300 ? '🔥 GREAT SPEED! 🔥' : '👍 NOT BAD! 👍'}
                                        </div>
                                        <div className="text-gray-400 font-bold tracking-widest flex items-center gap-2">
                                             <RotateCw className="w-5 h-5" /> CLICK ANYWHERE TO RESTART
                                        </div>
                                   </div>
                              )}

                              {phase === 'early' && (
                                   <div className="z-10 flex flex-col items-center animate-in slide-in-from-bottom-8">
                                        <div className="text-6xl font-black text-red-300 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] mb-4">TOO EARLY!</div>
                                        <div className="text-red-200 text-lg mb-10 font-bold">You clicked before it turned green.</div>
                                        <div className="text-gray-400 font-bold tracking-widest flex items-center gap-2">
                                             <RotateCw className="w-5 h-5" /> CLICK ANYWHERE TO RESTART
                                        </div>
                                   </div>
                              )}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamReactionTest;
