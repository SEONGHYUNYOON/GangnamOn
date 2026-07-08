import React, { useState, useEffect, Suspense, lazy } from 'react'
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query, Permission, Role, getCurrentUser, callEconomy } from './lib/appwrite'
import { normalizeForGangnamDisplay } from './lib/displayGangnam'
import LeftSidebar from './components/LeftSidebar'
import RightPanel from './components/RightPanel'
import ChatWidget from './components/ChatWidget'
import Toast from './components/Toast'
import KakaoMap from './components/KakaoMap'
import GangnamNews from './components/GangnamNews'
import './index.css'
import { User, LogIn, Menu, X, Megaphone, Loader2, Lock, CalendarDays, MapPin, BookOpen, Newspaper, Utensils } from 'lucide-react'
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
const ResetPasswordModal = lazy(() => import('./components/ResetPasswordModal'))

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
     { id: 'virtual-hiking-2', category: '⛰️ 등산', originalType: 'hiking', isEvent: false, expiresAt: null, title: '강남역→관악산 트레킹 — 저녁 노을 보고 내려와요', host: '등산모임', hostBadge: '강남 이웃', date: new Date().toLocaleDateString('ko-KR'), location: '관악산 낙성대 입구', participants: 3, maxParticipants: 8, isHot: false, status: 'open', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop' },
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
     const [createModalCategory, setCreateModalCategory] = useState('gathering');
     const [isRewardCenterOpen, setIsRewardCenterOpen] = useState(false);
     const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
     const [isBannerModalOpen, setIsBannerModalOpen] = useState(false); // New Toggle
     const [ownersNoteRefreshKey, setOwnersNoteRefreshKey] = useState(0); // 새 이벤트 등록 시 Owner's Note 재조회 트리거
     const [toastMessage, setToastMessage] = useState(null);
     const [beanCount, setBeanCount] = useState(1250); // 온(가상 화폐)
     const [unlockedStyles, setUnlockedStyles] = useState(['lorelei', 'avataaars']); // Default free styles

     // Admin / Presence State
     const [onlineUsersCount, setOnlineUsersCount] = useState(1); // Self


     // 플로우 배너: 이제 메시지뿐 아니라 "클릭하면 어디로 이동할지"도 함께 들고 다닙니다.
     // targetTab이 있으면 클릭 시 해당 메뉴로 이동해서 실제 목적지까지 연결됩니다.
     const [bannerMessages, setBannerMessages] = useState([
          { id: 'seed-1', message: "🎉 강남온 공식 오픈! 우리 동네 숨겨진 핫플레이스를 공유하고 적립금을 받아보세요! 🎉", targetTab: 'home' },
          { id: 'seed-2', message: "🐕 강아지를 찾습니다. 흰색 말티즈 역삼에서 도망감 ㅠㅠ 뽀야 돌아와~~", targetTab: 'town_story' },
          { id: 'seed-3', message: "🌸 오늘 날씨 완전 봄이네용! 강남역 스벅에서 같이 카공하실 분? 제가 커피 쏨 >_<", targetTab: null },
          { id: 'seed-4', message: "🐷 다이어트 한다고 저녁 굶었는데... 강남역 앞 붕어빵 냄새 유혹 미쳤음 3마리 순삭 ㅠㅠ", targetTab: null },
          { id: 'seed-5', message: "🥕 저희 집 고양이가 츄르를 다 먹어서요..😭 남는 츄르 당근하실 분 계신가요?", targetTab: 'share' },
     ]);

     // Auth & Mobile State
     const [user, setUser] = useState(null);
     const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);
     const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
     const [passwordRecovery, setPasswordRecovery] = useState(null); // { userId, secret } | null

     // 관리자 대시보드에 접근 가능한 이메일 (운영진 전용 — 다른 사용자에게는 메뉴 자체가 보이지 않음)
     const ADMIN_EMAILS = ['a23642514@gmail.com'];
     const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

     // --- 1. Data State ---
     const [marketItems, setMarketItems] = useState([]);
     const [meetingItems, setMeetingItems] = useState([]);

     // 로그인 상태 + 프로필 문서를 함께 불러와서, 기존 컴포넌트들이 쓰던
     // user.id / user.user_metadata.* 형태 그대로 쓸 수 있도록 맞춰줍니다.
     const refreshUser = async () => {
          const rawUser = await getCurrentUser();
          if (!rawUser) {
               setUser(null);
               return;
          }

          let profile = null;
          try {
               profile = await databases.getDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    documentId: rawUser.$id,
               });
               // 스키마 push 이전에 생성된 빈 프로필(username/beans 없음)은 economy Function이
               // beans=0으로 처리해 "온 부족" 오류를 냅니다. UI 기본값(1250)과 불일치하므로 복구합니다.
               if (!profile?.username) {
                    profile = await databases.updateDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         documentId: rawUser.$id,
                         data: {
                              username: rawUser.name || rawUser.email?.split('@')[0] || '강남주민',
                              fullName: rawUser.name || rawUser.email?.split('@')[0] || '강남주민',
                              beans: profile?.beans ?? 1250,
                              location: profile?.location || '강남',
                              unlockedStyles: profile?.unlockedStyles || ['lorelei', 'avataaars'],
                         },
                    });
               }
          } catch (e) {
               // 프로필 문서가 없으면 새로 생성
               try {
                    profile = await databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         documentId: rawUser.$id,
                         data: {
                              username: rawUser.name || rawUser.email?.split('@')[0] || '강남주민',
                              fullName: rawUser.name || '',
                              avatarUrl: '',
                              location: '강남',
                              beans: 1250,
                              unlockedStyles: ['lorelei', 'avataaars'],
                         },
                         permissions: [
                              Permission.read(Role.any()),
                              Permission.update(Role.user(rawUser.$id)),
                              Permission.delete(Role.user(rawUser.$id)),
                         ],
                    });
               } catch (createErr) {
                    console.error('프로필 생성 실패:', createErr);
               }
          }

          setBeanCount(profile?.beans ?? 1250);
          if (profile?.unlockedStyles && Array.isArray(profile.unlockedStyles)) {
               setUnlockedStyles(prev => [...new Set([...prev, ...profile.unlockedStyles])]);
          }

          setUser({
               id: rawUser.$id,
               $id: rawUser.$id,
               email: rawUser.email,
               emailVerification: rawUser.emailVerification,
               user_metadata: {
                    username: profile?.username || rawUser.name,
                    full_name: profile?.fullName || rawUser.name,
                    avatar_url: profile?.avatarUrl || '',
                    region: profile?.location || '강남',
                    gender: profile?.gender || '',
               },
          });
     };

     const handleLogout = async () => {
          try {
               await account.deleteSession('current');
          } catch (e) {
               console.error('로그아웃 실패:', e);
          }
          setUser(null);
     };

     // 인증 메일의 "이메일 인증하기" 링크를 클릭하면 ?userId=...&secret=... 파라미터와 함께
     // 이 페이지로 돌아오는데, 그걸 감지해서 실제 인증 완료 처리를 해줍니다.
     // (비밀번호 재설정 메일도 동일한 userId/secret 파라미터를 쓰기 때문에,
     // AuthWidget에서 재설정 링크에는 flow=recovery를 붙여서 구분합니다.)
     const handleEmailVerificationCallback = async () => {
          const params = new URLSearchParams(window.location.search);
          const oauth = params.get('oauth');
          if (oauth) {
               if (oauth === 'success') {
                    await refreshUser();
                    setToastMessage('소셜 로그인이 완료됐어요.');
               } else {
                    setToastMessage('소셜 로그인에 실패했어요. 구글/카카오 OAuth 설정을 확인해주세요.');
               }
               window.history.replaceState({}, '', window.location.pathname);
               return;
          }

          const userId = params.get('userId');
          const secret = params.get('secret');
          const flow = params.get('flow');
          if (!userId || !secret) return;

          if (flow === 'recovery') {
               setPasswordRecovery({ userId, secret });
               window.history.replaceState({}, '', window.location.pathname);
               return;
          }

          try {
               await account.updateVerification(userId, secret);
               setToastMessage('이메일 인증이 완료됐어요! ✅');
               await refreshUser();
          } catch (error) {
               console.error('이메일 인증 처리 실패:', error);
               setToastMessage('인증 링크가 만료됐거나 이미 사용됐어요.');
          } finally {
               // 새로고침해도 다시 처리되지 않도록 주소창 파라미터 정리
               window.history.replaceState({}, '', window.location.pathname);
          }
     };

     const handleResendVerification = async () => {
          try {
               await account.createVerification(window.location.origin + window.location.pathname);
               setToastMessage('인증 메일을 다시 보냈어요! 메일함을 확인해주세요 📧');
          } catch (error) {
               console.error('인증 메일 재전송 실패:', error);
               setToastMessage('인증 메일 재전송에 실패했어요.');
          }
     };

     useEffect(() => {
          handleEmailVerificationCallback();
          refreshUser();

          // Appwrite에는 Supabase 같은 실시간 presence(접속자 추적) 기능이 기본 제공되지 않습니다.
          // 실제 접속자 추적은 추후 별도 작업으로 남겨두고, 우선 화면 표시용 숫자를 채워둡니다.
          setOnlineUsersCount(Math.floor(Math.random() * 40) + 15);

          // Fetch Feed Data
          const fetchFeeds = async () => {
               try {
                    // Market
                    const marketsRes = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [Query.equal('type', 'market'), Query.orderDesc('$createdAt')],
                    });

                    setMarketItems(marketsRes.documents.map(m => ({
                         id: m.$id,
                         title: m.title,
                         price: m.price?.toLocaleString() || '0',
                         location: normalizeForGangnamDisplay(m.locationName || '강남'),
                         likes: m.likesCount || 0,
                         image: m.imageUrls?.[0] || 'https://via.placeholder.com/500',
                         seller: normalizeForGangnamDisplay(m.authorUsername) || m.authorUsername
                    })));

                    // Gatherings
                    const gatheringsRes = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [
                              Query.equal('type', ['gathering', 'hiking', 'sports', 'pet', 'wine', 'startup_freelance', 'lunch_networking', 'recruit_proposal', 'office_rent']),
                              Query.orderDesc('$createdAt'),
                              Query.limit(100),
                         ],
                    });

                    const mappedGatherings = gatheringsRes.documents.map(g => ({
                         id: g.$id,
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
                         expiresAt: g.expiresAt,
                         title: g.title,
                         host: normalizeForGangnamDisplay(g.authorUsername) || g.authorUsername || '익명',
                         hostBadge: '강남 이웃',
                         date: new Date(g.$createdAt).toLocaleDateString(),
                         location: normalizeForGangnamDisplay(g.locationName || '장소미정'),
                         participants: g.currentParticipants || 1,
                         maxParticipants: g.maxParticipants || 99,
                         isHot: (g.likesCount || 0) > 5,
                         status: (g.currentParticipants >= (g.maxParticipants || 99)) ? 'closed' : 'open',
                         image: g.imageUrls?.[0] || 'https://via.placeholder.com/600'
                    }));
                    setMeetingItems([...VIRTUAL_MEETING_ITEMS, ...mappedGatherings]);

                    // 플로우 배너 자동 생성: 진행 중인 사장님 이벤트 + 지금 핫한 모임을 배너에 실어서
                    // 클릭하면 바로 해당 메뉴로 이동하도록 연결 (목적성 강화)
                    const liveEventsRes = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [Query.equal('type', 'event'), Query.limit(20)],
                    });

                    const topLiveEvents = [...liveEventsRes.documents]
                         .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
                         .slice(0, 2);

                    const autoBanners = [];
                    topLiveEvents.forEach(ev => {
                         if (!ev.expiresAt || new Date(ev.expiresAt) > new Date()) {
                              autoBanners.push({
                                   id: `auto-event-${ev.$id}`,
                                   message: `🎁 사장님 이벤트: ${ev.title} — 지금 확인하기`,
                                   targetTab: 'local_biz'
                              });
                         }
                    });

                    const hottestMeeting = mappedGatherings.find(g => g.isHot);
                    if (hottestMeeting) {
                         autoBanners.push({
                              id: `auto-meeting-${hottestMeeting.id}`,
                              message: `🔥 지금 핫한 모임: ${hottestMeeting.title}`,
                              targetTab: 'home'
                         });
                    }

                    if (autoBanners.length > 0) {
                         setBannerMessages(prev => [...autoBanners, ...prev.filter(b => !String(b.id).startsWith('auto-'))]);
                    }
               } catch (err) {
                    console.error('피드 로딩 실패:', err);
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
               window.removeEventListener('popstate', handlePopState);
          };
     }, []);

     // Helper to update beans safely in DB and State
     const updateBeanCount = async (delta) => {
          setBeanCount(prev => {
               const newValue = prev + delta;
               if (user) {
                    databases.updateDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         documentId: user.id,
                         data: { beans: newValue },
                    }).catch(err => console.error('온 업데이트 실패:', err));
               }
               return newValue;
          });
     };

     // Handler for changing tabs
     const handleTabChange = (newTab) => {
          if (newTab === 'minihome') {
               handleOpenMinihome();
               return;
          }
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
     // CreatePostModal이 이미 실제 DB insert를 마치고 저장된 row(savedPost)를 넘겨줍니다.
     // 여기서는 다시 insert하지 않고, 화면 상태만 업데이트합니다.
     // (예전에는 여기서도 insert를 한번 더 호출해서 글이 두 번 저장되는 버그가 있었음)
     const CATEGORY_LABELS = {
          gathering: '⚡ 번개',
          startup_freelance: '⚡ 스타트업',
          lunch_networking: '☕ 런치미팅',
          recruit_proposal: '👥 구인/협업',
          office_rent: '🏢 사무실',
     };

     const handleShare = (category, savedPost) => {
          if (!user) {
               setIsMobileLoginOpen(true);
               return;
          }

          // 글 작성 보상(+10온)은 서버(economy Function)에서 지급합니다.
          // 실패해도 글 자체는 이미 등록됐으므로 화면은 그대로 진행시키고
          // 보상만 성공 시 잔액에 반영합니다.
          callEconomy({ action: 'earn', type: 'post_created' }).then(result => {
               if (result.success) setBeanCount(result.beans);
          });

          if (category === 'market') {
               const newItem = {
                    id: savedPost.$id,
                    title: savedPost.title,
                    price: savedPost.price?.toLocaleString(),
                    location: normalizeForGangnamDisplay(savedPost.locationName),
                    likes: 0,
                    image: savedPost.imageUrls?.[0],
                    seller: savedPost.authorUsername
               };
               setMarketItems(prev => [newItem, ...prev]);
               setToastMessage("중고 물품 등록! +10 온 획득! ⚡");
          } else if (category === 'event') {
               // Owner's Note는 자체적으로 posts(type='event')를 다시 불러오므로
               // refreshKey를 올려서 새 이벤트가 바로 보이도록 함
               setOwnersNoteRefreshKey(prev => prev + 1);
               setToastMessage("이벤트 등록 완료! Owner's Note에 노출됩니다 🎉 (+10 온)");
          } else {
               const newItem = {
                    id: savedPost.$id,
                    category: CATEGORY_LABELS[category] || '⚡ 번개',
                    originalType: category,
                    title: savedPost.title,
                    host: savedPost.authorUsername,
                    hostBadge: '강남 이웃',
                    date: new Date().toLocaleDateString(),
                    location: normalizeForGangnamDisplay(savedPost.locationName),
                    participants: 1,
                    maxParticipants: savedPost.maxParticipants || 4,
                    isHot: true,
                    image: savedPost.imageUrls?.[0]
               };
               setMeetingItems(prev => [newItem, ...prev]);
               setToastMessage("모임 개설! +10 온 획득! 🎉");
          }

          setIsCreateModalOpen(false);
     };

     // GangnamRomance에서 'romance_like' / 'romance_superlike'를 전달합니다.
     // 실제 차감 금액과 잔액 확인은 서버(economy Function)에서만 결정됩니다.
     const handleHeartClick = async (spendType) => {
          const result = await callEconomy({ action: 'spend', type: spendType });
          if (result.success) {
               setBeanCount(result.beans);
          } else if (result.message) {
               setToastMessage(result.message);
          }
          return result;
     };

     const handleRewardClaim = (amount) => {
          updateBeanCount(amount);
          // No toast needed here as the modal triggers a pulsing animation
     };

     const handleAvatarSave = async (newUrl) => {
          if (!user) return;

          try {
               // Appwrite profiles 문서에 아바타 URL 저장
               await databases.updateDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    documentId: user.id,
                    data: { avatarUrl: newUrl },
               });

               setUser(prev => ({ ...prev, user_metadata: { ...prev.user_metadata, avatar_url: newUrl } }));
               setToastMessage("캐릭터가 변경되었습니다! ✨");
               setIsAvatarModalOpen(false);
          } catch (error) {
               setToastMessage("저장 실패: " + error.message);
          }
     };

     // 구매 처리: 가격 확인/잔액 차감/스타일 잠금 해제를 전부 서버(economy Function)에서
     // 검증합니다. 클라이언트가 보내는 price는 화면 표시용일 뿐, 실제 차감 금액은
     // 서버의 고정 가격표를 따릅니다.
     const handlePurchaseStyle = async (styleId) => {
          if (!user) {
               setToastMessage("로그인이 필요합니다!");
               return false;
          }

          if (unlockedStyles.includes(styleId)) {
               setToastMessage("이미 보유한 스타일입니다.");
               return false;
          }

          const result = await callEconomy({ action: 'purchase_style', styleId });

          if (!result.success) {
               setToastMessage(result.message || "구매 중 오류가 발생했습니다.");
               return false;
          }

          setBeanCount(result.beans);
          setUnlockedStyles(result.unlockedStyles);
          setToastMessage("새로운 스타일 구매 완료! ✨");
          return true;
     };

     const handleBannerSubmit = async (message, targetTab) => {
          if (beanCount < 500) {
               setToastMessage("온이 부족합니다.");
               return;
          }

          const result = await callEconomy({ action: 'spend', type: 'banner' });
          if (!result.success) {
               setToastMessage(result.message || "배너 등록에 실패했습니다.");
               return;
          }

          setBeanCount(result.beans);
          setBannerMessages(prev => [{ id: `user-${Date.now()}`, message, targetTab: targetTab || null }, ...prev]);
          setToastMessage(`배너 등록 완료! -${result.spent} 온 💸`);
     };

     // 배너 클릭 시 연결된 메뉴로 이동 (연결 대상이 없으면 그냥 공지이므로 아무 동작 안 함)
     const handleBannerClick = (item) => {
          if (item?.targetTab) {
               handleTabChange(item.targetTab);
          }
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
          <div className={`min-h-screen font-sans flex justify-center transition-colors duration-500 ${activeTab === 'romance' ? 'bg-[#0F172A]' : activeTab === 'gangnam_lounge' ? 'bg-[#08090f]' : 'bg-transparent'}`}>

               {/* Toast Notification */}
               {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}


               {/* Central Container */}
               <div className="w-full max-w-[1880px] flex min-h-screen relative pt-20 lg:pt-0 pb-8 px-3 lg:px-5 gap-5 xl:gap-8">

                    {/* === Left Column (Fixed Width) === */}
                    <div className="w-[240px] xl:w-[280px] h-screen sticky top-0 hidden md:block overflow-y-auto no-scrollbar shrink-0 pt-5">
                         <LeftSidebar activeTab={activeTab} setActiveTab={handleTabChange} isAdmin={isAdmin} />
                    </div>

                    {/* === Center Column (Flexible) === */}
                    <main className="flex-1 min-w-0 py-4 lg:py-8 h-full flex flex-col gap-5">

                         {/* 이메일 미인증 안내 배너 */}
                         {user && user.emailVerification === false && (
                              <div className="flex items-center justify-between gap-3 bg-white border border-brand-gold/25 text-brand text-sm font-bold rounded-card px-4 py-3 shadow-soft">
                                   <span>📧 이메일 인증이 아직 안 됐어요. 받은 메일함을 확인해주세요.</span>
                                   <button
                                        onClick={handleResendVerification}
                                        className="shrink-0 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                   >
                                        인증 메일 재전송
                                   </button>
                              </div>
                         )}

                         {/* Top Marquee Banner */}
                         <div className="relative group">
                              <div
                                   className={`rounded-card overflow-hidden py-2.5 transition-colors duration-500 backdrop-blur-md cursor-pointer border ${activeTab === 'romance' ? 'bg-purple-900/60 border-purple-500/30' : 'bg-brand text-white border-white/10 shadow-soft'
                                        }`}
                              >
                                   <div className="animate-marquee whitespace-nowrap text-[13px] font-semibold text-white/90 inline-flex items-center gap-8 shrink-0 px-1" style={{ width: "max-content" }}>
                                        {/* 한 번에 한 블록만 이동하므로 마지막 문장이 왼쪽 끝을 지날 때까지 잘리지 않음 */}
                                        {[...bannerMessages, ...bannerMessages].map((item, i) => (
                                             <span
                                                  key={`${item.id}-${i}`}
                                                  onClick={(e) => { e.stopPropagation(); handleBannerClick(item); }}
                                                  className={`inline-block shrink-0 ${item.targetTab ? 'cursor-pointer hover:text-amber-200 underline decoration-white/30 underline-offset-4' : ''}`}
                                                  title={item.targetTab ? '클릭하면 바로 이동해요' : ''}
                                             >
                                                  {item.message}
                                             </span>
                                        ))}
                                   </div>
                              </div>

                              {/* Add Banner Button (Visible on Hover/Always for accessibility) */}
                              <button
                                   onClick={() => setIsBannerModalOpen(true)}
                                   className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-gold text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10"
                                   title="배너 등록하기 (500온)"
                              >
                                   <Megaphone className="w-4 h-4" />
                              </button>
                         </div>

                         {
                              isBannerModalOpen && (
                                   <Suspense fallback={null}>
                                        <BannerWriteModal
                                             onClose={() => setIsBannerModalOpen(false)}
                                             onSubmit={handleBannerSubmit}
                                             userBeanCount={beanCount}
                                        />
                                   </Suspense>
                              )
                         }


                         {/* Content Feed */}
                         <ErrorBoundary>
                              <Suspense fallback={
                                   <div className="flex flex-col items-center justify-center p-20">
                                        <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-4" />
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
                                                  <section className="rounded-card border border-surface-border bg-white p-4 shadow-soft md:p-5">
                                                       <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                                                            <div>
                                                                 <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-light px-3 py-1 text-[11px] font-black text-brand-accent">
                                                                      <MapPin className="h-3.5 w-3.5" />
                                                                      오늘의 강남온
                                                                 </div>
                                                                 <h1 className="text-xl font-black leading-tight text-brand-ink [word-break:keep-all] md:text-2xl">
                                                                      오늘 강남에서 뭐 할까?
                                                                 </h1>
                                                                 <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                                                                      지금 필요한 강남 생활 정보를 빠르게 고르세요.
                                                                 </p>
                                                            </div>
                                                            <button
                                                                 onClick={() => { setCreateModalCategory('gathering'); setIsCreateModalOpen(true); }}
                                                                 className="min-h-[40px] rounded-xl bg-brand px-4 text-sm font-black text-white shadow-soft transition-all hover:bg-brand-dark active:scale-[0.98]"
                                                            >
                                                                 모임 개설하기
                                                            </button>
                                                       </div>

                                                       <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                                                            <div className="space-y-3">
                                                                 <div className="grid gap-2 sm:grid-cols-4">
                                                                      {[
                                                                           { title: '미니홈피', desc: 'BGM/방명록', icon: User, action: () => handleOpenMinihome(), tone: 'bg-sky-50 text-sky-800' },
                                                                           { title: '동창 찾기', desc: '아이러브스쿨', icon: BookOpen, action: () => handleTabChange('school_find'), tone: 'bg-amber-50 text-amber-800' },
                                                                           { title: '밥친구', desc: '근처 약속', icon: Utensils, action: () => handleTabChange('home'), tone: 'bg-rose-50 text-rose-800' },
                                                                           { title: '강남소식', desc: '구청 이슈', icon: Newspaper, action: () => handleTabChange('news'), tone: 'bg-emerald-50 text-emerald-800' },
                                                                      ].map((item) => {
                                                                           const Icon = item.icon;
                                                                           return (
                                                                                <button
                                                                                     key={item.title}
                                                                                     type="button"
                                                                                     onClick={item.action}
                                                                                     className="rounded-xl border border-surface-border bg-white p-3 text-left transition-all hover:border-brand-gold/30 hover:bg-surface-muted"
                                                                                >
                                                                                     <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${item.tone}`}>
                                                                                          <Icon className="h-4 w-4" />
                                                                                     </div>
                                                                                     <h2 className="text-sm font-black text-brand-ink">{item.title}</h2>
                                                                                     <p className="mt-0.5 text-[11px] font-bold text-slate-400">{item.desc}</p>
                                                                                </button>
                                                                           );
                                                                      })}
                                                                 </div>

                                                                 <div className="grid gap-3 md:grid-cols-2">
                                                                      <div className="rounded-2xl border border-surface-border bg-surface-muted p-4">
                                                                           <div className="mb-3 flex items-center justify-between">
                                                                                <h3 className="text-sm font-black text-brand-ink">오늘 뜨는 모임</h3>
                                                                                <button onClick={() => handleTabChange('wine')} className="text-[11px] font-black text-brand-accent">더보기</button>
                                                                           </div>
                                                                           <div className="space-y-2">
                                                                                {meetingItems.slice(0, 3).map((item) => (
                                                                                     <button key={item.id} type="button" onClick={() => handleTabChange(item.originalType || 'wine')} className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-left">
                                                                                          <div className="min-w-0">
                                                                                               <p className="truncate text-xs font-black text-brand-ink">{item.title}</p>
                                                                                               <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{item.location}</p>
                                                                                          </div>
                                                                                          <span className="shrink-0 text-[11px] font-black text-brand-accent">{item.participants}/{item.maxParticipants}</span>
                                                                                     </button>
                                                                                ))}
                                                                           </div>
                                                                      </div>

                                                                      <div className="rounded-2xl border border-surface-border bg-white p-4">
                                                                           <h3 className="mb-3 text-sm font-black text-brand-ink">내 커뮤니티</h3>
                                                                           <div className="grid grid-cols-3 gap-2">
                                                                                <button onClick={() => handleOpenMinihome()} className="rounded-xl bg-sky-50 p-3 text-center">
                                                                                     <p className="text-base font-black text-sky-900">BGM</p>
                                                                                     <p className="text-[10px] font-bold text-sky-500">미니홈피</p>
                                                                                </button>
                                                                                <button onClick={() => handleTabChange('school_find')} className="rounded-xl bg-amber-50 p-3 text-center">
                                                                                     <p className="text-base font-black text-amber-900">동창</p>
                                                                                     <p className="text-[10px] font-bold text-amber-600">찾기</p>
                                                                                </button>
                                                                                <button onClick={() => handleTabChange('news')} className="rounded-xl bg-emerald-50 p-3 text-center">
                                                                                     <p className="text-base font-black text-emerald-900">소식</p>
                                                                                     <p className="text-[10px] font-bold text-emerald-600">강남구</p>
                                                                                </button>
                                                                           </div>
                                                                           <div className="mt-3 rounded-xl bg-surface-muted px-3 py-2">
                                                                                <p className="text-[11px] font-bold text-slate-400">추천 동선</p>
                                                                                <p className="mt-1 text-xs font-black text-brand-ink">미니홈피 꾸미기 → 파도타기 → 방명록 남기기</p>
                                                                           </div>
                                                                      </div>
                                                                 </div>
                                                            </div>

                                                            <div className="min-h-[250px] rounded-2xl border border-surface-border bg-surface-muted p-3">
                                                                 <KakaoMap
                                                                      latitude={37.4979}
                                                                      longitude={127.0276}
                                                                      level={4}
                                                                      label="강남역 중심"
                                                                      address="서울 강남구 강남대로 지하396"
                                                                      style={{ width: '100%', height: '100%' }}
                                                                 />
                                                            </div>
                                                       </div>
                                                  </section>
                                                  <ILoveSchool />
                                                  <DiningCompanion />
                                                  <MeetingFeed items={meetingItems} />
                                                  <UsedMarket items={marketItems} />
                                             </>
                                        )}

                                        {activeTab === 'news' && <GangnamNews />}

                                        {/* NEW: OWNER'S NOTE TAB (Previously Local Biz) */}
                                        {activeTab === 'local_biz' && (
                                             <OwnersNote
                                                  onOpenMinihome={handleOpenMinihome}
                                                  user={user}
                                                  beanCount={beanCount}
                                                  setBeanCount={setBeanCount}
                                                  refreshKey={ownersNoteRefreshKey}
                                                  onRequestCreate={() => { setCreateModalCategory('event'); setIsCreateModalOpen(true); }}
                                             />
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
                                                       <button onClick={() => { setCreateModalCategory(activeTab); setIsCreateModalOpen(true); }} className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-800 border border-transparent hover:border-amber-200 transition-colors">
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
                                                       <button onClick={() => { setCreateModalCategory('gathering'); setIsCreateModalOpen(true); }} className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-800 border border-transparent hover:border-amber-200 transition-colors">
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

                                        {/* ADMIN TAB — 관리자 계정이 아니면 데이터가 아예 렌더되지 않음 */}
                                        {activeTab === 'admin' && (
                                             isAdmin ? (
                                                  <AdminDashboard onlineUsersCount={onlineUsersCount} />
                                             ) : (
                                                  <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                                                       <Lock className="w-10 h-10 mb-3 text-gray-300" />
                                                       <p className="font-bold">관리자만 접근할 수 있는 페이지예요.</p>
                                                  </div>
                                             )
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
                                                       <button onClick={() => setIsMiniHomeOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all">
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
                    <div className="w-[320px] 2xl:w-[350px] h-screen sticky top-0 hidden 2xl:block overflow-y-auto overscroll-contain no-scrollbar shrink-0 pt-5">
                         {/* Pass bean stats and dark mode flag */}
                         <RightPanel
                              onOpenMinihome={() => handleOpenMinihome()}
                              onOpenRewardCenter={() => setIsRewardCenterOpen(true)}
                              onOpenAvatarCustomizer={() => setIsAvatarModalOpen(true)}
                              isDark={activeTab === 'romance'}
                              beanCount={beanCount}
                              setBeanCount={setBeanCount}
                              user={user}
                              onLoginSuccess={refreshUser}
                              onLogout={handleLogout}
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
                              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400 font-black text-xs">G</div>
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
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-slate-900 text-white hover:bg-slate-800'}`}
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
                                        <AuthWidget onLoginSuccess={() => { refreshUser(); setIsMobileLoginOpen(false); }} />
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
                                             isAdmin={isAdmin}
                                        />
                                   </div>
                              </div>
                         </div>
                    )
               }

               {/* Global Components */}
               <Suspense fallback={null}>
                    {
                         passwordRecovery && (
                              <ResetPasswordModal
                                   userId={passwordRecovery.userId}
                                   secret={passwordRecovery.secret}
                                   onDone={() => { setPasswordRecovery(null); setIsMobileLoginOpen(true); }}
                              />
                         )
                    }
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
                                   initialCategory={createModalCategory}
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
