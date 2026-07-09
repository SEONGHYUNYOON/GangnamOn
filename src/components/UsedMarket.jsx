import React, { useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import PostDetailModal from './PostDetailModal';

const CATEGORIES = ['전체', '디지털/가전', '가구/인테리어', '의류/잡화', '유아동/도서', '스포츠/레저', '생활/주방', '기타'];

const UsedMarket = ({ items }) => {
     const [selectedItem, setSelectedItem] = useState(null);
     const [activeCategory, setActiveCategory] = useState('전체');

     const filteredItems = useMemo(() => {
          if (!items) return [];
          if (activeCategory === '전체') return items;
          return items.filter((item) => (item.category || '기타') === activeCategory);
     }, [items, activeCategory]);

     return (
          <div className="bg-white rounded-card p-5 md:p-6 shadow-soft border border-surface-border">
               <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-black text-gray-900">중고마켓</h2>
                    <span className="text-xs text-gray-400 cursor-pointer hover:text-black hover:underline underline-offset-4">더보기</span>
               </div>

               {/* Category Filter Tabs */}
               <div className="mb-5 flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                         <button
                              key={cat}
                              type="button"
                              onClick={() => setActiveCategory(cat)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${activeCategory === cat
                                   ? 'bg-gray-900 text-white'
                                   : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                   }`}
                         >
                              {cat}
                         </button>
                    ))}
               </div>

               {/* Instagram Explore Style Grid */}
               <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {filteredItems.map((item) => (
                         <div
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
                         >
                              <img
                                   src={item.image}
                                   alt={item.title}
                                   className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />

                              {/* Overlay on Hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white p-4 text-center">
                                   <p className="font-bold text-sm truncate w-full mb-1">{item.title}</p>
                                   <p className="text-xs opacity-90 mb-2">{item.price}원</p>

                                   <div className="flex items-center gap-4 text-xs font-bold">
                                        <div className="flex items-center gap-1">
                                             <Heart className="w-4 h-4 fill-white" />
                                             <span>{item.likes || 0}</span>
                                        </div>
                                   </div>
                              </div>

                              {/* Default Label (Mobile) */}
                              <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                   <p className="text-white text-[10px] truncate">{item.price}원</p>
                              </div>
                         </div>
                    ))}
               </div>

               {/* Detail Modal */}
               {selectedItem && (
                    <PostDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
               )}

               {!items && <div className="text-center py-4 text-gray-400">데이터가 없습니다.</div>}
               {items && filteredItems.length === 0 && (
                    <div className="text-center py-8 text-sm font-semibold text-gray-400">
                         '{activeCategory}' 카테고리에 등록된 상품이 아직 없어요.
                    </div>
               )}
          </div>
     );
};

export default UsedMarket;
