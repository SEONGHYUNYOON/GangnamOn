import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Star, Heart, Coffee, HelpCircle, Bell, User, Book, Users, Calendar, PlusCircle, Palette, MessageCircle, ThumbsUp, Camera, Shield, Store, Zap, Flame } from 'lucide-react';
import logo from '../assets/gangnam_on_logo.png';

const LeftSidebar = ({ activeTab, setActiveTab }) => {
     // 그룹별 펼침 상태를 사용자가 직접 건드리기 전에는 저장하지 않습니다.
     // (undefined = 아직 수동으로 토글한 적 없음 → 현재 탭이 속한 그룹만 자동으로 펼쳐짐)
     const [expandedOverrides, setExpandedOverrides] = useState({});

     const toggleSection = (id, isExpandedNow) => {
          setExpandedOverrides(prev => ({
               ...prev,
               [id]: !isExpandedNow
          }));
     };

     const navGroups = [
          // 'lounge' group removed as it is now a special button
          {
               id: 'gathering',
               title: '[동네 모임] 취미로 하나 되는 강남',
               items: [
                    { id: 'hiking', label: '산타는 강남', icon: MapPin, subtext: '등산/트레킹' },
                    { id: 'sports', label: 'FC 강남', icon: Star, subtext: '스포츠/운동' },
                    { id: 'pet', label: '멍냥회관', icon: Heart, subtext: '반려동물' },
                    { id: 'wine', label: '밤의 미식회', icon: Coffee, subtext: '와인/맛집/커피' },
               ]
          },
          {
               id: 'biz',
               title: '[비즈니스 네트워크]',
               items: [
                    { id: 'startup_freelance', label: '스타트업/프리랜서', icon: Zap, subtext: '업무 협업/네트워킹' },
                    { id: 'lunch_networking', label: '점심 네트워킹', icon: Coffee, subtext: '식사하며 미팅' },
                    { id: 'recruit_proposal', label: '구인/협업 제안', icon: Users, subtext: '팀원 찾기' },
                    { id: 'office_rent', label: '사무실/임대 정보', icon: Store, subtext: '공유오피스/양도' },
                    { id: 'local_biz', label: "Owner's Note", icon: Shield, subtext: '소상공인 혜택' } // Moved here as part of business
               ]
          },
          {
               id: 'community',
               title: '[소통 공간] 우리끼리 속닥속닥',
               items: [
                    { id: 'town_story', label: '타운 스토리', icon: MessageCircle, subtext: '일상/잡담' },
                    { id: 'gangnam_pick', label: '강남 픽', icon: ThumbsUp, subtext: '맛집/핫플' },
                    { id: 'daily_photo', label: '데일리 포토', icon: Camera, subtext: '사진 갤러리' },
               ]
          },
          {
               id: 'culture',
               title: '[문화 생활] 감성 충전 강남',
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
               title: '[마이 강남]',
               items: [
                    { id: 'badge', label: '나의 활동 뱃지', icon: Star, subtext: '강남토박이' },
                    { id: 'schedule', label: '나의 모임 일정', icon: Calendar, subtext: '일정관리' },
               ]
          },
     ];

     return (
          <div className="flex flex-col w-full h-full p-6 border-r border-gray-100 bg-white sticky top-0 overflow-y-auto scrollbar-hide">
               {/* Logo */}
               <div className="mb-8 px-2 flex items-center justify-center">
                    <img
                         src={logo}
                         alt="Gangnam On"
                         className="h-14 w-auto cursor-pointer object-contain hover:scale-105 transition-transform duration-200"
                         onClick={() => setActiveTab('home')}
                    />
               </div>

               {/* Special: Gangnam Romance */}
               <div className="mb-2 px-0">
                    <button
                         onClick={() => setActiveTab('romance')}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${activeTab === 'romance'
                              ? 'bg-[#1a0810] border border-rose-800/60 shadow-[0_2px_16px_rgba(220,38,38,0.08)]'
                              : 'bg-white border border-rose-100 hover:border-rose-200 hover:bg-rose-50/30'
                              }`}
                    >
                         <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${activeTab === 'romance' ? 'bg-rose-500/20' : 'bg-rose-50'}`}>
                              <Flame className={`w-4 h-4 ${activeTab === 'romance' ? 'text-rose-400 fill-rose-400' : 'text-rose-500'}`} />
                         </div>
                         <div className="text-left min-w-0">
                              <div className={`text-sm font-bold truncate ${activeTab === 'romance' ? 'text-rose-300' : 'text-rose-700'}`}>
                                   강남 썸&쌈
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium">2030 핫플레이스</div>
                         </div>
                    </button>
               </div>

               {/* Special: Gangnam Lounge */}
               <div className="mb-6 px-0">
                    <button
                         onClick={() => setActiveTab('gangnam_lounge')}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${activeTab === 'gangnam_lounge'
                              ? 'bg-[#0a0c18] border border-amber-500/25 shadow-[0_2px_16px_rgba(251,191,36,0.06)]'
                              : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                    >
                         <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${activeTab === 'gangnam_lounge' ? 'bg-amber-500/15' : 'bg-slate-100'}`}>
                              <Zap className={`w-4 h-4 ${activeTab === 'gangnam_lounge' ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                         </div>
                         <div className="text-left min-w-0">
                              <div className={`text-sm font-bold truncate ${activeTab === 'gangnam_lounge' ? 'text-amber-200' : 'text-slate-700'}`}>
                                   강남 라운지
                              </div>
                              <div className={`text-[10px] font-medium ${activeTab === 'gangnam_lounge' ? 'text-amber-500/50' : 'text-gray-400'}`}>게임 · 경쟁 · 수다</div>
                         </div>
                    </button>
               </div>

               {/* Main Navigation */}
               <nav className="space-y-6">
                    {navGroups.map((group) => {

                         // 자동 펼침: 아직 수동으로 토글한 적 없다면, 현재 탭이 속한 그룹만 펼쳐진 상태로 시작
                         const containsActiveTab = group.items.some(item => item.id === activeTab);
                         const isExpanded = expandedOverrides[group.id] ?? containsActiveTab;

                         // Standard Accordion Group Rendering
                         return (
                              <div key={group.id} className="space-y-2">

                                   {/* Group Header */}
                                   <button
                                        onClick={() => toggleSection(group.id, isExpanded)}
                                        className="w-full flex items-center justify-between text-[9px] font-semibold text-gray-300 uppercase tracking-[0.18em] hover:text-gray-400 px-2 py-1 transition-colors"
                                   >
                                        <span>{group.title}</span>
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                   </button>

                                   {/* Group Items */}
                                   {isExpanded && (
                                        <div className="space-y-1">
                                             {group.items.map((item) => {
                                                  const Icon = item.icon;
                                                  return (
                                                       <button
                                                            key={item.id}
                                                            onClick={() => setActiveTab(item.id)}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group text-left ${activeTab === item.id
                                                                 ? 'bg-slate-900 shadow-sm'
                                                                 : 'hover:bg-gray-50'
                                                                 }`}
                                                       >
                                                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0 ${activeTab === item.id ? 'bg-white/10' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                                                 <Icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                 <div className={`text-sm font-semibold truncate ${activeTab === item.id ? 'text-white' : 'text-gray-700'}`}>
                                                                      {item.label}
                                                                 </div>
                                                                 <div className={`text-[10px] font-medium truncate ${activeTab === item.id ? 'text-slate-400' : 'text-gray-400'}`}>{item.subtext}</div>
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


               <div className="mt-auto pt-4 border-t border-gray-100/60 flex items-center justify-between">
                    <span className="text-[10px] text-gray-300 font-mono">v1.3.0</span>
                    <span className="text-[10px] text-gray-300">강남온 © 2026</span>
               </div>
               <div className="h-4"></div>
          </div>
     );
};

export default LeftSidebar;
