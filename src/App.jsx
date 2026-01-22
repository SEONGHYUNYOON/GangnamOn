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
import DbPresentation from './components/DbPresentation'

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
     const [marketItems, setMarketItems] = useState([]);
     const [meetingItems, setMeetingItems] = useState([]);

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

          // Sync Profile Logic & Load Data
          const fetchUserData = async () => {
               if (user) {
                    // 1. Fetch Profile (Beans, etc)
                    const { data: profile } = await supabase
                         .from('profiles')
                         .select('*')
                         .eq('id', user.id)
                         .single();

                    if (profile) {
                         setBeanCount(profile.beans || 0);
                         if (profile.unlocked_styles && Array.isArray(profile.unlocked_styles)) {
                              setUnlockedStyles(prev => [...new Set([...prev, ...profile.unlocked_styles])]);
                         }
                    } else {
                         // Create profile if missing
                         const { error } = await supabase
                              .from('profiles')
                              .insert({
                                   id: user.id,
                                   username: user.user_metadata?.username || user.email?.split('@')[0],
                                   full_name: user.user_metadata?.full_name || '',
                                   avatar_url: user.user_metadata?.avatar_url || '',
                                   location: user.user_metadata?.region || '파주',
                                   beans: 1250,
                                   unlocked_styles: ['lorelei', 'avataaars']
                              });
                         if (!error) {
                              setBeanCount(1250);
                         }
                    }
               }
          };
          fetchUserData();

          // Fetch Feed Data
          const fetchFeeds = async () => {
               // Market
               const { data: markets } = await supabase
                    .from('posts')
                    .select('*, author:profiles(username, avatar_url)')
                    .eq('type', 'market')
                    .order('created_at', { ascending: false });

               if (markets) {
                    setMarketItems(markets.map(m => ({
                         id: m.id,
                         title: m.title,
                         price: m.price?.toLocaleString() || '0',
                         location: m.location || '파주',
                         likes: m.likes_count || 0,
                         image: m.image_urls?.[0] || 'https://via.placeholder.com/500',
                         seller: m.author?.username
                    })));
               }

               // Gatherings
               const { data: gatherings } = await supabase
                    .from('posts')
                    .select('*, author:profiles(username, avatar_url)')
                    .in('type', ['gathering', 'hiking', 'sports', 'pet', 'wine']) // Fetch all gathering sub-types
                    .order('created_at', { ascending: false });

               if (gatherings) {
                    setMeetingItems(gatherings.map(g => ({
                         id: g.id,
                         category: g.type === 'gathering' ? '⚡ 번개'
                              : g.type === 'hiking' ? '⛰️ 등산'
                                   : g.type === 'sports' ? '⚽ 스포츠'
                                        : g.type === 'pet' ? '🐶 반려동물'
                                             : g.type === 'wine' ? '🍷 와인'
                                                  : g.type,
                         title: g.title,
                         host: g.author?.username || '익명',
                         hostBadge: '파주 이웃',
                         // Parse content for date/time if stored there, or use specific columns if added
                         date: new Date(g.created_at).toLocaleDateString(),
                         location: g.location || '장소미정',
                         participants: g.current_participants || 1,
                         maxParticipants: g.max_participants || 4,
                         isHot: (g.current_participants / g.max_participants) > 0.8,
                         image: g.image_urls?.[0] || 'https://via.placeholder.com/600'
                    })));
               }
          };
          fetchFeeds();

          // --- History Logic: Standard Trap ---
          const initHistory = () => {
               if (!window.history.state) {
                    window.history.replaceState({ tab: 'home' }, '', '');
                    window.history.pushState({ tab: 'home' }, '', '');
               }
          };
          initHistory();

          const handlePopState = (event) => {
               const tab = event.state?.tab;
               if (tab) {
                    setActiveTab(tab);
               } else {
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

     // Helper to update beans safely in DB and State
     const updateBeanCount = async (delta) => {
          setBeanCount(prev => {
               const newValue = prev + delta;
               if (user) {
                    supabase.from('profiles').update({ beans: newValue }).eq('id', user.id).then();
               }
               return newValue;
          });
     };

     // Handler for changing tabs
     const handleTabChange = (newTab) => {
          if (newTab === activeTab) return;
          const isHome = activeTab === 'home';
          if (!isHome && newTab !== 'home') {
               window.history.replaceState({ tab: newTab }, '', '');
          } else {
               window.history.pushState({ tab: newTab }, '', '');
          }
          setActiveTab(newTab);
          window.scrollTo(0, 0);
     };

     // --- 2. Share Logic ---
     const handleShare = async (category, data, image) => {
          if (!user) {
               setIsMobileLoginOpen(true);
               return;
          }

          const priceInt = parseInt(data.price?.replace(/,/g, '') || '0');

          let type = category;
          // Map category to DB types if needed
          if (category === 'market') type = 'market';
          else type = 'gathering'; // Default for other tabs 

          const newPost = {
               author_id: user.id,
               type: type,
               title: data.title,
               content: data.description || '',
               price: priceInt,
               location: data.location || '파주',
               max_participants: data.maxMembers ? parseInt(data.maxMembers) : null,
               image_urls: image ? [image] : [],
               likes_count: 0
          };

          const { data: savedPost, error } = await supabase
               .from('posts')
               .insert(newPost)
               .select('*, author:profiles(username)')
               .single();

          if (error) {
               setToastMessage("등록 실패: " + error.message);
               return;
          }

          updateBeanCount(10); // Reward

          if (category === 'market') {
               const newItem = {
                    id: savedPost.id,
                    title: savedPost.title,
                    price: savedPost.price?.toLocaleString(),
                    location: savedPost.location,
                    likes: 0,
                    image: savedPost.image_urls?.[0],
                    seller: savedPost.author?.username
               };
               setMarketItems(prev => [newItem, ...prev]);
               setToastMessage("중고 물품 등록! +10 콩 획득! 🫘");
          } else {
               const newItem = {
                    id: savedPost.id,
                    category: '⚡ 번개',
                    title: savedPost.title,
                    host: savedPost.author?.username,
                    hostBadge: '파주 이웃',
                    date: new Date().toLocaleDateString(),
                    location: savedPost.location,
                    participants: 1,
                    maxParticipants: savedPost.max_participants || 4,
                    isHot: true,
                    image: savedPost.image_urls?.[0]
               };
               setMeetingItems(prev => [newItem, ...prev]);
               setToastMessage("모임 개설! +10 콩 획득! 🎉");
          }

          setIsCreateModalOpen(false);
     };

     const handleHeartClick = (cost) => {
          updateBeanCount(cost);
     };

     const handleRewardClaim = (amount) => {
          updateBeanCount(amount);
          // No toast needed here as the modal triggers a pulsing animation
     };

     const handleAvatarSave = async (newUrl) => {
          if (!user) return;

          // 1. Update Public Profile (Primary Source)
          const { error: profileError } = await supabase
               .from('profiles')
               .update({ avatar_url: newUrl })
               .eq('id', user.id);

          if (profileError) {
               setToastMessage("저장 실패: " + profileError.message);
               return;
          }

          // 2. Sync Auth Metadata (Optional, for caching)
          const { data, error: authError } = await supabase.auth.updateUser({
               data: { avatar_url: newUrl }
          });

          setUser(data.user);
          setToastMessage("캐릭터가 변경되었습니다! ✨");
          setIsAvatarModalOpen(false);
     };

     const handlePurchaseStyle = async (styleId, price) => {
          if (!user) {
               setToastMessage("로그인이 필요합니다!");
               return false;
          }

          if (beanCount < price) {
               setToastMessage("콩이 부족해요! 열심히 활동해서 모아보세요 🫘");
               return false;
          }

          // Call RPC Function (Secure Transaction)
          const { data: success, error } = await supabase.rpc('purchase_avatar_style', {
               style_id: styleId,
               price: price
          });

          if (error) {
               console.error("Purchase error:", error);
               setToastMessage("구매 중 오류가 발생했습니다.");
               return false;
          }

          if (success) {
               // Update Local State if successful
               setBeanCount(prev => prev - price);
               setUnlockedStyles(prev => [...prev, styleId]);
               setToastMessage("새로운 스타일 구매 완료! ✨");
               return true;
          } else {
               setToastMessage("잔액이 부족하거나 이미 보유한 스타일입니다.");
               return false;
          }
     };

     const handleBannerSubmit = (message) => {
          const cost = 500;
          if (beanCount < cost) return;

          updateBeanCount(-cost);
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
               <div className="w-full max-w-[1920px] flex min-h-screen relative pt-20 lg:pt-0 pb-8 px-2 lg:px-4 gap-4 xl:gap-8">

                    {/* === Left Column (Fixed Width) === */}
                    <div className="w-[220px] xl:w-[260px] h-screen sticky top-0 hidden md:block overflow-y-auto no-scrollbar shrink-0 pt-4">
                         <LeftSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
                    </div>

                    {/* === Center Column (Flexible) === */}
                    <main className="flex-1 min-w-0 py-4 lg:py-8 h-full flex flex-col gap-6">

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

                              {/* 3. LIFE TAB & COMMUNITY TAB */}
                              {(['qna', 'news', 'share', 'town_story', 'paju_pick', 'daily_photo'].includes(activeTab)) && (
                                   <>
                                        <div className="flex items-center justify-between mb-2">
                                             <h2 className="text-xl font-bold text-gray-900">
                                                  {activeTab === 'qna' && '🙋‍♀️ 무엇이든 물어보세요'}
                                                  {activeTab === 'news' && '📢 우리 동네 소식통'}
                                                  {activeTab === 'share' && '🎁 당근보다 가까운 나눔'}
                                                  {activeTab === 'town_story' && '💬 타운 스토리'}
                                                  {activeTab === 'paju_pick' && '👍 파주 픽'}
                                                  {activeTab === 'daily_photo' && '📸 데일리 포토'}
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

                              {/* 8. DB PRESENTATION (NEW) */}
                              {activeTab === 'db_presentation' && (
                                   <DbPresentation />
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
                              updateBeanCount={updateBeanCount}
                         />
                    </div>
               </div>

               {/* === Mobile Top Nav (Fixed) === */}
               <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 p-3 lg:hidden z-50 flex items-center justify-between px-6 shadow-[0_5px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3">
                         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-500 hover:text-gray-900 active:bg-gray-100 rounded-full">
                              <Menu className="w-6 h-6" />
                         </button>
                         <div className="flex items-center gap-1" onClick={() => handleTabChange('home')}>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">P</div>
                              <span className="font-bold text-gray-900 text-lg">PajuOn</span>
                         </div>
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
               {
                    isMobileLoginOpen && (
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
                    )
               }

               {/* === Mobile Menu Drawer === */}
               {
                    isMobileMenuOpen && (
                         <div className="fixed inset-0 z-[70] lg:hidden">
                              {/* Backdrop */}
                              <div
                                   className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                                   onClick={() => setIsMobileMenuOpen(false)}
                              />
                              {/* Drawer */}
                              <div className="absolute left-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white animate-in slide-in-from-left duration-300 flex flex-col shadow-2xl">
                                   <div className="flex items-center justify-end p-4 border-b border-gray-100">
                                        <button
                                             onClick={() => setIsMobileMenuOpen(false)}
                                             className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
                                        >
                                             <X className="w-5 h-5" />
                                        </button>
                                   </div>
                                   <div className="flex-1 overflow-y-auto">
                                        <LeftSidebar
                                             activeTab={activeTab}
                                             setActiveTab={(tab) => {
                                                  handleTabChange(tab);
                                                  setIsMobileMenuOpen(false);
                                             }}
                                        />
                                   </div>
                              </div>
                         </div>
                    )
               }

               {/* Global Components */}
               {
                    isMiniHomeOpen && (
                         <MiniHomepage
                              user={miniHomeTargetUser || user}
                              currentUser={user}
                              onClose={() => setIsMiniHomeOpen(false)}
                              onOpenAvatarCustomizer={() => {
                                   setIsMiniHomeOpen(false);
                                   setIsAvatarModalOpen(true);
                              }}
                         />
                    )
               } {
                    isRewardCenterOpen && (
                         <ActivityRewardCenter
                              onClose={() => setIsRewardCenterOpen(false)}
                              onRewardClaim={handleRewardClaim}
                              onOpenCreatePost={() => setIsCreateModalOpen(true)}
                              currentBeanCount={beanCount}
                         />
                    )
               }

               {
                    isCreateModalOpen && (
                         <CreatePostModal
                              onClose={() => setIsCreateModalOpen(false)}
                              onShare={handleShare}
                              user={user}
                         />
                    )
               }

               {/* Avatar Customizer Modal */}
               {
                    isAvatarModalOpen && (
                         <AvatarCustomizer
                              onClose={() => setIsAvatarModalOpen(false)}
                              onSave={handleAvatarSave}
                              currentAvatarUrl={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                              unlockedStyles={unlockedStyles}
                              userBeanCount={beanCount}
                              onPurchaseStyle={handlePurchaseStyle}
                         />
                    )
               }

               <ChatWidget />

          </div >
     )
}

export default App
