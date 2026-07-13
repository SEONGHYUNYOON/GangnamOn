import React, { useMemo, useState } from 'react';
import {
     MapPin, Users, Coffee, Sparkles, Heart, Clock, Flame, Store,
     Leaf, Route, Zap, Plus,
} from 'lucide-react';
import KakaoMap from './KakaoMap';

const SEASONAL_PICKS = [
     { id: 's1', title: '여름 루프탑 카페 투어', spot: '청담동·압구정', badge: 'D-5', tag: '제철코어', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=260&fit=crop' },
     { id: 's2', title: '한강 야경 플로깅 8km', spot: '잠원 한강공원', badge: '이번 주말', tag: 'FOMO NOW', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=260&fit=crop' },
     { id: 's3', title: '역삼 골목 팝업 마켓', spot: '역삼동 메인스트리트', badge: 'D-3', tag: '한정', image: 'https://images.unsplash.com/photo-1555529669-e93c5a0c0c0e?w=400&h=260&fit=crop' },
];

const MOOD_OPTIONS = [
     { id: 'happy', emoji: '😊', label: '기분 좋을 때', desc: '분위기 좋은 카페·루프탑', target: { type: 'tab', id: 'gangnam_pick' }, color: 'from-amber-50 to-orange-50 border-amber-200' },
     { id: 'new', emoji: '😮', label: '새로운 거', desc: '팝업·신상 핫플 탐색', target: { type: 'tab', id: 'gangnam_pick' }, color: 'from-sky-50 to-blue-50 border-sky-200' },
     { id: 'solo', emoji: '😌', label: '혼자만의 시간', desc: '조용한 카페·산책 코스', target: { type: 'scroll', id: 'home-dining' }, color: 'from-violet-50 to-purple-50 border-violet-200' },
     { id: 'social', emoji: '🤝', label: '사람 만나고 싶을 때', desc: '동네 친구·소규모 모임', target: { type: 'tab', id: 'friend_find' }, color: 'from-rose-50 to-pink-50 border-rose-200' },
];

const NEIGHBOR_FRIENDS = [
     { id: 'f1', title: '강아지 산책 메이트', user: '멍멍이집사', area: '역삼동', time: '오늘 19:00', slots: '2/5', tags: ['#반려견', '#저녁산책'] },
     { id: 'f2', title: '카페 수다 타임', user: '카페인러버', area: '강남역', time: '내일 14:00', slots: '3/6', tags: ['#혼카페', '#MZ수다'] },
     { id: 'f3', title: '보드게임 같이 할 사람', user: '다이스킹', area: '삼성동', time: '토 15:00', slots: '4/8', tags: ['#보드게임', '#초보환영'] },
];

const NANO_CLANS = [
     { id: 'n1', name: '강남 슬로우 조깅', members: 24, max: 30, tag: '운동', tab: 'sports' },
     { id: 'n2', name: '역삼 빈티지 카메라', members: 18, max: 25, tag: '취미', tab: 'daily_photo' },
     { id: 'n3', name: '삼성동 보드게임', members: 12, max: 20, tag: '게임', tab: 'wine' },
];

const ONE_HOUR_ROUTES = [
     { id: 'r1', title: '출장 1시간 코스', steps: ['강남역 점심', '스타벅스 리저브', '도산공원 산책'], time: '60분', icon: '💼' },
     { id: 'r2', title: '데이트 반나절', steps: ['청담 카페', '가로수길 산책', '디저트'], time: '90분', icon: '💕' },
     { id: 'r3', title: '혼자 충전', steps: ['조용한 카페', '책 읽기', '한강 노을'], time: '75분', icon: '🧘' },
];

const VOLUNTEER_SPOTS = [
     { id: 'v1', title: '한강 플로깅 봉사', date: '7/19 (토) 09:00', location: '잠원 한강공원', slots: 2, max: 8, hot: true },
     { id: 'v2', title: '유기견 산책 봉사', date: '7/20 (일) 10:00', location: '강남 보호센터', slots: 1, max: 6, hot: true },
     { id: 'v3', title: '어르신 도시락 배달', date: '7/26 (토) 11:00', location: '역삼동 경로당', slots: 4, max: 10, hot: false },
];

const POPUP_ALERTS = [
     { id: 'p1', title: '성수 팝업 → 강남 연장', brand: '로컬 브랜드 A', until: '7/20까지', area: '청담동' },
     { id: 'p2', title: '한정 굿즈 드롭', brand: '콜라보 에디션', until: '선착순 100명', area: '강남역' },
     { id: 'p3', title: '여름 시즌 팝스토어', brand: '강남 라이프', until: '8/10까지', area: '신사동' },
];

const BALANCE_GAMES = [
     { id: 'bg1', left: '역삼 라면 맛집', right: '강남역 라면 맛집', votes: { left: 62, right: 38 } },
     { id: 'bg2', left: '루프탑 카페', right: '골목 로스터리', votes: { left: 71, right: 29 } },
];

const LIVE_TICKER = [
     '역삼동 지금 24명 접속',
     '여수on → 강남 태그 3건',
     '한강 플로깅 모임 마감 임박',
     '청담 팝업 대기 40분',
     '혼카페 매칭 5건 신규',
];

// 홈 퀵메뉴 — tab: 사이드바 탭 이동, scroll: 홈 내 섹션 스크롤
const QUICK_NAV = [
     { id: 'today', label: '오늘의 강남', sub: '제철코어', icon: Sparkles, target: { type: 'tab', id: 'gangnam_pick' }, tone: 'bg-amber-50 text-amber-700', line: 'bg-amber-400' },
     { id: 'friend', label: '동네 친구', sub: '하이퍼로컬', icon: Users, target: { type: 'tab', id: 'friend_find' }, tone: 'bg-sky-50 text-sky-700', line: 'bg-sky-400' },
     { id: 'solo', label: '혼밥·혼카페', sub: '실시간 매칭', icon: Coffee, target: { type: 'scroll', id: 'home-dining' }, tone: 'bg-rose-50 text-rose-700', line: 'bg-rose-400' },
     { id: 'nano', label: '나노 클랜', sub: '취향 소그룹', icon: Heart, target: { type: 'tab', id: 'wine' }, tone: 'bg-violet-50 text-violet-700', line: 'bg-violet-400' },
     { id: 'volunteer', label: '봉케팅', sub: '한정 봉사', icon: Leaf, target: { type: 'tab', id: 'pet' }, tone: 'bg-emerald-50 text-emerald-700', line: 'bg-emerald-400' },
     { id: 'route', label: '1시간 루트', sub: '시경비 코스', icon: Route, target: { type: 'tab', id: 'gangnam_pick' }, tone: 'bg-indigo-50 text-indigo-700', line: 'bg-indigo-400' },
     { id: 'live', label: '지금 뜨는 중', sub: '실시간', icon: Zap, target: { type: 'tab', id: 'town_story' }, tone: 'bg-orange-50 text-orange-700', line: 'bg-orange-400' },
     { id: 'popup', label: '팝업·굿즈', sub: '한정 드롭', icon: Store, target: { type: 'tab', id: 'gangnam_pick' }, tone: 'bg-pink-50 text-pink-700', line: 'bg-pink-400' },
];

function SectionHeader({ label, title, actionLabel, onAction }) {
     return (
          <div className="mb-3 flex items-center justify-between gap-3">
               <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-accent">{label}</p>
                    <h3 className="mt-1 text-lg font-black text-brand-ink">{title}</h3>
               </div>
               {actionLabel && onAction && (
                    <button type="button" onClick={onAction} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black text-brand-accent shadow-sm">
                         {actionLabel}
                    </button>
               )}
          </div>
     );
}

function navigateTarget(target, onTabChange, onScrollToHomeSection) {
     if (!target) return;
     if (target.type === 'scroll') {
          onScrollToHomeSection?.(target.id);
          return;
     }
     onTabChange(target.id);
}

function BalanceGameCard({ game }) {
     const [picked, setPicked] = useState(null);
     const total = game.votes.left + game.votes.right;
     const leftPct = Math.round((game.votes.left / total) * 100);
     const rightPct = 100 - leftPct;

     return (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
               <p className="mb-3 text-center text-sm font-black text-slate-500">MZ 밸런스 게임</p>
               <div className="grid grid-cols-2 gap-2">
                    <button
                         type="button"
                         onClick={() => setPicked('left')}
                         className={`rounded-xl border-2 px-3 py-4 text-center transition-all ${picked === 'left' ? 'border-brand-gold bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}
                    >
                         <p className="text-base font-black text-brand-ink">{game.left}</p>
                         {picked && <p className="mt-1 text-xs font-bold text-brand-accent">{leftPct}%</p>}
                    </button>
                    <button
                         type="button"
                         onClick={() => setPicked('right')}
                         className={`rounded-xl border-2 px-3 py-4 text-center transition-all ${picked === 'right' ? 'border-brand-gold bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}
                    >
                         <p className="text-base font-black text-brand-ink">{game.right}</p>
                         {picked && <p className="mt-1 text-xs font-bold text-brand-accent">{rightPct}%</p>}
                    </button>
               </div>
               {picked && (
                    <p className="mt-2 text-center text-xs font-semibold text-slate-400">
                         {picked === 'left' ? game.left : game.right} 픽! 강남 클랜 점수 +1
                    </p>
               )}
          </div>
     );
}

export default function HomeMzFeed({
     onTabChange,
     onScrollToHomeSection,
     onCreateMeeting,
     digestNews,
     meetingItems = [],
     featuredMeeting,
     homeMapMarkers = [],
}) {
     const [selectedMood, setSelectedMood] = useState(null);
     const tickerItems = useMemo(() => [...LIVE_TICKER, ...LIVE_TICKER], []);
     const go = (target) => navigateTarget(target, onTabChange, onScrollToHomeSection);

     return (
          <section className="overflow-hidden rounded-[24px] border border-brand-gold/15 bg-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.38)]">
               {/* Hero */}
               <div className="relative overflow-hidden bg-brand px-5 py-5 text-white md:px-7 md:py-6">
                    <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-gold/20 blur-3xl" />
                    <div className="absolute bottom-0 right-[20%] h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                         <div className="min-w-0 flex-1">
                              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black text-amber-200 backdrop-blur-md">
                                   <Flame className="h-3.5 w-3.5" />
                                   LIVE · 지금 이 순간의 강남
                              </div>
                              <h1 className="text-xl font-black leading-tight tracking-[-0.02em] [word-break:keep-all] sm:text-2xl md:text-3xl">
                                   오늘 강남에서 뭐 하고 놀까?
                              </h1>
                         </div>
                         <button
                              type="button"
                              onClick={onCreateMeeting}
                              className="flex shrink-0 min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-brand-gold px-5 text-sm font-black text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-amber-500 active:translate-y-0 sm:ml-4"
                         >
                              <Plus className="h-4 w-4" />
                              모임 개설하기
                         </button>
                    </div>
               </div>

               {/* LIVE Ticker */}
               <div className="overflow-hidden border-b border-brand-gold/10 bg-gradient-to-r from-amber-50 via-white to-rose-50 py-2">
                    <div className="flex animate-marquee whitespace-nowrap">
                         {tickerItems.map((text, i) => (
                              <span key={i} className="mx-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-ink">
                                   <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                                   {text}
                              </span>
                         ))}
                    </div>
               </div>

               <div className="p-4 md:p-6 space-y-5">
                    {/* Quick nav — 1·2순위 핵심 메뉴 */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
                         {QUICK_NAV.map((item) => {
                              const Icon = item.icon;
                              return (
                                   <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => go(item.target)}
                                        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-[0_12px_35px_-24px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-1 hover:border-brand-gold/20 md:p-4"
                                   >
                                        <span className={`absolute inset-x-0 top-0 h-1 ${item.line}`} />
                                        <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${item.tone}`}>
                                             <Icon className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-sm font-black text-brand-ink md:text-base">{item.label}</h2>
                                        <p className="mt-0.5 text-xs font-bold text-slate-400 md:text-sm">{item.sub}</p>
                                   </button>
                              );
                         })}
                    </div>

                    {/* ① 오늘의 강남 — 제철코어 */}
                    <div className="rounded-[20px] border border-brand-gold/15 bg-gradient-to-br from-white via-brand-light/30 to-white p-4 md:p-5">
                         <SectionHeader label="Seasonal Core" title="오늘의 강남 — 이번 주만" actionLabel="더보기" onAction={() => onTabChange('gangnam_pick')} />
                         <div className="grid gap-3 sm:grid-cols-3">
                              {SEASONAL_PICKS.map((pick) => (
                                   <button
                                        key={pick.id}
                                        type="button"
                                        onClick={() => onTabChange('gangnam_pick')}
                                        className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-transform hover:-translate-y-1"
                                   >
                                        <div className="relative aspect-[16/10] overflow-hidden">
                                             <img src={pick.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                                             <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-black text-white">{pick.badge}</span>
                                             <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">{pick.tag}</span>
                                        </div>
                                        <div className="p-3">
                                             <p className="line-clamp-1 text-base font-black text-brand-ink">{pick.title}</p>
                                             <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-400">
                                                  <MapPin className="h-3 w-3" />{pick.spot}
                                             </p>
                                        </div>
                                   </button>
                              ))}
                         </div>
                    </div>

                    {/* ⑤ 필코노미 — 기분별 강남 */}
                    <div className="rounded-[20px] bg-slate-50 p-4 md:p-5">
                         <SectionHeader label="Philconomy" title="오늘 기분별 강남" />
                         <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                              {MOOD_OPTIONS.map((mood) => (
                                   <button
                                        key={mood.id}
                                        type="button"
                                        onClick={() => { setSelectedMood(mood.id); go(mood.target); }}
                                        className={`rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:-translate-y-0.5 ${mood.color} ${selectedMood === mood.id ? 'ring-2 ring-brand-gold' : ''}`}
                                   >
                                        <span className="text-3xl">{mood.emoji}</span>
                                        <p className="mt-2 text-sm font-black text-brand-ink md:text-base">{mood.label}</p>
                                        <p className="mt-1 text-xs font-semibold text-slate-500 md:text-sm">{mood.desc}</p>
                                   </button>
                              ))}
                         </div>
                    </div>

                    {/* ② 동네 친구 + ④ 나노 클랜 */}
                    <div className="grid gap-4 lg:grid-cols-2">
                         <div className="rounded-[20px] border border-sky-100 bg-gradient-to-br from-sky-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="Hyperlocal" title="동네 친구 찾기" actionLabel="전체보기" onAction={() => onTabChange('friend_find')} />
                              <div className="space-y-2">
                                   {NEIGHBOR_FRIENDS.map((friend) => (
                                        <button
                                             key={friend.id}
                                             type="button"
                                             onClick={() => onTabChange('friend_find')}
                                             className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
                                        >
                                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg">👋</div>
                                             <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-black text-brand-ink">{friend.title}</p>
                                                  <p className="mt-0.5 text-xs font-semibold text-slate-400 md:text-sm">{friend.user} · {friend.area} · {friend.time}</p>
                                                  <div className="mt-1 flex flex-wrap gap-1">
                                                       {friend.tags.map((t) => (
                                                            <span key={t} className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-600">{t}</span>
                                                       ))}
                                                  </div>
                                             </div>
                                             <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-700">{friend.slots}</span>
                                        </button>
                                   ))}
                              </div>
                         </div>

                         <div className="rounded-[20px] border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="Nano Clan" title="나노 클랜 — 취향 소그룹" actionLabel="모임 보기" onAction={() => onTabChange('wine')} />
                              <div className="space-y-2">
                                   {NANO_CLANS.map((clan) => (
                                        <button
                                             key={clan.id}
                                             type="button"
                                             onClick={() => onTabChange(clan.tab)}
                                             className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
                                        >
                                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                                                  <Users className="h-5 w-5 text-violet-600" />
                                             </div>
                                             <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-black text-brand-ink">{clan.name}</p>
                                                  <p className="mt-0.5 text-xs font-semibold text-slate-400 md:text-sm">#{clan.tag} · 소규모 운영</p>
                                             </div>
                                             <div className="shrink-0 text-right">
                                                  <p className="text-sm font-black text-violet-700">{clan.members}/{clan.max}</p>
                                                  <div className="mt-1 h-1.5 w-12 overflow-hidden rounded-full bg-violet-100">
                                                       <div className="h-full rounded-full bg-violet-500" style={{ width: `${(clan.members / clan.max) * 100}%` }} />
                                                  </div>
                                             </div>
                                        </button>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* ⑦ 1시간 루트 */}
                    <div className="rounded-[20px] border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-4 md:p-5">
                         <SectionHeader label="Time Value" title="1시간 루트 — 시경비 코스" actionLabel="강남픽" onAction={() => onTabChange('gangnam_pick')} />
                         <div className="grid gap-3 md:grid-cols-3">
                              {ONE_HOUR_ROUTES.map((route) => (
                                   <button
                                        key={route.id}
                                        type="button"
                                        onClick={() => onTabChange('gangnam_pick')}
                                        className="rounded-2xl bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                                   >
                                        <div className="mb-2 flex items-center justify-between">
                                             <span className="text-2xl">{route.icon}</span>
                                             <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                                                  <Clock className="h-3 w-3" />{route.time}
                                             </span>
                                        </div>
                                        <p className="text-base font-black text-brand-ink">{route.title}</p>
                                        <ol className="mt-2 space-y-1">
                                             {route.steps.map((step, i) => (
                                                  <li key={step} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                                                       <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600">{i + 1}</span>
                                                       {step}
                                                  </li>
                                             ))}
                                        </ol>
                                   </button>
                              ))}
                         </div>
                    </div>

                    {/* ⑥ 봉케팅 + ⑨ 팝업 */}
                    <div className="grid gap-4 lg:grid-cols-2">
                         <div className="rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="Volun-ticketing" title="봉케팅 — 선착순 봉사" actionLabel="봉사 모임" onAction={() => onTabChange('pet')} />
                              <div className="space-y-2">
                                   {VOLUNTEER_SPOTS.map((spot) => (
                                        <button
                                             key={spot.id}
                                             type="button"
                                             onClick={() => onTabChange('pet')}
                                             className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
                                        >
                                             <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${spot.hot ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                                                  <Leaf className={`h-5 w-5 ${spot.hot ? 'text-rose-600' : 'text-emerald-600'}`} />
                                             </div>
                                             <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-2">
                                                       <p className="truncate text-sm font-black text-brand-ink">{spot.title}</p>
                                                       {spot.hot && <span className="shrink-0 rounded bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white">마감임박</span>}
                                                  </div>
                                                  <p className="mt-0.5 text-xs font-semibold text-slate-400 md:text-sm">{spot.date} · {spot.location}</p>
                                             </div>
                                             <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${spot.slots <= 2 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                  {spot.slots}자리
                                             </span>
                                        </button>
                                   ))}
                              </div>
                         </div>

                         <div className="rounded-[20px] border border-pink-100 bg-gradient-to-br from-pink-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="Pop-up Drop" title="팝업·팝스토어 알림" actionLabel="핫플 보기" onAction={() => onTabChange('gangnam_pick')} />
                              <div className="space-y-2">
                                   {POPUP_ALERTS.map((popup) => (
                                        <button
                                             key={popup.id}
                                             type="button"
                                             onClick={() => onTabChange('gangnam_pick')}
                                             className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
                                        >
                                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100">
                                                  <Store className="h-5 w-5 text-pink-600" />
                                             </div>
                                             <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-black text-brand-ink">{popup.title}</p>
                                                  <p className="mt-0.5 text-xs font-semibold text-slate-400 md:text-sm">{popup.brand} · {popup.area}</p>
                                             </div>
                                             <span className="shrink-0 rounded-full bg-pink-100 px-2.5 py-1 text-xs font-black text-pink-700">{popup.until}</span>
                                        </button>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* ⑩ MZ 밸런스 게임 + 다이제스트 + 지도 */}
                    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                         <div className="space-y-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                   {BALANCE_GAMES.map((game) => (
                                        <BalanceGameCard key={game.id} game={game} />
                                   ))}
                              </div>

                              {/* 구청 소식 다이제스트 */}
                              <div className="rounded-[20px] border border-brand-gold/15 bg-gradient-to-br from-white via-brand-light/40 to-white p-4 md:p-5">
                                   <SectionHeader label="Today in Gangnam" title="오늘의 강남 다이제스트" actionLabel="소식 더보기" onAction={() => onTabChange('news')} />
                                   <div className="grid gap-2 md:grid-cols-2">
                                        {(digestNews?.loading ? [0, 1] : digestNews?.news || []).map((item, index) => (
                                             digestNews?.loading ? (
                                                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/80" />
                                             ) : (
                                                  <a
                                                       key={`${item.title}-${item.date}`}
                                                       href={item.link}
                                                       target="_blank"
                                                       rel="noreferrer"
                                                       className="rounded-2xl bg-white/90 p-3 shadow-sm transition-transform hover:-translate-y-0.5"
                                                  >
                                                       <p className="text-xs font-black text-brand-accent">{item.source || '강남구청'}</p>
                                                       <p className="mt-1 line-clamp-2 text-sm font-black leading-5 text-brand-ink">{item.title}</p>
                                                  </a>
                                             )
                                        ))}
                                        {featuredMeeting && (
                                             <button
                                                  type="button"
                                                  onClick={() => onTabChange(featuredMeeting.originalType || 'wine')}
                                                  className="rounded-2xl bg-brand px-3 py-3 text-left text-white shadow-sm transition-transform hover:-translate-y-0.5 md:col-span-2"
                                             >
                                                  <p className="text-xs font-bold text-amber-200">🔥 지금 핫한 모임</p>
                                                  <p className="mt-1 line-clamp-2 text-base font-black">{featuredMeeting.title}</p>
                                                  <p className="mt-1 text-sm font-semibold text-white/80">{featuredMeeting.location}</p>
                                             </button>
                                        )}
                                   </div>
                                   {digestNews?.fromCache && (
                                        <p className="mt-3 text-sm font-semibold text-amber-700">실시간 소식 연결에 문제가 있어 캐시 목록을 함께 보여드리고 있어요.</p>
                                   )}
                              </div>

                              {/* 오늘 뜨는 모임 */}
                              <div className="rounded-[20px] bg-slate-50 p-4 md:p-5">
                                   <SectionHeader label="Trending now" title="오늘 뜨는 모임" actionLabel="전체보기" onAction={() => onTabChange('wine')} />
                                   <div className="space-y-2.5">
                                        {meetingItems.slice(0, 3).map((item) => (
                                             <button key={item.id} type="button" onClick={() => onTabChange(item.originalType || 'wine')} className="group flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left transition-all hover:shadow-md">
                                                  <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                                                  <div className="min-w-0">
                                                       <p className="truncate text-sm font-black text-brand-ink">{item.title}</p>
                                                       <p className="mt-1 truncate text-xs font-semibold text-slate-400 md:text-sm">{item.location}</p>
                                                  </div>
                                                  <span className="ml-auto shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-xs font-black text-brand-accent">{item.participants}/{item.maxParticipants}</span>
                                             </button>
                                        ))}
                                   </div>
                              </div>
                         </div>

                         <div className="relative min-h-[280px] overflow-hidden rounded-[20px] bg-slate-100 p-2">
                              <div className="absolute left-4 top-4 z-10 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                                   <p className="text-xs font-black text-brand-accent">NOW HERE</p>
                                   <p className="mt-0.5 text-sm font-black text-brand-ink">강남역 중심</p>
                              </div>
                              <KakaoMap
                                   latitude={37.4979}
                                   longitude={127.0276}
                                   level={4}
                                   label="강남역 중심"
                                   address="서울 강남구 강남대로 지하396"
                                   markers={homeMapMarkers}
                                   onMarkerClick={(pin) => {
                                        const target = meetingItems.find((item) => item.id === pin.id);
                                        if (target) onTabChange(target.originalType || 'wine');
                                   }}
                                   style={{ width: '100%', height: '100%', borderRadius: '14px' }}
                              />
                         </div>
                    </div>
               </div>
          </section>
     );
}
