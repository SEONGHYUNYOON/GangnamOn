import React, { useState } from 'react';
import { X, Heart, MoreHorizontal, Send, Mail, MapPin, Sparkles } from 'lucide-react';

const MiniHomepage = ({ onClose, user, onOpenAvatarCustomizer }) => {
     // Mock Data
     const guestbookEntries = [
          { id: 1, author: '금촌사랑꾼', content: '오늘 파주 날씨 너무 좋다! 산책 가자~ 🌸', date: '5분 전', color: 'bg-yellow-50' },
          { id: 2, author: '운정댁', content: '주말에 뭐해? 같이 커피 한 잔? ☕', date: '30분 전', color: 'bg-pink-50' },
          { id: 3, author: '파주지킴이', content: '1촌 신청 받아줘! ㅎㅎ', date: '2시간 전', color: 'bg-blue-50' },
     ];

     const galleryImages = [
          'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=300&h=300',
     ];

     const [isPublic, setIsPublic] = useState(false);
     const [ilchonCount] = useState(Math.floor(Math.random() * 50) + 10);

     return (
          <div
               className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
               onClick={onClose}
          >

               {/* Card Container */}
               <div
                    className="bg-white w-full max-w-[480px] max-h-[80vh] h-full rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300 border-4 border-gray-100/50 filter-drop-shadow"
                    onClick={(e) => e.stopPropagation()}
               >

                    {/* Top Buttons (Close & Message) */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                         <button
                              className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md border border-white/20 shadow-lg group"
                              title="1:1 메시지 보내기"
                         >
                              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                         </button>
                         <button
                              onClick={onClose}
                              className="p-3 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
                         >
                              <X className="w-5 h-5" />
                         </button>
                    </div>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide bg-white pb-6">

                         {/* === 1. Header Section === */}
                         <div className="relative">
                              {/* Cover */}
                              <div className="h-64 w-full bg-gradient-to-bl from-indigo-400 via-purple-400 to-pink-400 relative overflow-hidden">
                                   <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              </div>

                              {/* Profile Info Overlay */}
                              <div className="absolute bottom-0 left-0 w-full p-8 pb-10 text-white">
                                   <div className="flex justify-between items-end mb-4">
                                        <div
                                             className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white -mb-6 relative z-10 group cursor-pointer"
                                             onClick={onOpenAvatarCustomizer}
                                        >
                                             <img
                                                  src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                                  alt="Profile"
                                                  className="w-full h-full object-cover"
                                             />
                                             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Sparkles className="w-6 h-6 text-white" />
                                             </div>
                                        </div>

                                        {/* Visitor Stats */}
                                        <div className="flex items-center gap-4 mb-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                             <div className="text-center">
                                                  <span className="text-orange-400 font-bold text-xl drop-shadow-sm">128</span>
                                                  <span className="block text-[10px] text-gray-300 uppercase font-medium">Today</span>
                                             </div>
                                             <div className="w-[1px] h-6 bg-white/20"></div>
                                             <div className="text-center">
                                                  <span className="text-white font-bold text-xl drop-shadow-sm">12k</span>
                                                  <span className="block text-[10px] text-gray-300 uppercase font-medium">Total</span>
                                             </div>
                                             <div className="w-[1px] h-6 bg-white/20"></div>
                                             <div className="text-center">
                                                  <span className="text-pink-400 font-bold text-xl drop-shadow-sm">{ilchonCount}</span>
                                                  <span className="block text-[10px] text-gray-300 uppercase font-medium">일촌</span>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Name & Bio */}
                                   <div className="mt-8">
                                        <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
                                             {user?.user_metadata?.username || user?.user_metadata?.full_name || '나의 파주 라이프 🏡'}
                                        </h2>
                                        <div className="flex items-center gap-1 text-sm text-gray-300 mb-4">
                                             <MapPin className="w-3.5 h-3.5" />
                                             {user?.user_metadata?.location || '파주 운정 1동 · ENFP'}
                                        </div>
                                        <p className="text-base text-gray-200 leading-relaxed font-light mb-6">
                                             "오늘도 평화로운 파주의 하루! 🌈<br />
                                             맛집 탐방하고 사진 찍는 거 좋아해요 ✨"
                                        </p>

                                        {/* Privacy Toggle & Incentive */}
                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between">
                                             <div>
                                                  <div className="text-xs text-yellow-300 font-bold mb-0.5">✨ 전체공개 챌린지</div>
                                                  <div className="text-[10px] text-gray-300">1개월 유지 시 <span className="text-white font-bold">+1,000콩</span> 지급!</div>
                                             </div>
                                             <button
                                                  onClick={() => setIsPublic(!isPublic)}
                                                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isPublic
                                                       ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                                       : 'bg-gray-600 text-gray-300'
                                                       }`}
                                             >
                                                  {isPublic ? '전체공개 ON' : '비공개'}
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         {/* === 2. Gallery Section (Instagram Grid) === */}
                         <div className="px-1 mt-10">
                              <div className="flex items-center justify-between px-5 mb-4">
                                   <h3 className="font-bold text-lg text-gray-900">Gallery</h3>
                                   <span className="text-xs text-gray-400 cursor-pointer hover:text-purple-600 transition-colors">더보기 &gt;</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                   {galleryImages.map((img, i) => (
                                        <div key={i} className="aspect-square bg-gray-100 overflow-hidden relative group cursor-pointer">
                                             <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`feed-${i}`} />
                                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                   ))}
                              </div>
                         </div>

                         {/* === 3. Guestbook Section === */}
                         <div className="mt-10 px-6 pb-8">
                              <h3 className="font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
                                   방명록 <span className="text-purple-600 text-sm font-normal">{guestbookEntries.length}</span>
                              </h3>

                              {/* Input */}
                              <div className="flex items-center gap-3 mb-8">
                                   <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                        <img src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Visitor"} className="w-full h-full" alt="me" />
                                   </div>
                                   <div className="flex-1 bg-gray-50 rounded-full px-5 py-3 flex items-center border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-50 transition-all shadow-sm">
                                        <input
                                             type="text"
                                             placeholder="따뜻한 한마디를 남겨주세요..."
                                             className="flex-1 bg-transparent text-sm focus:outline-none min-w-0 mr-2"
                                        />
                                        <button className="text-white bg-purple-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-700 transition-colors shrink-0 whitespace-nowrap shadow-md shadow-purple-200">
                                             게시
                                        </button>
                                   </div>
                              </div>

                              {/* Comments List */}
                              <div className="space-y-4">
                                   {guestbookEntries.map((entry) => (
                                        <div key={entry.id} className="flex gap-3 items-start group">
                                             <div className={`w-8 h-8 rounded-full ${entry.color} flex items-center justify-center text-xs font-bold text-gray-600 shrink-0`}>
                                                  {entry.author[0]}
                                             </div>
                                             <div className="flex-1">
                                                  <div className="flex items-baseline gap-2 mb-0.5">
                                                       <span className="font-bold text-sm text-gray-900">{entry.author}</span>
                                                       <span className="text-[10px] text-gray-400">{entry.date}</span>
                                                  </div>
                                                  <p className="text-sm text-gray-700 leading-relaxed">{entry.content}</p>

                                                  <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <button className="text-[11px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1">
                                                            <Heart className="w-3 h-3" /> 좋아요
                                                       </button>
                                                       <button className="text-[11px] font-bold text-gray-400 hover:text-gray-600">
                                                            답글달기
                                                       </button>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>

                              <div className="mt-6 text-center">
                                   <button className="text-xs text-gray-400 font-medium hover:text-gray-600 border-b border-gray-200 pb-0.5">
                                        이전 방명록 더보기
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default MiniHomepage;
