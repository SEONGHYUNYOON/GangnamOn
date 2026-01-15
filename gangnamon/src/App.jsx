import React, { useState } from 'react'
import LeftSidebar from './components/LeftSidebar'
import RightPanel from './components/RightPanel'
import ILoveSchool from './components/ILoveSchool'
import UsedMarket from './components/UsedMarket'
import MeetingFeed from './components/MeetingFeed'
import MiniHomepage from './components/MiniHomepage'
import ChatWidget from './components/ChatWidget'
import CreatePostModal from './components/CreatePostModal'
import NeighborhoodLife from './components/NeighborhoodLife'
import GangnamRomance from './components/GangnamRomance'
import Toast from './components/Toast'
import ActivityRewardCenter from './components/ActivityRewardCenter'
import './index.css'

function App() {
     const [activeTab, setActiveTab] = useState('home');
     const [isMiniHomeOpen, setIsMiniHomeOpen] = useState(false);
     const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
     const [isRewardCenterOpen, setIsRewardCenterOpen] = useState(false);
     const [toastMessage, setToastMessage] = useState(null);
     const [beanCount, setBeanCount] = useState(1250); // Jangdan Bean Currency

     // --- 1. Data State ---
     const [marketItems, setMarketItems] = useState([
          { id: 1, title: '샤넬 카드지갑 (미사용)', price: '850,000', location: '청담동', likes: 112, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 2, title: '애플워치 울트라 풀박스', price: '950,000', location: '역삼동', likes: 45, image: 'https://images.unsplash.com/photo-1664478546384-d57ffe74a791?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 3, title: '한정판 나이키 덩크 로우', price: '420,000', location: '신사동', likes: 248, image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 4, title: 'PT 30회 양도합니다', price: '1,500,000', location: '대치동', likes: 89, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 5, title: '톰브라운 가디건', price: '650,000', location: '반포동', likes: 71, image: 'https://images.unsplash.com/photo-1616486338812-3aeee0770399?auto=format&fit=crop&q=80&w=500&h=500' },
          { id: 6, title: '허먼밀러 의자', price: '1,200,000', location: '삼성동', likes: 58, image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=500&h=500' },
     ]);

     const [meetingItems, setMeetingItems] = useState([
          {
               id: 1,
               category: '🍷 와인 & 위스키',
               title: '청담동 위스키 바에서 싱글몰트 시음회 (엔트리 환영)',
               host: '위스키러버',
               hostBadge: '바텐더',
               date: '10월 28일 (토) 20:00',
               location: '#청담동 #몰트바',
               participants: 3,
               maxParticipants: 6,
               isHot: true,
               image: 'https://images.unsplash.com/photo-1569931727763-71887e49195d?auto=format&fit=crop&q=80&w=600&h=400'
          },
          {
               id: 2,
               category: '🏃‍♂️ 압구정 러닝',
               title: '선정릉~양재천 야간 시티런 참여하실 분 (페이스 530)',
               host: '아이언맨',
               hostBadge: '러닝코치',
               date: '매주 화/목 19:30',
               location: '#선정릉 #양재천',
               participants: 12,
               maxParticipants: 20,
               isHot: true,
               image: 'https://images.unsplash.com/photo-1552674605-4694c0cc5c34?auto=format&fit=crop&q=80&w=600&h=400'
          },
          {
               id: 3,
               category: '📈 부동산/주식',
               title: '강남 부동산 임장 및 재테크 스터디 (뒷풀이 있음)',
               host: '건물주되고파',
               hostBadge: '분석가',
               date: '10월 29일 (일) 14:00',
               location: '#강남역 #스터디룸',
               participants: 5,
               maxParticipants: 8,
               isHot: true,
               status: 'imminent',
               image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600&h=400'
          },
          {
               id: 4,
               category: '🗣️ 영어 회화',
               title: '직장인 비즈니스 영어 회화 모임 (신논현역)',
               host: 'David',
               hostBadge: '원어민',
               date: '평일 오후 7시',
               location: '#신논현 #카페',
               participants: 2,
               maxParticipants: 4,
               isHot: false,
               image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600&h=400'
          }
     ]);

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
               setToastMessage("중고 물품 등록! +10 스타 획득! ⭐");
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
               setToastMessage("작성 완료! +10 스타 획득! ⭐");
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

     return (
          // Body Background
          <div className={`min-h-screen font-sans flex justify-center transition-colors duration-500 ${activeTab === 'romance' ? 'bg-[#0F172A]' : 'bg-[#FAFAFA]'}`}>

               {/* Toast Notification */}
               {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

               {/* Central Container */}
               <div className="w-full max-w-[1280px] flex min-h-screen">

                    {/* === Left Column === */}
                    <div className="w-[20%] h-screen sticky top-0 hidden md:block overflow-y-auto no-scrollbar">
                         <LeftSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>

                    {/* === Center Column === */}
                    <main className="w-full md:w-[50%] px-0 md:px-8 py-8 h-full flex flex-col gap-6">

                         {/* Top Marquee Banner */}
                         <div className={`rounded-2xl overflow-hidden py-3 text-white shadow-lg shadow-gray-200 transition-colors duration-500 ${activeTab === 'romance' ? 'bg-gradient-to-r from-pink-900 to-purple-900' : 'bg-gradient-to-r from-gray-900 to-black'
                              }`}>
                              📢 강남on 공식 오픈! 트렌디한 강남 라이프를 공유하고 스타를 받아보세요! 🎉 CEO/전문직 네트워킹 모임을 찾습니다! 🏢  🐕 강아지 찾습니다. 비숑 프리제 신논현역 근처에서 도망감ㅠㅠ 코코야 돌아와~~
                         </div>

                         {/* Content Feed */}
                         <div className="flex flex-col gap-8">

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
                                                       <p className="text-xs text-gray-500">강남 셀럽 뱃지를 획득해보세요!</p>
                                                  </div>
                                             </div>
                                             <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 transition-all transform group-hover:translate-x-1">
                                                  모임 개설하기
                                             </button>
                                        </div>
                                        <ILoveSchool />
                                        <MeetingFeed items={meetingItems} />
                                        <UsedMarket items={marketItems} />
                                   </>
                              )}

                              {/* 2. GATHERING TAB */}
                              {(['hiking', 'sports', 'pet', 'wine'].includes(activeTab)) && (
                                   <>
                                        <div className="flex items-center justify-between mb-2">
                                             <h2 className="text-xl font-bold text-gray-900">
                                                  {activeTab === 'hiking' && '🍷 와인 & 위스키'}
                                                  {activeTab === 'sports' && '🏃‍♂️ 압구정 러닝'}
                                                  {activeTab === 'pet' && '📈 부동산/주식'}
                                                  {activeTab === 'wine' && '🗣️ 영어 회화'}
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

                              {/* 5. GANGNAM ROMANCE (NEW) */}
                              {activeTab === 'romance' && (
                                   <GangnamRomance
                                        beanCount={beanCount}
                                        onHeartClick={handleHeartClick}
                                        onOpenRewardCenter={() => setIsRewardCenterOpen(true)}
                                   />
                              )}

                              {/* 6. MY TAB */}
                              {(['badge', 'schedule'].includes(activeTab)) && (
                                   <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                                        <div className="text-center space-y-4">
                                             <div className="text-6xl animate-bounce">🏆</div>
                                             <h2 className="text-2xl font-bold text-gray-900">나의 강남 활동 Badge</h2>
                                             <p className="text-gray-500">
                                                  현재 <strong>'역삼 새싹 🌱'</strong> 등급입니다.<br />
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

                    {/* === Right Column === */}
                    <div className="w-[30%] h-screen sticky top-0 hidden lg:block overflow-y-auto no-scrollbar">
                         {/* Pass bean stats and dark mode flag */}
                         <RightPanel
                              onOpenMinihome={() => setIsMiniHomeOpen(true)}
                              onOpenRewardCenter={() => setIsRewardCenterOpen(true)}
                              isDark={activeTab === 'romance'}
                              beanCount={beanCount}
                         />
                    </div>
               </div>

               {/* Global Components */}
               {isMiniHomeOpen && <MiniHomepage onClose={() => setIsMiniHomeOpen(false)} />}

               {isRewardCenterOpen && (
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
                    />
               )}

               <ChatWidget />

          </div>
     )
}

export default App
