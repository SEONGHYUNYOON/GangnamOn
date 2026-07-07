import React, { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Query, Permission, Role } from '../lib/appwrite';
import { Heart, X, MessageCircle, MapPin, Zap, Star, Lock, Send, Sparkles, Plus, Users } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import LightningMeetupModal from './LightningMeetupModal';

// 실제 유저 풀이 이 인원수보다 적을 때만, 부족한 만큼 샘플 프로필로 채웁니다.
// 샘플 프로필은 실제 매칭이 되지 않고 좋아요/슈퍼라이크도 온이 차감되지 않습니다.
const MIN_ROMANCE_POOL_SIZE = 6;

// --- Sub Component: Individual Card ---
const SwipeableCard = React.forwardRef(({ profile, onAction, dragConstraints = { left: 0, right: 0 } }, ref) => {
     // Motion values for drag gestures
     const x = useMotionValue(0);
     const rotate = useTransform(x, [-200, 200], [-30, 30]); // Rotate while dragging
     const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]); // Fade out on exit

     // Background color change feedback
     const bg = useTransform(x, [-150, 0, 150], ["#ef4444", "#ffffff", "#3b82f6"]);

     const handleDragEnd = (event, info) => {
          if (info.offset.x > 100) {
               onAction('like');
          } else if (info.offset.x < -100) {
               onAction('pass');
          }
     };

     return (
          <motion.div
               ref={ref}
               drag="x"
               dragConstraints={dragConstraints} // Limit drag area
               style={{ x, rotate, opacity }} // Apply dynamic styles
               onDragEnd={handleDragEnd}
               whileTap={{ cursor: "grabbing" }}
               className="absolute top-0 w-full h-full cursor-grab active:cursor-grabbing origin-bottom"
               initial={{ scale: 0.95, opacity: 0, y: 50 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
               <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white select-none">
                    {/* Image Area */}
                    <div className="h-[85%] relative">
                         <img
                              src={profile.image}
                              alt={profile.name}
                              className="w-full h-full object-cover pointer-events-none"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                         {profile.isSample && (
                              <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-bold text-gray-200 border border-white/20">
                                   샘플 프로필 · 실제 매칭 없음
                              </div>
                         )}

                         {/* Profile Info Overlay */}
                         <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                              <div className="flex items-end gap-2 mb-2">
                                   <h2 className="text-3xl font-bold">{profile.name}</h2>
                                   <span className="text-xl opacity-90 mb-1">{profile.age}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm opacity-90 mb-3">
                                   <MapPin className="w-4 h-4 text-rose-500" />
                                   <span>{profile.location}</span>
                                   <span className="mx-1">|</span>
                                   <span>{profile.job}</span>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-2">
                                   {profile.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium"> # {tag} </span>
                                   ))}
                              </div>
                         </div>
                    </div>

                    {/* Action Buttons Area (Bottom) */}
                    <div className="h-[15%] bg-slate-900 flex items-center justify-center gap-6">
                         <button onClick={() => onAction('pass')} className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                              <X className="w-6 h-6" />
                         </button>
                         <button onClick={() => onAction('superlike')} className="p-4 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform">
                              <Star className="w-6 h-6 fill-white" />
                         </button>
                         <button onClick={() => onAction('like')} className="p-4 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:scale-110 transition-transform relative">
                              <Heart className="w-7 h-7 fill-white" />
                              <span className="absolute -top-2 -right-2 bg-white text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-rose-100 shadow-sm">
                                   {profile.isSample ? '무료' : '-5온'}
                              </span>
                         </button>
                         <button className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                              <Send className="w-6 h-6" />
                         </button>
                    </div>
               </div>
          </motion.div>
     );
});


// --- Main Component ---
const GangnamRomance = ({ beanCount, onHeartClick, onOpenRewardCenter, user }) => {
     // State
     const [currentCardIndex, setCurrentCardIndex] = useState(0);
     const [exitDirection, setExitDirection] = useState(null); // 'like', 'pass'
     const [floatingTexts, setFloatingTexts] = useState([]);
     const [showLowBeanModal, setShowLowBeanModal] = useState(false);
     const [isMatch, setIsMatch] = useState(false);
     const [realProfiles, setRealProfiles] = useState([]);
     const [lightningPosts, setLightningPosts] = useState([]);
     const [isLightningModalOpen, setIsLightningModalOpen] = useState(false);
     const [joiningLightningId, setJoiningLightningId] = useState(null);

     // Refs for cleanup
     const cleanupRef = React.useRef(null);

     // Mock Profiles (강남권)
     const mockProfiles = [
          {
               id: 1, name: '역삼불주먹', age: 26, gender: 'female', location: '역삼동', mbti: 'ENFP', job: '프리랜서 디자이너', tags: ['#운동하는여자', '#맛집탐방', '#맥주러버'],
               image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 3, name: '요가파이어', age: 26, gender: 'female', location: '논현동', mbti: 'INFJ', job: '필라테스 강사', tags: ['#요가', '#건강식', '#아침형인간'],
               image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 5, name: '꽃을든여자', age: 29, gender: 'female', location: '청담동', mbti: 'ISFP', job: '플로리스트', tags: ['#꽃꽂이', '#전시회', '#감성카페'],
               image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 7, name: '그림그리는냥', age: 25, gender: 'female', location: '서초동', mbti: 'INFP', job: '일러스트레이터', tags: ['#고양이', '#드로잉', '#집순이'],
               image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 9, name: '여행러버', age: 32, gender: 'female', location: '강남역', mbti: 'ESFJ', job: '승무원', tags: ['#여행', '#와인', '#소통왕'],
               image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 11, name: '강남맛집탐험대', age: 27, gender: 'female', location: '삼성동', mbti: 'ESTP', job: '마케터', tags: ['#맛집투어', '#핫플', '#인생샷'],
               image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600&h=800'
          },
          // Males
          {
               id: 2, name: '역삼사랑꾼', age: 29, gender: 'male', location: '역삼 로터리', mbti: 'ISTJ', job: '공무원', tags: ['#영화감상', '#드라이브', '#조용한카페'],
               image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 4, name: '강남보안관', age: 31, gender: 'male', location: '신사동', mbti: 'ESTJ', job: '헬스 트레이너', tags: ['#헬스', '#단백질', '#자기관리'],
               image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 6, name: '책읽는남자', age: 28, gender: 'male', location: '코엑스', mbti: 'INTJ', job: '사서', tags: ['#독서', '#산책', '#클래식'],
               image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 8, name: '캠핑고수', age: 34, gender: 'male', location: '압구정동', mbti: 'ISTP', job: '사업가', tags: ['#캠핑', '#낚시', '#불멍'],
               image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 10, name: '커피프린스', age: 27, gender: 'male', location: '강남역', mbti: 'ENTP', job: '바리스타', tags: ['#커피', '#라떼아트', '#카페투어'],
               image: 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&q=80&w=600&h=800'
          },
          {
               id: 12, name: '개발자킴', age: 30, gender: 'male', location: '역삼1동', mbti: 'INTP', job: '개발자', tags: ['#코딩', '#얼리어답터', '#게임'],
               image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=600&h=800'
          }
     ];

     const [allProfiles, setAllProfiles] = useState(mockProfiles);

     // Fetch Real Profiles
     useEffect(() => {
          const fetchProfiles = async () => {
               if (!user) return;
               try {
                    // 이미 상호작용(좋아요/패스)한 상대는 제외 — Appwrite에는 "not in" 쿼리가 없어
                    // 클라이언트에서 걸러냅니다 (커뮤니티 규모상 충분히 가벼운 처리)
                    const interactionsRes = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.romanceInteractions,
                         queries: [Query.equal('actorId', user.id), Query.limit(200)],
                    });
                    const interactedIds = interactionsRes.documents.map(i => i.targetId);

                    const candidatesRes = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         queries: [Query.limit(50)],
                    });
                    const candidates = candidatesRes.documents.filter(p => p.$id !== user.id && !interactedIds.includes(p.$id));

                    const formattedCandidates = candidates.map(p => ({
                         id: p.$id,
                         name: p.fullName || p.username || '알 수 없음',
                         age: p.birthYear ? new Date().getFullYear() - p.birthYear : 25,
                         gender: p.gender || 'unknown',
                         location: p.location || '강남',
                         mbti: p.mbti || 'MBTI',
                         job: p.job || '강남 주민',
                         tags: p.interests || ['#신비주의'],
                         image: p.avatarUrl || 'https://via.placeholder.com/600x800'
                    }));
                    setRealProfiles(formattedCandidates);
               } catch (error) {
                    console.error('로맨스 프로필 로딩 실패:', error);
               }
          };
          fetchProfiles();
     }, [user]);

     // 실제 유저 풀이 충분하면 샘플 프로필은 아예 섞지 않습니다.
     // 부족할 때만, 모자란 만큼만 샘플로 채우고 isSample 플래그를 붙여
     // (1) UI에 "샘플" 배지를 보여주고 (2) 좋아요해도 온이 차감되지 않게 합니다.
     // mockProfiles는 앞 6개가 전부 여성, 뒤 6개가 전부 남성이라 단순히 앞에서부터
     // 자르면 한쪽 성별만 샘플로 채워질 수 있습니다. 성별 균형을 맞춰서 채웁니다.
     const samplesNeeded = Math.max(0, MIN_ROMANCE_POOL_SIZE - realProfiles.length);
     const perGenderNeeded = Math.ceil(samplesNeeded / 2);
     const sampleProfiles = [
          ...mockProfiles.filter(p => p.gender === 'female').slice(0, perGenderNeeded),
          ...mockProfiles.filter(p => p.gender === 'male').slice(0, perGenderNeeded),
     ].map(p => ({ ...p, isSample: true }));

     // Merge Real + Samples
     const displayPool = [...realProfiles, ...sampleProfiles];
     const myGender = user?.user_metadata?.gender;
     const targetGender = myGender === 'female' ? 'male' : 'female';
     const filteredDisplay = displayPool.filter(p => {
          if (typeof p.id === 'string') return true;
          return p.gender === targetGender;
     });
     const safeDisplayProfiles = filteredDisplay.length > 0
          ? filteredDisplay
          : mockProfiles.map(p => ({ ...p, isSample: true }));

     // Current Logic
     const currentProfile = safeDisplayProfiles[currentCardIndex % safeDisplayProfiles.length];
     const nextProfile = safeDisplayProfiles[(currentCardIndex + 1) % safeDisplayProfiles.length];

     // 즉석 모임 ("지금 바로 만나요") — posts 컬렉션을 type: 'gangnam_lightning'으로 재사용합니다.
     const fetchLightningPosts = async () => {
          try {
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    queries: [
                         Query.equal('type', 'gangnam_lightning'),
                         Query.orderDesc('$createdAt'),
                         Query.limit(8),
                    ],
               });
               const now = Date.now();
               const active = res.documents.filter(d => !d.expiresAt || new Date(d.expiresAt).getTime() > now);
               setLightningPosts(active);
          } catch (err) {
               console.error('즉석모임 로딩 실패:', err);
          }
     };

     useEffect(() => {
          fetchLightningPosts();
     }, []);

     const handleJoinLightning = async (item) => {
          if (!user || joiningLightningId) return;
          if ((item.currentParticipants ?? 0) >= (item.maxParticipants ?? 4)) return;

          setJoiningLightningId(item.$id);
          try {
               const updated = await databases.updateDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    documentId: item.$id,
                    data: { currentParticipants: (item.currentParticipants ?? 0) + 1 },
               });
               setLightningPosts(prev => prev.map(p => (p.$id === item.$id ? updated : p)));
          } catch (err) {
               console.error('즉석모임 참여 실패:', err);
          } finally {
               setJoiningLightningId(null);
          }
     };

     const formatTimeLeft = (expiresAt) => {
          if (!expiresAt) return '';
          const diffMs = new Date(expiresAt).getTime() - Date.now();
          if (diffMs <= 0) return '마감';
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          return hours > 0 ? `${hours}시간 ${mins}분 남음` : `${mins}분 남음`;
     };

     // 좋아요/슈퍼라이크 비용 (실제 차감/잔액 검증은 서버 economy Function에서 수행됩니다.
     // 여기 값은 클릭 전에 "온이 부족한지" 미리 안내하는 화면 표시용입니다.)
     const ROMANCE_COSTS = { like: 5, superlike: 10, pass: 0 };

     // Main Action Handler
     const handleAction = async (type) => {
          const cost = ROMANCE_COSTS[type] ?? 0;
          // Clear any existing cleanup timer to prevent premature dismissal
          if (cleanupRef.current) clearTimeout(cleanupRef.current);

          if (type === 'pass') {
               setExitDirection('pass');
               if (user && typeof currentProfile.id === 'string') {
                    try {
                         await databases.createDocument({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.romanceInteractions,
                              documentId: ID.unique(),
                              data: { actorId: user.id, targetId: currentProfile.id, actionType: 'pass' },
                              permissions: [
                                   Permission.read(Role.user(user.id)),
                                   Permission.read(Role.user(currentProfile.id)),
                              ],
                         });
                    } catch (err) {
                         console.error('pass 기록 실패:', err);
                    }
               }
               setCurrentCardIndex(prev => prev + 1);
               // Auto dismiss feedback
               cleanupRef.current = setTimeout(() => setExitDirection(null), 500);
               return;
          }

          const isSample = !!currentProfile.isSample;

          if (!isSample) {
               if (beanCount < cost) {
                    setShowLowBeanModal(true);
                    return;
               }

               // 서버(economy Function)가 실제 차감과 잔액을 검증합니다.
               const spendResult = await onHeartClick(type === 'superlike' ? 'romance_superlike' : 'romance_like');
               if (!spendResult?.success) {
                    setShowLowBeanModal(true);
                    return;
               }
          }
          // 샘플 프로필(실제 유저가 부족할 때 채워지는 목업)은 실제 매칭이 될 수 없으므로
          // 온을 차감하지 않습니다. 사용자가 헛돈을 쓰는 일이 없도록 하는 안전장치입니다.

          const id = Date.now();
          setFloatingTexts(prev => [...prev, { id, text: isSample ? '샘플 (무료)' : `-${cost} 온` }]);
          setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 1000); // Cleanup floating text

          setExitDirection(type); // KEY: this triggers the 'exit' direction in AnimatePresence

          if (type === 'like' || type === 'superlike') {
               if (user && typeof currentProfile.id === 'string') {
                    try {
                         await databases.createDocument({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.romanceInteractions,
                              documentId: ID.unique(),
                              data: { actorId: user.id, targetId: currentProfile.id, actionType: type },
                              permissions: [
                                   Permission.read(Role.user(user.id)),
                                   Permission.read(Role.user(currentProfile.id)),
                              ],
                         });

                         const mutualRes = await databases.listDocuments({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.romanceInteractions,
                              queries: [
                                   Query.equal('actorId', currentProfile.id),
                                   Query.equal('targetId', user.id),
                                   Query.equal('actionType', ['like', 'superlike']),
                                   Query.limit(1),
                              ],
                         });

                         if (mutualRes.documents.length > 0) {
                              setIsMatch(true); // Trigger Match Modal
                              const room = await databases.createDocument({
                                   databaseId: DATABASE_ID,
                                   collectionId: COLLECTIONS.chatRooms,
                                   documentId: ID.unique(),
                                   data: { type: 'dm' },
                                   permissions: [
                                        Permission.read(Role.user(user.id)),
                                        Permission.read(Role.user(currentProfile.id)),
                                   ],
                              });
                              await Promise.all([
                                   databases.createDocument({
                                        databaseId: DATABASE_ID,
                                        collectionId: COLLECTIONS.chatParticipants,
                                        documentId: ID.unique(),
                                        data: { roomId: room.$id, userId: user.id },
                                        permissions: [Permission.read(Role.user(user.id)), Permission.read(Role.user(currentProfile.id))],
                                   }),
                                   databases.createDocument({
                                        databaseId: DATABASE_ID,
                                        collectionId: COLLECTIONS.chatParticipants,
                                        documentId: ID.unique(),
                                        data: { roomId: room.$id, userId: currentProfile.id },
                                        permissions: [Permission.read(Role.user(user.id)), Permission.read(Role.user(currentProfile.id))],
                                   }),
                              ]);
                              return; // Don't slide card yet if matched
                         }
                    } catch (err) {
                         console.error('로맨스 상호작용 실패:', err);
                    }
               }
               setCurrentCardIndex(prev => prev + 1);
               // Auto dismiss feedback
               cleanupRef.current = setTimeout(() => setExitDirection(null), 600);
          }
     };

     return (
          <div className="bg-gray-900 min-h-screen text-white rounded-3xl overflow-hidden shadow-2xl relative font-sans">
               {/* Backgrounds */}
               <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/50 to-transparent pointer-events-none"></div>
               <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-600/30 rounded-full blur-3xl pointer-events-none"></div>

               {/* Impactful Floating Cost Animation */}
               <AnimatePresence>
                    {floatingTexts.map(ft => (
                         <motion.div
                              key={ft.id}
                              initial={{ opacity: 0, y: 100, scale: 0.5 }}
                              animate={{ opacity: [0, 1, 0], y: -50, scale: [0.5, 1.5, 1.2] }}
                              transition={{ duration: 0.8, times: [0, 0.2, 1], ease: "easeOut" }}
                              className="absolute inset-x-0 top-[35%] z-[100] flex justify-center pointer-events-none"
                         >
                              <div className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" style={{ textShadow: '0 0 5px rgba(0,0,0,0.5)' }}>
                                   {ft.text}
                              </div>
                         </motion.div>
                    ))}
               </AnimatePresence>

               {/* Impactful Feedback Overlay */}
               <AnimatePresence>
                    {exitDirection === 'like' && (
                         <motion.div
                              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                              animate={{ opacity: 1, scale: 1.1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)", transition: { duration: 0.2 } }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                         >
                              <div className="bg-pink-500 text-white px-10 py-6 rounded-3xl text-4xl font-black shadow-2xl backdrop-blur-sm border-4 border-white/20">😍 심쿵!</div>
                         </motion.div>
                    )}
                    {exitDirection === 'superlike' && (
                         <motion.div
                              initial={{ opacity: 0, scale: 0.5, rotate: 20 }}
                              animate={{ opacity: 1, scale: 1.1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)", transition: { duration: 0.2 } }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                         >
                              <div className="bg-indigo-600 text-white px-10 py-6 rounded-3xl text-4xl font-black shadow-2xl backdrop-blur-sm border-4 border-yellow-300">⭐ 슈퍼 라이크!</div>
                         </motion.div>
                    )}
                    {exitDirection === 'pass' && (
                         <motion.div
                              initial={{ opacity: 0, x: -100 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                         >
                              <div className="bg-gray-700/90 text-gray-300 px-8 py-4 rounded-full text-2xl font-bold shadow-xl backdrop-blur-sm">PASS 👋</div>
                         </motion.div>
                    )}
               </AnimatePresence>


               {/* Low Bean Modal */}
               {showLowBeanModal && (
                    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                         <div className="bg-gray-800 rounded-3xl p-6 w-full max-w-sm text-center border border-gray-700 shadow-2xl">
                              <div className="text-4xl mb-4">😭</div>
                              <h3 className="text-xl font-bold text-white mb-2">앗! 온이 부족해요</h3>
                              <p className="text-gray-400 text-sm mb-6">마음에 드는 이성을 놓치지 않으려면<br />온을 충전해야 해요!</p>
                              <div className="flex gap-3">
                                   <button onClick={() => setShowLowBeanModal(false)} className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 font-bold text-sm">취소</button>
                                   <button onClick={() => { setShowLowBeanModal(false); onOpenRewardCenter(); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20">온 벌러가기 ⚡</button>
                              </div>
                         </div>
                    </div>
               )}

               {/* Match Modal */}
               {isMatch && (
                    <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
                         <div className="text-center animate-in zoom-in-50 duration-500">
                              <div className="text-6xl mb-4 relative inline-block">💘<Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-yellow-400 animate-pulse" /></div>
                              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4 drop-shadow-sm">It's a Match!</h2>
                              <p className="text-white text-lg md:text-xl mb-8 font-medium"><span className="text-pink-400 font-bold">{currentProfile.name}</span>님도 회원님을 좋아해요!</p>
                              <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                                   <button className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-white shadow-xl shadow-purple-500/30 hover:scale-105 transition-transform flex items-center justify-center gap-2" onClick={() => { setIsMatch(false); setCurrentCardIndex(prev => prev + 1); setExitDirection(null); }}><MessageCircle className="w-5 h-5" /> 채팅 바로 시작하기</button>
                                   <button onClick={() => { setIsMatch(false); setCurrentCardIndex(prev => prev + 1); setExitDirection(null); }} className="w-full py-4 bg-gray-800 rounded-2xl font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">계속 구경하기</button>
                              </div>
                         </div>
                    </div>
               )}

               <div className="relative z-10 p-4 md:p-8 flex flex-col items-center">
                    <div className="text-center mb-6">
                         <h2 className="text-xl md:text-2xl font-black mb-1 animate-in slide-in-from-top-4 duration-500"><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">오늘 밤, 로맨틱한 만남? 🥂</span></h2>
                         <p className="text-gray-400 text-xs md:text-sm">보유 중인 온으로 <span className="text-yellow-400 font-bold">{Math.floor(beanCount / 5)}번</span> 더 심쿵할 수 있어요!</p>
                    </div>

                    <div className="w-full max-w-2xl flex flex-col gap-10">
                         <div className="flex flex-col items-center w-full h-[600px] relative">
                              {/* Background Card (Next) */}
                              <div key={nextProfile.id} className="absolute top-0 w-full aspect-[4/5] h-full rounded-[2.5rem] overflow-hidden border border-white/5 bg-gray-800 scale-[0.93] translate-y-4 opacity-60 z-0 select-none pointer-events-none transition-transform duration-300">
                                   <img src={nextProfile.image} alt="Next" className="w-full h-full object-cover grayscale-[0.5]" />
                                   <div className="absolute inset-0 bg-black/50"></div>
                              </div>

                              {/* Active Card (Swipeable) */}
                              <AnimatePresence custom={exitDirection} mode="popLayout">
                                   <SwipeableCard
                                        key={currentProfile.id}
                                        profile={currentProfile}
                                        onAction={handleAction}
                                        dragConstraints={{ left: 0, right: 0 }}
                                   />
                              </AnimatePresence>
                         </div>

                         {/* List */}
                         <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
                              <div className="flex items-center justify-between mb-2 px-2">
                                   <h3 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />지금 바로 만나요</h3>
                                   <button
                                        onClick={() => setIsLightningModalOpen(true)}
                                        className="text-sm text-gray-300 hover:text-white flex items-center gap-1 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full border border-white/10"
                                   >
                                        <Plus className="w-3.5 h-3.5" /> 모임 만들기
                                   </button>
                              </div>
                              {lightningPosts.length === 0 ? (
                                   <div className="bg-gray-800/50 rounded-2xl p-6 text-center border border-white/5">
                                        <p className="text-sm text-gray-400">아직 등록된 즉석 모임이 없어요.</p>
                                        <p className="text-xs text-gray-500 mt-1">가장 먼저 모임을 만들어보세요!</p>
                                   </div>
                              ) : (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {lightningPosts.map(item => {
                                             const isFull = (item.currentParticipants ?? 0) >= (item.maxParticipants ?? 4);
                                             return (
                                                  <div key={item.$id} className="bg-gray-800/80 rounded-2xl p-4 hover:bg-gray-700 transition-all flex items-center justify-between group border border-white/5 hover:border-purple-500/30">
                                                       <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center border border-white/5 shrink-0"><Zap className="w-6 h-6 text-gray-400 group-hover:text-yellow-400 transition-colors" /></div>
                                                            <div className="min-w-0">
                                                                 <h4 className="font-bold text-gray-100 text-sm mb-0.5 truncate">{item.title}</h4>
                                                                 <div className="flex gap-2 text-xs text-gray-500 flex-wrap">
                                                                      <span className="text-pink-400 font-medium">{item.locationName}</span><span>|</span><span>{item.content}</span>
                                                                 </div>
                                                                 <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                                                                      <Users className="w-3 h-3" /> {item.currentParticipants ?? 0}/{item.maxParticipants ?? 4}명
                                                                      <span>·</span> {formatTimeLeft(item.expiresAt)}
                                                                 </div>
                                                            </div>
                                                       </div>
                                                       <button
                                                            onClick={() => handleJoinLightning(item)}
                                                            disabled={isFull || joiningLightningId === item.$id}
                                                            className="shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-400 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
                                                       >
                                                            {isFull ? '마감' : joiningLightningId === item.$id ? '참여 중...' : '참여하기'}
                                                       </button>
                                                  </div>
                                             );
                                        })}
                                   </div>
                              )}
                              <div className="mt-4 bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-2xl p-6 border border-white/10 relative overflow-hidden flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform" onClick={onOpenRewardCenter}>
                                   <div className="relative z-10"><h4 className="font-bold text-white text-lg mb-1">⚡ 온 충전하고 로맨스 시작!</h4><p className="text-sm text-pink-200">매일 무료 충전 혜택 받기 &gt;</p></div><div className="relative z-10 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">⚡</div>
                              </div>
                         </div>
                    </div>
               </div>

               {isLightningModalOpen && (
                    <LightningMeetupModal
                         user={user}
                         onClose={() => setIsLightningModalOpen(false)}
                         onCreated={(doc) => setLightningPosts(prev => [doc, ...prev])}
                    />
               )}
          </div>
     );
};

export default GangnamRomance;
