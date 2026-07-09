import React, { useState } from 'react';
import { X, Heart, MessageCircle, MoreHorizontal, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const PostDetailModal = ({ item, onClose }) => {
     if (!item) return null;

     const [currentImageIndex, setCurrentImageIndex] = useState(0);

     const images = [item.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=900&fit=crop'];

     const handlePrev = (e) => {
          e.stopPropagation();
          setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
     };

     const handleNext = (e) => {
          e.stopPropagation();
          setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
     };

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-10 animate-in fade-in duration-200">

               {/* Close Button (PC) */}
               <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-white/80 hover:text-white hidden md:block"
               >
                    <X className="w-8 h-8" />
               </button>

               {/* Modal Container */}
               <div className="bg-white w-full h-full md:max-w-6xl md:h-[85vh] md:rounded-r-2xl md:rounded-l-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">

                    {/* Close Button (Mobile) */}
                    <button
                         onClick={onClose}
                         className="absolute top-4 left-4 z-20 p-2 bg-black/30 text-white rounded-full md:hidden backdrop-blur-md"
                    >
                         <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* === Left: Image Slider (60%) === */}
                    <div className="w-full md:w-[60%] h-[40vh] md:h-full bg-black relative group">
                         <img
                              src={images[currentImageIndex]}
                              alt="Product"
                              className="w-full h-full object-contain md:object-cover"
                         />

                         {/* Slider Controls */}
                         {images.length > 1 && <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={handlePrev} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors">
                                   <ChevronLeft className="w-6 h-6" />
                              </button>
                              <button onClick={handleNext} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors">
                                   <ChevronRight className="w-6 h-6" />
                              </button>
                         </div>}

                         {/* Pagination Dots */}
                         {images.length > 1 && <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                              {images.map((_, idx) => (
                                   <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                                   />
                              ))}
                         </div>}
                    </div>

                    {/* === Right: Content & Chat (40%) === */}
                    <div className="w-full md:w-[40%] flex flex-col h-full bg-white relative">

                         {/* Header: User Profile */}
                         <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-gray-200">
                                        <img src={item.sellerAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.seller || 'Gangnam'}`} alt="User" />
                                   </div>
                                   <div>
                                        <h3 className="text-sm font-bold text-gray-900">{item.seller || '강남 이웃'}</h3>
                                        <p className="text-xs text-gray-500">{item.location || '강남'} · 강남온 판매자</p>
                                   </div>
                              </div>
                              <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
                         </div>

                         {/* Scrollable Body: Content & Comments */}
                         <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                              {/* Product Info */}
                              <div className="mb-6">
                                   <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{item.title}</h2>
                                   <p className="text-lg font-bold text-purple-600 mb-4">{item.price}원</p>
                                   <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                        {item.content || '상품 설명이 아직 없습니다.'}
                                   </p>
                                   <div className="flex gap-2 mt-4">
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">#{item.category || '기타'}</span>
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">#직거래</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-xs text-gray-400 mt-4">
                                        <MapPin className="w-3 h-3" />
                                        <span>{item.location || '강남'}</span>
                                   </div>
                              </div>

                              <hr className="border-gray-100 my-4" />

                              {/* Comments Section */}
                              <div>
                                   <h3 className="text-sm font-bold text-gray-900 mb-4">거래 메모</h3>
                                   <div className="rounded-xl bg-gray-50 p-4 text-sm font-semibold leading-6 text-gray-500">
                                        거래 전 상품 상태, 직거래 장소, 가격을 다시 확인하세요.
                                   </div>
                              </div>
                         </div>

                         {/* Footer: Action Buttons */}
                         <div className="p-4 border-t border-gray-100 bg-white md:bg-gray-50 shrink-0">
                              <div className="flex items-center gap-4">
                                   <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors px-2">
                                        <Heart className="w-6 h-6" />
                                        <span className="text-[10px] font-medium">{item.likes}</span>
                                   </button>

                                   <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <MessageCircle className="w-5 h-5" />
                                        채팅으로 거래하기
                                   </button>
                              </div>
                         </div>

                    </div>
               </div>
          </div>
     );
};

export default PostDetailModal;
