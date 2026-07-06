import React, { useState, useEffect } from 'react';
import { X, Camera, PenTool, MessageCircle, Star, Zap, CheckCircle, ChevronRight, User } from 'lucide-react';

const ActivityRewardCenter = ({ onClose, onRewardClaim, onOpenCreatePost, currentBeanCount }) => {
     const [charmScore, setCharmScore] = useState(35); // Initial score
     const [userLevel, setUserLevel] = useState('새싹 🌱');
     const [uploadedImage, setUploadedImage] = useState(null);
     const [showConfetti, setShowConfetti] = useState(false);
     const [rewardAmount, setRewardAmount] = useState(0);

     // Calculate level based on score
     useEffect(() => {
          if (charmScore >= 80) setUserLevel('강남 인싸 😎');
          else if (charmScore >= 50) setUserLevel('동네 이웃 🏠');
          else setUserLevel('강남 새싹 🌱');
     }, [charmScore]);

     const handlePhotoUpload = (e) => {
          const file = e.target.files[0];
          if (file) {
               const reader = new FileReader();
               reader.onloadend = () => {
                    setUploadedImage(reader.result);
                    triggerReward(20);
                    setCharmScore(prev => Math.min(prev + 50, 100)); // Boost score
               };
               reader.readAsDataURL(file);
          }
     };

     const triggerReward = (amount) => {
          setRewardAmount(amount);
          setShowConfetti(true);
          onRewardClaim(amount);
          setTimeout(() => setShowConfetti(false), 2500);
     };

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">

               {/* Reward Animation Overlay */}
               {showConfetti && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
                         <div className="text-6xl animate-bounce mb-4">⚡</div>
                         <h2 className="text-4xl font-black text-yellow-400 drop-shadow-lg animate-in zoom-in spin-in duration-500">
                              +{rewardAmount} 온 획득!
                         </h2>
                         <p className="text-white mt-2 font-bold text-lg drop-shadow-md">매력도가 상승했습니다! 🚀</p>
                         {/* Simple CSS Confetti (simulated by multiple elements) */}
                         <div className="absolute inset-0 overflow-hidden">
                              {[...Array(20)].map((_, i) => (
                                   <div key={i} className="absolute animate-pulse" style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        fontSize: `${Math.random() * 20 + 10}px`,
                                        animationDelay: `${Math.random()}s`
                                   }}>✨</div>
                              ))}
                         </div>
                    </div>
               )}

               <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 relative overflow-hidden text-center text-white">
                         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                         <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                              <X className="w-6 h-6" />
                         </button>

                         <div className="relative z-10">
                              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-3 border border-white/10">
                                   {userLevel}
                              </span>
                              <h2 className="text-2xl font-black mb-1">매력적인 이웃이 되어보세요! 😎</h2>
                              <p className="text-purple-200 text-sm mb-6">활동하면 온이 쏟아집니다 ⚡</p>

                              {/* Progress Bar */}
                              <div className="relative pt-2">
                                   <div className="flex justify-between text-xs font-bold text-purple-200 mb-1">
                                        <span>매력도 {charmScore}%</span>
                                        <span>목표 100%</span>
                                   </div>
                                   <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                                        <div
                                             className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000 ease-out relative"
                                             style={{ width: `${charmScore}%` }}
                                        >
                                             <div className="absolute top-0 right-0 w-full h-full bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* Mission List */}
                    <div className="p-6 bg-gray-50 h-[400px] overflow-y-auto">
                         <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-500" /> 추천 미션
                         </h3>

                         <div className="space-y-4">

                              {/* Mission 1: Profile Photo (High Reward) */}
                              <div className={`relative bg-white p-5 rounded-2xl shadow-sm border-2 transition-all ${uploadedImage ? 'border-green-400 bg-green-50' : 'border-purple-100 hover:border-purple-300'}`}>
                                   {uploadedImage && (
                                        <div className="absolute top-3 right-3 text-green-600 bg-white rounded-full p-1 shadow-sm">
                                             <CheckCircle className="w-5 h-5" />
                                        </div>
                                   )}
                                   <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${uploadedImage ? 'bg-green-100' : 'bg-purple-50'}`}>
                                             {uploadedImage ? (
                                                  <img src={uploadedImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                             ) : (
                                                  <Camera className="w-7 h-7 text-purple-500" />
                                             )}
                                        </div>
                                        <div className="flex-1">
                                             <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                  얼굴 공개하고 매력 발산
                                                  {!uploadedImage && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">HOT</span>}
                                             </h4>
                                             <p className="text-xs text-gray-500 mt-1 mb-3">
                                                  실제 사진이 있으면 매칭 확률이 <span className="text-purple-600 font-bold">200%</span> 올라가요!
                                             </p>

                                             {!uploadedImage ? (
                                                  <label className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:shadow-lg hover:scale-105 transition-all">
                                                       <Camera className="w-3 h-3" />
                                                       사진 올리고 +20온
                                                       <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                                  </label>
                                             ) : (
                                                  <span className="text-xs font-bold text-green-600">보상 지급 완료! (+20온)</span>
                                             )}
                                        </div>
                                   </div>
                              </div>

                              {/* Mission 2: Write Post */}
                              <button
                                   onClick={() => {
                                        onClose();
                                        onOpenCreatePost();
                                   }}
                                   className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 transition-all text-left group"
                              >
                                   <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                             <PenTool className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1">
                                             <div className="flex justify-between items-start">
                                                  <h4 className="font-bold text-gray-900">오늘 강남 이야기 쓰기</h4>
                                                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">+5온</span>
                                             </div>
                                             <p className="text-xs text-gray-500 mt-1">
                                                  이웃들에게 재미있는 소식을 전해주세요.
                                             </p>
                                        </div>
                                   </div>
                              </button>

                              {/* Mission 3: Comment (Passive) */}
                              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                   <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                             <MessageCircle className="w-6 h-6 text-orange-500" />
                                        </div>
                                        <div className="flex-1">
                                             <div className="flex justify-between items-start">
                                                  <h4 className="font-bold text-gray-900">따뜻한 댓글 남기기</h4>
                                                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">+2온</span>
                                             </div>
                                             <p className="text-xs text-gray-500 mt-1">
                                                  이웃의 글에 공감과 댓글을 남겨보세요.
                                             </p>
                                        </div>
                                   </div>
                              </div>

                         </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white border-t border-gray-100 text-center">
                         <button onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-gray-600">
                              다음에 할게요
                         </button>
                    </div>

               </div>
          </div>
     );
};

export default ActivityRewardCenter;
