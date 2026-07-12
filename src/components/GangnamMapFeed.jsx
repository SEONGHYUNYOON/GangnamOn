import React, { useEffect, useMemo, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import { resolveAvatarUrl } from '../lib/avatar';
import KakaoMap from './KakaoMap';
import { MapPin, Loader2, X, Clock, Users } from 'lucide-react';

// 게시글 type → 표시 정보. CreatePostModal의 카테고리와 맞춰 관리합니다.
const TYPE_META = {
     gathering: { label: '⚡ 동호회/모임', tone: 'bg-violet-50 text-violet-700' },
     lunch_networking: { label: '☕ 점심 네트워킹', tone: 'bg-amber-50 text-amber-700' },
     startup_freelance: { label: '⚡ 스타트업/프리랜서', tone: 'bg-sky-50 text-sky-700' },
     recruit_proposal: { label: '👥 구인/협업', tone: 'bg-emerald-50 text-emerald-700' },
     market: { label: '🥕 중고거래', tone: 'bg-orange-50 text-orange-700' },
     event: { label: '🎉 이벤트', tone: 'bg-rose-50 text-rose-700' },
     office_rent: { label: '🏢 사무실/임대', tone: 'bg-slate-100 text-slate-700' },
     housing_trade: { label: '🏠 월세·전세', tone: 'bg-teal-50 text-teal-700' },
     daily_photo: { label: '📸 데일리 포토', tone: 'bg-pink-50 text-pink-700' },
     town_story: { label: '💬 타운 스토리', tone: 'bg-indigo-50 text-indigo-700' },
     question: { label: '🙋 질문', tone: 'bg-yellow-50 text-yellow-700' },
};

const FILTERS = [
     { id: 'all', label: '전체', types: null },
     { id: 'meeting', label: '모임', types: ['gathering', 'lunch_networking', 'startup_freelance', 'recruit_proposal'] },
     { id: 'market', label: '장터', types: ['market', 'share'] },
     { id: 'housing', label: '부동산', types: ['office_rent', 'housing_trade'] },
     { id: 'community', label: '커뮤니티', types: ['daily_photo', 'town_story', 'question'] },
     { id: 'event', label: '이벤트', types: ['event'] },
];

const formatRelativeTime = (iso) => {
     const diffMs = Date.now() - new Date(iso).getTime();
     const minutes = Math.floor(diffMs / 60000);
     if (minutes < 1) return '방금 전';
     if (minutes < 60) return `${minutes}분 전`;
     const hours = Math.floor(minutes / 60);
     if (hours < 24) return `${hours}시간 전`;
     return `${Math.floor(hours / 24)}일 전`;
};

const GangnamMapFeed = ({ onJoinMeeting }) => {
     const [posts, setPosts] = useState([]);
     const [loading, setLoading] = useState(true);
     const [filterId, setFilterId] = useState('all');
     const [selectedPost, setSelectedPost] = useState(null);

     useEffect(() => {
          const fetchMapPosts = async () => {
               setLoading(true);
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [
                              Query.isNotNull('latitude'),
                              Query.orderDesc('$createdAt'),
                              Query.limit(100),
                         ],
                    });
                    setPosts(res.documents.filter(post => post.latitude && post.longitude));
               } catch (error) {
                    console.warn('지도 게시글 로딩 실패:', error);
               } finally {
                    setLoading(false);
               }
          };
          fetchMapPosts();
     }, []);

     const visiblePosts = useMemo(() => {
          const filter = FILTERS.find(item => item.id === filterId);
          if (!filter?.types) return posts;
          return posts.filter(post => filter.types.includes(post.type));
     }, [posts, filterId]);

     const markers = useMemo(() => visiblePosts.map(post => ({
          lat: post.latitude,
          lng: post.longitude,
          label: post.title,
          postId: post.$id,
     })), [visiblePosts]);

     const handleMarkerClick = useMemo(() => (pin) => {
          const post = visiblePosts.find(item => item.$id === pin.postId);
          if (post) setSelectedPost(post);
     }, [visiblePosts]);

     const typeMeta = (type) => TYPE_META[type] || { label: `📌 ${type || '게시글'}`, tone: 'bg-slate-100 text-slate-600' };

     return (
          <div className="space-y-4">
               <div className="rounded-card border border-surface-border bg-white p-5 shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                         <div>
                              <h2 className="flex items-center gap-2 text-xl font-black text-brand-ink">
                                   <MapPin className="h-5 w-5 text-brand-accent" />
                                   강남 동네지도
                              </h2>
                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                   지도 위 핀을 눌러 우리 동네의 모임·장터·이야기를 찾아보세요.
                              </p>
                         </div>
                         <span className="shrink-0 rounded-full bg-brand-light px-3 py-1.5 text-xs font-black text-brand">
                              게시글 {visiblePosts.length}개
                         </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                         {FILTERS.map(filter => (
                              <button
                                   key={filter.id}
                                   type="button"
                                   onClick={() => { setFilterId(filter.id); setSelectedPost(null); }}
                                   className={`rounded-full px-4 py-2 text-xs font-black transition-colors ${filterId === filter.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                   {filter.label}
                              </button>
                         ))}
                    </div>
               </div>

               <div className="relative overflow-hidden rounded-card border border-surface-border shadow-soft">
                    <KakaoMap
                         latitude={37.4979}
                         longitude={127.0276}
                         level={5}
                         label="강남 동네지도"
                         address="핀을 눌러 게시글을 확인하세요"
                         style={{ width: '100%', height: '480px' }}
                         showActions={false}
                         markers={markers}
                         onMarkerClick={handleMarkerClick}
                    />

                    {loading && (
                         <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                              <Loader2 className="h-8 w-8 animate-spin text-brand" />
                         </div>
                    )}

                    {selectedPost && (
                         <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-xl rounded-2xl border border-surface-border bg-white/95 p-4 shadow-2xl backdrop-blur md:left-auto md:right-4 md:w-[380px]">
                              <div className="flex items-start justify-between gap-2">
                                   <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${typeMeta(selectedPost.type).tone}`}>
                                        {typeMeta(selectedPost.type).label}
                                   </span>
                                   <button type="button" onClick={() => setSelectedPost(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                                        <X className="h-4 w-4" />
                                   </button>
                              </div>
                              <h3 className="mt-2 text-base font-black leading-6 text-brand-ink">{selectedPost.title}</h3>
                              {selectedPost.content && (
                                   <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{selectedPost.content}</p>
                              )}
                              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                                   <img
                                        src={resolveAvatarUrl({ avatarUrl: selectedPost.authorAvatarUrl, $id: selectedPost.authorId })}
                                        alt={selectedPost.authorUsername}
                                        className="h-7 w-7 rounded-full bg-slate-100 object-cover"
                                   />
                                   <span className="text-xs font-black text-slate-600">{selectedPost.authorUsername || '강남 이웃'}</span>
                                   <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                        <Clock className="h-3 w-3" />
                                        {formatRelativeTime(selectedPost.$createdAt)}
                                   </span>
                              </div>
                              {selectedPost.maxParticipants > 0 && (
                                   <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Users className="h-3.5 w-3.5" />
                                        {selectedPost.currentParticipants || 1}/{selectedPost.maxParticipants}명 참여 중
                                        {onJoinMeeting && (
                                             <button
                                                  type="button"
                                                  onClick={() => onJoinMeeting(selectedPost)}
                                                  className="ml-auto rounded-full bg-brand px-3 py-1.5 text-[11px] font-black text-white hover:bg-brand-dark"
                                             >
                                                  자세히 보기
                                             </button>
                                        )}
                                   </div>
                              )}
                              {selectedPost.locationName && (
                                   <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                        <MapPin className="h-3 w-3" />
                                        {selectedPost.locationName}
                                   </p>
                              )}
                         </div>
                    )}
               </div>

               <div className="rounded-card border border-surface-border bg-white p-5 shadow-soft">
                    <h3 className="text-sm font-black text-brand-ink">지도에 올라온 최신 글</h3>
                    {!loading && visiblePosts.length === 0 && (
                         <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                              <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                              <p className="text-sm font-bold text-slate-500">아직 위치가 등록된 게시글이 없어요.</p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">글을 쓸 때 지도에서 위치를 선택하면 이곳에 표시됩니다.</p>
                         </div>
                    )}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                         {visiblePosts.slice(0, 12).map(post => (
                              <button
                                   key={post.$id}
                                   type="button"
                                   onClick={() => setSelectedPost(post)}
                                   className={`rounded-2xl border p-3 text-left transition-colors ${selectedPost?.$id === post.$id ? 'border-brand bg-brand-light' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                              >
                                   <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${typeMeta(post.type).tone}`}>
                                        {typeMeta(post.type).label}
                                   </span>
                                   <p className="mt-1.5 truncate text-sm font-black text-brand-ink">{post.title}</p>
                                   <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{post.locationName || '강남'}</span>
                                        <span className="ml-auto shrink-0">{formatRelativeTime(post.$createdAt)}</span>
                                   </p>
                              </button>
                         ))}
                    </div>
               </div>
          </div>
     );
};

export default GangnamMapFeed;
