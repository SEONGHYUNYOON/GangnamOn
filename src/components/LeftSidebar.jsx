import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Star, Heart, Coffee, HelpCircle, Bell, User, Book, Users, Calendar, Palette, MessageCircle, Sparkles, Camera, Shield, Store, Zap, Flame, Lock, Home, EyeOff, Building2, ParkingCircle, Stethoscope, Siren } from 'lucide-react';
import TermsAndPrivacyModal from './TermsAndPrivacyModal';
import GangnamOnLogo from './GangnamOnLogo';

const LeftSidebar = ({ activeTab, setActiveTab, onLogoClick, isAdmin = false }) => {
     // 그룹별 펼침 상태를 사용자가 직접 건드리기 전에는 저장하지 않습니다.
     // (undefined = 아직 수동으로 토글한 적 없음 → 현재 탭이 속한 그룹만 자동으로 펼쳐짐)
     const [expandedOverrides, setExpandedOverrides] = useState({});
     const [termsModalTab, setTermsModalTab] = useState(null); // null | 'terms' | 'privacy'

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
               tag: '동네 모임',
               subtitle: '취미로 하나 되는 강남',
               items: [
                    { id: 'hiking', label: '산타는 강남', icon: MapPin, subtext: '등산/트레킹' },
                    { id: 'sports', label: 'FC 강남', icon: Star, subtext: '스포츠/운동' },
                    { id: 'pet', label: '멍냥회관', icon: Heart, subtext: '반려동물' },
                    { id: 'wine', label: '밤의 미식회', icon: Coffee, subtext: '와인/맛집/커피' },
               ]
          },
          {
               id: 'biz',
               tag: '비즈니스 네트워크',
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
               tag: '소통 공간',
               subtitle: '우리끼리 속닥속닥',
               items: [
                    { id: 'town_story', label: '타운 스토리', icon: MessageCircle, subtext: '일상/잡담' },
                    { id: 'daily_photo', label: '데일리 포토', icon: Camera, subtext: '사진 갤러리' },
                    { id: 'anonymous', label: '익명 게시판', icon: EyeOff, subtext: '속마음 털어놓기' },
               ]
          },
          {
               id: 'culture',
               tag: '문화 생활',
               subtitle: '감성 충전 강남',
               items: [
                    { id: 'culture_class', label: '문화 강연 & 클래스', icon: Palette, subtext: '원데이/인문학' }
               ]
          },
          {
               id: 'life',
               tag: '동네 생활',
               subtitle: '찐 로컬들의 정보 공유',
               items: [
                    { id: 'qna', label: '무엇이든 물어보세요', icon: HelpCircle, subtext: 'Q&A' },
                    { id: 'news', label: '강남구 소식', icon: Bell, subtext: '구청 뉴스/RSS' },
                    { id: 'life_info', label: '생활기관 안내', icon: Building2, subtext: '구청/주민센터' },
                    { id: 'parking_info', label: '주차·교통 생활', icon: ParkingCircle, subtext: '공영주차/교통민원' },
                    { id: 'health_info', label: '보건·복지 안내', icon: Stethoscope, subtext: '보건소/복지센터' },
                    { id: 'safety_info', label: '안전·민원 기관', icon: Siren, subtext: '경찰/소방/출입국' },
                    { id: 'housing_trade', label: '월세·전세 직거래', icon: Home, subtext: '부동산/룸메이트' },
                    { id: 'share', label: '당근보다 가까운 나눔', icon: Heart, subtext: '중고/나눔' },
               ]
          },
          {
               id: 'service',
               tag: '서비스 안내',
               subtitle: '강남온 운영 소식',
               items: [
                    { id: 'notice', label: '공지사항', icon: Bell, subtext: '운영 안내' },
               ]
          },
          {
               id: 'school',
               tag: '아이러브스쿨',
               subtitle: '추억과 사람 찾기',
               items: [
                    { id: 'school_find', label: '학교 찾기 & 동창회', icon: Book, subtext: '졸업생/기수' },
                    { id: 'friend_find', label: '친구 찾기', icon: Users, subtext: '동네친구' },
               ]
          },
          {
               id: 'my',
               tag: '마이 강남',
               items: [
                    { id: 'minihome', label: '내 미니홈피', icon: User, subtext: 'BGM/방명록/갤러리' },
                    { id: 'badge', label: '나의 활동 뱃지', icon: Star, subtext: '강남토박이' },
                    { id: 'schedule', label: '나의 모임 일정', icon: Calendar, subtext: '일정관리' },
                    // 관리자 계정으로 로그인했을 때만 노출 (일반 사용자에게는 아예 보이지 않음)
                    ...(isAdmin ? [{ id: 'admin', label: '관리자 대시보드', icon: Lock, subtext: '운영진 전용' }] : []),
               ]
          },
     ];

     return (
          <div className="flex flex-col w-full h-full p-5 border border-surface-border bg-white/90 backdrop-blur-xl sticky top-5 overflow-y-auto no-scrollbar rounded-card shadow-soft">
               {/* Logo */}
               <div className="mb-7 px-2 flex items-center justify-center">
                    <GangnamOnLogo
                         className="h-20 w-auto cursor-pointer hover:scale-105 transition-transform duration-200"
                         onClick={onLogoClick || (() => setActiveTab('home'))}
                    />
               </div>

               {/* Special: Gangnam Romance */}
               <div className="mb-2 px-0">
                    <button
                         onClick={() => setActiveTab('romance')}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'romance'
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
                              <div className="text-xs text-gray-500 font-medium">2030 핫플레이스</div>
                         </div>
                    </button>
               </div>

               {/* Special: Gangnam Lounge */}
               <div className="mb-6 px-0">
                    <button
                         onClick={() => setActiveTab('gangnam_lounge')}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'gangnam_lounge'
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
                              <div className={`text-xs font-medium ${activeTab === 'gangnam_lounge' ? 'text-amber-500/60' : 'text-gray-500'}`}>게임 · 경쟁 · 수다</div>
                         </div>
                    </button>
               </div>

               {/* Special: Gangnam Pick (AI 추천 맛집/카페) */}
               <div className="mb-6 px-0">
                    <button
                         onClick={() => setActiveTab('gangnam_pick')}
                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'gangnam_pick'
                              ? 'bg-brand-ink border border-brand-gold/40 shadow-[0_2px_16px_rgba(200,155,60,0.10)]'
                              : 'bg-white border border-brand-gold/20 hover:border-brand-gold/40 hover:bg-brand-light/40'
                              }`}
                    >
                         <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${activeTab === 'gangnam_pick' ? 'bg-brand-gold/15' : 'bg-brand-light'}`}>
                              <Sparkles className={`w-4 h-4 ${activeTab === 'gangnam_pick' ? 'text-brand-gold' : 'text-brand-accent'}`} />
                         </div>
                         <div className="text-left min-w-0">
                              <div className={`text-sm font-bold truncate ${activeTab === 'gangnam_pick' ? 'text-brand-gold' : 'text-brand-ink'}`}>
                                   강남 픽
                              </div>
                              <div className={`text-xs font-medium ${activeTab === 'gangnam_pick' ? 'text-brand-gold/60' : 'text-gray-500'}`}>AI가 추천하는 맛집·카페</div>
                         </div>
                    </button>
               </div>

               {/* Main Navigation */}
               <nav className="space-y-6">
                    {navGroups.map((group) => {

                         // 자동 펼침: 아직 수동으로 토글한 적 없다면, 현재 탭이 속한 그룹만 펼쳐진 상태로 시작
                         const containsActiveTab = group.items.some(item => item.id === activeTab);
                         const isExpanded = expandedOverrides[group.id] ?? (containsActiveTab || group.id === 'life' || group.id === 'my');

                         // Standard Accordion Group Rendering
                         return (
                              <div key={group.id} className="space-y-2">

                                   {/* Group Header */}
                                   <button
                                        onClick={() => toggleSection(group.id, isExpanded)}
                                        className="w-full flex items-start gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-surface-muted transition-colors"
                                   >
                                        <div className="flex-1 min-w-0 leading-snug">
                                             <div className="text-xs font-black uppercase text-brand-accent">{group.tag}</div>
                                             {group.subtitle && (
                                                  <div className="text-sm font-semibold text-gray-700 mt-0.5">{group.subtitle}</div>
                                             )}
                                        </div>
                                        {isExpanded
                                             ? <ChevronDown className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                                             : <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />}
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
                                                                 ? 'bg-brand shadow-sm'
                                                                 : 'hover:bg-surface-muted'
                                                                 }`}
                                                       >
                                                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0 ${activeTab === item.id ? 'bg-white/10' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                                                 <Icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                 <div className={`text-base font-semibold truncate ${activeTab === item.id ? 'text-white' : 'text-gray-800'}`}>
                                                                      {item.label}
                                                                 </div>
                                                                 <div className={`text-xs font-medium truncate ${activeTab === item.id ? 'text-slate-300' : 'text-gray-500'}`}>{item.subtext}</div>
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


               <div className="mt-auto pt-4 border-t border-gray-100/60 flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-3">
                         <button onClick={() => setTermsModalTab('terms')} className="text-[10px] text-gray-400 hover:text-gray-600 hover:underline">이용약관</button>
                         <span className="text-[10px] text-gray-200">|</span>
                         <button onClick={() => setTermsModalTab('privacy')} className="text-[10px] text-gray-400 hover:text-gray-600 hover:underline">개인정보처리방침</button>
                    </div>
                    <div className="flex items-center justify-between">
                         <span className="text-[10px] text-gray-300 font-mono">v1.4.0</span>
                         <span className="text-[10px] text-gray-300">강남온 © 2026</span>
                    </div>
               </div>
               <div className="h-4"></div>

               {termsModalTab && (
                    <TermsAndPrivacyModal initialTab={termsModalTab} onClose={() => setTermsModalTab(null)} />
               )}
          </div>
     );
};

export default LeftSidebar;
