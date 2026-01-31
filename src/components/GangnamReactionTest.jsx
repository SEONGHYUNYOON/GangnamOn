import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCw, Play, Trophy } from 'lucide-react';
import { getRankTop10, addScore } from '../lib/gameRank';

const GangnamReactionTest = ({ onClose, user }) => {
     const [phase, setPhase] = useState('idle'); // 'idle' | 'wait' | 'ready' | 'result'
     const [resultMs, setResultMs] = useState(null);
     const [rankList, setRankList] = useState(() => getRankTop10('reaction', false));
     const waitTimeoutRef = useRef(null);
     const startTimeRef = useRef(0);

     const startGame = useCallback(() => {
          setPhase('wait');
          setResultMs(null);
          setRankList(getRankTop10('reaction', false));
          const delay = 2000 + Math.random() * 3000;
          waitTimeoutRef.current = setTimeout(() => {
               setPhase('ready');
               startTimeRef.current = Date.now();
          }, delay);
     }, []);

     const handleClick = useCallback(() => {
          if (phase === 'wait') {
               clearTimeout(waitTimeoutRef.current);
               setPhase('idle');
               return;
          }
          if (phase === 'ready') {
               const ms = Date.now() - startTimeRef.current;
               setResultMs(ms);
               setPhase('result');
               const name = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
               addScore('reaction', name, ms, false);
               setRankList(getRankTop10('reaction', false));
          }
     }, [phase, user]);

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-4xl mx-auto">
               <div className="w-full flex justify-between items-center mb-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <h2 className="text-xl font-black tracking-wider">반응속도 대결</h2>
                    <div className="w-24" />
               </div>

               <div className="flex gap-6 w-full flex-col lg:flex-row items-start justify-center">
                    <div
                         onClick={handleClick}
                         className={`flex-1 min-h-[320px] rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-colors select-none
                              ${phase === 'idle' ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : ''}
                              ${phase === 'wait' ? 'bg-amber-600/80 border-amber-500 animate-pulse' : ''}
                              ${phase === 'ready' ? 'bg-green-600 border-green-400' : ''}
                              ${phase === 'result' ? 'bg-gray-800 border-gray-600' : ''}`}
                    >
                         {phase === 'idle' && (
                              <>
                                   <div className="text-2xl font-black mb-2">반응속도 대결</div>
                                   <div className="text-gray-400 text-sm mb-6">초록색이 되면 최대한 빨리 클릭하세요!</div>
                                   <button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full flex items-center gap-2"><Play className="w-5 h-5" /> 시작하기</button>
                              </>
                         )}
                         {phase === 'wait' && <div className="text-xl font-bold text-amber-100">기다리세요...</div>}
                         {phase === 'ready' && <div className="text-3xl font-black text-green-100">클릭!</div>}
                         {phase === 'result' && (
                              <>
                                   <div className="text-2xl font-black text-yellow-400 mb-2">{resultMs} ms</div>
                                   <div className="text-gray-400 text-sm mb-4">낮을수록 좋아요!</div>
                                   <button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2"><RotateCw className="w-5 h-5" /> 다시 하기</button>
                              </>
                         )}
                    </div>

                    <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-600 w-full lg:w-56 shrink-0">
                         <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-gray-400 tracking-wider">TOP 10 (ms)</span></div>
                         <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {rankList.map((e, i) => (
                                   <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                             <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${e.rank === 1 ? 'bg-yellow-500 text-black' : e.rank === 2 ? 'bg-gray-400 text-black' : e.rank === 3 ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'}`}>{e.rank}</span>
                                             <span className="text-gray-300 truncate max-w-[80px]">{e.name}</span>
                                        </div>
                                        <span className="text-gray-400 font-mono text-xs">{e.score}ms</span>
                                   </div>
                              ))}
                              {rankList.length === 0 && <p className="text-gray-500 text-xs">아직 기록이 없어요.</p>}
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamReactionTest;
