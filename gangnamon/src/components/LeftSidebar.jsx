import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Star, Heart, Coffee, HelpCircle, Bell, User, Book, Users, Calendar, PlusCircle } from 'lucide-react';

const LeftSidebar = ({ activeTab, setActiveTab }) => {
     // State to manage expanded sections
     const [expandedSections, setExpandedSections] = useState({
          'gathering': true,
          'life': true,
          'school': true,
          'my': true
     });

     const toggleSection = (id) => {
          setExpandedSections(prev => ({
               ...prev,
               [id]: !prev[id]
          }));
     };

     const navGroups = [
          {
               id: 'gathering',
               title: '[동네 모임] 트렌디한 강남 서클',
               items: [
                    { id: 'hiking', label: '와인 & 위스키', icon: MapPin, subtext: '소셜/네트워킹' },
                    { id: 'sports', label: '압구정 러닝', icon: Star, subtext: '스포츠/운동' },
                    { id: 'pet', label: '부동산/주식', icon: Heart, subtext: '재테크/스터디' },
                    { id: 'wine', label: '영어 회화', icon: Coffee, subtext: '자기개발' },
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
                    { id: 'badge', label: '나의 활동 뱃지', icon: Star, subtext: '강남셀럽' },
                    { id: 'schedule', label: '나의 모임 일정', icon: Calendar, subtext: '일정관리' },
               ]
          }
     ];

     return (
          <div className="hidden md:flex flex-col w-full h-full p-6 border-r border-gray-100 bg-white sticky top-0 overflow-y-auto scrollbar-hide">
               {/* Logo */}
               <div className="mb-8 px-2 flex items-center justify-between">
                    <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-[Pretendard] cursor-pointer" onClick={() => setActiveTab('home')}>
                         Gangnam On
                    </h1>
               </div>

               {/* Special: Paju Romance */}
               <div className="mb-6 px-0">
                    <button
                         onClick={() => setActiveTab('romance')}
                         className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group shadow-md ${activeTab === 'romance'
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-200'
                              : 'bg-white border border-pink-100 text-gray-800 hover:border-pink-300'
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
                                        강남 썸&쌈
                                   </div>
                                   <div className={`text-[10px] font-medium ${activeTab === 'romance' ? 'text-pink-100' : 'text-gray-400'
                                        }`}>
                                        2030 핫플레이스
                                   </div>
                              </div>
                         </div>
                    </button>
               </div>

               {/* Main Navigation */}
               <nav className="space-y-6">
                    {navGroups.map((group) => (
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
                    ))}
               </nav>

               <div className="h-10"></div>
          </div>
     );
};

export default LeftSidebar;
