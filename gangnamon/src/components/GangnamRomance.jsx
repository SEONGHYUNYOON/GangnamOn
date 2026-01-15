import React, { useState } from 'react';
import { Heart, X, MessageCircle, MapPin, Zap, Star, Lock, Send, ChevronRight } from 'lucide-react';

const GangnamRomance = ({ beanCount, onHeartClick, onOpenRewardCenter }) => {
     // Demo State
     const [currentCardIndex, setCurrentCardIndex] = useState(0);
     const [lastAction, setLastAction] = useState(null); // 'like', 'superlike', 'pass', 'error'
     const [floatingTexts, setFloatingTexts] = useState([]);
     const [showLowBeanModal, setShowLowBeanModal] = useState(false);

     // Mock Profiles
     const profiles = [
          {
               id: 1,
               name: '논현동핵주먹',
               age: 26,
               location: '논현동',
               mbti: 'ENFP',
               job: '필라테스 강사',
               tags: ['#필라테스', '#오마카세', '#와인러버'],
               image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 2,
               name: '압구정사랑꾼',
               age: 29,
               location: '신사동 가로수길',
               mbti: 'ISTJ',
               job: '스타트업 CEO',
               tags: ['#골프', '#슈퍼카', '#청담카페'],
               image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800'
          }
     ];

     const lightnings = [
          {
               id: 1,
               title: '2:2 라운지바 벙개 가실 분! 🥂',
               location: '청담동',
               status: '여2 대기중',
               time: '지금 바로',
               icon: Zap
          },
          {
               id: 2,
               title: '퇴근 후 압구정 와인 한잔 🍷',
               location: '압구정 로데오',
               status: '남1 여1',
               time: '8시',
               icon: Zap
          },
          {
               id: 3,
               title: '심야 드라이브 가요 🏎️',
               location: '남산 소월길',
               status: '누구나',
               time: '10:30',
               icon: Star
          }
     ];

     const currentProfile = profiles[currentCardIndex % profiles.length];

     const handleAction = (type, cost) => {
          if (type === 'pass') {
               setLastAction('pass');
               setTimeout(() => {
                    setCurrentCardIndex(prev => prev + 1);
                    setLastAction(null);
               }, 500);
               return;
          }

          // Check Beans
          if (beanCount < cost) {
               setShowLowBeanModal(true);
               return;
          }

          // Deduction & Animation
          onHeartClick(-cost);

          // Add floating text
          const id = Date.now();
          setFloatingTexts(prev => [...prev, { id, text: `-${cost} ⭐` }]);
          setTimeout(() => {
               setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
          }, 1000);

          setLastAction(type);

          // Card transition for major actions
          if (type === 'like' || type === 'superlike') {
               setTimeout(() => {
                    setCurrentCardIndex(prev => prev + 1);
                    setLastAction(null);
               }, 800);
          } else {
               // For unlock/dm, just show success temporarily
               setTimeout(() => setLastAction(null), 1000);
          }
     };

     return (
          <div className="bg-gray-900 min-h-screen text-white rounded-3xl overflow-hidden shadow-2xl relative font-sans">

               {/* Background Decoration */}
               <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/50 to-transparent pointer-events-none"></div>
               <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-600/30 rounded-full blur-3xl pointer-events-none"></div>

               {/* Floating Cost Animation */}
               {floatingTexts.map(ft => (
                    <div key={ft.id} className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                         <div className="text-4xl font-black text-red-400 drop-shadow-lg animate-out slide-out-to-top-20 fade-out duration-1000">
                              {ft.text}
                         </div>
                    </div>
               ))}

               {/* Action Feedback Overlay */}
               {lastAction === 'like' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
                         <div className="bg-pink-500/90 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-xl backdrop-blur-sm">
                              😍 심쿵!
                         </div>
                    </div>
               )}
               {lastAction === 'superlike' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in spin-in-12 duration-500">
                         <div className="bg-blue-500/90 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-xl backdrop-blur-sm border-2 border-yellow-300">
                              ⭐ 슈퍼 라이크!
                         </div>
                    </div>
               )}
               {lastAction === 'pass' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-right duration-300">
                         <div className="bg-gray-700/90 text-gray-300 px-8 py-4 rounded-full text-2xl font-bold shadow-xl backdrop-blur-sm">
                              PASS 👋
                         </div>
                    </div>
               )}

               {/* Low Bean Modal */}
               {showLowBeanModal && (
                    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                         <div className="bg-gray-800 rounded-3xl p-6 w-full max-w-sm text-center border border-gray-700 shadow-2xl">
                              <div className="text-4xl mb-4">😭</div>
                              <h3 className="text-xl font-bold text-white mb-2">앗! 스타가 부족해요</h3>
                              <p className="text-gray-400 text-sm mb-6">
                                   마음에 드는 이성을 놓치지 않으려면<br />스타를 충전해야 해요!
                              </p>
                              <div className="flex gap-3">
                                   <button
                                        onClick={() => setShowLowBeanModal(false)}
                                        className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 font-bold text-sm"
                                   >
                                        취소
                                   </button>
                                   <button
                                        onClick={() => {
                                             setShowLowBeanModal(false);
                                             onOpenRewardCenter();
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20"
                                   >
                                        스타 벌러가기 ⚡
                                   </button>
                              </div>
                         </div>
                    </div>
               )}

               <div className="relative z-10 p-4 md:p-8 flex flex-col items-center">

                    {/* Header Copy */}
                    <div className="text-center mb-6">
                         <h2 className="text-xl md:text-2xl font-black mb-1 animate-in slide-in-from-top-4 duration-500">
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                                   오늘 밤, 로맨틱한 만남? 🥂
                              </span>
                         </h2>
                         <p className="text-gray-400 text-xs md:text-sm">보유 중인 스타로 <span className="text-yellow-400 font-bold">{Math.floor(beanCount / 5)}번</span> 더 심쿵할 수 있어요!</p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

                         {/* 1. Daily Match Card (Tinder Style) */}
                         <div className="flex flex-col items-center">
                              <div className="w-full max-w-sm aspect-[3/4] rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.3)] group border border-white/10 bg-gray-800">
                                   {/* Image */}
                                   <img
                                        src={currentProfile.image}
                                        alt={currentProfile.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                   />

                                   {/* Overlay Gradient */}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>

                                   {/* Top Right Actions */}
                                   <div className="absolute top-4 right-4 flex flex-col gap-3">
                                        <button
                                             onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAction('unlock', 30);
                                             }}
                                             className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all group/btn"
                                        >
                                             <Lock className="w-5 h-5 text-white group-hover/btn:text-black" />
                                             <span className="absolute right-12 bg-black/80 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                                  잠금해제 -30스타
                                             </span>
                                        </button>
                                   </div>

                                   {/* Info */}
                                   <div className="absolute bottom-0 left-0 w-full p-6 pb-24">
                                        <div className="flex items-end gap-2 mb-1">
                                             <h3 className="text-2xl font-bold text-white shadow-sm">{currentProfile.name}</h3>
                                             <span className="text-lg text-gray-200 font-medium">{currentProfile.age}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                                             <MapPin className="w-4 h-4 text-pink-500" />
                                             {currentProfile.location} · {currentProfile.job}
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2">
                                             {currentProfile.tags.map(tag => (
                                                  <span key={tag} className="px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md text-xs font-bold text-gray-300 border border-white/10">
                                                       {tag}
                                                  </span>
                                             ))}
                                        </div>
                                   </div>

                                   {/* Bottom Actions Bar */}
                                   <div className="absolute bottom-4 left-0 w-full px-4 flex justify-center items-end gap-4">

                                        {/* Pass */}
                                        <button
                                             onClick={() => handleAction('pass', 0)}
                                             className="w-12 h-12 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-red-500 hover:bg-gray-700 hover:scale-110 transition-all shadow-lg"
                                        >
                                             <X className="w-6 h-6" />
                                        </button>

                                        {/* Like (-5) */}
                                        <button
                                             onClick={() => handleAction('like', 5)}
                                             className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:scale-110 transition-all shadow-lg group relative"
                                        >
                                             <div className="flex flex-col items-center">
                                                  <Heart className="w-7 h-7 fill-white group-active:scale-90 transition-transform" />
                                                  <span className="text-[10px] font-bold mt-0.5">-5스타</span>
                                             </div>
                                        </button>

                                        {/* Super Like (-20) */}
                                        <div className="relative">
                                             <button
                                                  onClick={() => handleAction('superlike', 20)}
                                                  className="w-12 h-12 rounded-full bg-blue-500 border border-blue-400 flex items-center justify-center text-white hover:bg-blue-400 hover:scale-110 transition-all shadow-lg group"
                                             >
                                                  <Star className="w-6 h-6 fill-white" />
                                             </button>
                                             <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-300 w-full text-center">-20스타</span>
                                        </div>

                                        {/* DM (-50) */}
                                        <div className="relative">
                                             <button
                                                  onClick={() => handleAction('dm', 50)}
                                                  className="w-12 h-12 rounded-full bg-purple-500 border border-purple-400 flex items-center justify-center text-white hover:bg-purple-400 hover:scale-110 transition-all shadow-lg"
                                             >
                                                  <Send className="w-5 h-5 ml-0.5 fill-white" />
                                             </button>
                                             <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-purple-300 w-full text-center">-50스타</span>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         {/* 2. Lightning Meetup List */}
                         <div className="flex flex-col justify-center gap-4">
                              <div className="bg-gray-800/50 rounded-3xl p-6 border border-gray-700">
                                   <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                             <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                                             지금 바로 만나요
                                        </h3>
                                        <span className="text-xs text-gray-400 cursor-pointer hover:text-white">더보기</span>
                                   </div>

                                   <div className="space-y-3">
                                        {lightnings.map(item => {
                                             const Icon = item.icon;
                                             return (
                                                  <div key={item.id} className="bg-gray-700/50 rounded-2xl p-4 hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-between group">
                                                       <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                                                 <Icon className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                                                            </div>
                                                            <div>
                                                                 <h4 className="font-bold text-gray-200 text-sm">{item.title}</h4>
                                                                 <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                                                                      <span>{item.location}</span>
                                                                      <span>•</span>
                                                                      <span>{item.status}</span>
                                                                 </div>
                                                            </div>
                                                       </div>
                                                       <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-300" />
                                                  </div>
                                             )
                                        })}
                                   </div>
                              </div>

                              {/* Banner */}
                              <div className="bg-gradient-to-r from-pink-900 to-purple-900 rounded-2xl p-6 border border-white/10 relative overflow-hidden flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform" onClick={onOpenRewardCenter}>
                                   <div className="relative z-10">
                                        <h4 className="font-bold text-white text-lg mb-1">스타가 부족한가요?</h4>
                                        <p className="text-sm text-pink-200">무료 충전소 바로가기 &gt;</p>
                                   </div>
                                   <div className="relative z-10 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                                        ⭐
                                   </div>
                                   <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/20 blur-2xl rounded-full"></div>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamRomance;
