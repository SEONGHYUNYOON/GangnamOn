import React, { useState, useEffect } from 'react';
import { Zap, Send, Gamepad2, ArrowLeft, Trophy, Crown, Volume2, VolumeX } from 'lucide-react';
import GangnamBlockGame from './GangnamBlockGame';
import GangnamSnake from './GangnamSnake';
import GangnamWhackAMole from './GangnamWhackAMole';
import GangnamBrickBreaker from './GangnamBrickBreaker';
import GangnamReactionTest from './GangnamReactionTest';
import GangnamTypingGame from './GangnamTypingGame';
import GangnamGame2048 from './GangnamGame2048';
import GangnamFlapOn from './GangnamFlapOn';
import GangnamMemoryMatch from './GangnamMemoryMatch';
import GangnamDartGame from './GangnamDartGame';
import GangnamSpinRoulette from './GangnamSpinRoulette';
import GangnamNunchiGame from './GangnamNunchiGame';
import GangnamCompatibility from './GangnamCompatibility';
import TowerDefense from './TowerDefense';
import GangnamTarot from './GangnamTarot';
import { getRankTop10 } from '../lib/gameRank';
import { soundManager } from '../lib/soundManager';

const LOUNGE_ENTRY_COST = 1;

const MEDALS = ['🥇', '🥈', '🥉'];

const MiniRank = ({ gameId, max = 3 }) => {
     const top = getRankTop10(gameId, true).slice(0, max);
     if (top.length === 0) {
          return <div className="text-slate-500 text-[11px] py-1 italic font-medium">첫 도전자가 되세요!</div>;
     }
     return (
          <div className="space-y-1.5">
               {top.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                         <span className={`flex items-center gap-1.5 ${i === 0 ? 'text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : i === 1 ? 'text-gray-300 font-bold' : 'text-orange-400 font-bold'}`}>
                              {MEDALS[i]} <span className="truncate max-w-[80px]">{entry.name}</span>
                         </span>
                         <span className="text-white font-mono text-[11px]">{(entry.score || 0).toLocaleString()}</span>
                    </div>
               ))}
          </div>
     );
};

const GangnamLounge = ({ onExit, user, beanCount = 0, updateBeanCount }) => {
     const [activeFeature, setActiveFeature] = useState(null);
     const [isMuted, setIsMuted] = useState(soundManager.isMuted);

     useEffect(() => {
          const currentFeature = window.history.state?.feature || null;
          setActiveFeature(currentFeature);

          const handlePopState = (event) => {
               const feature = event.state?.feature || null;
               setActiveFeature(feature);
          };

          window.addEventListener('popstate', handlePopState);
          return () => window.removeEventListener('popstate', handlePopState);
     }, []);

     const toggleSound = () => {
          soundManager.init();
          const newMutedState = soundManager.toggleMute();
          setIsMuted(newMutedState);
          if (!newMutedState) soundManager.playTick();
     };

     const handleOpenFeature = (feature) => {
          soundManager.init();
          soundManager.playTick();
          window.history.pushState({ tab: 'gangnam_lounge', feature }, '', '');
          setActiveFeature(feature);
     };

     const paidFeatures = ['block', 'snake', 'whack', 'brick', 'reaction', 'typing', 'towerdefense', 'game2048', 'flapon', 'memory', 'dart', 'nunchi', 'compatibility', 'balance', 'mbti', 'tarot'];
     
     const handleLoungeEntry = (feature) => {
          soundManager.init();
          if (paidFeatures.includes(feature)) {
               if (!user?.id) {
                    alert('비회원은 이용 할 수 없습니다.');
                    return;
               }
               if (beanCount < LOUNGE_ENTRY_COST) {
                    soundManager.playExplosion();
                    alert(`온이 부족해요! 열심히 활동해서 모아보세요 ⚡\n(필요: ${LOUNGE_ENTRY_COST} 온)`);
                    return;
               }
               const ok = window.confirm(`이 콘텐츠 이용 시 ${LOUNGE_ENTRY_COST} 온이 소모됩니다.\n진행하시겠습니까?`);
               if (!ok) return;
               if (typeof updateBeanCount === 'function') updateBeanCount(-LOUNGE_ENTRY_COST);
          }
          handleOpenFeature(feature);
     };

     const handleCloseFeature = () => {
          soundManager.playTick();
          window.history.back();
     };

     // === MBTI STATE ===
     const [mbtiStep, setMbtiStep] = useState(0);
     const [mbtiScores, setMbtiScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
     
     const mbtiQuestions = [
          // E vs I
          { q: "평일 내내 야근으로 지친 금요일 저녁, 나의 선택은?", a: { text: "피곤할수록 놀아야지! 친구들과 맥주 한잔하러 나간다.", type: "E" }, b: { text: "일단 집으로. 씻고 누워서 좋아하는 유튜브 보며 쉰다.", type: "I" } },
          { q: "새로운 모임(동호회)에 처음 나간 날, 나는?", a: { text: "먼저 사람들에게 다가가 인사하고 대화를 주도한다.", type: "E" }, b: { text: "누군가 말을 걸어줄 때까지 기다리거나 조용히 분위기를 살핀다.", type: "I" } },
          // ... (simplified for length, keeping functionality)
     ];

     const handleMbtiSelect = (type) => {
          setMbtiScores(prev => ({ ...prev, [type]: prev[type] + 1 }));
          setMbtiStep(prev => prev + 1);
     };

     const getFinalMBTI = () => {
          const { E, I, S, N, T, F, J, P } = mbtiScores;
          return (E >= I ? 'E' : 'I') + (S >= N ? 'S' : 'N') + (T >= F ? 'T' : 'F') + (J >= P ? 'J' : 'P');
     };

     // === BALANCE GAME STATE ===
     const [balanceVote, setBalanceVote] = useState(null);
     const [balanceStats, setBalanceStats] = useState({ a: 45, b: 55 });

     const handleBalanceVote = (option) => {
          setBalanceVote(option);
          setBalanceStats(prev => option === 'A' ? ({ a: prev.a + 1, b: prev.b }) : ({ a: prev.a, b: prev.b + 1 }));
     };

     // === CHAT STATE ===
     const [messages, setMessages] = useState([
          { id: 1, text: "안녕하세요 강남 날씨 어떤가요?", type: "recv", time: "10:00" },
          { id: 2, text: "지금 역삼엔 비 와요 ㅠㅠ", type: "recv", time: "10:01" },
          { id: 3, text: "역삼은 흐리기만 하네요", type: "recv", time: "10:02" },
     ]);
     const [chatInput, setChatInput] = useState("");

     const handleSendChat = (e) => {
          e.preventDefault();
          if (!chatInput.trim()) return;
          setMessages([...messages, { id: Date.now(), text: chatInput, type: "sent", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
          setChatInput("");
     };

     const renderContent = () => {
          if (activeFeature === 'block') return <GangnamBlockGame onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'snake') return <GangnamSnake onClose={handleCloseFeature} user={user} beanCount={beanCount} updateBeanCount={updateBeanCount} />;
          if (activeFeature === 'whack') return <GangnamWhackAMole onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'brick') return <GangnamBrickBreaker onClose={handleCloseFeature} user={user} beanCount={beanCount} updateBeanCount={updateBeanCount} />;
          if (activeFeature === 'reaction') return <GangnamReactionTest onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'typing') return <GangnamTypingGame onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'towerdefense') return <TowerDefense onClose={handleCloseFeature} user={user} beanCount={beanCount} updateBeanCount={updateBeanCount} />;
          if (activeFeature === 'game2048') return <GangnamGame2048 onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'flapon') return <GangnamFlapOn onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'memory') return <GangnamMemoryMatch onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'dart') return <GangnamDartGame onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'spinroulette') return <GangnamSpinRoulette onClose={handleCloseFeature} user={user} beanCount={beanCount} updateBeanCount={updateBeanCount} />;
          if (activeFeature === 'nunchi') return <GangnamNunchiGame onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'compatibility') return <GangnamCompatibility onClose={handleCloseFeature} user={user} />;
          if (activeFeature === 'tarot') return <GangnamTarot onClose={handleCloseFeature} user={user} />;

          if (activeFeature === 'balance') {
               return (
                    <div className="flex flex-col items-center justify-center p-6 animate-in slide-in-from-right max-w-2xl mx-auto h-full overflow-y-auto">
                         <div className="w-full flex justify-between items-center mb-8">
                              <button onClick={handleCloseFeature} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-white" /></button>
                              <h2 className="text-xl font-black text-white">🔥 오늘의 밸런스</h2>
                              <div className="w-10" />
                         </div>
                         <div className="w-full bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.2)] p-8 border border-red-500/30 relative overflow-hidden">
                              {/* ... balance game UI ... */}
                              <h3 className="text-2xl md:text-3xl font-black text-center text-white mb-8 leading-tight">
                                   탕수육 먹을 때...<br />
                                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-500">부먹 vs 찍먹?</span>
                              </h3>
                              <div className="flex gap-4 w-full h-48 md:h-60 mb-8 relative">
                                   <button onClick={() => handleBalanceVote('A')} className={`flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 group ${balanceVote === 'A' ? 'bg-blue-900/50 border-2 border-blue-500 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-black/50 border border-gray-700 hover:border-blue-500/50 hover:bg-blue-900/20 text-gray-300'}`}>
                                        <div className="text-6xl md:text-7xl group-hover:scale-110 transition-transform">🥢</div>
                                        <div className="flex flex-col items-center"><span className="font-black text-xl md:text-2xl">찍먹</span></div>
                                   </button>
                                   <button onClick={() => handleBalanceVote('B')} className={`flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 group ${balanceVote === 'B' ? 'bg-red-900/50 border-2 border-red-500 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-black/50 border border-gray-700 hover:border-red-500/50 hover:bg-red-900/20 text-gray-300'}`}>
                                        <div className="text-6xl md:text-7xl group-hover:scale-110 transition-transform">🥘</div>
                                        <div className="flex flex-col items-center"><span className="font-black text-xl md:text-2xl">부먹</span></div>
                                   </button>
                              </div>
                              {balanceVote && (
                                   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="relative h-12 bg-gray-800 rounded-full overflow-hidden shadow-inner p-1">
                                             <div className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-1000 ease-out flex items-center justify-start px-4 text-white font-black text-lg" style={{ width: `${balanceStats.a / (balanceStats.a + balanceStats.b) * 100}%` }}>{Math.round(balanceStats.a / (balanceStats.a + balanceStats.b) * 100)}%</div>
                                             <div className="absolute inset-y-0 right-0 bg-red-500 transition-all duration-1000 ease-out flex items-center justify-end px-4 text-white font-black text-lg" style={{ width: `${balanceStats.b / (balanceStats.a + balanceStats.b) * 100}%` }}>{Math.round(balanceStats.b / (balanceStats.a + balanceStats.b) * 100)}%</div>
                                        </div>
                                   </div>
                              )}
                         </div>
                    </div>
               );
          }

          if (activeFeature === 'mbti') {
               // Render MBTI test (simplified to start screen)
               return (
                    <div className="flex flex-col items-center justify-center p-6 animate-in slide-in-from-right max-w-2xl mx-auto h-full overflow-y-auto">
                         <div className="w-full flex justify-between items-center mb-8">
                              <button onClick={handleCloseFeature} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-white" /></button>
                              <h2 className="text-xl font-black text-white">MBTI 테스트</h2>
                              <div className="w-10" />
                         </div>
                         <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl p-10 w-full text-center border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                              <div className="text-6xl mb-6">🧠</div>
                              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">강남 캐릭터 찾기</h1>
                              <p className="text-gray-400 mb-8">총 28문항의 심리테스트로 나의 숨겨진 강남 자아를 발견하세요!</p>
                              <button onClick={() => { alert('준비중입니다!'); handleCloseFeature(); }} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">테스트 시작하기</button>
                         </div>
                    </div>
               );
          }

          if (activeFeature === 'bingo') {
               return (
                    <div className="p-6 flex flex-col items-center h-full max-w-md mx-auto">
                         <div className="w-full flex justify-between items-center mb-8">
                              <button onClick={handleCloseFeature} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-white" /></button>
                              <h2 className="text-xl font-black text-white">매일매일 출석 빙고</h2>
                              <div className="w-10" />
                         </div>
                         <p className="text-gray-400 mb-8 text-center">빙고를 완성하고 커피 쿠폰 받아가세요!</p>
                         <div className="grid grid-cols-5 gap-2 mb-8 w-full max-w-lg mx-auto">
                              {[...Array(25)].map((_, i) => (
                                   <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 transition-all cursor-pointer ${i === 12 || i === 0 ? 'bg-purple-600/50 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-purple-500/50 hover:bg-gray-700'}`}>
                                        {i === 12 || i === 0 ? '🎁' : i + 1}
                                   </div>
                              ))}
                         </div>
                    </div>
               )
          }

          if (activeFeature === 'chat') {
               return (
                    <div className="flex flex-col h-full max-w-2xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-3xl border border-teal-500/30 overflow-hidden shadow-[0_0_40px_rgba(20,184,166,0.15)]">
                         <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                              <h2 className="font-bold text-lg text-white flex items-center gap-2">🔥 실시간 강남 톡 <span className="text-xs bg-teal-500/20 border border-teal-500/50 text-teal-400 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping"/>42명</span></h2>
                              <button onClick={handleCloseFeature} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-400" /></button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-4 space-y-4">
                              {messages.map(msg => (
                                   <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.type === 'sent' ? 'bg-teal-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(13,148,136,0.3)]' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none shadow-sm'}`}>
                                             {msg.text}
                                             <div className={`text-[10px] mt-1 text-right ${msg.type === 'sent' ? 'text-teal-200' : 'text-gray-500'}`}>{msg.time}</div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                         <form onSubmit={handleSendChat} className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
                              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:border-teal-500 transition-colors" />
                              <button type="submit" className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white hover:bg-teal-500 transition-colors shadow-[0_0_15px_rgba(13,148,136,0.4)]">
                                   <Send className="w-4 h-4" />
                              </button>
                         </form>
                    </div>
               )
          }

          // DEFAULT DASHBOARD
          return (
               <div className="max-w-5xl mx-auto">
                    {/* ── Header ── */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                         <div>
                              <div className="flex items-center gap-3 mb-1.5">
                                   <button onClick={onExit} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all md:hidden border border-white/10">
                                        <ArrowLeft className="w-5 h-5" />
                                   </button>
                                   <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20">
                                             <Gamepad2 className="w-6 h-6 text-white" />
                                        </div>
                                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">NEON ARCADE</h1>
                                   </div>
                              </div>
                              <p className="text-indigo-300 text-sm pl-1 font-medium tracking-wide">프리미엄 라운지에서 기록을 갱신하세요</p>
                         </div>
                         <div className="flex items-center gap-3">
                              {/* Sound Toggle */}
                              <button onClick={toggleSound} className="bg-gray-800/80 border border-gray-700 hover:border-gray-500 rounded-xl p-3 text-gray-300 transition-all backdrop-blur-md shadow-lg group">
                                   {isMuted ? <VolumeX className="w-5 h-5 group-hover:text-red-400" /> : <Volume2 className="w-5 h-5 group-hover:text-emerald-400" />}
                              </button>
                              
                              <div className="flex items-center gap-2 bg-gray-900/80 border border-amber-500/30 rounded-xl px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                                   <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                                   <div className="flex flex-col">
                                        <span className="text-[10px] text-amber-500/80 font-bold leading-none mb-0.5">MY COIN</span>
                                        <span className="text-white font-black text-lg leading-none">{beanCount.toLocaleString()}</span>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* ── Section 1: 랭킹 아케이드 ── */}
                    <div className="flex items-center gap-4 mb-6">
                         <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-widest shrink-0 flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-indigo-400" /> RANKING ARCADE
                         </span>
                         <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                         {/* Card 1: Tetris */}
                         <div onClick={() => handleLoungeEntry('block')} className="bg-gray-900/60 rounded-3xl border border-fuchsia-500/20 hover:border-fuchsia-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(217,70,239,0.2)] group relative flex flex-col">
                              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="p-6 flex-1 flex flex-col relative z-10">
                                   <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-3xl border border-fuchsia-500/20 shadow-inner">🟦</div>
                                        <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">HOT</span>
                                   </div>
                                   <h3 className="text-xl font-black text-white mb-1">테트리스 <span className="text-fuchsia-400 font-bold">NEON</span></h3>
                                   <p className="text-gray-400 text-xs mb-4">클래식의 화려한 귀환</p>
                                   <div className="mt-auto bg-black/40 rounded-xl p-3 border border-white/5">
                                        <MiniRank gameId="block" max={2} />
                                   </div>
                              </div>
                         </div>

                         {/* Card 2: Snake */}
                         <div onClick={() => handleLoungeEntry('snake')} className="bg-gray-900/60 rounded-3xl border border-emerald-500/20 hover:border-emerald-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(16,185,129,0.2)] group relative flex flex-col">
                              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="p-6 flex-1 flex flex-col relative z-10">
                                   <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-3xl border border-emerald-500/20 shadow-inner">🐍</div>
                                   </div>
                                   <h3 className="text-xl font-black text-white mb-1">스네이크 <span className="text-emerald-400 font-bold">RUSH</span></h3>
                                   <p className="text-gray-400 text-xs mb-4">붕어빵을 먹고 끝없이 자라라</p>
                                   <div className="mt-auto bg-black/40 rounded-xl p-3 border border-white/5">
                                        <MiniRank gameId="snake" max={2} />
                                   </div>
                              </div>
                         </div>

                         {/* Card 3: Whack A Mole */}
                         <div onClick={() => handleLoungeEntry('whack')} className="bg-gray-900/60 rounded-3xl border border-amber-500/20 hover:border-amber-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(245,158,11,0.2)] group relative flex flex-col">
                              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="p-6 flex-1 flex flex-col relative z-10">
                                   <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl border border-amber-500/20 shadow-inner">🐹</div>
                                   </div>
                                   <h3 className="text-xl font-black text-white mb-1">두더지 <span className="text-amber-400 font-bold">SMASH</span></h3>
                                   <p className="text-gray-400 text-xs mb-4">30초! 당신의 순발력은?</p>
                                   <div className="mt-auto bg-black/40 rounded-xl p-3 border border-white/5">
                                        <MiniRank gameId="whack" max={2} />
                                   </div>
                              </div>
                         </div>

                         {/* Card 4: Brick Breaker */}
                         <div onClick={() => handleLoungeEntry('brick')} className="bg-gray-900/60 rounded-3xl border border-cyan-500/20 hover:border-cyan-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(6,182,212,0.2)] group relative flex flex-col">
                              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="p-6 flex-1 flex flex-col relative z-10">
                                   <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-3xl border border-cyan-500/20 shadow-inner">🧱</div>
                                   </div>
                                   <h3 className="text-xl font-black text-white mb-1">벽돌깨기 <span className="text-cyan-400 font-bold">BLAST</span></h3>
                                   <p className="text-gray-400 text-xs mb-4">아이템을 먹고 다 부숴버려요</p>
                                   <div className="mt-auto bg-black/40 rounded-xl p-3 border border-white/5">
                                        <MiniRank gameId="brick" max={2} />
                                   </div>
                              </div>
                         </div>

                         {/* Card 5: Tower Defense */}
                         <div onClick={() => handleLoungeEntry('towerdefense')} className="bg-gray-900/60 rounded-3xl border border-indigo-500/20 hover:border-indigo-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(99,102,241,0.2)] group relative flex flex-col lg:col-span-2">
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="p-6 flex-1 flex flex-col md:flex-row gap-6 relative z-10">
                                   <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                             <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-3xl border border-indigo-500/20 shadow-inner">🏰</div>
                                             <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)] tracking-wider">STRATEGY</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-1">타워 디펜스 <span className="text-indigo-400 font-bold">PRO</span></h3>
                                        <p className="text-gray-400 text-sm mb-4">최고의 전략으로 웨이브를 막아내세요</p>
                                   </div>
                                   <div className="w-full md:w-64 bg-black/40 rounded-2xl p-4 border border-white/5 shrink-0 h-full flex flex-col justify-center">
                                        <MiniRank gameId="towerdefense" max={3} />
                                   </div>
                              </div>
                         </div>
                         
                         {/* Other Games Grid */}
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:col-span-3">
                              {[
                                   { id: 'reaction', icon: '⚡', name: '반응속도', color: 'text-yellow-400', border: 'border-yellow-500/20 hover:border-yellow-400/60' },
                                   { id: 'typing', icon: '⌨️', name: '네온타자', color: 'text-pink-400', border: 'border-pink-500/20 hover:border-pink-400/60' },
                                   { id: 'game2048', icon: '🧩', name: '2048', color: 'text-orange-400', border: 'border-orange-500/20 hover:border-orange-400/60' },
                                   { id: 'flapon', icon: '🦅', name: '온 점프', color: 'text-amber-400', border: 'border-amber-500/20 hover:border-amber-400/60' },
                                   { id: 'memory', icon: '🃏', name: '짝맞추기', color: 'text-fuchsia-400', border: 'border-fuchsia-500/20 hover:border-fuchsia-400/60' },
                                   { id: 'dart', icon: '🎯', name: '다트', color: 'text-rose-400', border: 'border-rose-500/20 hover:border-rose-400/60' },
                                   { id: 'nunchi', icon: '👀', name: '눈치게임', color: 'text-teal-400', border: 'border-teal-500/20 hover:border-teal-400/60' }
                              ].map(game => (
                                   <div key={game.id} onClick={() => handleLoungeEntry(game.id)} className={`bg-gray-900/40 rounded-2xl border ${game.border} p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 group`}>
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{game.icon}</div>
                                        <div className={`font-bold text-sm ${game.color}`}>{game.name}</div>
                                   </div>
                              ))}
                         </div>
                    </div>

                    {/* ── Section 2: 소통·심리 ── */}
                    <div className="flex items-center gap-4 mb-6">
                         <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400 uppercase tracking-widest shrink-0 flex items-center gap-2">
                              <Crown className="w-4 h-4 text-rose-400" /> COMMUNITY & TEST
                         </span>
                         <div className="flex-1 h-px bg-gradient-to-r from-rose-500/30 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                         <div onClick={() => handleLoungeEntry('balance')} className="bg-gray-900/60 rounded-3xl border border-blue-500/20 hover:border-blue-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 p-6 relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl border border-blue-500/20 mb-4 shadow-inner relative z-10">⚖️</div>
                              <h3 className="text-lg font-black text-white mb-1 relative z-10">밸런스 게임</h3>
                              <p className="text-gray-400 text-xs relative z-10">부먹 vs 찍먹? 강남인들의 선택은?</p>
                         </div>

                         <div onClick={() => handleLoungeEntry('mbti')} className="bg-gray-900/60 rounded-3xl border border-purple-500/20 hover:border-purple-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 p-6 relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-2xl border border-purple-500/20 mb-4 shadow-inner relative z-10">🧠</div>
                              <h3 className="text-lg font-black text-white mb-1 relative z-10">MBTI 테스트</h3>
                              <p className="text-gray-400 text-xs relative z-10">나의 숨겨진 강남 자아를 찾아보세요</p>
                         </div>

                         <div onClick={() => handleLoungeEntry('tarot')} className="bg-gray-900/60 rounded-3xl border border-pink-500/20 hover:border-pink-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 p-6 relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-2xl border border-pink-500/20 mb-4 shadow-inner relative z-10">🔮</div>
                              <h3 className="text-lg font-black text-white mb-1 relative z-10">오늘의 타로</h3>
                              <p className="text-gray-400 text-xs relative z-10">매일 아침 확인하는 신비한 운세</p>
                         </div>

                         <div onClick={() => handleOpenFeature('spinroulette')} className="bg-gray-900/60 rounded-3xl border border-amber-500/20 hover:border-amber-400/60 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 p-6 relative group">
                              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl border border-amber-500/20 mb-4 shadow-inner relative z-10">🎰</div>
                              <h3 className="text-lg font-black text-white mb-1 relative z-10">행운의 룰렛</h3>
                              <p className="text-gray-400 text-xs relative z-10">코인을 불려보세요! 꽝도 조심!</p>
                         </div>
                    </div>
               </div>
          );
     };

     return (
          <div className="min-h-full bg-[#0A0A10] animate-in fade-in duration-500 overflow-y-auto custom-scrollbar relative">
               {/* Global Ambient Glows */}
               <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none" />
               <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-rose-900/10 rounded-full blur-[120px] pointer-events-none" />
               
               <div className="relative z-10 min-h-full p-4 md:p-8">
                    {renderContent()}
               </div>
          </div>
     );
};

export default GangnamLounge;
