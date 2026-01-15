import React, { useState } from 'react';
import { X, Megaphone, Check } from 'lucide-react';

const BannerWriteModal = ({ onClose, onSubmit, userBeanCount, cost = 500 }) => {
     const [message, setMessage] = useState('');

     const handleSubmit = () => {
          if (!message.trim()) return;
          onSubmit(message);
          onClose();
     };

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
               <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                         <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                              <div className="bg-purple-100 p-2 rounded-full">
                                   <Megaphone className="w-5 h-5 text-purple-600" />
                              </div>
                              플로우 배너 등록
                         </h2>
                         <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                              <X className="w-5 h-5 text-gray-500" />
                         </button>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                         <div className="bg-yellow-50 p-4 rounded-2xl mb-4 border border-yellow-100">
                              <p className="text-sm text-yellow-800 font-bold mb-1">📢 모두에게 알리기</p>
                              <p className="text-xs text-yellow-700">
                                   메인 화면 상단에 내 메시지가 흘러갑니다.<br />
                                   동네 사람들에게 하고 싶은 말을 적어보세요!
                              </p>
                              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-yellow-900">
                                   <span>비용:</span>
                                   <span className="bg-white px-2 py-0.5 rounded border border-yellow-200 shadow-sm flex items-center gap-1">
                                        🫘 {cost}
                                   </span>
                              </div>
                         </div>

                         <textarea
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="예) 강아지를 찾습니다! 운정역 근처에서 보신 분 연락주세요 ㅠㅠ"
                              className="w-full h-32 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-purple-300 focus:bg-white focus:outline-none p-4 text-sm font-bold resize-none transition-all placeholder-gray-400"
                              maxLength={50}
                         />
                         <div className="text-right text-xs text-gray-400 mt-2">
                              {message.length}/50자
                         </div>
                    </div>

                    {/* Footer */}
                    <button
                         onClick={handleSubmit}
                         disabled={userBeanCount < cost || !message.trim()}
                         className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${userBeanCount < cost || !message.trim()
                                   ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                   : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg hover:shadow-purple-200 hover:scale-[1.02] active:scale-[0.98]'
                              }`}
                    >
                         {userBeanCount < cost ? '콩이 부족해요 😭' : '등록하기'}
                    </button>
               </div>
          </div>
     );
};

export default BannerWriteModal;
