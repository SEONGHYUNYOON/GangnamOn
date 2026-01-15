import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import PostDetailModal from './PostDetailModal';

const UsedMarket = ({ items }) => {
     const [selectedItem, setSelectedItem] = useState(null);

     return (
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">중고마켓 & 라이프 ✨</h2>
                    <span className="text-xs text-gray-400 cursor-pointer hover:text-black hover:underline underline-offset-4">더보기</span>
               </div>

               {/* Instagram Explore Style Grid */}
               <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {items && items.map((item) => (
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
          </div>
     );
};

export default UsedMarket;
