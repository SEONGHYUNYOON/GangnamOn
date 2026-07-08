import React, { useState } from 'react';
import { ArrowLeft, RotateCw, Heart } from 'lucide-react';
import GameHelpDropdown from './GameHelpDropdown';

const hashScore = (a, b) => {
     const combined = `${a.trim().toLowerCase()}|${b.trim().toLowerCase()}`;
     let h = 0;
     for (let i = 0; i < combined.length; i++) {
          h = ((h << 5) - h) + combined.charCodeAt(i);
          h |= 0;
     }
     return Math.abs(h) % 101;
};

const MESSAGES = [
     { min: 0, max: 19, text: '친구 그 이상은 아니고.. 그냥 지나치는 사이예요 😅' },
     { min: 20, max: 39, text: '같은 동네 사는 이웃 정도? 인사는 해요 👋' },
     { min: 40, max: 59, text: '커피 한잔은 괜찮을 것 같아요 ☕' },
     { min: 60, max: 74, text: '강남역에서 우연히 마주치면 반갑겠는데요? 🚇' },
     { min: 75, max: 89, text: '이 정도면 테헤란로에서 손잡고 걸어야 함 🌆' },
     { min: 90, max: 100, text: '천생연분! 오늘 바로 미니홈피 방명록 남기세요 💕' },
];

const getMessage = (score) => MESSAGES.find(m => score >= m.min && score <= m.max)?.text || MESSAGES[2].text;

const GangnamCompatibility = ({ onClose, user }) => {
     const [name1, setName1] = useState(user?.user_metadata?.username || user?.user_metadata?.nickname || '');
     const [name2, setName2] = useState('');
     const [result, setResult] = useState(null);

     const test = () => {
          if (!name1.trim() || !name2.trim()) {
               alert('두 이름을 모두 입력해주세요.');
               return;
          }
          const score = hashScore(name1, name2);
          setResult({ score, message: getMessage(score), names: [name1.trim(), name2.trim()] });
     };

     const reset = () => {
          setResult(null);
          setName2('');
     };

     return (
          <div className="min-h-full py-6 px-4 flex flex-col items-center bg-gradient-to-b from-gray-900 to-black text-white max-w-lg mx-auto">
               <div className="w-full flex justify-between items-center mb-6">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-300" /></button>
                    <div className="flex items-center gap-1.5">
                         <h2 className="text-xl font-black tracking-wider">궁합 테스트</h2>
                         <GameHelpDropdown accent="rose">
                              <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside leading-relaxed">
                                   <li>두 사람의 이름(닉네임)을 입력하세요</li>
                                   <li><b className="text-white">0~100%</b> 궁합 점수와 강남 드립이 나와요</li>
                                   <li>같은 이름 조합이면 항상 같은 결과!</li>
                              </ul>
                         </GameHelpDropdown>
                    </div>
                    <div className="w-10" />
               </div>

               {!result ? (
                    <div className="w-full bg-gray-800/80 rounded-2xl border border-pink-500/20 p-6">
                         <div className="flex justify-center mb-6"><Heart className="w-10 h-10 text-pink-400" /></div>
                         <div className="space-y-4">
                              <div>
                                   <label className="text-xs text-gray-400 font-bold mb-1 block">나의 이름</label>
                                   <input value={name1} onChange={e => setName1(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500/40" placeholder="닉네임" />
                              </div>
                              <div className="text-center text-2xl text-pink-400">💕</div>
                              <div>
                                   <label className="text-xs text-gray-400 font-bold mb-1 block">상대 이름</label>
                                   <input value={name2} onChange={e => setName2(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500/40" placeholder="상대 닉네임" />
                              </div>
                              <button onClick={test} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-black py-3 rounded-xl">궁합 보기</button>
                         </div>
                    </div>
               ) : (
                    <div className="w-full bg-gray-800/80 rounded-2xl border border-pink-500/30 p-8 text-center">
                         <p className="text-gray-400 text-sm mb-2">{result.names[0]} × {result.names[1]}</p>
                         <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-4">{result.score}%</div>
                         <div className="w-full bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all" style={{ width: `${result.score}%` }} />
                         </div>
                         <p className="text-lg font-semibold text-gray-200 leading-relaxed mb-8">"{result.message}"</p>
                         <button onClick={reset} className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold flex items-center gap-2 mx-auto"><RotateCw className="w-4 h-4" /> 다시하기</button>
                    </div>
               )}
          </div>
     );
};

export default GangnamCompatibility;
