import React, { useMemo, useState } from 'react';
import { Heart, MapPin, MessageCircle, Plus, Search, SlidersHorizontal, Star, Users } from 'lucide-react';
import PostDetailModal from './PostDetailModal';
import { EmptyFeedCTA } from './FeedStates';

const CATEGORIES = ['전체', '디지털/가전', '가구/인테리어', '의류/잡화', '유아동/도서', '스포츠/레저', '생활/주방', '기타'];

const UsedMarket = ({ items = [], onCreate }) => {
     const [selectedItem, setSelectedItem] = useState(null);
     const [activeCategory, setActiveCategory] = useState('전체');
     const [query, setQuery] = useState('');

     const filteredItems = useMemo(() => {
          const term = query.trim().toLowerCase();
          return items
               .filter((item) => activeCategory === '전체' || (item.category || '기타') === activeCategory)
               .filter((item) => {
                    if (!term) return true;
                    return [item.title, item.location, item.seller, item.category].filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
               });
     }, [items, activeCategory, query]);

     return (
          <section className="rounded-card border border-surface-border bg-white p-5 shadow-soft md:p-6">
               <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                    <div>
                         <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-[11px] font-black text-brand-accent">
                              당근보다 가까운 강남 직거래
                         </div>
                         <h2 className="text-2xl font-black tracking-tight text-brand-ink">중고거래</h2>
                         <p className="mt-1 text-sm font-semibold text-slate-500">강남 생활권 물건을 빠르게 올리고, 가까운 곳에서 거래하세요.</p>
                    </div>
                    <button
                         type="button"
                         onClick={onCreate}
                         className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-black text-white shadow-soft transition-colors hover:bg-brand-dark"
                    >
                         <Plus className="h-4 w-4" />
                         글쓰기
                    </button>
               </div>

               <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
                    <label className="flex h-11 items-center gap-2 rounded-xl border border-surface-border bg-surface-muted px-3">
                         <Search className="h-4 w-4 text-slate-400" />
                         <input
                              value={query}
                              onChange={(event) => setQuery(event.target.value)}
                              placeholder="상품명, 위치, 판매자 검색"
                              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                         />
                    </label>
                    <div className="hidden items-center gap-2 rounded-xl border border-surface-border px-3 text-xs font-black text-slate-400 md:flex">
                         <SlidersHorizontal className="h-4 w-4" />
                         {filteredItems.length}개 상품
                    </div>
               </div>

               <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                         <button
                              key={cat}
                              type="button"
                              onClick={() => setActiveCategory(cat)}
                              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition-all ${activeCategory === cat
                                   ? 'bg-brand text-white shadow-sm'
                                   : 'bg-surface-muted text-slate-500 hover:bg-brand-light hover:text-brand-accent'
                                   }`}
                         >
                              {cat}
                         </button>
                    ))}
               </div>

               {filteredItems.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                         {filteredItems.map((item) => (
                              <article
                                   key={item.id}
                                   onClick={() => setSelectedItem(item)}
                                   className="group cursor-pointer overflow-hidden rounded-2xl border border-surface-border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-soft"
                              >
                                   <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
                                        <img
                                             src={item.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                                             alt={item.title}
                                             className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                   </div>
                                   <div className="p-4">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                             <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-black text-slate-500">{item.category || '기타'}</span>
                                             <span className="text-[11px] font-bold text-slate-400">직거래</span>
                                        </div>
                                        <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-brand-ink">{item.title}</h3>
                                        <p className="mt-2 text-lg font-black text-brand-accent">{item.price || '0'}원</p>
                                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-500">
                                             <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                             <span className="truncate">{item.location || '강남'}</span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-3">
                                             <div className="min-w-0">
                                                  <p className="truncate text-xs font-black text-slate-700">{item.seller || '강남 이웃'}</p>
                                                  <p className="text-[10px] font-semibold text-slate-400">강남온 판매자</p>
                                             </div>
                                             <div className="flex items-center gap-2 text-slate-400">
                                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                                                       <Heart className="h-3.5 w-3.5" />
                                                       {item.likes || 0}
                                                  </span>
                                                  <MessageCircle className="h-4 w-4" />
                                             </div>
                                        </div>
                                   </div>
                              </article>
                         ))}
                    </div>
               ) : (
                    <EmptyFeedCTA
                         title="등록된 상품이 아직 없어요"
                         description="첫 나눔을 올리면 강남 이웃과 바로 거래를 시작할 수 있어요."
                         rewardText="첫 상품 등록 시 재화(온) 적립 이벤트 진행 중"
                         actionLabel="상품 글쓰기"
                         onAction={onCreate}
                         icon={Plus}
                    />
               )}

               {selectedItem && <PostDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
          </section>
     );
};

export default UsedMarket;
