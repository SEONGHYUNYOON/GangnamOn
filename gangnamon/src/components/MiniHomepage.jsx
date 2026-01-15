import React, { useState } from 'react';
import { X, Image, BookOpen, PenTool, Heart, MoreHorizontal, Send } from 'lucide-react';

const MiniHomepage = ({ onClose }) => {
     const [activeTab, setActiveTab] = useState('guestbook');

     // Mock Data
     const guestbookEntries = [
          { id: 1, author: '금촌사랑꾼', content: '오늘 파주 날씨 너무 좋다! 산책 가자~ 🌸', date: '2023.10.25', color: 'bg-yellow-100' },
          { id: 2, author: '운정댁', content: '주말에 뭐해? 같이 커피 한 잔? ☕', date: '2023.10.24', color: 'bg-pink-100' },
          { id: 3, author: '파주지킴이', content: '1촌 신청 받아줘! ㅎㅎ', date: '2023.10.23', color: 'bg-blue-100' },
          { id: 4, author: '문산토박이', content: '프로필 사진 바꿨네? 잘 나왔다!', date: '2023.10.22', color: 'bg-green-100' },
     ];

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">

               {/* Card Container */}
               <div className="bg-white w-full max-w-lg h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300 border-4 border-gray-100/50">

                    {/* Close Button */}
                    <button
                         onClick={onClose}
                         className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                         <X className="w-5 h-5" />
                    </button>

                    {/* === Header (Cover & Profile) === */}
                    <div className="relative h-48 shrink-0">
                         {/* Cover Image */}
                         <img
                              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800&h=400"
                              alt="Cover"
                              className="w-full h-full object-cover"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                         {/* Profile Info */}
                         <div className="absolute -bottom-10 left-0 right-0 px-6 flex justify-between items-end">
                              <div className="flex flex-col items-center">
                                   <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden relative bg-white">
                                        <img
                                             src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                             alt="Profile"
                                             className="w-full h-full object-cover"
                                        />
                                   </div>
                              </div>

                              {/* Stats */}
                              <div className="flex gap-4 mb-11 text-white">
                                   <div className="text-center">
                                        <span className="block font-bold text-lg">1,204</span>
                                        <span className="text-[10px] opacity-80 uppercase tracking-wider">Followers</span>
                                   </div>
                                   <div className="text-center">
                                        <span className="block font-bold text-lg">382</span>
                                        <span className="text-[10px] opacity-80 uppercase tracking-wider">Following</span>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* === Bio & Status === */}
                    <div className="mt-12 px-6 text-center">
                         <h2 className="text-2xl font-bold text-gray-900 mb-1">나의 파주 라이프 🏡</h2>
                         <p className="text-sm text-gray-500 mb-4">"오늘도 평화로운 파주의 하루! 🌈"</p>

                         {/* Today's Mood */}
                         <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                              <span className="text-xl">🎵</span>
                              <span className="text-xs font-semibold text-gray-600">NewJeans - ETA 듣는 중...</span>
                         </div>
                    </div>

                    {/* === Tabs === */}
                    <div className="flex justify-center border-b border-gray-100 mt-6 px-4">
                         {[
                              { id: 'photos', label: '사진첩', icon: Image },
                              { id: 'guestbook', label: '방명록', icon: BookOpen },
                              { id: 'diary', label: '다이어리', icon: PenTool },
                         ].map((tab) => {
                              const Icon = tab.icon;
                              return (
                                   <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 border-b-2 transition-all ${activeTab === tab.id
                                                  ? 'border-purple-500 text-purple-600'
                                                  : 'border-transparent text-gray-400 hover:text-gray-600'
                                             }`}
                                   >
                                        <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                        <span className="text-xs font-bold">{tab.label}</span>
                                   </button>
                              )
                         })}
                    </div>

                    {/* === Content Area === */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA] scrollbar-hide">
                         {activeTab === 'guestbook' && (
                              <div className="space-y-4">
                                   {/* Input Area */}
                                   <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-2 mb-6">
                                        <input
                                             type="text"
                                             placeholder="일촌평을 남겨보세요..."
                                             className="flex-1 bg-transparent text-sm focus:outline-none px-2"
                                        />
                                        <button className="bg-purple-100 text-purple-600 p-2 rounded-xl hover:bg-purple-200 transition-colors">
                                             <Send className="w-4 h-4" />
                                        </button>
                                   </div>

                                   {/* Guestbook List (Post-it Style) */}
                                   <div className="grid grid-cols-1 gap-4">
                                        {guestbookEntries.map((entry) => (
                                             <div key={entry.id} className={`${entry.color} p-4 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-none shadow-sm relative group hover:-translate-y-1 transition-transform duration-300`}>
                                                  <div className="flex justify-between items-start mb-2">
                                                       <span className="font-bold text-gray-800 text-sm">{entry.author}</span>
                                                       <span className="text-[10px] text-gray-500/70">{entry.date}</span>
                                                  </div>
                                                  <p className="text-gray-800 text-sm leading-relaxed">{entry.content}</p>

                                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <button className="p-1 hover:bg-black/5 rounded-full">
                                                            <Heart className="w-3 h-3 text-gray-500" />
                                                       </button>
                                                       <button className="p-1 hover:bg-black/5 rounded-full">
                                                            <MoreHorizontal className="w-3 h-3 text-gray-500" />
                                                       </button>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         )}
                         {activeTab === 'photos' && (
                              <div className="grid grid-cols-3 gap-2">
                                   {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="aspect-square bg-gray-200 rounded-xl overflow-hidden hover:opacity-90 cursor-pointer">
                                             <img src={`https://picsum.photos/300/300?random=${i}`} className="w-full h-full object-cover" />
                                        </div>
                                   ))}
                              </div>
                         )}
                         {activeTab === 'diary' && (
                              <div className="text-center py-10 text-gray-400 text-sm">
                                   <p>🔒 비공개 다이어리입니다.</p>
                              </div>
                         )}
                    </div>

               </div>
          </div>
     );
};

export default MiniHomepage;
