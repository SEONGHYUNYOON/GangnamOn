import React, { useState, useEffect } from 'react';
import { User, MoreHorizontal, Circle, Sun, Zap, MapPin, Star, Heart, Cloud } from 'lucide-react';

const RightPanel = ({ onOpenMinihome, onOpenRewardCenter, isDark = false, beanCount = 0 }) => {
     const [onlineCount, setOnlineCount] = useState(1204);
     const [trafficStatus, setTrafficStatus] = useState({
          jayuro: 'smooth',
          secondJayuro: 'slow',
          munsanHighway: 'smooth'
     });

     // Mock Data: Real-time Users
     const onlineUsers = [
          { id: 1, name: '압구정힙스터', status: 'online' },
          { id: 2, name: '대치동맘', status: 'online' },
          { id: 3, name: '강남지킴이', status: 'away' },
          { id: 4, name: '역삼직장인', status: 'online' },
     ];

     // Romance Rank Mock
     const rankedUsers = [
          { id: 1, name: '논현동핵주먹', hearts: 120, rank: 1, change: 'up' },
          { id: 2, name: '압구정사랑꾼', hearts: 98, rank: 2, change: 'same' },
          { id: 3, name: '강남역여신', hearts: 85, rank: 3, change: 'down' },
     ];

     useEffect(() => {
          // Online User Counter
          const userInterval = setInterval(() => {
               const change = Math.floor(Math.random() * 9) - 3;
               setOnlineCount(prev => prev + change);
          }, 3500);

          // Traffic Status Simulation
          const trafficInterval = setInterval(() => {
               const statuses = ['smooth', 'slow', 'jammed'];
               setTrafficStatus({
                    jayuro: statuses[Math.floor(Math.random() * 3)],
                    secondJayuro: statuses[Math.floor(Math.random() * 3)],
                    munsanHighway: statuses[Math.floor(Math.random() * 3)],
               });
          }, 5000);

          return () => {
               clearInterval(userInterval);
               clearInterval(trafficInterval);
          };
     }, []);

     const getTrafficColor = (status) => {
          switch (status) {
               case 'smooth': return 'bg-green-500';
               case 'slow': return 'bg-yellow-400';
               case 'jammed': return 'bg-red-500';
               default: return 'bg-gray-300';
          }
     };

     const getTrafficText = (status) => {
          switch (status) {
               case 'smooth': return '원활';
               case 'slow': return '서행';
               case 'jammed': return '정체';
               default: return '-';
          }
     };

     // === DARK MODE RENDER (For Romance Tab) ===
     if (isDark) {
          return (
               <div className="hidden lg:block w-full h-full p-8 sticky top-0 bg-gray-900 border-l border-gray-800 text-white transition-colors duration-500">

                    {/* 1. Bean Wallet */}
                    <div
                         onClick={onOpenRewardCenter}
                         className="bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-700 mb-6 cursor-pointer hover:border-pink-500 transition-colors group"
                    >
                         <div className="flex items-center justify-between mb-4">
                              <h3 className="text-pink-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                   <Zap className="w-4 h-4" /> 스타 충전소
                              </h3>
                              <span className="text-xs text-gray-500 group-hover:text-white transition-colors">내역보기 &gt;</span>
                         </div>
                         <div className="flex items-end gap-2 mb-2">
                              <span className="text-3xl font-black text-yellow-400 group-hover:scale-105 transition-transform origin-left">{beanCount.toLocaleString()}</span>
                              <span className="text-sm font-bold text-gray-400 mb-1">스타 ⭐</span>
                         </div>
                         <button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-2 rounded-xl text-sm hover:opacity-90 transition-opacity">
                              + 충전하기
                         </button>
                    </div>

                    {/* 2. Real-time Ranking */}
                    <div className="bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-700 mb-6">
                         <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Star className="w-4 h-4" /> 실시간 인기 랭킹
                         </h3>
                         <div className="space-y-4">
                              {rankedUsers.map((user, idx) => (
                                   <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                             <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-400 text-black' :
                                                  idx === 1 ? 'bg-gray-400 text-black' :
                                                       'bg-orange-700 text-white'
                                                  }`}>
                                                  {user.rank}
                                             </div>
                                             <span className="font-bold text-gray-200">{user.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-pink-500 font-bold">
                                             <Heart className="w-3 h-3 fill-pink-500" />
                                             {user.hearts}
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>

                    {/* 3. Shop Banner */}
                    <div className="bg-gradient-to-br from-green-800 to-emerald-900 rounded-3xl p-6 border border-green-700/50 relative overflow-hidden group cursor-pointer">
                         <div className="relative z-10">
                              <h3 className="text-green-300 font-bold text-lg mb-1">신라호텔 망고빙수 🥭</h3>
                              <p className="text-green-100/70 text-xs">열심히 모은 스타로<br />호캉스 어때요?</p>
                         </div>
                         <Star className="absolute right-4 bottom-4 w-12 h-12 text-green-500/30 group-hover:scale-110 transition-transform" />
                    </div>

               </div>
          );
     }

     // === STANDARD RENDER ===
     return (
          <div className="hidden lg:block w-full h-full p-8 sticky top-0 transition-colors duration-500">

               {/* 1. My Mini-Homepage Widget (With Beans) */}
               <div
                    onClick={onOpenMinihome}
                    className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6 cursor-pointer hover:border-pink-200 hover:shadow-lg transition-all transform hover:-translate-y-1 group relative overflow-hidden"
               >
                    <div className="flex justify-between items-center mb-6 relative z-10">
                         <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider group-hover:text-pink-500 transition-colors">My Minihome</h3>
                         <MoreHorizontal className="w-5 h-5 text-gray-300 group-hover:text-pink-500 transition-colors" />
                    </div>

                    <div className="flex flex-col items-center relative z-10">
                         <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 p-[2px] mb-3 group-hover:scale-105 transition-transform duration-300">
                              <div className="w-full h-full rounded-full bg-white p-[2px]">
                                   <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full" alt="me" />
                                   </div>
                              </div>
                         </div>
                         <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">나의 강남 라이프</h4>

                         {/* Bean Count (New) */}
                         <div
                              onClick={(e) => {
                                   e.stopPropagation();
                                   onOpenRewardCenter();
                              }}
                              className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 mt-2 mb-4 cursor-pointer hover:bg-yellow-100 transition-colors hover:scale-110 transform"
                         >
                              <span className="text-sm">⭐</span>
                              <span className="text-xs font-black text-yellow-600">{beanCount.toLocaleString()} 스타</span>
                         </div>

                         <div className="flex gap-8 w-full justify-center border-t border-gray-50 pt-4">
                              <div className="text-center group-hover:text-gray-900 transition-colors">
                                   <span className="block text-lg font-bold text-gray-900">128</span>
                                   <span className="text-[10px] text-gray-400 uppercase">Today</span>
                              </div>
                              <div className="text-center">
                                   <span className="block text-lg font-bold text-gray-900">1.2k</span>
                                   <span className="text-[10px] text-gray-400 uppercase">Total</span>
                              </div>
                         </div>
                    </div>
               </div>

               {/* 2. Weather & Traffic Widget */}
               <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-blue-100 mb-6 relative overflow-hidden">
                    {/* Weather Section */}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                         <div>
                              <div className="flex items-center gap-2 mb-1">
                                   <Sun className="w-8 h-8 text-orange-400" />
                                   <span className="text-3xl font-bold text-gray-800">24°</span>
                              </div>
                              <span className="text-xs font-bold text-gray-500 ml-1">서울 역삼동</span>
                         </div>
                         <div className="text-right">
                              <div className="flex items-center justify-end gap-1 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg mb-1">
                                   <Zap className="w-3 h-3" />
                                   <span>미세먼지 좋음 😊</span>
                              </div>
                              <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                                   <Cloud className="w-3 h-3" />
                                   <span>습도 45%</span>
                              </div>
                         </div>
                    </div>

                    {/* Divider */}
                    <div className="h-[1px] bg-blue-200/50 w-full mb-5"></div>

                    {/* Traffic Section */}
                    <div>
                         <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> 교통 상황 (실시간)
                         </h3>
                         <div className="space-y-3">
                              {/* 1. Teheran-ro */}
                              <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">테헤란로</span>
                                   <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getTrafficColor(trafficStatus.jayuro)} animate-pulse`}></div>
                                        <span className="text-xs font-bold text-gray-600">{getTrafficText(trafficStatus.jayuro)}</span>
                                   </div>
                              </div>
                              {/* 2. Gangnam-daero */}
                              <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">강남대로</span>
                                   <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getTrafficColor(trafficStatus.secondJayuro)} animate-pulse`}></div>
                                        <span className="text-xs font-bold text-gray-600">{getTrafficText(trafficStatus.secondJayuro)}</span>
                                   </div>
                              </div>
                              {/* 3. Olympic Highway */}
                              <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">올림픽대로</span>
                                   <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getTrafficColor(trafficStatus.munsanHighway)} animate-pulse`}></div>
                                        <span className="text-xs font-bold text-gray-600">{getTrafficText(trafficStatus.munsanHighway)}</span>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>

               {/* 3. Real-time Users Widget */}
               <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100">

                    {/* Header with Visual Effect */}
                    <div className="flex items-center justify-between mb-6">
                         <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider">Live Now</h3>
                         <div className="flex items-center gap-2 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                              <div className="relative flex h-2 w-2">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </div>
                              <span className="text-xs font-bold text-green-600 tabular-nums">
                                   {onlineCount.toLocaleString()}명
                              </span>
                         </div>
                    </div>

                    {/* User List */}
                    <div className="space-y-4 relative">
                         <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10"></div>

                         {onlineUsers.map(user => (
                              <div key={user.id} className="flex items-center justify-between bg-white z-10">
                                   <div className="flex items-center gap-3">
                                        <div className="relative">
                                             <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden">
                                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} />
                                             </div>
                                             {user.status === 'online' && (
                                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                                             )}
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{user.name}</span>
                                   </div>
                                   <span className="text-[10px] font-medium text-gray-400">
                                        {user.status === 'online' ? 'On' : 'Away'}
                                   </span>
                              </div>
                         ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                         <p className="text-xs text-gray-400 leading-relaxed">
                              외 <span className="font-bold text-gray-800">{(onlineCount - onlineUsers.length).toLocaleString()}명</span>이<br />
                              지금 <span className="text-purple-600 font-bold">강남on</span>을 여행 중입니다. 🚀
                         </p>
                    </div>
               </div>

          </div>
     );
};

export default RightPanel;
