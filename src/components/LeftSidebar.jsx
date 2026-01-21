import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Star, Heart, Coffee, HelpCircle, Bell, User, Book, Users, Calendar, PlusCircle, Palette, MessageCircle, ThumbsUp, Camera, Shield, Store, Zap, Database } from 'lucide-react';

const LeftSidebar = ({ activeTab, setActiveTab }) => {
     // State to manage expanded sections
     const [expandedSections, setExpandedSections] = useState({
          'lounge': true,
          'gathering': true,
          'biz': true,
          'community': true,
          'culture': true,
          'life': true,
          'school': true,
          'my': true,
          'project': true
     });

     const toggleSection = (id) => {
          setExpandedSections(prev => ({
               ...prev,
               [id]: !prev[id]
          }));
     };

     const navGroups = [
          // 'lounge' group removed as it is now a special button
          {
               id: 'gathering',
               title: '[동네 모임] 취미로 하나 되는 파주',
               items: [
                    { id: 'hiking', label: '산타는 파주', icon: MapPin, subtext: '등산/트레킹' },
                    { id: 'sports', label: 'FC 파주', icon: Star, subtext: '스포츠/운동' },
                    { id: 'pet', label: '멍냥회관', icon: Heart, subtext: '반려동물' },
                    { id: 'wine', label: '밤의 미식회', icon: Coffee, subtext: '와인/맛집/커피' },
               ]
          },
          {
               id: 'biz',
               title: '[우리동네 가게] 사장님 화이팅!',
               items: [
                    { id: 'local_biz', label: "Owner's Note", icon: Store, subtext: '오늘의 혜택 & 소식' }
               ]
          },
          {
               id: 'community',
               title: '[소통 공간] 우리끼리 속닥속닥',
               items: [
                    { id: 'town_story', label: '타운 스토리', icon: MessageCircle, subtext: '일상/잡담' },
                    { id: 'paju_pick', label: '파주 픽', icon: ThumbsUp, subtext: '맛집/핫플' },
                    { id: 'daily_photo', label: '데일리 포토', icon: Camera, subtext: '사진 갤러리' },
               ]
          },
          {
               id: 'culture',
               title: '[문화 생활] 감성 충전 파주',
               items: [
                    { id: 'culture_class', label: '문화 강연 & 클래스', icon: Palette, subtext: '원데이/인문학' }
               ]
          },
          {
               id: 'life',
               title: '[동네 생활] 찐 로컬들의 정보 공유',
               items: [
                    { id: 'qna', label: '무엇이든 물어보세요', icon: HelpCircle, subtext: 'Q&A' },
                    { id: 'news', label: '우리 동네 소식통', icon: Bell, subtext: '소식/교통' },
                    { id: 'share', label: '당근보다 가까운 나눔', icon: Heart, subtext: '중고/나눔' },
               ]
          },
          {
               id: 'school',
               title: '[아이러브스쿨] 추억과 사람 찾기',
               items: [
                    { id: 'school_find', label: '학교 찾기 & 동창회', icon: Book, subtext: '졸업생/기수' },
                    { id: 'friend_find', label: '친구 찾기', icon: Users, subtext: '동네친구' },
               ]
          },
          {
               id: 'my',
               title: '[마이 파주]',
               items: [
                    { id: 'badge', label: '나의 활동 뱃지', icon: Star, subtext: '파주토박이' },
                    { id: 'schedule', label: '나의 모임 일정', icon: Calendar, subtext: '일정관리' },
               ]
          },
          {
               id: 'admin_zone',
               title: '[관리자]',
               items: [
                    { id: 'admin', label: '관리자 홈', icon: Shield, subtext: '현황/통계' }
               ]
          },
          {
               id: 'project',
               title: '[프로젝트 문서]',
               items: [
                    { id: 'db_presentation', label: 'DB 구축 PPT', icon: Database, subtext: '상세 설계서' },
               ]
          }
     ];

     return (
          <div className="flex flex-col w-full h-full p-6 border-r border-gray-100 bg-white sticky top-0 overflow-y-auto scrollbar-hide">
               {/* Logo */}
               <div className="mb-8 px-2 flex items-center justify-center">
                    <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-[Pretendard] cursor-pointer" onClick={() => setActiveTab('home')}>
                         Paju On
                    </h1>
               </div>

               {/* Special: Paju Romance */}
               <div className="mb-2 px-0">
                    <button
                         onClick={() => setActiveTab('romance')}
                         className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group shadow-md ${activeTab === 'romance'
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-200 scale-[1.02]'
                              : 'bg-white border border-pink-100 text-gray-800 hover:border-pink-300 hover:shadow-lg'
                              }`}
                    >
                         <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${activeTab === 'romance' ? 'bg-white/20 text-white' : 'bg-pink-50 text-pink-500'
                                   }`}>
                                   <span className="text-lg">🔥</span>
                              </div>
                              <div className="text-left">
                                   <div className={`text-sm font-black ${activeTab === 'romance' ? 'text-white' : 'text-pink-600'
                                        }`}>
                                        파주 썸&쌈
                                   </div>
                                   <div className={`text-[10px] font-medium ${activeTab === 'romance' ? 'text-pink-100' : 'text-gray-400'
                                        }`}>
                                        2030 핫플레이스
                                   </div>
                              </div>
                         </div>
                    </button>
               </div>

               {/* Special: Paju Lounge */}
               <div className="mb-6 px-0">
                    <button
                         onClick={() => setActiveTab('paju_lounge')}
                         className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group shadow-md ${activeTab === 'paju_lounge'
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-indigo-200 scale-[1.02]'
                              : 'bg-white border border-indigo-100 text-gray-800 hover:border-indigo-300 hover:shadow-lg'
                              }`}
                    >
                         <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${activeTab === 'paju_lounge' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500'
                                   }`}>
                                   <Zap className="w-5 h-5 fill-current" />
                              </div>
                              <div className="text-left">
                                   <div className={`text-sm font-black ${activeTab === 'paju_lounge' ? 'text-white' : 'text-indigo-600'
                                        }`}>
                                        파주 라운지
                                   </div>
                                   <div className={`text-[10px] font-medium ${activeTab === 'paju_lounge' ? 'text-indigo-100' : 'text-gray-400'
                                        }`}>
                                        게임/MBTI/수다
                                   </div>
                              </div>
                         </div>
                    </button>
               </div>

               {/* Main Navigation */}
               <nav className="space-y-6">
                    {navGroups.map((group) => {
                         // Special handling for 'biz' group (Owner's Note) to render as a standalone box
                         if (group.id === 'biz') {
                              return (
                                   <div key={group.id} className="py-2">
                                        <button
                                             onClick={() => setActiveTab('local_biz')}
                                             className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group shadow-sm ring-1 ${activeTab === 'local_biz'
                                                  ? 'bg-slate-700 text-white ring-slate-700 shadow-slate-300 scale-[1.02]'
                                                  : 'bg-slate-50 ring-slate-200 text-slate-700 hover:ring-slate-300 hover:shadow-md'
                                                  }`}
                                        >
                                             <div className="flex items-center gap-3">
                                                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${activeTab === 'local_biz' ? 'bg-white/20 text-white' : 'bg-white text-slate-500 shadow-sm'
                                                       }`}>
                                                       <Store className="w-4 h-4" />
                                                  </div>
                                                  <div className="text-left">
                                                       <div className={`text-sm font-bold ${activeTab === 'local_biz' ? 'text-white' : 'text-slate-800'
                                                            }`}>
                                                            Owner's Note
                                                       </div>
                                                       <div className={`text-[10px] font-medium ${activeTab === 'local_biz' ? 'text-slate-300' : 'text-gray-400'
                                                            }`}>
                                                            오늘의 혜택 & 소식
                                                       </div>
                                                  </div>
                                             </div>
                                        </button>
                                   </div>
                              );
                         }

                         // Standard Accordion Group Rendering
                         return (
                              <div key={group.id} className="space-y-2">

                                   {/* Group Header */}
                                   <button
                                        onClick={() => toggleSection(group.id)}
                                        className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 px-2 py-1"
                                   >
                                        <span>{group.title}</span>
                                        {expandedSections[group.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                   </button>

                                   {/* Group Items */}
                                   {expandedSections[group.id] && (
                                        <div className="space-y-1">
                                             {group.items.map((item) => {
                                                  const Icon = item.icon;
                                                  return (
                                                       <button
                                                            key={item.id}
                                                            onClick={() => setActiveTab(item.id)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left ${activeTab === item.id
                                                                 ? 'bg-purple-50 text-purple-700'
                                                                 : 'text-gray-600 hover:bg-gray-50'
                                                                 }`}
                                                       >
                                                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${activeTab === item.id ? 'bg-white' : 'bg-gray-100 group-hover:bg-white'} transition-colors shadow-sm`}>
                                                                 <Icon className={`w-4 h-4 ${activeTab === item.id ? 'text-purple-600' : 'text-gray-500'}`} />
                                                            </div>
                                                            <div>
                                                                 <div className={`text-sm font-bold ${activeTab === item.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                      {item.label}
                                                                 </div>
                                                                 <div className="text-[10px] text-gray-400 font-medium">{item.subtext}</div>
                                                            </div>
                                                       </button>
                                                  );
                                             })}
                                        </div>
                                   )}
                              </div>
                         );
                    })}
               </nav>

               <div className="h-10"></div>
          </div>
     );
};

export default LeftSidebar;
