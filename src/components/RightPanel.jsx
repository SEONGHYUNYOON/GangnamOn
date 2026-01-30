import React, { useState, useEffect } from 'react';
import { Sun, Zap, MapPin, Star, Heart, Cloud, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthWidget from './AuthWidget';
import GangnamTraffic from './GangnamTraffic';

const RightPanel = ({ onOpenMinihome, onOpenRewardCenter, onOpenAvatarCustomizer, isDark = false, beanCount = 0, updateBeanCount }) => {
     const [onlineCount, setOnlineCount] = useState(1204);
     const [trafficStatus, setTrafficStatus] = useState({
          jayuro: 'smooth',
          secondJayuro: 'slow',
          munsanHighway: 'smooth'
     });

     // --- Real-time Weather State ---
     const [weather, setWeather] = useState({
          temp: null,
          humidity: null,
          code: null,
          pm10: null,
          loading: true
     });

     // --- Auth State ---
     const [user, setUser] = useState(null);

     // --- Edit Profile State ---
     const [isEditingName, setIsEditingName] = useState(false);
     const [editName, setEditName] = useState('');

     // Mock Data: Real-time Users
     const onlineUsers = [
          { id: 1, name: '강남사랑꾼', status: 'online' },
          { id: 2, name: '역삼댁', status: 'online' },
          { id: 3, name: '강남지킴이', status: 'away' },
          { id: 4, name: '강남토박이', status: 'online' },
     ];

     // Romance Rank Mock
     const rankedUsers = [
          { id: 1, name: '역삼불주먹', hearts: 120, rank: 1, change: 'up' },
          { id: 2, name: '강남사랑꾼', hearts: 98, rank: 2, change: 'same' },
          { id: 3, name: '강남역여신', hearts: 85, rank: 3, change: 'down' },
     ];

     useEffect(() => {
          // Check active session
          supabase.auth.getSession().then(({ data: { session } }) => {
               setUser(session?.user ?? null);
          }).catch(err => console.error("Session check failed", err));

          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
               setUser(session?.user ?? null);
          });

          // Fetch Weather Data (강남 역삼동)
          const fetchWeather = async () => {
               try {
                    const [weatherRes, airRes] = await Promise.all([
                         fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5012&longitude=127.0396&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul'),
                         fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=37.5012&longitude=127.0396&current=pm10')
                    ]).catch(e => {
                         console.warn("API fetch failed, skipping weather:", e);
                         return [null, null];
                    });

                    if (!weatherRes || !airRes || !weatherRes.ok || !airRes.ok) {
                         console.warn("Weather API error or non-ok status");
                         setWeather(prev => ({ ...prev, loading: false }));
                         return;
                    }

                    const weatherData = await weatherRes.json();
                    const airData = await airRes.json();

                    if (!weatherData?.current || !airData?.current) {
                         console.warn("Invalid weather data structure");
                         setWeather(prev => ({ ...prev, loading: false }));
                         return;
                    }

                    setWeather({
                         temp: Math.round(weatherData.current.temperature_2m),
                         humidity: weatherData.current.relative_humidity_2m,
                         code: weatherData.current.weather_code,
                         pm10: airData.current.pm10,
                         loading: false
                    });
               } catch (error) {
                    console.error("Failed to fetch/parse weather:", error);
                    setWeather(prev => ({ ...prev, loading: false }));
               }
          };

          fetchWeather();
          // Fetch weather every 10 minutes
          const weatherInterval = setInterval(fetchWeather, 600000);

          // Online User Counter & Traffic Mock
          const userInterval = setInterval(() => {
               const change = Math.floor(Math.random() * 9) - 3;
               setOnlineCount(prev => prev + change);
          }, 3500);

          const trafficInterval = setInterval(() => {
               const statuses = ['smooth', 'slow', 'jammed'];
               setTrafficStatus({
                    jayuro: statuses[Math.floor(Math.random() * 3)],
                    secondJayuro: statuses[Math.floor(Math.random() * 3)],
                    munsanHighway: statuses[Math.floor(Math.random() * 3)],
               });
          }, 5000);

          return () => {
               subscription.unsubscribe();
               clearInterval(weatherInterval);
               clearInterval(userInterval);
               clearInterval(trafficInterval);
          };
     }, []);

     useEffect(() => {
          if (user) {
               // Prioritize nickname/display_name and REMOVE email ID fallback
               const displayName = user.user_metadata?.nickname ||
                    user.user_metadata?.display_name ||
                    user.user_metadata?.username ||
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    '닉네임을 설정해주세요';
               setEditName(displayName);
          }
     }, [user]);

     const handleLogout = async () => {
          await supabase.auth.signOut();
     };

     const handleUpdateName = async () => {
          if (!editName.trim()) return;

          // Check if name is actually changing
          const currentName = user.user_metadata?.nickname ||
               user.user_metadata?.display_name ||
               user.user_metadata?.username ||
               user.user_metadata?.full_name ||
               user.user_metadata?.name;

          if (editName === currentName) {
               setIsEditingName(false);
               return;
          }

          // Cost Logic
          const CHANGE_COST = 1000;
          if (beanCount < CHANGE_COST) {
               alert(`닉네임 변경에는 ${CHANGE_COST}온이 필요합니다! \n현재 보유: ${beanCount}온`);
               return;
          }

          const confirmed = window.confirm(`닉네임을 '${editName}'(으)로 변경하시겠습니까?\n비용: ${CHANGE_COST}온이 차감됩니다.`);
          if (!confirmed) return;

          const { data, error } = await supabase.auth.updateUser({
               data: {
                    nickname: editName,
                    display_name: editName,
                    username: editName,
                    full_name: editName,
                    name: editName
               }
          });

          if (error) {
               alert("이름 변경 실패: " + error.message);
          } else {
               // Deduct beans safely
               updateBeanCount(-CHANGE_COST);
               setUser(data.user);
               setIsEditingName(false);
               alert(`닉네임 변경 완료! -${CHANGE_COST}온`);
          }
     };

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

     // Helper functions for Weather
     const getWeatherInfo = (code) => {
          if (code === null || code === undefined) return { text: '...', icon: <Sun className="w-8 h-8 text-gray-300" /> };
          // WMO Weather interpretation codes
          if (code === 0) return { text: '맑음', icon: <Sun className="w-8 h-8 text-orange-500 animate-[spin_10s_linear_infinite]" /> };
          if ([1, 2, 3].includes(code)) return { text: '구름 조금', icon: <Cloud className="w-8 h-8 text-blue-400" /> };
          if ([45, 48].includes(code)) return { text: '안개', icon: <Cloud className="w-8 h-8 text-gray-400" /> };
          if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { text: '비', icon: <Cloud className="w-8 h-8 text-blue-600" /> };
          if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: '눈', icon: <Cloud className="w-8 h-8 text-sky-200" /> };
          if ([95, 96, 99].includes(code)) return { text: '천둥번개', icon: <Zap className="w-8 h-8 text-yellow-500" /> };
          return { text: '흐림', icon: <Cloud className="w-8 h-8 text-gray-400" /> };
     };

     const getDustInfo = (pm10) => {
          if (pm10 === null || pm10 === undefined) return { text: '정보없음', color: 'text-gray-500', bg: 'bg-gray-100' };
          if (pm10 <= 30) return { text: '미세먼지 좋음 😊', color: 'text-blue-600', bg: 'bg-blue-100' };
          if (pm10 <= 80) return { text: '미세먼지 보통 😐', color: 'text-green-600', bg: 'bg-green-100' };
          if (pm10 <= 150) return { text: '미세먼지 나쁨 😷', color: 'text-orange-600', bg: 'bg-orange-100' };
          return { text: '미세먼지 최악 👿', color: 'text-red-600', bg: 'bg-red-100' };
     };

     const weatherInfo = getWeatherInfo(weather.code);
     const dustInfo = getDustInfo(weather.pm10);

     // === LOGIN WIDGET (Replaces Minihome when logged out) ===
     const renderLoginWidget = () => (
          <AuthWidget />
     );

     // === DARK MODE RENDER (For Romance Tab) ===
     if (isDark) {
          return (
               // Modified: Removed sticky top-0, h-full, hidden lg:block
               <div className="w-full p-8 transition-colors duration-500">

                    {/* 1. 온 지갑 (Capsule Widget) */}
                    <div className="flex justify-end mb-6">
                         <div
                              onClick={onOpenRewardCenter}
                              className="bg-gray-800/80 backdrop-blur-md rounded-full pl-4 pr-1 py-1 shadow-lg border border-purple-500/30 cursor-pointer hover:border-purple-400 transition-all group flex items-center gap-3"
                         >
                              <div className="flex items-center gap-2">
                                   <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                                   <span className="text-sm font-black text-white">{beanCount.toLocaleString()} 온</span>
                              </div>
                              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                   </svg>
                              </button>
                         </div>
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
                              <h3 className="text-green-300 font-bold text-lg mb-1">스타벅스 교환 ☕</h3>
                              <p className="text-green-100/70 text-xs">열심히 모은 온으로<br />커피 한 잔 어때요?</p>
                         </div>
                         <Star className="absolute right-4 bottom-4 w-12 h-12 text-green-500/30 group-hover:scale-110 transition-transform" />
                    </div>

               </div>
          );
     }

     // === STANDARD RENDER ===
     return (
          // Modified: Removed sticky top-0, h-full, hidden lg:block
          <div className="w-full p-8 transition-colors duration-500">

               {/* 1. Login Widget OR My Mini-Homepage Widget */}
               {user ? (
                    <div
                         onClick={onOpenMinihome}
                         className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6 cursor-pointer hover:border-pink-200 hover:shadow-lg transition-all transform hover:-translate-y-1 group relative overflow-hidden"
                    >
                         <div className="flex justify-between items-center mb-6 relative z-10">
                              <div className="flex items-center gap-2">
                                   <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider group-hover:text-pink-500 transition-colors">내 미니홈피</h3>
                                   <span className="bg-green-100 text-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">ONLINE</span>
                              </div>

                              {/* Logout Button (Small) */}
                              <button
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogout();
                                   }}
                                   className="text-xs text-gray-300 hover:text-red-500 underline z-20"
                              >
                                   로그아웃
                              </button>
                         </div>

                         <div className="flex flex-col items-center relative z-10">
                              <div
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenAvatarCustomizer();
                                   }}
                                   className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 p-[2px] mb-3 group-hover:scale-105 transition-transform duration-300 relative cursor-pointer"
                              >
                                   <div className="w-full h-full rounded-full bg-white p-[2px]">
                                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                                             <img
                                                  src={user.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                                  className="w-full h-full object-cover"
                                                  alt="me"
                                             />
                                        </div>
                                   </div>
                                   {/* Edit Overlay */}
                                   <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Sparkles className="w-6 h-6 text-white" />
                                   </div>
                              </div>

                              {/* Name Display / Edit Mode */}
                              {isEditingName ? (
                                   <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                             type="text"
                                             value={editName}
                                             onChange={(e) => setEditName(e.target.value)}
                                             className="w-32 text-center border-b-2 border-purple-300 focus:outline-none font-bold text-gray-900 text-lg bg-transparent"
                                             autoFocus
                                        />
                                        <button
                                             onClick={handleUpdateName}
                                             className="bg-purple-500 text-white p-1 rounded-full hover:bg-purple-600"
                                        >
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </button>
                                   </div>
                              ) : (
                                   <div className="flex items-center gap-2 group/name cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}>
                                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                                             {user.user_metadata?.nickname || user.user_metadata?.display_name || user.user_metadata?.username || user.user_metadata?.full_name || user.user_metadata?.name || '닉네임을 설정해주세요'}
                                        </h4>
                                        <svg className="w-4 h-4 text-gray-300 opacity-0 group-hover/name:opacity-100 transition-opacity hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                   </div>
                              )}

                              {/* 온 잔액 */}
                              <div
                                   onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenRewardCenter();
                                   }}
                                   className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 mt-2 mb-4 cursor-pointer hover:bg-yellow-100 transition-colors hover:scale-110 transform"
                              >
                                   <span className="text-sm">🫘</span>
                                   <span className="text-xs font-black text-yellow-600">{beanCount.toLocaleString()} 온</span>
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
               ) : (
                    renderLoginWidget()
               )}

               {/* 2. Weather & Traffic Widget */}
               <div
                    onClick={() => window.open('https://search.naver.com/search.naver?query=강남+역삼동+날씨', '_blank')}
                    className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-blue-100 mb-6 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
               >
                    {/* Weather Section */}
                    <div className="flex items-center justify-between mb-6 relative z-10 h-12">
                         {weather.loading ? (
                              <div className="w-full flex justify-between items-center animate-pulse">
                                   <div className="h-8 w-24 bg-blue-200/50 rounded-lg"></div>
                                   <div className="h-6 w-20 bg-blue-200/50 rounded-lg"></div>
                              </div>
                         ) : (
                              <>
                                   <div>
                                        <div className="flex items-center gap-2 mb-1">
                                             {weatherInfo.icon}
                                             <span className="text-3xl font-bold text-gray-800">{weather.temp !== null ? weather.temp : '-'}°</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 ml-1">강남 역삼동 · {weatherInfo.text}</span>
                                   </div>
                                   <div className="text-right">
                                        <div className={`flex items-center justify-end gap-1 text-xs font-bold px-2 py-1 rounded-lg mb-1 ${dustInfo.color} ${dustInfo.bg}`}>
                                             <Zap className="w-3 h-3" />
                                             <span>{dustInfo.text}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                                             <Cloud className="w-3 h-3" />
                                             <span>습도 {weather.humidity !== null ? weather.humidity : '-'}%</span>
                                        </div>
                                   </div>
                              </>
                         )}
                    </div>

                    {/* Divider */}

               </div>

               {/* 2.5 New Traffic Widget */}
               <GangnamTraffic />

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
                              지금 <span className="text-purple-600 font-bold">강남온</span>을 여행 중입니다. 🚀
                         </p>
                    </div>
               </div>

          </div>
     );
};

export default RightPanel;
