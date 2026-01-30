import React, { useState } from 'react';
import { X, Heart, MessageCircle, Share2, MoreHorizontal, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const PostDetailModal = ({ item, onClose }) => {
     if (!item) return null;

     const [currentImageIndex, setCurrentImageIndex] = useState(0);

     // Mock Images (In real app, item.images would be an array)
     // Generating fake array of 3 images for slider effect using the main image as base
     const images = [
          item.image,
          'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=800&h=800',
          'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800&h=800'
     ];

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
                         <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={handlePrev} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors">
                                   <ChevronLeft className="w-6 h-6" />
                              </button>
                              <button onClick={handleNext} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors">
                                   <ChevronRight className="w-6 h-6" />
                              </button>
                         </div>

                         {/* Pagination Dots */}
                         <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                              {images.map((_, idx) => (
                                   <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                                   />
                              ))}
                         </div>
                    </div>

                    {/* === Right: Content & Chat (40%) === */}
                    <div className="w-full md:w-[40%] flex flex-col h-full bg-white relative">

                         {/* Header: User Profile */}
                         <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                              <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-gray-200">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                                   </div>
                                   <div>
                                        <h3 className="text-sm font-bold text-gray-900">강남사랑꾼</h3>
                                        <p className="text-xs text-gray-500">강남 역삼동 • 매너온도 36.5℃</p>
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
                                        {`감성 캠핑 시작하려고 샀는데, 바빠서 한 번도 못 나갔네요. 😭\n박스만 뜯은 새 상품입니다!\n\n쿨거래 하시면 네고 조금 해드릴게요.\n강남역 직거래 선호합니다.`}
                                   </p>
                                   <div className="flex gap-2 mt-4">
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">#캠핑용품</span>
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">#새상품</span>
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">#직거래</span>
                                   </div>
                                   <div className="flex items-center gap-1 text-xs text-gray-400 mt-4">
                                        <MapPin className="w-3 h-3" />
                                        <span>역삼동 중앙도서관 근처</span>
                                   </div>
                              </div>

                              <hr className="border-gray-100 my-4" />

                              {/* Comments Section */}
                              <div>
                                   <h3 className="text-sm font-bold text-gray-900 mb-4">댓글 2개</h3>
                                   <div className="space-y-4">
                                        <div className="flex gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                                                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jude" />
                                             </div>
                                             <div>
                                                  <div className="flex items-center gap-2">
                                                       <span className="text-sm font-bold text-gray-800">캠핑조아</span>
                                                       <span className="text-xs text-gray-400">1시간 전</span>
                                                  </div>
                                                  <p className="text-sm text-gray-600 mt-0.5">혹시 의자 2개 일괄인가요?</p>
                                             </div>
                                        </div>
                                        <div className="flex gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                                                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                                             </div>
                                             <div>
                                                  <div className="flex items-center gap-2">
                                                       <span className="text-sm font-bold text-gray-800">강남사랑꾼</span>
                                                       <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1 rounded">작성자</span>
                                                       <span className="text-xs text-gray-400">50분 전</span>
                                                  </div>
                                                  <p className="text-sm text-gray-600 mt-0.5">네! 2개 세트 가격입니다!</p>
                                             </div>
                                        </div>
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
