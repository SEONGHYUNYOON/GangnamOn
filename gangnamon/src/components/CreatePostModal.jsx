import React, { useState } from 'react';
import { X, Image as ImageIcon, MapPin, Calendar, Users, DollarSign, Tag, ChevronDown, ArrowLeft } from 'lucide-react';

const CreatePostModal = ({ onClose, onShare }) => {
     const [selectedCategory, setSelectedCategory] = useState('gathering');
     const [previewImage, setPreviewImage] = useState('https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800&h=800'); // Pre-filled for demo

     // Demo: Pre-filled Data for "Hiking Meeting"
     const [formData, setFormData] = useState({
          title: '이번 주말 심학산 둘레길 같이 걸으실 분!',
          price: '',
          location: '심학산 배수지 주차장',
          date: '2023-10-28',
          time: '10:00',
          maxMembers: 4,
          description: `날씨가 너무 좋아서 급하게 벙개 열어봅니다! ☀️\n\n초보자도 갈 수 있는 아주 쉬운 코스예요.\n정상에서 김밥 한 줄 먹고 내려와서\n근처 카페 가서 커피 한 잔 해요~ ☕️\n\n준비물: 편한 신발, 물`
     });

     const categories = [
          { id: 'market', label: '🥕 중고거래', icon: DollarSign },
          { id: 'gathering', label: '⚡ 동호회/모임', icon: Users },
          { id: 'school', label: '🏫 아이러브스쿨', icon: Tag },
          { id: 'life', label: '🏡 동네생활', icon: MapPin },
     ];

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">

               {/* Container */}
               <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">

                    {/* Header (Mobile Only) */}
                    <div className="md:hidden p-4 border-b flex justify-between items-center">
                         <button onClick={onClose}><ArrowLeft className="w-6 h-6" /></button>
                         <span className="font-bold">새 게시물 만들기</span>
                         <span className="text-purple-600 font-bold">공유</span>
                    </div>

                    {/* Close Button (PC) */}
                    <button
                         onClick={onClose}
                         className="absolute top-6 right-6 z-20 text-gray-400 hover:text-gray-900 hidden md:block"
                    >
                         <X className="w-6 h-6" />
                    </button>

                    {/* === Left: Image Upload (50%) === */}
                    <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center relative border-r border-gray-100">
                         {previewImage ? (
                              <div className="w-full h-full relative group">
                                   <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                             onClick={() => setPreviewImage(null)}
                                             className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold hover:bg-white/30 transition-colors"
                                        >
                                             사진 변경하기
                                        </button>
                                   </div>
                              </div>
                         ) : (
                              <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-2xl m-10 w-3/4 aspect-square flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                                   <ImageIcon className="w-16 h-16 mb-4" />
                                   <p className="font-bold text-lg mb-1">사진을 이곳에 끌어다 놓으세요</p>
                                   <p className="text-sm">또는 클릭하여 파일 선택</p>
                              </div>
                         )}
                    </div>

                    {/* === Right: Input Form (50%) === */}
                    <div className="w-full md:w-1/2 bg-white flex flex-col h-full">

                         {/* 1. User Profile Header */}
                         <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                              </div>
                              <span className="font-bold text-gray-900">금촌사랑꾼</span>
                         </div>

                         {/* 2. Scrollable Form Area */}
                         <div className="flex-1 overflow-y-auto p-6 space-y-8">

                              {/* Category Selector */}
                              <div className="relative">
                                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">게시판 선택</label>
                                   <div className="grid grid-cols-2 gap-2">
                                        {categories.map(cat => {
                                             const Icon = cat.icon;
                                             return (
                                                  <button
                                                       key={cat.id}
                                                       onClick={() => setSelectedCategory(cat.id)}
                                                       className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-bold ${selectedCategory === cat.id
                                                                 ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                                 : 'border-gray-200 text-gray-500 hover:border-purple-200'
                                                            }`}
                                                  >
                                                       <Icon className="w-4 h-4" />
                                                       {cat.label}
                                                  </button>
                                             )
                                        })}
                                   </div>
                              </div>

                              {/* Common: Title & Content */}
                              <div className="space-y-4">
                                   <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="글 제목을 입력해주세요"
                                        className="w-full text-xl font-bold placeholder-gray-300 border-none focus:ring-0 p-0"
                                   />
                                   <textarea
                                        rows={6}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="내용을 입력해주세요. (가품 및 판매금지 품목은 게시가 제한될 수 있어요.)"
                                        className="w-full text-sm text-gray-600 placeholder-gray-300 border-none focus:ring-0 p-0 resize-none leading-relaxed"
                                   />
                              </div>

                              <hr className="border-gray-100" />

                              {/* === Dynamic Fields === */}

                              {/* Case A: Market (Price) */}
                              {selectedCategory === 'market' && (
                                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">판매 가격</label>
                                             <div className="relative">
                                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₩</span>
                                                  <input type="text" placeholder="가격 입력" className="w-full pl-8 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-purple-200 focus:ring-0 transition-all font-bold" />
                                             </div>
                                        </div>
                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">상품 상태</label>
                                             <div className="flex gap-2">
                                                  <button className="flex-1 py-2 rounded-lg border border-purple-500 text-purple-600 bg-purple-50 font-bold text-sm">S급 (미개봉)</button>
                                                  <button className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-400 hover:border-gray-400 text-sm">A급</button>
                                                  <button className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-400 hover:border-gray-400 text-sm">B급</button>
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {/* Case B: Gathering (Date/Time/Location) */}
                              {selectedCategory === 'gathering' && (
                                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">모임 날짜</label>
                                                  <div className="flex items-center bg-gray-50 px-3 py-3 rounded-xl">
                                                       <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                       <input
                                                            type="date"
                                                            value={formData.date}
                                                            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full text-gray-700"
                                                       />
                                                  </div>
                                             </div>
                                             <div>
                                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">시간</label>
                                                  <div className="bg-gray-50 px-3 py-3 rounded-xl">
                                                       <input
                                                            type="time"
                                                            value={formData.time}
                                                            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full text-gray-700"
                                                       />
                                                  </div>
                                             </div>
                                        </div>

                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">장소</label>
                                             <div className="flex items-center bg-gray-50 px-3 py-3 rounded-xl">
                                                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                                  <input
                                                       type="text"
                                                       value={formData.location}
                                                       className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full placeholder-gray-400 text-gray-700"
                                                       placeholder="장소를 입력하거나 지도에서 선택"
                                                  />
                                             </div>
                                        </div>

                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">모집 인원 ({formData.maxMembers}명)</label>
                                             <input
                                                  type="range"
                                                  min="2" max="20"
                                                  value={formData.maxMembers}
                                                  onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                                                  className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                             />
                                             <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                  <span>소규모(2명)</span>
                                                  <span>단체(20명)</span>
                                             </div>
                                        </div>
                                   </div>
                              )}

                         </div>

                         {/* 3. Footer Action */}
                         <div className="p-6 border-t border-gray-100 flex justify-end">
                              <button
                                   onClick={() => onShare(selectedCategory, formData, previewImage)}
                                   className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 text-sm"
                              >
                                   공유하기
                              </button>
                         </div>

                    </div>
               </div>
          </div>
     );
};

export default CreatePostModal;
