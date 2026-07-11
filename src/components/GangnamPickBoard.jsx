import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Phone, ExternalLink, Sparkles, Coffee, Heart, Eye, Loader2, X, Map, LayoutGrid, UtensilsCrossed, Palette, Puzzle, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query, callEconomy } from '../lib/appwrite';
import { FeedError, SectionSkeleton } from './FeedStates';

const REGIONS = ['강남 전체', '역삼동', '신사동', '청담동', '삼성동', '논현동', '압구정', '강남역'];
const PICK_REFRESH_MS = 600000;

const formatPickTime = (iso) => {
     if (!iso) return '';
     return new Date(iso).toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
     });
};

const GROUP_TABS = [
     { key: 'all', label: '전체', icon: LayoutGrid },
     { key: 'restaurant', label: '맛집', icon: UtensilsCrossed },
     { key: 'cafe', label: '카페', icon: Coffee },
     { key: 'culture', label: '문화·예술', icon: Palette },
     { key: 'hobby', label: '취미', icon: Puzzle },
     { key: 'sport', label: '운동', icon: Dumbbell },
];

const GROUP_META = {
     restaurant: { label: '맛집', icon: UtensilsCrossed, className: 'bg-amber-50 text-amber-700' },
     cafe: { label: '카페', icon: Coffee, className: 'bg-emerald-50 text-emerald-700' },
     culture: { label: '문화·예술', icon: Palette, className: 'bg-violet-50 text-violet-700' },
     hobby: { label: '취미', icon: Puzzle, className: 'bg-sky-50 text-sky-700' },
     sport: { label: '운동', icon: Dumbbell, className: 'bg-rose-50 text-rose-700' },
};

const PlaceholderThumb = ({ className = '' }) => (
     <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-light via-[#f3ead9] to-[#ecdfc4] text-brand-accent/70 ${className}`}>
          <Coffee className="h-9 w-9" strokeWidth={1.5} />
          <span className="text-[11px] font-bold tracking-wide">사진 준비중</span>
     </div>
);

const LikeButton = ({ liked, count, onToggle }) => (
     <button
          onClick={(e) => {
               e.stopPropagation();
               onToggle();
          }}
          className={`flex items-center gap-1 transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
     >
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500' : ''}`} />
          {count}
     </button>
);

const PickCard = ({ post, onOpen, liked, onToggleLike }) => {
     const images = post.imageUrls?.length ? post.imageUrls : [];
     const [activeImg, setActiveImg] = useState(0);
     const thumb = images[activeImg];
     const extraCount = Math.max(0, images.length - 1);
     const moveImage = (event, direction) => {
          event.stopPropagation();
          if (images.length < 2) return;
          setActiveImg((current) => (current + direction + images.length) % images.length);
     };

     return (
          <div
               onClick={() => onOpen(post)}
               className="group cursor-pointer overflow-hidden rounded-2xl border border-brand-gold/15 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg"
          >
               {/* Image */}
               <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-light">
                    {thumb ? (
                         <img
                              src={thumb}
                              alt={post.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                         />
                    ) : (
                         <PlaceholderThumb />
                    )}

                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-brand-ink/85 px-2.5 py-1 text-[10px] font-black text-brand-gold shadow-soft backdrop-blur-sm">
                         <Sparkles className="h-3 w-3" />
                         AI 추천
                    </div>

                    {post.placeCategory && (
                         <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-brand-ink shadow-soft backdrop-blur-sm">
                              {post.placeCategory}
                         </div>
                    )}

                    {extraCount > 0 && (
                         <>
                              <button
                                   type="button"
                                   onClick={(event) => moveImage(event, -1)}
                                   className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100"
                                   aria-label="이전 사진"
                              >
                                   <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                   type="button"
                                   onClick={(event) => moveImage(event, 1)}
                                   className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100"
                                   aria-label="다음 사진"
                              >
                                   <ChevronRight className="h-4 w-4" />
                              </button>
                              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                                   {activeImg + 1}/{images.length} · +{extraCount}
                              </div>
                         </>
                    )}
               </div>

               {/* Body */}
               <div className="p-4">
                    {GROUP_META[post.pickGroup] && (
                         <div className={`mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${GROUP_META[post.pickGroup].className}`}>
                              {React.createElement(GROUP_META[post.pickGroup].icon, { className: 'h-3 w-3' })}
                              {GROUP_META[post.pickGroup].label}
                         </div>
                    )}
                    <h3 className="text-base font-black leading-snug text-brand-ink [word-break:keep-all]">
                         {post.title}
                    </h3>

                    <div className="mt-2 space-y-1">
                         <div className="flex items-start gap-1.5 text-xs font-semibold text-slate-500">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent" />
                              <span className="[word-break:keep-all]">{post.placeAddress || post.locationName || '강남'}</span>
                         </div>
                         {post.placePhone && (
                              <a
                                   href={`tel:${post.placePhone}`}
                                   onClick={(e) => e.stopPropagation()}
                                   className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-accent"
                              >
                                   <Phone className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
                                   {post.placePhone}
                              </a>
                         )}
                    </div>

                    <p className="mt-2.5 line-clamp-6 text-sm leading-6 text-slate-600 [word-break:keep-all]">
                         {post.content}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                         <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                              <LikeButton liked={liked} count={post.likesCount} onToggle={onToggleLike} />
                              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.views || 0}</span>
                              <span>{post.time}</span>
                         </div>

                         {post.sourceUrl && (
                              <a
                                   href={post.sourceUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   onClick={(e) => e.stopPropagation()}
                                   className="flex items-center gap-1 text-[11px] font-black text-brand-accent hover:text-brand-ink"
                              >
                                   원문 보기
                                   <ExternalLink className="h-3 w-3" />
                              </a>
                         )}
                    </div>
               </div>
          </div>
     );
};

const PickDetailModal = ({ post, onClose, liked, onToggleLike }) => {
     const [activeImg, setActiveImg] = useState(0);
     const images = post.imageUrls?.length ? post.imageUrls : [];
     const mapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(post.placeAddress || post.title)}`;

     return (
          <div
               className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
               onClick={onClose}
          >
               <div
                    className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-soft-lg"
                    onClick={(e) => e.stopPropagation()}
               >
                    {/* Gallery */}
                    <div className="relative aspect-[4/3] w-full bg-brand-light">
                         {images.length > 0 ? (
                              <img src={images[activeImg]} alt={post.title} className="h-full w-full object-cover" />
                         ) : (
                              <PlaceholderThumb />
                         )}
                         <button
                              onClick={onClose}
                              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                         >
                              <X className="h-4 w-4" />
                         </button>

                         {images.length > 1 && (
                              <>
                                   <button
                                        type="button"
                                        onClick={() => setActiveImg((current) => (current - 1 + images.length) % images.length)}
                                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
                                        aria-label="이전 사진"
                                   >
                                        <ChevronLeft className="h-5 w-5" />
                                   </button>
                                   <button
                                        type="button"
                                        onClick={() => setActiveImg((current) => (current + 1) % images.length)}
                                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
                                        aria-label="다음 사진"
                                   >
                                        <ChevronRight className="h-5 w-5" />
                                   </button>
                                   <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5">
                                        <span className="mr-1 text-[10px] font-black text-white">{activeImg + 1}/{images.length}</span>
                                        {images.map((_, i) => (
                                             <button
                                                  key={i}
                                                  onClick={() => setActiveImg(i)}
                                                  className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                                             />
                                        ))}
                                   </div>
                              </>
                         )}
                    </div>

                    {/* Body */}
                    <div className="p-5">
                         <div className="mb-2 flex flex-wrap items-center gap-1.5">
                              <span className="flex items-center gap-1 rounded-full bg-brand-ink px-2.5 py-1 text-[10px] font-black text-brand-gold">
                                   <Sparkles className="h-3 w-3" />
                                   AI 추천
                              </span>
                              {GROUP_META[post.pickGroup] && (
                                   <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${GROUP_META[post.pickGroup].className}`}>
                                        {React.createElement(GROUP_META[post.pickGroup].icon, { className: 'h-3 w-3' })}
                                        {GROUP_META[post.pickGroup].label}
                                   </span>
                              )}
                              {post.placeCategory && (
                                   <span className="rounded-full bg-brand-light px-2.5 py-1 text-[10px] font-bold text-brand-accent">
                                        {post.placeCategory}
                                   </span>
                              )}
                         </div>

                         <h2 className="text-xl font-black leading-snug text-brand-ink [word-break:keep-all]">
                              {post.title}
                         </h2>

                         <div className="mt-3 space-y-2 rounded-xl bg-surface-muted p-3">
                              <a
                                   href={mapUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="flex items-start gap-2 text-sm font-semibold text-slate-600 hover:text-brand-accent"
                              >
                                   <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                                   <span className="[word-break:keep-all]">{post.placeAddress || post.locationName || '강남'}</span>
                                   <Map className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent/60" />
                              </a>
                              {post.placePhone && (
                                   <a href={`tel:${post.placePhone}`} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-accent">
                                        <Phone className="h-4 w-4 shrink-0 text-brand-accent" />
                                        {post.placePhone}
                                   </a>
                              )}
                         </div>

                         <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700 [word-break:keep-all]">
                              {post.content}
                         </p>

                         <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-400">
                              <LikeButton liked={liked} count={post.likesCount} onToggle={onToggleLike} />
                              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />조회 {post.views || 0}</span>
                              {post.time && <span>{post.time}</span>}
                         </div>

                         <div className="mt-5 flex items-center gap-2">
                              {post.sourceUrl && (
                                   <a
                                        href={post.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand py-3 text-sm font-black text-white shadow-soft hover:bg-brand-dark"
                                   >
                                        원문 블로그에서 자세히 보기
                                        <ExternalLink className="h-3.5 w-3.5" />
                                   </a>
                              )}
                         </div>

                         <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                              AI가 네이버 블로그 후기를 바탕으로 자동으로 정리한 소개예요. 실제 방문 전 원문과 최신 정보를 확인해주세요.
                         </p>
                    </div>
               </div>
          </div>
     );
};

const GangnamPickBoard = ({ user }) => {
     const [posts, setPosts] = useState([]);
     const [loading, setLoading] = useState(true);
     const [loadError, setLoadError] = useState(false);
     const [reloadKey, setReloadKey] = useState(0);
     const [region, setRegion] = useState('강남 전체');
     const [groupTab, setGroupTab] = useState('all');
     const [selectedPost, setSelectedPost] = useState(null);
     const [likedIds, setLikedIds] = useState(new Set());
     const [viewedIds, setViewedIds] = useState(new Set());

     useEffect(() => {
          const fetchPicks = async () => {
               setLoading(true);
               setLoadError(false);
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [
                              Query.equal('type', ['gangnam_pick']),
                              Query.orderDesc('$createdAt'),
                              Query.limit(100),
                         ],
                    });
                    const mapped = res.documents.map((p) => ({
                         id: p.$id,
                         title: p.title,
                         content: p.content,
                         locationName: p.locationName,
                         placeAddress: p.placeAddress,
                         placePhone: p.placePhone,
                         placeCategory: p.placeCategory,
                         pickGroup: p.pickGroup || 'restaurant',
                         sourceUrl: p.sourceUrl,
                         imageUrls: p.imageUrls || [],
                         likesCount: p.likesCount || 0,
                         views: p.views || 0,
                         createdAt: p.$createdAt,
                         time: formatPickTime(p.$createdAt),
                    }));
                    setPosts(mapped);
               } catch (e) {
                    console.error('강남 픽을 불러오지 못했습니다.', e);
                    setLoadError(true);
               } finally {
                    setLoading(false);
               }
          };
          fetchPicks();
     }, [reloadKey]);

     useEffect(() => {
          const interval = setInterval(() => setReloadKey((key) => key + 1), PICK_REFRESH_MS);
          const handleVisibilityChange = () => {
               if (document.visibilityState === 'visible') {
                    setReloadKey((key) => key + 1);
               }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);
          return () => {
               clearInterval(interval);
               document.removeEventListener('visibilitychange', handleVisibilityChange);
          };
     }, []);

     // 로그인한 사용자가 이전에 좋아요를 눌렀던 글 목록을 불러와, 새로고침/재로그인 후에도
     // 하트가 채워진 상태로 정확히 보이도록 합니다 (이전에는 로컬 state만 써서 새로고침하면
     // 항상 초기화된 것처럼 보였습니다).
     useEffect(() => {
          const fetchMyLikes = async () => {
               if (!user?.id) {
                    setLikedIds(new Set());
                    return;
               }
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.postLikes,
                         queries: [Query.equal('userId', user.id), Query.limit(200)],
                    });
                    setLikedIds(new Set(res.documents.map((doc) => doc.postId)));
               } catch (e) {
                    console.warn('좋아요 목록 로딩 실패:', e);
               }
          };
          fetchMyLikes();
     }, [user?.id]);

     const handleToggleLike = async (postId) => {
          if (!user?.id) {
               alert('로그인이 필요합니다.');
               return;
          }
          // 낙관적 업데이트: 서버 응답을 기다리지 않고 먼저 화면을 바꿔서 반응성을 높이고,
          // 실패하면 원래 상태로 되돌립니다.
          const wasLiked = likedIds.has(postId);
          setLikedIds((prev) => {
               const next = new Set(prev);
               if (wasLiked) next.delete(postId); else next.add(postId);
               return next;
          });
          setPosts((prev) => prev.map((p) => (
               p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount + (wasLiked ? -1 : 1)) } : p
          )));

          const result = await callEconomy({ action: 'toggle_pick_like', postId });
          if (!result.success) {
               // 실패 시 롤백
               setLikedIds((prev) => {
                    const next = new Set(prev);
                    if (wasLiked) next.add(postId); else next.delete(postId);
                    return next;
               });
               setPosts((prev) => prev.map((p) => (
                    p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount + (wasLiked ? 1 : -1)) } : p
               )));
               alert(result.message || '좋아요 처리에 실패했습니다.');
               return;
          }
          // 서버가 계산한 정확한 값으로 동기화
          setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likesCount: result.likesCount } : p)));
     };

     const handleOpenPost = (post) => {
          setSelectedPost(post);
          // 같은 글을 여러 번 열어도 이번 방문(세션) 동안은 조회수를 한 번만 올립니다.
          if (viewedIds.has(post.id)) return;
          setViewedIds((prev) => new Set(prev).add(post.id));
          setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p)));
          callEconomy({ action: 'record_pick_view', postId: post.id }).then((result) => {
               if (result.success) {
                    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, views: result.views } : p)));
               }
          });
     };

     const byGroup = groupTab === 'all' ? posts : posts.filter((p) => p.pickGroup === groupTab);
     const filtered = useMemo(() => {
          const regionFiltered = region === '강남 전체'
               ? byGroup
               : byGroup.filter((p) => (p.placeAddress || p.locationName || '').includes(region));
          return [...regionFiltered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
     }, [byGroup, region]);

     const groupCounts = GROUP_TABS.reduce((acc, tab) => {
          acc[tab.key] = tab.key === 'all' ? posts.length : posts.filter((p) => p.pickGroup === tab.key).length;
          return acc;
     }, {});

     const selectedPostLive = useMemo(
          () => (selectedPost ? posts.find((p) => p.id === selectedPost.id) || selectedPost : null),
          [selectedPost, posts]
     );

     return (
          <div>
               {/* Header */}
               <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                         <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-light px-3 py-1 text-[11px] font-black text-brand-accent">
                              <Sparkles className="h-3.5 w-3.5" />
                              AI가 골라주는 강남 맛집·카페·문화예술·취미·운동
                         </div>
                         <h2 className="text-xl font-black text-brand-ink">👍 강남 픽</h2>
                         <p className="mt-1 text-xs font-semibold text-slate-500">
                              AI가 네이버 블로그를 분석해 12시간마다 맛집·카페·전시/공연·취미·운동 소식을 새로 소개해요. 카드를 눌러보면 주소·전화번호·사진을 더 볼 수 있어요.
                         </p>
                    </div>
               </div>

               {/* Group tabs (맛집 / 카페 / 문화·예술 / 취미 / 운동) */}
               <div className="mb-3 flex flex-wrap gap-2">
                    {GROUP_TABS.map((tab) => {
                         const Icon = tab.icon;
                         const active = groupTab === tab.key;
                         return (
                              <button
                                   key={tab.key}
                                   onClick={() => setGroupTab(tab.key)}
                                   className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-black transition-all ${active
                                        ? 'bg-brand-ink text-brand-gold shadow-soft'
                                        : 'bg-surface-muted text-slate-500 hover:bg-brand-light hover:text-brand-accent'
                                        }`}
                              >
                                   <Icon className="h-4 w-4" />
                                   {tab.label}
                                   <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/15 text-brand-gold' : 'bg-white text-slate-400'}`}>
                                        {groupCounts[tab.key] ?? 0}
                                   </span>
                              </button>
                         );
                    })}
               </div>

               {/* Region filter */}
               <div className="mb-4 flex flex-wrap gap-1.5">
                    {REGIONS.map((r) => (
                         <button
                              key={r}
                              onClick={() => setRegion(r)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${region === r
                                   ? 'bg-brand text-white shadow-soft'
                                   : 'bg-surface-muted text-slate-500 hover:bg-brand-light hover:text-brand-accent'
                                   }`}
                         >
                              {r}
                         </button>
                    ))}
               </div>

               {loading ? (
                    <SectionSkeleton label="강남 픽" />
               ) : loadError ? (
                    <FeedError title="강남 픽" onRetry={() => setReloadKey((key) => key + 1)} />
               ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-gold/30 bg-brand-light/40 p-12 text-center">
                         <Coffee className="mx-auto mb-3 h-8 w-8 text-brand-accent/60" strokeWidth={1.5} />
                         <p className="text-sm font-bold text-slate-500">
                              {groupTab === 'all'
                                   ? '아직 등록된 장소가 없어요. 잠시 후 다시 확인해주세요.'
                                   : `아직 ${GROUP_TABS.find((t) => t.key === groupTab)?.label} 소식이 없어요. AI가 12시간마다 새로 찾아올게요.`}
                         </p>
                    </div>
               ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                         {filtered.map((post) => (
                              <PickCard
                                   key={post.id}
                                   post={post}
                                   onOpen={handleOpenPost}
                                   liked={likedIds.has(post.id)}
                                   onToggleLike={() => handleToggleLike(post.id)}
                              />
                         ))}
                    </div>
               )}

               {selectedPostLive && (
                    <PickDetailModal
                         post={selectedPostLive}
                         onClose={() => setSelectedPost(null)}
                         liked={likedIds.has(selectedPostLive.id)}
                         onToggleLike={() => handleToggleLike(selectedPostLive.id)}
                    />
               )}
          </div>
     );
};

export default GangnamPickBoard;
