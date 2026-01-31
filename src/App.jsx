import React, { useState, useEffect, Suspense, lazy } from 'react'
import { supabase } from './lib/supabase'
import { normalizeForGangnamDisplay } from './lib/displayGangnam'
import LeftSidebar from './components/LeftSidebar'
import RightPanel from './components/RightPanel'
import ChatWidget from './components/ChatWidget'
import Toast from './components/Toast'
import './index.css'
import { User, LogIn, Menu, X, Megaphone, Loader2 } from 'lucide-react'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy Load Heavy Components
const ILoveSchool = lazy(() => import('./components/ILoveSchool'))
const UsedMarket = lazy(() => import('./components/UsedMarket'))
const MeetingFeed = lazy(() => import('./components/MeetingFeed'))
const MiniHomepage = lazy(() => import('./components/MiniHomepage'))
const CreatePostModal = lazy(() => import('./components/CreatePostModal'))
const NeighborhoodLife = lazy(() => import('./components/NeighborhoodLife'))
const GangnamRomance = lazy(() => import('./components/GangnamRomance'))
const ActivityRewardCenter = lazy(() => import('./components/ActivityRewardCenter'))
const AuthWidget = lazy(() => import('./components/AuthWidget'))
const AvatarCustomizer = lazy(() => import('./components/AvatarCustomizer'))
const BannerWriteModal = lazy(() => import('./components/BannerWriteModal'))
const DiningCompanion = lazy(() => import('./components/DiningCompanion'))
const CultureClass = lazy(() => import('./components/CultureClass'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const GangnamLounge = lazy(() => import('./components/GangnamLounge'))
const OwnersNote = lazy(() => import('./components/OwnersNote'))
const DbPresentation = lazy(() => import('./components/DbPresentation'))

// 가상 모임 게시물 (홈 + 비즈니스 네트워크 탭에 노출)
const VIRTUAL_MEETING_ITEMS = [
     // 홈 피드용 (독서, 영어, 강아지 봉사)
     { id: 'virtual-reading', category: '📚 독서', originalType: 'pet', isEvent: false, expiresAt: null, title: '강남역 근처 독서 모임 — 이번 주 주제: 「작은 것들의 신」', host: '강남 북클럽', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '강남역 스타벅스 2층', participants: 4, maxParticipants: 8, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop' },
     { id: 'virtual-english', category: '🗣️ 영어', originalType: 'pet', isEvent: false, expiresAt: null, title: '매주 토요일 영어 스터디 — 프리토킹 + 단어 퀴즈', host: '강남 잉글리시', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '역삼동 카페 「커피나무」', participants: 6, maxParticipants: 10, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop' },
     { id: 'virtual-pet-volunteer', category: '🐶 강아지 봉사', originalType: 'pet', isEvent: false, expiresAt: null, title: '유기견 산책 봉사 — 강남 보호센터와 함께하는 주말 봉사', host: '멍냥회관', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '강남구 유기동물 보호센터', participants: 3, maxParticipants: 6, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop' },
     // 스타트업/프리랜서 (3개)
     { id: 'virtual-sf-1', category: '⚡ 스타트업', originalType: 'startup_freelance', isEvent: false, expiresAt: null, title: '강남 스타트업 팀 빌딩 밋업 — 아이디어만 있어도 OK, 같이 구체화해요', host: '강남 스타트업랩', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '역삼 WeWork 3층', participants: 7, maxParticipants: 15, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop' },
     { id: 'virtual-sf-2', category: '⚡ 스타트업', originalType: 'startup_freelance', isEvent: false, expiresAt: null, title: '웹/앱 개발 프리랜서 협업 구합니다 — 강남 오피스 주 2회', host: '테크스타트업A', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '테헤란로 팀랩', participants: 2, maxParticipants: 3, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop' },
     { id: 'virtual-sf-3', category: '⚡ 스타트업', originalType: 'startup_freelance', isEvent: false, expiresAt: null, title: '테크 창업가 네트워킹 — 1월 정기 오프라인 모임 (피칭 + 피드백)', host: '강남 창업모임', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '강남역 스타트업 캠퍼스', participants: 12, maxParticipants: 20, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop' },
     // 점심 네트워킹 (3개)
     { id: 'virtual-ln-1', category: '☕ 런치미팅', originalType: 'lunch_networking', isEvent: false, expiresAt: null, title: '역삼 점심 같이 드실 분 — 마케팅/광고 업계 정보 교환', host: '강남 런치클럽', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '역삼동 맛집 「청담골」', participants: 4, maxParticipants: 6, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop' },
     { id: 'virtual-ln-2', category: '☕ 런치미팅', originalType: 'lunch_networking', isEvent: false, expiresAt: null, title: 'VC/엔젤 투자자와 점심 미팅 — 선착순 5명, 사업 아이디어 피드백', host: '강남 액셀', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '삼성동 라운지 레스토랑', participants: 3, maxParticipants: 5, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop' },
     { id: 'virtual-ln-3', category: '☕ 런치미팅', originalType: 'lunch_networking', isEvent: false, expiresAt: null, title: '강남 점심 네트워킹 — 금요일 정기 모임, 비즈니스 캐주얼', host: '점심네트워킹', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '강남역 인근 (매주 장소 공지)', participants: 8, maxParticipants: 12, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop' },
     // 구인/협업 제안 (3개)
     { id: 'virtual-rp-1', category: '👥 구인/협업', originalType: 'recruit_proposal', isEvent: false, expiresAt: null, title: '헬스케어 스타트업 공동 창업자 구합니다 — 의료/바이오 경험자 우대', host: '헬스업팀', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '온·오프라인 협의', participants: 1, maxParticipants: 2, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop' },
     { id: 'virtual-rp-2', category: '👥 구인/협업', originalType: 'recruit_proposal', isEvent: false, expiresAt: null, title: '사이드 프로젝트 UI/UX 디자이너 1명 구해요 — 강남에서 오프라인 미팅 가능', host: '사이드팀', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '강남역 근처 카페', participants: 2, maxParticipants: 3, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop' },
     { id: 'virtual-rp-3', category: '👥 구인/협업', originalType: 'recruit_proposal', isEvent: false, expiresAt: null, title: 'B2B 세일즈 경험 있으신 분 협업 제안 — SaaS 스타트업 팀 합류', host: '세일즈파트너', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '테헤란로 본사', participants: 4, maxParticipants: 5, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop' },
     // 사무실/임대 정보 (3개)
     { id: 'virtual-or-1', category: '🏢 사무실', originalType: 'office_rent', isEvent: false, expiresAt: null, title: '강남역 5분 프라이빗 오피스 1인실 입주 모집 — 월 50만원대', host: '강남오피스', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '강남역 인근 공유오피스', participants: 0, maxParticipants: 1, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop' },
     { id: 'virtual-or-2', category: '🏢 사무실', originalType: 'office_rent', isEvent: false, expiresAt: null, title: '역삼동 20평 오피스 3월부터 양도 — 인테리어 완비, 즉시 입주 가능', host: '역삼부동산', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '역삼동 봉은사로', participants: 0, maxParticipants: 1, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop' },
     { id: 'virtual-or-3', category: '🏢 사무실', originalType: 'office_rent', isEvent: false, expiresAt: null, title: '테헤란로 공유 오피스 데스크 2석 남음 — 당일 입주 가능', host: '테헤란오피스', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '테헤란로 위워크', participants: 0, maxParticipants: 2, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop' },
     // 산타는 강남 — 등산/트레킹 (3개)
     { id: 'virtual-hiking-1', category: '⛰️ 등산', originalType: 'hiking', isEvent: false, expiresAt: null, title: '우리동네 북한산 등산 — 초보 환영, 일요일 아침 8시 출발', host: '산타는강남', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '북한산 우이동 입구', participants: 5, maxParticipants: 10, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop' },
     { id: 'virtual-hiking-2', category: '⛰️ 등산', originalType: 'hiking', isEvent: false, expiresAt: null, title: '강남역→관악산 트레킹 — 저녁 해돋이 보고 내려와요', host: '등산모임', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '관악산 연대 입구', participants: 3, maxParticipants: 8, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop' },
     { id: 'virtual-hiking-3', category: '⛰️ 등산', originalType: 'hiking', isEvent: false, expiresAt: null, title: '수도권 100대 명산 도전 — 이번 주 코스: 도봉산', host: '산타는강남', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '도봉산 도봉역 1번 출구', participants: 7, maxParticipants: 12, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop' },
     // FC 강남 — 스포츠/운동 (3개)
     { id: 'virtual-sports-1', category: '⚽ 스포츠', originalType: 'sports', isEvent: false, expiresAt: null, title: 'FC 강남 정기 축구 — 토요일 오전 7인제, 실력 무관', host: 'FC강남', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '강남구민축구장 (선릉역)', participants: 9, maxParticipants: 14, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop' },
     { id: 'virtual-sports-2', category: '⚽ 스포츠', originalType: 'sports', isEvent: false, expiresAt: null, title: '강남 러닝 모임 — 매주 일요일 10km, 페이스 자유', host: '강남러너스', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '잠실 한강공원 집합', participants: 6, maxParticipants: 15, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=600&h=400&fit=crop' },
     { id: 'virtual-sports-3', category: '⚽ 스포츠', originalType: 'sports', isEvent: false, expiresAt: null, title: '배드민턴 셔틀 — 역삼 실내체육관, 초급/중급 팀 나눠서', host: 'FC강남', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '역삼동 강남문화체육관', participants: 4, maxParticipants: 8, isHot: true, status: 'open', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=400&fit=crop' },
];

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
          "🎉 강남온 공식 오픈! 우리 동네 숨겨진 핫플레이스를 공유하고 적립금을 받아보세요! 🎉",
          "🐕 강아지를 찾습니다. 흰색 말티즈 역삼에서 도망감 ㅠㅠ 뽀야 돌아와~~",
          "🌸 오늘 날씨 완전 봄이네용! 강남역 스벅에서 같이 카공하실 분? 제가 커피 쏨 >_<",
          "🐷 다이어트 한다고 저녁 굶었는데... 강남역 앞 붕어빵 냄새 유혹 미쳤음 3마리 순삭 ㅠㅠ",
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
                                   location: user.user_metadata?.region || '강남',
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
                         location: normalizeForGangnamDisplay(m.location || '강남'),
                         likes: m.likes_count || 0,
                         image: m.image_urls?.[0] || 'https://via.placeholder.com/500',
                         seller: normalizeForGangnamDisplay(m.author?.username) || m.author?.username
                    })));
               }

               // Gatherings
               const { data: gatherings } = await supabase
                    .from('posts')
                    .select('*, author:profiles(username, avatar_url)')
                    .in('type', ['gathering', 'hiking', 'sports', 'pet', 'wine', 'startup_freelance', 'lunch_networking', 'recruit_proposal', 'office_rent']) // Fetch all types including business
                    .order('created_at', { ascending: false });

               const mappedGatherings = (gatherings || []).map(g => ({
                    id: g.id,
                    category: g.type === 'gathering' ? '⚡ 번개'
                         : g.type === 'hiking' ? '⛰️ 등산'
                              : g.type === 'sports' ? '⚽ 스포츠'
                                   : g.type === 'pet' ? '🐶 반려동물'
                                        : g.type === 'wine' ? '🍷 와인'
                                             : g.type === 'startup_freelance' ? '⚡ 스타트업'
                                                  : g.type === 'lunch_networking' ? '☕ 런치미팅'
                                                       : g.type === 'recruit_proposal' ? '👥 구인/협업'
                                                            : g.type === 'office_rent' ? '🏢 사무실'
                                                                 : g.type,
                    originalType: g.type,
                    isEvent: g.type === 'event',
                    expiresAt: g.expires_at,
                    title: g.title,
                    host: normalizeForGangnamDisplay(g.author?.username) || g.author?.username || '익명',
                    hostBadge: '강남 이웃',
                    date: new Date(g.created_at).toLocaleDateString(),
                    location: normalizeForGangnamDisplay(g.location || '장소미정'),
                    participants: g.current_participants || 1,
                    maxParticipants: g.max_participants || 99,
                    isHot: (g.likes_count || 0) > 5,
                    status: (g.current_participants >= (g.max_participants || 99)) ? 'closed' : 'open',
                    image: g.image_urls?.[0] || 'https://via.placeholder.com/600'
               }));
               setMeetingItems([...VIRTUAL_MEETING_ITEMS, ...mappedGatherings]);
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
               location: data.location || '강남',
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
               setToastMessage("중고 물품 등록! +10 온 획득! ⚡");
          } else {
               const newItem = {
                    id: savedPost.id,
                    category: '⚡ 번개',
                    title: savedPost.title,
                    host: savedPost.author?.username,
                    hostBadge: '강남 이웃',
                    date: new Date().toLocaleDateString(),
                    location: savedPost.location,
                    participants: 1,
                    maxParticipants: savedPost.max_participants || 4,
                    isHot: true,
                    image: savedPost.image_urls?.[0]
               };
               setMeetingItems(prev => [newItem, ...prev]);
               setToastMessage("모임 개설! +10 온 획득! 🎉");
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
               setToastMessage("온이 부족해요! 열심히 활동해서 모아보세요 ⚡");
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
          setToastMessage(`배너 등록 완료! -${cost} 온 💸`);
     };

     const handleOpenMinihome = (targetProfile) => {
          if (targetProfile && targetProfile.name) {
               // Mock profile object
               setMiniHomeTargetUser({
                    user_metadata: {
                         username: targetProfile.name,
                         avatar_url: targetProfile.avatar,
                         location: targetProfile.location || '강남'
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
                                   <div className="animate-marquee whitespace-nowrap text-md font-bold tracking-wide text-white inline-flex items-center gap-8 shrink-0" style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)", width: "max-content" }}>
                                        {/* 한 번에 한 블록만 이동하므로 마지막 문장이 왼쪽 끝을 지날 때까지 잘리지 않음 */}
                                        {[...bannerMessages, ...bannerMessages].map((msg, i) => (
                                             <span key={i} className="inline-block shrink-0">
                                                  {msg}
                                             </span>
                                        ))}
                                   </div>
                              </div>

                              {/* Add Banner Button (Visible on Hover/Always for accessibility) */}
                              <button
                                   onClick={() => setIsBannerModalOpen(true)}
                                   className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-purple-600 p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10"
                                   title="배너 등록하기 (500온)"
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
                         <ErrorBoundary>
                              <Suspense fallback={
                                   <div className="flex flex-col items-center justify-center p-20">
                                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                                        <p className="text-gray-400 font-bold">로딩중입니다...</p>
                                   </div>
                              }>
                                   <div className="flex flex-col gap-8">

                                        {/* NEW: GANGNAM LOUNGE TAB */}
                                        {activeTab === 'gangnam_lounge' && (
                                             <GangnamLounge
                                                  onExit={() => handleTabChange('home')}
                                                  user={user}
                                                  beanCount={beanCount}
                                                  updateBeanCount={updateBeanCount}
                                             />
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
                                                                 <p className="text-xs text-gray-500">강남 리더 뱃지를 획득해보세요!</p>
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

                                        {/* NEW: BUSINESS NETWORK TAB */}
                                        {['startup_freelance', 'lunch_networking', 'recruit_proposal', 'office_rent'].includes(activeTab) && (
                                             <>
                                                  <div className="flex items-center justify-between mb-2">
                                                       <h2 className="text-xl font-bold text-gray-900">
                                                            {activeTab === 'startup_freelance' && '⚡ 스타트업/프리랜서'}
                                                            {activeTab === 'lunch_networking' && '☕ 점심 네트워킹'}
                                                            {activeTab === 'recruit_proposal' && '👥 구인/협업 제안'}
                                                            {activeTab === 'office_rent' && '🏢 사무실/임대 정보'}
                                                       </h2>
                                                       <button onClick={() => setIsCreateModalOpen(true)} className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100">
                                                            + 글쓰기
                                                       </button>
                                                  </div>
                                                  <MeetingFeed items={meetingItems.filter(item => item.originalType === activeTab)} />
                                             </>
                                        )}

                                        {/* 2. GATHERING TAB */}
                                        {(['hiking', 'sports', 'pet', 'wine'].includes(activeTab)) && (
                                             <>
                                                  <div className="flex items-center justify-between mb-2">
                                                       <h2 className="text-xl font-bold text-gray-900">
                                                            {activeTab === 'hiking' && '⛰️ 산타는 강남'}
                                                            {activeTab === 'sports' && '⚽️ FC 강남 & 스포츠'}
                                                            {activeTab === 'pet' && '🐶 멍냥회관'}
                                                            {activeTab === 'wine' && '🍷 밤의 미식회'}
                                                       </h2>
                                                       <button onClick={() => setIsCreateModalOpen(true)} className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100">
                                                            + 모임 만들기
                                                       </button>
                                                  </div>
                                                  <MeetingFeed items={meetingItems.filter(item => item.originalType === activeTab)} />
                                             </>
                                        )}

                                        {/* 3. LIFE TAB & COMMUNITY TAB */}
                                        {(['qna', 'news', 'share', 'town_story', 'gangnam_pick', 'daily_photo'].includes(activeTab)) && (
                                             <>
                                                  <div className="flex items-center justify-between mb-2">
                                                       <h2 className="text-xl font-bold text-gray-900">
                                                            {activeTab === 'qna' && '🙋‍♀️ 무엇이든 물어보세요'}
                                                            {activeTab === 'news' && '📢 우리 동네 소식통'}
                                                            {activeTab === 'share' && '🎁 당근보다 가까운 나눔'}
                                                            {activeTab === 'town_story' && '💬 타운 스토리'}
                                                            {activeTab === 'gangnam_pick' && '👍 강남 픽'}
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

                                        {/* 6. GANGNAM ROMANCE (NEW) */}
                                        {activeTab === 'romance' && (
                                             <GangnamRomance
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
                                                       <h2 className="text-2xl font-bold text-gray-900">나의 강남 활동 Badge</h2>
                                                       <p className="text-gray-500">
                                                            현재 <strong>'강남 새싹 🌱'</strong> 등급입니다.<br />
                                                            활동을 통해 레벨업 해보세요!
                                                       </p>
                                                       <button onClick={() => setIsMiniHomeOpen(true)} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                                            🏠 내 미니홈피 열기
                                                       </button>
                                                  </div>
                                             </div>
                                        )}
                                   </div>
                              </Suspense>
                         </ErrorBoundary>
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
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">G</div>
                              <span className="font-bold text-gray-900 text-lg">Gangnam On</span>
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
                         <Suspense fallback={null}>
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
                         </Suspense>
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
               <Suspense fallback={null}>
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
                    }
                    {
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
               </Suspense>

               <ChatWidget />

          </div>
     )
}


export default App
