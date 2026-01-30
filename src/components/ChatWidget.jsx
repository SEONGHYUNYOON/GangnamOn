import React, { useState } from 'react';
import { MessageCircle, X, Send, MoreVertical, Phone, Video } from 'lucide-react';

const ChatWidget = () => {
     const [isOpen, setIsOpen] = useState(false);

     return (
          <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none">

               {/* Chat Window */}
               <div
                    className={`pointer-events-auto bg-white rounded-3xl shadow-2xl border border-gray-100 w-[360px] h-[550px] mb-4 origin-bottom-right transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-24'
                         } overflow-hidden flex flex-col`}
               >
                    {/* Header */}
                    <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                         <div className="flex items-center gap-3">
                              <div className="relative">
                                   <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" className="w-full h-full" alt="User" />
                                   </div>
                                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div>
                                   <h3 className="font-bold text-gray-900 text-sm">역삼댁</h3>
                                   <p className="text-xs text-green-500 font-medium">Online</p>
                              </div>
                         </div>
                         <div className="flex gap-1 text-gray-400">
                              <button className="p-2 hover:bg-gray-50 rounded-full"><Phone className="w-4 h-4" /></button>
                              <button className="p-2 hover:bg-gray-50 rounded-full"><Video className="w-4 h-4" /></button>
                              <button className="p-2 hover:bg-gray-50 rounded-full"><MoreVertical className="w-4 h-4" /></button>
                         </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3">
                         <div className="text-center text-[10px] text-gray-400 my-2">오늘 오전 10:23</div>

                         {/* Received Message */}
                         <div className="flex gap-2 max-w-[80%]">
                              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-auto">
                                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" className="w-full h-full" />
                              </div>
                              <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm text-sm text-gray-800">
                                   안녕하세요! 혹시 미니홈피 보셨나요?
                              </div>
                         </div>

                         {/* Sent Message */}
                         <div className="flex flex-col items-end gap-1 max-w-[80%] ml-auto">
                              <div className="bg-purple-600 p-3 rounded-2xl rounded-br-none shadow-sm text-sm text-white">
                                   네! 방금 봤어요 ㅎㅎ 사진 너무 예쁘던데요?
                              </div>
                              <span className="text-[10px] text-gray-400">오전 10:25</span>
                         </div>

                         {/* Received Message */}
                         <div className="flex gap-2 max-w-[80%]">
                              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-auto">
                                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" className="w-full h-full" />
                              </div>
                              <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm text-sm text-gray-800">
                                   감사해요 ㅋㅋ 이번 주말에 등산 모임 같이 가실래요?
                              </div>
                         </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                         <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                              <input
                                   type="text"
                                   placeholder="메시지 보내기..."
                                   className="flex-1 bg-transparent text-sm focus:outline-none"
                              />
                              <button className="text-purple-600 hover:text-purple-700 transition-colors">
                                   <Send className="w-5 h-5" />
                              </button>
                         </div>
                    </div>

                    {/* Close Button (Hidden, toggle via main button) */}
               </div>


               {/* Floating Action Button (FAB) */}
               <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`pointer-events-auto rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgba(124,58,237,0.3)] transition-all duration-300 hover:scale-110 active:scale-95 z-[70] ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:rotate-12'
                         }`}
               >
                    {isOpen ? (
                         <X className="w-6 h-6 text-white" />
                    ) : (
                         <MessageCircle className="w-7 h-7 text-white fill-current" />
                    )}
               </button>
          </div>
     );
};

export default ChatWidget;
