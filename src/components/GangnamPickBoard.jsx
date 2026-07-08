import React, { useEffect, useState } from 'react';
import { MapPin, Phone, ExternalLink, Sparkles, Coffee, Heart, Eye, Loader2, X, Map } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

const REGIONS = ['강남 전체', '역삼동', '신사동', '청담동', '삼성동', '논현동', '압구정', '강남역'];

const PlaceholderThumb = ({ className = '' }) => (
     <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-light via-[#f3ead9] to-[#ecdfc4] text-brand-accent/70 ${className}`}>
          <Coffee className="h-9 w-9" strokeWidth={1.5} />
          <span className="text-[11px] font-bold tracking-wide">사진 준비중</span>
     </div>
);

const LikeButton = ({ initialCount }) => {
     const [isLiked, setIsLiked] = useState(false);
     const [count, setCount] = useState(initialCount);

     return (
          <button
               onClick={(e) => {
                    e.stopPropagation();
                    setIsLiked((prev) => !prev);
                    setCount((prev) => (isLiked ? prev - 1 : prev + 1));
               }}
               className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
          >
               <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
               {count}
          </button>
     );
};

const PickCard = ({ post, onOpen }) => {
     const thumb = post.imageUrls?.[0];
     const extraCount = Math.max(0, (post.imageUrls?.length || 0) - 1);

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
                         <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                              +{extraCount}
                         </div>
                    )}
               </div>

               {/* Body */}
               <div className="p-4">
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

                    <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-slate-600 [word-break:keep-all]">
                         {post.content}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
                         <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                              <LikeButton initialCount={post.likesCount} />
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

const PickDetailModal = ({ post, onClose }) => {
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
                              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                                   {images.map((_, i) => (
                                        <button
                                             key={i}
                                             onClick={() => setActiveImg(i)}
                                             className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                                        />
                                   ))}
                              </div>
                         )}
                    </div>

                    {/* Body */}
                    <div className="p-5">
                         <div className="mb-2 flex flex-wrap items-center gap-1.5">
                              <span className="flex items-center gap-1 rounded-full bg-brand-ink px-2.5 py-1 text-[10px] font-black text-brand-gold">
                                   <Sparkles className="h-3 w-3" />
                                   AI 추천
                              </span>
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

const GangnamPickBoard = () => {
     const [posts, setPosts] = useState([]);
     const [loading, setLoading] = useState(true);
     const [region, setRegion] = useState('강남 전체');
     const [selectedPost, setSelectedPost] = useState(null);

     useEffect(() => {
          const fetchPicks = async () => {
               setLoading(true);
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [
                              Query.equal('type', ['gangnam_pick']),
                              Query.orderDesc('$createdAt'),
                              Query.limit(40),
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
                         sourceUrl: p.sourceUrl,
                         imageUrls: p.imageUrls || [],
                         likesCount: p.likesCount || 0,
                         views: p.views || 0,
                         time: new Date(p.$createdAt).toLocaleDateString(),
                    }));
                    setPosts(mapped);
               } catch (e) {
                    console.error('강남 픽을 불러오지 못했습니다.', e);
               } finally {
                    setLoading(false);
               }
          };
          fetchPicks();
     }, []);

     const filtered = region === '강남 전체'
          ? posts
          : posts.filter((p) => (p.placeAddress || p.locationName || '').includes(region));

     return (
          <div>
               {/* Header */}
               <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                         <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-light px-3 py-1 text-[11px] font-black text-brand-accent">
                              <Sparkles className="h-3.5 w-3.5" />
                              AI가 매일 골라주는 강남 맛집·카페
                         </div>
                         <h2 className="text-xl font-black text-brand-ink">👍 강남 픽</h2>
                         <p className="mt-1 text-xs font-semibold text-slate-500">
                              AI가 네이버 블로그 후기를 분석해 2시간마다 새로운 장소를 소개해요. 카드를 눌러보면 주소·전화번호·사진을 더 볼 수 있어요.
                         </p>
                    </div>
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
                    <div className="flex flex-col items-center justify-center p-16">
                         <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-accent" />
                         <p className="text-sm font-bold text-slate-400">강남 픽을 불러오는 중...</p>
                    </div>
               ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-gold/30 bg-brand-light/40 p-12 text-center">
                         <Coffee className="mx-auto mb-3 h-8 w-8 text-brand-accent/60" strokeWidth={1.5} />
                         <p className="text-sm font-bold text-slate-500">
                              아직 등록된 장소가 없어요. 잠시 후 다시 확인해주세요.
                         </p>
                    </div>
               ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                         {filtered.map((post) => (
                              <PickCard key={post.id} post={post} onOpen={setSelectedPost} />
                         ))}
                    </div>
               )}

               {selectedPost && (
                    <PickDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
               )}
          </div>
     );
};

export default GangnamPickBoard;
