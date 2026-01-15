import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LeftSidebar from './components/LeftSidebar'
import RightPanel from './components/RightPanel'
import ILoveSchool from './components/ILoveSchool'
import UsedMarket from './components/UsedMarket'
import MeetingFeed from './components/MeetingFeed'
import MiniHomepage from './components/MiniHomepage'
import ChatWidget from './components/ChatWidget'
import CreatePostModal from './components/CreatePostModal'
import NeighborhoodLife from './components/NeighborhoodLife'
import PajuRomance from './components/PajuRomance'
import Toast from './components/Toast'
import ActivityRewardCenter from './components/ActivityRewardCenter'
import AuthWidget from './components/AuthWidget'
import AvatarCustomizer from './components/AvatarCustomizer'
import BannerWriteModal from './components/BannerWriteModal'
import './index.css'
import { User, LogIn, Menu, X, Megaphone } from 'lucide-react'
import DiningCompanion from './components/DiningCompanion'
import CultureClass from './components/CultureClass'
import AdminDashboard from './components/AdminDashboard'
import PajuLounge from './components/PajuLounge'
import OwnersNote from './components/OwnersNote'

function App() {
     const [activeTab, setActiveTab] = useState('home');
     const [isMiniHomeOpen, setIsMiniHomeOpen] = useState(false);
     const [miniHomeTargetUser, setMiniHomeTargetUser] = useState(null); // Target user for Minihome
     const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
     const [isRewardCenterOpen, setIsRewardCenterOpen] = useState(false);
     const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
     const [isBannerModalOpen, setIsBannerModalOpen] = useState(false); // New Toggle
     const [toastMessage, setToastMessage] = useState(null);
     const [beanCount, setBeanCount] = useState(1250); // Jangdan Bean Currency
     const [unlockedStyles, setUnlockedStyles] = useState(['lorelei', 'avataaars']); // Default free styles

     // Admin / Presence State
     const [onlineUsersCount, setOnlineUsersCount] = useState(1); // Self


     // Banner Messages State
     const [bannerMessages, setBannerMessages] = useState([
          "🎉 파주on 공식 오픈! 우리 동네 숨겨진 핫플레이스를 공유하고 적립금을 받아보세요! 🎉",
          "🐕 강아지를 찾습니다. 흰색 말티즈 운정에서 도망감 ㅠㅠ 뽀야 돌아와~~",
          "🌸 오늘 날씨 완전 봄이네용! 금촌 스벅에서 같이 카공하실 분? 제가 커피 쏨 >_<",
          "🐷 다이어트 한다고 저녁 굶었는데... 야당역 앞 붕어빵 냄새 유혹 미쳤음 3마리 순삭 ㅠㅠ",
          "🥕 저희 집 고양이가 츄르를 다 먹어서요..😭 남는 츄르 당근하실 분 계신가여?",
     ]);

     // Auth & Mobile State
     const [user, setUser] = useState(null);
     const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);
     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

     // --- 1. Data State ---
     const [marketItems, setMarketItems] = useState([
          { id: 1, title: '감성 캠핑 의자 세트', price: '45,000', location: '금촌동', likes: 12, image: 'https://images.unsplash.com/photo-1628144211608-410c2c31c463?q=80&w=500&auto=format&fit=crop' },
          { id: 2, title: '애플워치 스트랩', price: '15,000', location: '운정1동', likes: 5, image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?q=80&w=500&auto=format&fit=crop' },
          { id: 3, title: '빈티지 필름카메라', price: '120,000', location: '문산읍', likes: 48, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=500&auto=format&fit=crop' },
          { id: 4, title: '마샬 스피커 인테리어', price: '210,000', location: '야당동', likes: 89, image: 'https://images.unsplash.com/photo-1615557766860-2622700f1352?q=80&w=500&auto=format&fit=crop' },
          { id: 5, title: '아이패드 에어 4세대', price: '450,000', location: '금촌2동', likes: 21, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=500&auto=format&fit=crop' },
          { id: 6, title: '자전거 (픽시)', price: '80,000', location: '교하동', likes: 8, image: 'https://images.unsplash.com/photo-1576435728678-38d01d52e3bf?q=80&w=500&auto=format&fit=crop' },
     ]);

     const [meetingItems, setMeetingItems] = useState([
          {
               id: 1,
               category: '⛰️ 산타는 파주',
               title: '이번 주말 심학산 둘레길 가볍게 도실 분!',
               host: '산다람쥐',
               hostBadge: '파주 등산왕',
               date: '10월 28일 (토) 10:00 AM',
               location: '#심학산_배수지 #둘레길',
               participants: 3,
               maxParticipants: 5,
               isHot: true,
               image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=600&h=400'
          },
          {
               id: 2,
               category: '⚽️ FC 파주',
               title: '운정 호수공원 야간 런닝 크루 모집합니다 (초보환영)',
               host: '런닝맨',
               hostBadge: '파주 리더',
               date: '매주 화/목 20:00',
               location: '#운정호수공원 #야간런닝',
               participants: 12,
               maxParticipants: 20,
               isHot: false,
               image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600&h=400'
          },
          {
               id: 3,
               category: '🍷 밤의 미식회',
               title: '헤이리 마을 분위기 좋은 와인바 벙개 🍷',
               host: '와인러버',
               hostBadge: '미식가',
               date: '10월 27일 (금) 19:00',
               location: '#헤이리 #와인바',
               participants: 3,
               maxParticipants: 4,
               isHot: true,
               status: 'imminent',
               image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=600&h=400'
          },
          {
               id: 4,
               category: '🐶 멍냥회관',
               title: '운정 건강공원 강아지 산책 친구 구해요~',
               host: '멍멍이맘',
               hostBadge: '활동왕',
               date: '평일 오후 6시',
               location: '#운정건강공원 #반려견산책',
               participants: 1,
               maxParticipants: 3,
               isHot: false,
               image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600&h=400'
          }
     ]);

     useEffect(() => {
          // Check active session
          supabase.auth.getSession().then(({ data: { session } }) => {
               setUser(session?.user ?? null);
          });

          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
               setUser(session?.user ?? null);
          });

          // Presence Logic: Track who is online
          const channel = supabase.channel('online-users');
          channel
               .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState();
                    let count = 0;
                    for (let id in newState) {
                         count += newState[id].length;
                    }
                    setOnlineUsersCount(count);
               })
               .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                         await channel.track({
                              online_at: new Date().toISOString(),
                              user_id: user?.id || 'anon',
                         });
                    }
               });

          // Sync Profile Logic (Fix for 0 users issue)
          const syncProfile = async () => {
               if (user) {
                    const { data: profile } = await supabase
                         .from('profiles')
                         .select('id')
                         .eq('id', user.id)
                         .single();

                    if (!profile) {
                         const { error } = await supabase
                              .from('profiles')
                              .insert({
                                   id: user.id,
                                   username: user.user_metadata?.username || user.email?.split('@')[0],
                                   full_name: user.user_metadata?.full_name || '',
                                   avatar_url: user.user_metadata?.avatar_url || '',
                                   location: user.user_metadata?.region || '파주',
                                   beans: 1250
                              });
                         if (!error) {
                              console.log("Profile auto-created for existing user.");
                         } else {
                              console.error("Failed to auto-create profile:", error);
                         }
                    }
               }
          };
          syncProfile();

          // --- History Logic: Standard Trap ---
          // Goal: 1. Home -> Back -> Home (Stay). 2. Feature -> Back -> Main.

          const initHistory = () => {
               if (!window.history.state) {
                    // Initial Load: Create a [Backstop, Home] stack
                    window.history.replaceState({ tab: 'home' }, '', '');
                    window.history.pushState({ tab: 'home' }, '', '');
               }
          };
          initHistory();

          const handlePopState = (event) => {
               const tab = event.state?.tab;
               console.log("📍 PopState:", tab || "TRAP HIT");

               if (tab) {
                    // Normal Navigation (e.g., 'home', 'paju_lounge')
                    setActiveTab(tab);
               } else {
                    // Trap Hit (State is null or invalid) -> Force Stay on Home
                    // We hit the bottom, so push Home again to keep the trap active
                    window.history.pushState({ tab: 'home' }, '', '');
                    setActiveTab('home');
               }
          };

          window.addEventListener('popstate', handlePopState);

          return () => {
               subscription.unsubscribe();
               supabase.removeChannel(channel);
               window.removeEventListener('popstate', handlePopState);
          };
     }, [user]);

     // Handler for changing tabs with History Push
     const handleTabChange = (newTab) => {
          if (newTab === activeTab) return;

          // Sibling Navigation Strategy:
          // If we are moving between feature tabs (not Home), REPLACE the state.
          // This keeps the history stack flat: [Root, Home, CurrentTab].
          // So 'Back' always goes to 'Home', never to the previous sibling tab.
          const isHome = activeTab === 'home';

          if (!isHome && newTab !== 'home') {
               window.history.replaceState({ tab: newTab }, '', '');
          } else {
               window.history.pushState({ tab: newTab }, '', '');
          }

          setActiveTab(newTab);
          window.scrollTo(0, 0); // Ensure fresh scroll position
     };

     // --- 2. Share Logic ---
     const handleShare = (category, data, image) => {
          // Reward Logic
          setBeanCount(prev => prev + 10);

          if (category === 'market') {
               const newItem = {
                    id: Date.now(),
                    title: data.title,
                    price: '35,000',
                    location: '금촌동',
                    likes: 0,
                    image: image || 'https://via.placeholder.com/500'
               };
               setMarketItems([newItem, ...marketItems]);
               setToastMessage("중고 물품 등록! +10 콩 획득! 🫘");
          } else if (category === 'gathering') {
               const newItem = {
                    id: Date.now(),
                    category: '⚡ 번개모임',
                    title: data.title,
                    host: '금촌사랑꾼',
                    hostBadge: '신규',
                    date: `${data.date || '날짜미정'} ${data.time || ''}`,
                    location: `#${data.location || '장소미정'}`,
                    participants: 1,
                    maxParticipants: data.maxMembers || 4,
                    isHot: true,
                    image: image || 'https://via.placeholder.com/600'
               };
               setMeetingItems([newItem, ...meetingItems]);
               setToastMessage("모임 개설! +10 콩 획득! 🎉");
          } else {
               setToastMessage("작성 완료! +10 콩 획득! 🫘");
          }

          setIsCreateModalOpen(false);
     };

     const handleHeartClick = (cost) => {
          setBeanCount(prev => prev + cost);
     };

     const handleRewardClaim = (amount) => {
          setBeanCount(prev => prev + amount);
          // No toast needed here as the modal triggers a pulsing animation
     };

     const handleAvatarSave = async (newUrl) => {
          if (!user) return;

          const { data, error } = await supabase.auth.updateUser({
               data: { avatar_url: newUrl }
          });

          if (!error && user) {
               // Also sync to public.profiles
               await supabase
                    .from('profiles')
                    .update({ avatar_url: newUrl })
                    .eq('id', user.id);
          }

          if (error) {
               setToastMessage("아바타 저장 실패: " + error.message);
          } else {
               setUser(data.user);
               setToastMessage("캐릭터가 변경되었습니다! ✨");
               setIsAvatarModalOpen(false);
          }
     };

     const handlePurchaseStyle = (styleId, price) => {
          if (beanCount < price) {
               setToastMessage("콩이 부족해요! 열심히 활동해서 모아보세요 🫘");
               return false;
          }
          setBeanCount(prev => prev - price);
          setUnlockedStyles(prev => [...prev, styleId]);
          setToastMessage("새로운 스타일 구매 완료! ✨");
          return true;
     };

     const handleBannerSubmit = (message) => {
          const cost = 500;
          if (beanCount < cost) return;

          setBeanCount(prev => prev - cost);
          setBannerMessages(prev => [message, ...prev]);
          setToastMessage(`배너 등록 완료! -${cost} 콩 💸`);
     };

     const handleOpenMinihome = (targetProfile) => {
          if (targetProfile && targetProfile.name) {
               // Mock profile object
               setMiniHomeTargetUser({
                    user_metadata: {
                         username: targetProfile.name,
                         avatar_url: targetProfile.avatar,
                         location: targetProfile.location || '파주'
                    }
               });
               setIsMiniHomeOpen(true);
          } else if (user) {
               setMiniHomeTargetUser(user);
               setIsMiniHomeOpen(true);
          } else {
               setIsMobileLoginOpen(true);
          }
     };

     return (
          // Body Background
          <div className={`min-h-screen font-sans flex justify-center transition-colors duration-500 ${activeTab === 'romance' ? 'bg-[#0F172A]' : 'bg-[#FAFAFA]'}`}>

               {/* Toast Notification */}
               {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}


               {/* Central Container */}
               <div className="w-full max-w-[1920px] flex min-h-screen relative pb-20 md:pb-0 px-2 lg:px-4 gap-4 xl:gap-8">

                    {/* === Left Column (Fixed Width) === */}
                    <div className="w-[220px] xl:w-[260px] h-screen sticky top-0 hidden md:block overflow-y-auto no-scrollbar shrink-0 pt-4">
                         <LeftSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
                    </div>

                    {/* === Center Column (Flexible) === */}
                    <main className="flex-1 min-w-0 py-8 h-full flex flex-col gap-6">

                         {/* Top Marquee Banner */}
                         <div className="relative group">
                              <div
                                   className={`rounded-xl overflow-hidden py-3 mb-6 transition-colors duration-500 backdrop-blur-md cursor-pointer ${activeTab === 'romance' ? 'bg-purple-900/60 border border-purple-500/30' : 'bg-gray-900/80 text-white'
                                        }`}
                              >
                                   <div className="animate-marquee whitespace-nowrap text-md font-bold tracking-wide text-white flex items-center gap-8" style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}>
                                        {bannerMessages.map((msg, i) => (
                                             <span key={i} className="inline-block">
                                                  {msg}
                                             </span>
                                        ))}
                                   </div>
                              </div>

                              {/* Add Banner Button (Visible on Hover/Always for accessibility) */}
                              <button
                                   onClick={() => setIsBannerModalOpen(true)}
                                   className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-purple-600 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10"
                                   title="배너 등록하기 (500콩)"
                              >
                                   <Megaphone className="w-4 h-4" />
                              </button>
                         </div>

                         {
                              isBannerModalOpen && (
                                   <BannerWriteModal
                                        onClose={() => setIsBannerModalOpen(false)}
                                        onSubmit={handleBannerSubmit}
                                        userBeanCount={beanCount}
                                   />
                              )
                         }

                         {/* Content Feed */}
                         <div className="flex flex-col gap-8">

                              {/* NEW: PAJU LOUNGE TAB */}
                              {activeTab === 'paju_lounge' && (
                                   <PajuLounge onExit={() => handleTabChange('home')} user={user} />
                              )}

                              {/* 1. HOME TAB */}
                              {activeTab === 'home' && (
                                   <>
                                        {/* Host Banner */}
                                        <div
                                             onClick={() => setIsCreateModalOpen(true)}
                                             className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm flex items-center justify-between hover:border-purple-300 transition-colors cursor-pointer group"
                                        >
                                             <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✨</div>
                                                  <div>
                                                       <h3 className="font-bold text-gray-900">나만의 소모임 만들기</h3>
                                                       <p className="text-xs text-gray-500">파주 리더 뱃지를 획득해보세요!</p>
                                                  </div>
                                             </div>
                                             <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 transition-all transform group-hover:translate-x-1">
                                                  모임 개설하기
                                             </button>
                                        </div>
                                        <ILoveSchool />
                                        <DiningCompanion />
                                        <MeetingFeed items={meetingItems} />
                                        <UsedMarket items={marketItems} />
                                   </>
                              )}

                              {/* NEW: OWNER'S NOTE TAB (Previously Local Biz) */}
                              {activeTab === 'local_biz' && (
                                   <OwnersNote onOpenMinihome={handleOpenMinihome} />
                              )}

                              {/* 2. GATHERING TAB */}
                              {(['hiking', 'sports', 'pet', 'wine'].includes(activeTab)) && (
                                   <>
                                        <div className="flex items-center justify-between mb-2">
                                             <h2 className="text-xl font-bold text-gray-900">
                                                  {activeTab === 'hiking' && '⛰️ 산타는 파주'}
                                                  {activeTab === 'sports' && '⚽️ FC 파주 & 스포츠'}
                                                  {activeTab === 'pet' && '🐶 멍냥회관'}
                                                  {activeTab === 'wine' && '🍷 밤의 미식회'}
                                             </h2>
                                             <button onClick={() => setIsCreateModalOpen(true)} className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100">
                                                  + 모임 만들기
                                             </button>
                                        </div>
                                        <MeetingFeed items={meetingItems} />
                                   </>
                              )}

                              {/* 3. LIFE TAB */}
                              {(['qna', 'news', 'share'].includes(activeTab)) && (
                                   <>
                                        <div className="flex items-center justify-between mb-2">
                                             <h2 className="text-xl font-bold text-gray-900">
                                                  {activeTab === 'qna' && '🙋‍♀️ 무엇이든 물어보세요'}
                                                  {activeTab === 'news' && '📢 우리 동네 소식통'}
                                                  {activeTab === 'share' && '🎁 당근보다 가까운 나눔'}
                                             </h2>
                                        </div>
                                        {activeTab === 'share' ? (
                                             <UsedMarket items={marketItems} />
                                        ) : (
                                             <NeighborhoodLife filter={activeTab} />
                                        )}
                                   </>
                              )}

                              {/* 4. SCHOOL TAB */}
                              {(['school_find', 'friend_find'].includes(activeTab)) && (
                                   <ILoveSchool />
                              )}

                              {/* 5. CULTURE TAB (NEW) */}
                              {activeTab === 'culture_class' && (
                                   <CultureClass />
                              )}

                              {/* ADMIN TAB */}
                              {activeTab === 'admin' && (
                                   <AdminDashboard onlineUsersCount={onlineUsersCount} />
                              )}

                              {/* 6. PAJU ROMANCE (NEW) */}
                              {activeTab === 'romance' && (
                                   <PajuRomance
                                        beanCount={beanCount}
                                        onHeartClick={handleHeartClick}
                                        onOpenRewardCenter={() => setIsRewardCenterOpen(true)}
                                        user={user}
                                   />
                              )}

                              {/* 7. MY TAB */}
                              {(['badge', 'schedule'].includes(activeTab)) && (
                                   <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                                        <div className="text-center space-y-4">
                                             <div className="text-6xl animate-bounce">🏆</div>
                                             <h2 className="text-2xl font-bold text-gray-900">나의 파주 활동 Badge</h2>
                                             <p className="text-gray-500">
                                                  현재 <strong>'운정 새싹 🌱'</strong> 등급입니다.<br />
                                                  활동을 통해 레벨업 해보세요!
                                             </p>
                                             <button onClick={() => setIsMiniHomeOpen(true)} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                                  🏠 내 미니홈피 열기
                                             </button>
                                        </div>
                                   </div>
                              )}
                         </div>
                    </main>

                    {/* === Right Column (Fixed Width) === */}
                    <div className="w-[300px] xl:w-[350px] h-screen sticky top-0 hidden lg:block overflow-y-auto shrink-0 pt-4">
                         {/* Pass bean stats and dark mode flag */}
                         <RightPanel
                              onOpenMinihome={() => handleOpenMinihome()}
                              onOpenRewardCenter={() => setIsRewardCenterOpen(true)}
                              onOpenAvatarCustomizer={() => setIsAvatarModalOpen(true)}
                              isDark={activeTab === 'romance'}
                              beanCount={beanCount}
                              setBeanCount={setBeanCount}
                         />
                    </div>
               </div>

               {/* === Mobile Bottom Nav (Fixed) === */}
               <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 lg:hidden z-50 flex items-center justify-between px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-1" onClick={() => handleTabChange('home')}>
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">P</div>
                         <span className="font-bold text-gray-900 text-lg">PajuOn</span>
                    </div>

                    <button
                         onClick={() => {
                              if (user) {
                                   setIsMiniHomeOpen(true);
                              } else {
                                   setIsMobileLoginOpen(true);
                              }
                         }}
                         className={`px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all flex items-center gap-2 ${user
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                              : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                    >
                         {user ? (
                              <>
                                   <User className="w-4 h-4" /> 내 미니홈피
                              </>
                         ) : (
                              <>
                                   <LogIn className="w-4 h-4" /> 로그인
                              </>
                         )}
                    </button>
               </div>

               {/* === Mobile Login Modal === */}
               {isMobileLoginOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                         <div className="w-full max-w-sm relative">
                              <button
                                   onClick={() => setIsMobileLoginOpen(false)}
                                   className="absolute -top-12 right-0 text-white/80 hover:text-white p-2"
                              >
                                   <X className="w-8 h-8" />
                              </button>
                              <AuthWidget onLoginSuccess={() => setIsMobileLoginOpen(false)} />
                         </div>
                    </div>
               )}

               {/* Global Components */}
               {isMiniHomeOpen && (
                    <MiniHomepage
                         user={miniHomeTargetUser}
                         onClose={() => setIsMiniHomeOpen(false)}
                         onOpenAvatarCustomizer={() => {
                              setIsMiniHomeOpen(false);
                              setIsAvatarModalOpen(true);
                         }}
                    />
               )}       {isRewardCenterOpen && (
                    <ActivityRewardCenter
                         onClose={() => setIsRewardCenterOpen(false)}
                         onRewardClaim={handleRewardClaim}
                         onOpenCreatePost={() => setIsCreateModalOpen(true)}
                         currentBeanCount={beanCount}
                    />
               )}

               {isCreateModalOpen && (
                    <CreatePostModal
                         onClose={() => setIsCreateModalOpen(false)}
                         onShare={handleShare}
                         user={user}
                    />
               )}

               {/* Avatar Customizer Modal */}
               {isAvatarModalOpen && (
                    <AvatarCustomizer
                         onClose={() => setIsAvatarModalOpen(false)}
                         onSave={handleAvatarSave}
                         currentAvatarUrl={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                         unlockedStyles={unlockedStyles}
                         userBeanCount={beanCount}
                         onPurchaseStyle={handlePurchaseStyle}
                    />
               )}

               <ChatWidget />

          </div>
     )
}

export default App
