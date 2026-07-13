import React, { useEffect, useMemo, useState } from 'react';
import {
     MapPin, Users, Coffee, Sparkles, Heart, Clock, Flame, Store,
     Leaf, Route, Zap, Plus, ExternalLink,
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import KakaoMap from './KakaoMap';

// ────────────────────────────────────────────────────────────────
// MZ 트렌드 홈 피드
// 실데이터(강남 픽 게시글, 접속자 수, 모임, 구청 소식)를 우선 사용하고,
// 아직 데이터가 없는 코너(동네 친구, 나노 클랜, 봉사 모임)는 가짜 유저를
// 흉내내는 대신 "이런 모임 어때요" 개설 아이디어 카드로 보여줍니다.
// ────────────────────────────────────────────────────────────────

const PICK_GROUP_LABEL = { restaurant: '맛집', cafe: '카페', culture: '문화·예술', hobby: '취미', sport: '운동' };

// 강남 픽 게시글을 아직 못 불러왔을 때 보여줄 대체 큐레이션
const SEASONAL_FALLBACK = [
     { id: 's1', title: '여름 루프탑 카페 투어', spot: '청담동, 압구정', tag: '카페', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=260&fit=crop' },
     { id: 's2', title: '한강 노을 러닝 코스', spot: '잠원 한강공원', tag: '운동', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=260&fit=crop' },
     { id: 's3', title: '코엑스 여름 전시 나들이', spot: '삼성동 코엑스', tag: '문화·예술', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=260&fit=crop' },
];

const MOOD_OPTIONS = [
     { id: 'happy', emoji: '😊', label: '기분 좋을 때', desc: '분위기 좋은 카페와 루프탑', target: { type: 'tab', id: 'gangnam_pick' }, color: 'from-amber-50 to-orange-50 border-amber-200' },
     { id: 'new', emoji: '😮', label: '새로운 게 필요할 때', desc: '팝업, 전시, 신상 핫플', target: { type: 'scroll', id: 'home-popup' }, color: 'from-sky-50 to-blue-50 border-sky-200' },
     { id: 'solo', emoji: '😌', label: '혼자만의 시간', desc: '조용한 카페와 산책 코스', target: { type: 'scroll', id: 'home-routes' }, color: 'from-violet-50 to-purple-50 border-violet-200' },
     { id: 'social', emoji: '🤝', label: '사람이 그리울 때', desc: '동네 친구, 소규모 모임', target: { type: 'scroll', id: 'home-friends' }, color: 'from-rose-50 to-pink-50 border-rose-200' },
];

// 아직 전용 게시판이 없는 코너는 개설 아이디어로 제안합니다 (가짜 참여자 수 미표기)
const FRIEND_IDEAS = [
     { id: 'f1', title: '강아지 저녁 산책 메이트', area: '역삼동', emoji: '🐕', tags: ['반려견', '저녁 산책'] },
     { id: 'f2', title: '퇴근 후 혼카페 수다 모임', area: '강남역', emoji: '☕', tags: ['혼카페', '가벼운 수다'] },
     { id: 'f3', title: '주말 보드게임 번개', area: '삼성동', emoji: '🎲', tags: ['보드게임', '초보 환영'] },
];

const NANO_CLAN_IDEAS = [
     { id: 'n1', name: '강남 슬로우 조깅 클럽', tag: '운동', desc: '대회 목표 없이 천천히 달리는 사람들' },
     { id: 'n2', name: '역삼 필름카메라 산책', tag: '취미', desc: '필름 한 롤 들고 골목 출사' },
     { id: 'n3', name: '선릉 점심 독서 클럽', tag: '독서', desc: '점심시간 30분, 각자 읽고 한 줄 나눔' },
];

const VOLUNTEER_IDEAS = [
     { id: 'v1', title: '한강 플로깅', when: '주말 아침', where: '잠원 한강공원', emoji: '🏃' },
     { id: 'v2', title: '유기견 산책 봉사', when: '주말 오전', where: '강남 인근 보호소', emoji: '🐾' },
     { id: 'v3', title: '어르신 도시락 나눔', when: '평일 점심', where: '역삼동 일대', emoji: '🍱' },
];

const ONE_HOUR_ROUTES = [
     { id: 'r1', title: '출장 중 1시간', steps: ['강남역 점심', '커피 테이크아웃', '테헤란로 산책'], time: '60분', icon: '💼' },
     { id: 'r2', title: '가로수길 반나절', steps: ['신사 브런치', '가로수길 구경', '디저트 카페'], time: '90분', icon: '💕' },
     { id: 'r3', title: '혼자 충전 코스', steps: ['조용한 카페', '선정릉 한 바퀴', '노을 감상'], time: '75분', icon: '🧘' },
];

// 팝업, 전시는 자체 데이터가 없으므로 실제로 확인 가능한 공식 채널로 연결합니다
const POPUP_LINKS = [
     { id: 'p1', title: '비짓강남 전시·행사 캘린더', desc: '강남구 공식 문화 관광 소식', href: 'https://www.visitgangnam.net/' },
     { id: 'p2', title: '코엑스 전시 일정', desc: '삼성동 코엑스에서 열리는 전시와 박람회', href: 'https://www.coexcenter.com/' },
     { id: 'p3', title: '강남구청 행사소식', desc: '구에서 여는 행사와 참여 프로그램', target: { type: 'tab', id: 'news' } },
];

const BALANCE_GAMES = [
     { id: 'bg1', question: '점심 취향 픽', left: '든든한 국밥', right: '가벼운 샐러드' },
     { id: 'bg2', question: '카페 취향 픽', left: '루프탑 카페', right: '골목 로스터리' },
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

function BalanceGameCard({ game }) {
     const [picked, setPicked] = useState(null);

     return (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
               <p className="mb-3 text-center text-sm font-black text-slate-500">{game.question}</p>
               <div className="grid grid-cols-2 gap-2">
                    {['left', 'right'].map((side) => (
                         <button
                              key={side}
                              type="button"
                              onClick={() => setPicked(side)}
                              className={`rounded-xl border-2 px-3 py-4 text-center transition-all ${picked === side ? 'border-brand-gold bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}
                         >
                              <p className="text-base font-black text-brand-ink">{game[side]}</p>
                         </button>
                    ))}
               </div>
               {picked && (
                    <p className="mt-2 text-center text-xs font-semibold text-slate-400">
                         오늘은 {picked === 'left' ? game.left : game.right} 쪽이군요. 타운 스토리에 취향을 자랑해보세요!
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
     const [seasonalPicks, setSeasonalPicks] = useState([]);
     const [onlineCount, setOnlineCount] = useState(0);

     // 이번 주 강남 픽: 봇이 큐레이션한 실제 gangnam_pick 게시글 최신 3건
     useEffect(() => {
          let alive = true;
          databases.listDocuments({
               databaseId: DATABASE_ID,
               collectionId: COLLECTIONS.posts,
               queries: [
                    Query.equal('type', 'gangnam_pick'),
                    Query.orderDesc('$createdAt'),
                    Query.limit(3),
               ],
          }).then((res) => {
               if (alive && res.documents.length) setSeasonalPicks(res.documents);
          }).catch(() => {
               // 실패 시 대체 큐레이션 사용
          });
          return () => { alive = false; };
     }, []);

     // 실시간 접속자 수: presence 컬렉션에서 최근 2분 내 활동 사용자를 셉니다
     useEffect(() => {
          let alive = true;
          const fetchOnline = async () => {
               try {
                    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.presence,
                         queries: [Query.greaterThan('lastSeenAt', since), Query.limit(100)],
                    });
                    if (alive) setOnlineCount(res.total || res.documents.length);
               } catch {
                    // 조회 실패 시 표기 생략
               }
          };
          fetchOnline();
          const interval = setInterval(fetchOnline, 60 * 1000);
          return () => { alive = false; clearInterval(interval); };
     }, []);

     // LIVE 티커: 지어낸 수치 대신 실제 데이터(접속자, 모집 중 모임, 구청 소식)로 구성
     const tickerItems = useMemo(() => {
          const items = [];
          if (onlineCount > 0) items.push(`지금 강남온에 ${onlineCount}명 접속 중`);
          meetingItems.slice(0, 2).forEach((item) => {
               if (item?.title) items.push(`모집 중: ${item.title} (${item.participants}/${item.maxParticipants})`);
          });
          const headline = digestNews?.news?.[0]?.title;
          if (headline) items.push(`강남구 소식: ${headline}`);
          items.push('모임을 만들면 홈 상단에 바로 소개돼요');
          return [...items, ...items];
     }, [onlineCount, meetingItems, digestNews?.news]);

     const go = (target) => {
          if (!target) return;
          if (target.type === 'scroll') {
               onScrollToHomeSection?.(target.id);
               return;
          }
          onTabChange(target.id);
     };

     // 퀵메뉴는 홈 안의 해당 코너로 스크롤하는 목차 역할을 합니다
     const quickNav = [
          { id: 'today', label: '오늘의 강남', sub: '이번 주 한정', icon: Sparkles, target: { type: 'scroll', id: 'home-seasonal' }, tone: 'bg-amber-50 text-amber-700', line: 'bg-amber-400' },
          { id: 'friend', label: '동네 친구', sub: '같이 놀 사람', icon: Users, target: { type: 'scroll', id: 'home-friends' }, tone: 'bg-sky-50 text-sky-700', line: 'bg-sky-400' },
          { id: 'solo', label: '혼밥·혼카페', sub: '밥친구 매칭', icon: Coffee, target: { type: 'scroll', id: 'home-dining' }, tone: 'bg-rose-50 text-rose-700', line: 'bg-rose-400' },
          { id: 'nano', label: '나노 클랜', sub: '취향 소모임', icon: Heart, target: { type: 'scroll', id: 'home-nano' }, tone: 'bg-violet-50 text-violet-700', line: 'bg-violet-400' },
          { id: 'volunteer', label: '봉케팅', sub: '선착순 봉사', icon: Leaf, target: { type: 'scroll', id: 'home-volunteer' }, tone: 'bg-emerald-50 text-emerald-700', line: 'bg-emerald-400' },
          { id: 'route', label: '1시간 루트', sub: '짧고 알찬 코스', icon: Route, target: { type: 'scroll', id: 'home-routes' }, tone: 'bg-indigo-50 text-indigo-700', line: 'bg-indigo-400' },
          { id: 'live', label: '지금 뜨는 중', sub: '인기 모임', icon: Zap, target: { type: 'scroll', id: 'home-trending' }, tone: 'bg-orange-50 text-orange-700', line: 'bg-orange-400' },
          { id: 'popup', label: '팝업·전시', sub: '한정 소식', icon: Store, target: { type: 'scroll', id: 'home-popup' }, tone: 'bg-pink-50 text-pink-700', line: 'bg-pink-400' },
     ];

     const hasRealPicks = seasonalPicks.length > 0;

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
                    {/* Quick nav */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
                         {quickNav.map((item) => {
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

                    {/* 오늘의 강남: 강남 픽 실데이터 큐레이션 */}
                    <div id="home-seasonal" className="scroll-mt-24 rounded-[20px] border border-brand-gold/15 bg-gradient-to-br from-white via-brand-light/30 to-white p-4 md:p-5">
                         <SectionHeader label="오늘의 강남" title="이번 주 놓치면 아쉬운 곳" actionLabel="강남 픽 전체" onAction={() => onTabChange('gangnam_pick')} />
                         <div className="grid gap-3 sm:grid-cols-3">
                              {(hasRealPicks ? seasonalPicks : SEASONAL_FALLBACK).map((pick) => (
                                   <button
                                        key={pick.$id || pick.id}
                                        type="button"
                                        onClick={() => onTabChange('gangnam_pick')}
                                        className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-transform hover:-translate-y-1"
                                   >
                                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                                             {(hasRealPicks ? pick.imageUrls?.[0] : pick.image) ? (
                                                  <img
                                                       src={hasRealPicks ? pick.imageUrls[0] : pick.image}
                                                       alt=""
                                                       className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                       loading="lazy"
                                                  />
                                             ) : (
                                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-rose-50 text-3xl">✨</div>
                                             )}
                                             <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
                                                  {hasRealPicks ? (PICK_GROUP_LABEL[pick.pickGroup] || '추천') : pick.tag}
                                             </span>
                                        </div>
                                        <div className="p-3">
                                             <p className="line-clamp-1 text-base font-black text-brand-ink">{pick.title}</p>
                                             <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-400">
                                                  <MapPin className="h-3 w-3" />
                                                  {hasRealPicks ? (pick.locationName || '강남') : pick.spot}
                                             </p>
                                        </div>
                                   </button>
                              ))}
                         </div>
                    </div>

                    {/* 기분별 강남 */}
                    <div className="rounded-[20px] bg-slate-50 p-4 md:p-5">
                         <SectionHeader label="기분 따라 고르기" title="오늘 기분별 강남" />
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

                    {/* 동네 친구 + 나노 클랜: 개설 아이디어 카드 */}
                    <div className="grid gap-4 lg:grid-cols-2">
                         <div id="home-friends" className="scroll-mt-24 rounded-[20px] border border-sky-100 bg-gradient-to-br from-sky-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="동네 친구" title="이런 모임 어때요?" actionLabel="친구 찾기" onAction={() => onTabChange('friend_find')} />
                              <div className="space-y-2">
                                   {FRIEND_IDEAS.map((idea) => (
                                        <button
                                             key={idea.id}
                                             type="button"
                                             onClick={onCreateMeeting}
                                             className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
                                        >
                                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg">{idea.emoji}</div>
                                             <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-black text-brand-ink">{idea.title}</p>
                                                  <div className="mt-1 flex flex-wrap gap-1">
                                                       <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{idea.area}</span>
                                                       {idea.tags.map((t) => (
                                                            <span key={t} className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-600">#{t}</span>
                                                       ))}
                                                  </div>
                                             </div>
                                             <span className="shrink-0 rounded-full bg-sky-600 px-2.5 py-1 text-xs font-black text-white">개설하기</span>
                                        </button>
                                   ))}
                              </div>
                         </div>

                         <div id="home-nano" className="scroll-mt-24 rounded-[20px] border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="나노 클랜" title="취향으로 모이는 소그룹" actionLabel="동네 모임" onAction={() => onTabChange('hiking')} />
                              <div className="space-y-2">
                                   {NANO_CLAN_IDEAS.map((clan) => (
                                        <button
                                             key={clan.id}
                                             type="button"
                                             onClick={onCreateMeeting}
                                             className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
                                        >
                                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                                                  <Users className="h-5 w-5 text-violet-600" />
                                             </div>
                                             <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-black text-brand-ink">{clan.name}</p>
                                                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-400 md:text-sm">#{clan.tag} · {clan.desc}</p>
                                             </div>
                                             <span className="shrink-0 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-black text-white">개설하기</span>
                                        </button>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* 1시간 루트 */}
                    <div id="home-routes" className="scroll-mt-24 rounded-[20px] border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-4 md:p-5">
                         <SectionHeader label="1시간 루트" title="시간 없어도 강남은 즐겁게" actionLabel="강남 픽" onAction={() => onTabChange('gangnam_pick')} />
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

                    {/* 봉케팅 + 팝업 */}
                    <div className="grid gap-4 lg:grid-cols-2">
                         <div id="home-volunteer" className="scroll-mt-24 rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="봉케팅" title="봉사도 선착순 마감" />
                              <p className="mb-3 -mt-1 text-xs font-semibold text-slate-400">인원을 정해 봉사 모임을 열면 콘서트 티켓처럼 금방 마감돼요.</p>
                              <div className="space-y-2">
                                   {VOLUNTEER_IDEAS.map((idea) => (
                                        <button
                                             key={idea.id}
                                             type="button"
                                             onClick={onCreateMeeting}
                                             className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md"
                                        >
                                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg">{idea.emoji}</div>
                                             <div className="min-w-0 flex-1">
                                                  <p className="truncate text-sm font-black text-brand-ink">{idea.title}</p>
                                                  <p className="mt-0.5 text-xs font-semibold text-slate-400 md:text-sm">{idea.when} · {idea.where}</p>
                                             </div>
                                             <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-black text-white">모임 열기</span>
                                        </button>
                                   ))}
                              </div>
                         </div>

                         <div id="home-popup" className="scroll-mt-24 rounded-[20px] border border-pink-100 bg-gradient-to-br from-pink-50/50 to-white p-4 md:p-5">
                              <SectionHeader label="팝업·전시" title="한정 소식은 여기서 확인" actionLabel="구청 소식" onAction={() => onTabChange('news')} />
                              <div className="space-y-2">
                                   {POPUP_LINKS.map((popup) => {
                                        const inner = (
                                             <>
                                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100">
                                                       <Store className="h-5 w-5 text-pink-600" />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                       <p className="truncate text-sm font-black text-brand-ink">{popup.title}</p>
                                                       <p className="mt-0.5 truncate text-xs font-semibold text-slate-400 md:text-sm">{popup.desc}</p>
                                                  </div>
                                                  <ExternalLink className="h-4 w-4 shrink-0 text-pink-300" />
                                             </>
                                        );
                                        const className = 'flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition-all hover:shadow-md';
                                        return popup.href ? (
                                             <a key={popup.id} href={popup.href} target="_blank" rel="noreferrer" className={className}>{inner}</a>
                                        ) : (
                                             <button key={popup.id} type="button" onClick={() => go(popup.target)} className={className}>{inner}</button>
                                        );
                                   })}
                              </div>
                         </div>
                    </div>

                    {/* 밸런스 게임 + 다이제스트 + 지도 */}
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
                              <div id="home-trending" className="scroll-mt-24 rounded-[20px] bg-slate-50 p-4 md:p-5">
                                   <SectionHeader label="지금 뜨는 중" title="오늘 뜨는 모임" actionLabel="전체보기" onAction={() => onTabChange('wine')} />
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
                                        {meetingItems.length === 0 && (
                                             <button type="button" onClick={onCreateMeeting} className="w-full rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-400 hover:border-brand-gold/40 hover:text-brand-accent">
                                                  아직 모임이 없어요. 첫 모임을 열어보세요!
                                             </button>
                                        )}
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
