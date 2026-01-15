import React, { useState, useEffect } from 'react';
import { X, Dice5, Check, Lock, ShoppingBag, Sparkles, User, Palette } from 'lucide-react';

const AvatarCustomizer = ({ onClose, onSave, currentAvatarUrl, unlockedStyles = [], userBeanCount = 0, onPurchaseStyle }) => {
     const [activeTab, setActiveTab] = useState('customize'); // 'customize' or 'shop'
     const [style, setStyle] = useState('lorelei');
     const [seed, setSeed] = useState('Felix');
     const [bgColor, setBgColor] = useState('b6e3f4');
     const [purchaseModalOpen, setPurchaseModalOpen] = useState(null); // Stores style object to buy

     // Expanded Style List with Premium Options
     const styles = [
          // Free Styles
          { id: 'lorelei', name: '순정 만화', icon: '🌸', price: 0, desc: '사랑스러운 만화 주인공 스타일' },
          { id: 'avataaars', name: '베이직', icon: '🙂', price: 0, desc: '가장 무난하고 깔끔한 스타일' },

          // Premium Styles (Cute & Feminine)
          { id: 'micah', name: '감성 일러스트', icon: '🎨', price: 300, desc: '부드러운 색감의 드로잉', premium: true },
          { id: 'miniavs', name: '미니미', icon: '🐣', price: 150, desc: '작고 소중한 미니 캐릭터', premium: true },
          { id: 'open-peeps', name: '힙스터', icon: '🕶️', price: 200, desc: '트렌디한 흑백 손그림', premium: true },
          { id: 'adventurer', name: '모험가', icon: '🎒', price: 100, desc: '활동적인 느낌 뿜뿜!', premium: true },
          { id: 'big-smile', name: '스마일', icon: '😁', price: 150, desc: '보기만 해도 기분 좋은 미소', premium: true },
          { id: 'personas', name: '페르소나', icon: '🎭', price: 250, desc: '개성 넘치는 아트 스타일', premium: true },
     ];

     useEffect(() => {
          if (currentAvatarUrl) {
               try {
                    const url = new URL(currentAvatarUrl);
                    const pathParts = url.pathname.split('/');
                    if (pathParts.length >= 3) {
                         // Only set style if it's unlocked, otherwise default to lorelei
                         const urlStyle = pathParts[2];
                         if (unlockedStyles.includes(urlStyle)) {
                              setStyle(urlStyle);
                         }
                    }
                    const seedParam = url.searchParams.get('seed');
                    if (seedParam) setSeed(seedParam);
               } catch (e) { }
          }
     }, [currentAvatarUrl, unlockedStyles]);

     const generateUrl = (s = style) => {
          return `https://api.dicebear.com/7.x/${s}/svg?seed=${seed}&backgroundColor=${bgColor}`;
     };

     const handleRandomize = () => {
          setSeed(Math.random().toString(36).substring(7));
          // Random pastel colors
          const colors = ['ffdfd3', 'e2f0cb', 'b5ead7', 'c7ceea', 'fec8d8', 'e0bbe4'];
          setBgColor(colors[Math.floor(Math.random() * colors.length)]);
     };

     const handleSave = () => {
          onSave(generateUrl());
          onClose();
     };

     const handleSelectStyle = (s) => {
          if (s.price > 0 && !unlockedStyles.includes(s.id)) {
               setPurchaseModalOpen(s);
          } else {
               setStyle(s.id);
          }
     };

     const executePurchase = () => {
          if (purchaseModalOpen) {
               const success = onPurchaseStyle(purchaseModalOpen.id, purchaseModalOpen.price);
               if (success) {
                    setStyle(purchaseModalOpen.id);
                    setPurchaseModalOpen(null);
               }
          }
     };

     return (
          <div
               className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
               onClick={onClose}
          >
               <div
                    className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
               >
                    {/* Header with Tabs */}
                    <div className="px-6 pt-6 pb-2 bg-white z-10">
                         <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                   <div className="bg-purple-100 p-2 rounded-full">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                   </div>
                                   파주 뷰티샵
                              </h2>

                              <div className="flex items-center gap-3">
                                   <div className="px-3 py-1 bg-yellow-100 rounded-full border border-yellow-200 flex items-center gap-1">
                                        <span className="text-xs">🫘</span>
                                        <span className="text-xs font-bold text-yellow-700">{userBeanCount.toLocaleString()}</span>
                                   </div>
                                   <button
                                        onClick={onClose}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                   >
                                        <X className="w-5 h-5 text-gray-500" />
                                   </button>
                              </div>
                         </div>

                         {/* Tabs */}
                         <div className="flex p-1 bg-gray-100 rounded-2xl mb-2">
                              <button
                                   onClick={() => setActiveTab('customize')}
                                   className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'customize'
                                             ? 'bg-white text-gray-900 shadow-sm'
                                             : 'text-gray-400 hover:text-gray-600'
                                        }`}
                              >
                                   <Palette className="w-4 h-4" /> 내 파우더룸
                              </button>
                              <button
                                   onClick={() => setActiveTab('shop')}
                                   className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'shop'
                                             ? 'bg-white text-pink-600 shadow-sm'
                                             : 'text-gray-400 hover:text-gray-600'
                                        }`}
                              >
                                   <ShoppingBag className="w-4 h-4" /> 스타일 상점
                              </button>
                         </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">

                         {/* === Customized Preview Area (Always Visible but styled differently based on context) === */}
                         <div className="w-full bg-white pb-8 rounded-b-[2.5rem] shadow-sm mb-6 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-b from-purple-50 to-white opacity-50 pointer-events-none" />

                              <div className="flex justify-center relative pt-4">
                                   <div className="w-48 h-48 rounded-full border-8 border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden bg-white relative group">
                                        <img
                                             src={generateUrl()}
                                             alt="Avatar Preview"
                                             className="w-full h-full object-cover"
                                        />
                                        <button
                                             onClick={handleRandomize}
                                             className="absolute bottom-2 right-2 p-3 bg-white text-purple-600 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border border-purple-100 z-10"
                                             title="랜덤 생성"
                                        >
                                             <Dice5 className="w-5 h-5" />
                                        </button>
                                   </div>
                              </div>

                              <div className="text-center mt-6 px-6">
                                   <div className="inline-flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-50 transition-all w-full max-w-xs cursor-text">
                                        <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                                        <input
                                             type="text"
                                             value={seed}
                                             onChange={(e) => setSeed(e.target.value)}
                                             className="bg-transparent w-full font-bold text-gray-700 focus:outline-none placeholder-gray-400 text-center"
                                             placeholder="이름 입력 (예: Felix)"
                                        />
                                   </div>
                                   <p className="text-xs text-gray-400 mt-2">✨ 이름을 바꾸면 얼굴이 달라져요!</p>
                              </div>
                         </div>

                         {/* === Tab Content === */}
                         <div className="px-6 pb-24">
                              {activeTab === 'customize' ? (
                                   /* CUSTOMIZE TAB */
                                   <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">보유한 스타일</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                             {styles.filter(s => unlockedStyles.includes(s.id)).map((s) => (
                                                  <button
                                                       key={s.id}
                                                       onClick={() => setStyle(s.id)}
                                                       className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${style === s.id
                                                                 ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 ring-offset-2'
                                                                 : 'border-white bg-white shadow-sm hover:border-purple-100'
                                                            }`}
                                                  >
                                                       <div className="flex justify-between items-start mb-2">
                                                            <span className="text-2xl">{s.icon}</span>
                                                            {style === s.id && <Check className="w-5 h-5 text-purple-600 bg-white rounded-full p-1" />}
                                                       </div>
                                                       <div className="font-bold text-gray-900">{s.name}</div>
                                                       <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">{s.desc}</div>

                                                       {/* Live Preview Background (Optional enhancement) */}
                                                       <img
                                                            src={`https://api.dicebear.com/7.x/${s.id}/svg?seed=${seed}&backgroundColor=transparent`}
                                                            className="absolute -right-4 -bottom-4 w-20 h-20 opacity-20 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6"
                                                            alt="bg"
                                                       />
                                                  </button>
                                             ))}
                                        </div>
                                   </div>
                              ) : (
                                   /* SHOP TAB */
                                   <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">프리미엄 상점</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                             {styles.filter(s => !unlockedStyles.includes(s.id)).map((s) => (
                                                  <button
                                                       key={s.id}
                                                       onClick={() => handleSelectStyle(s)}
                                                       className="p-4 rounded-2xl border-2 border-white bg-white shadow-sm text-left relative overflow-hidden group hover:shadow-md transition-all active:scale-95"
                                                  >
                                                       <div className="absolute top-3 right-3 bg-black/5 p-1.5 rounded-full z-10">
                                                            <Lock className="w-3 h-3 text-gray-500" />
                                                       </div>

                                                       <div className="w-full h-24 bg-gray-50 rounded-xl mb-3 overflow-hidden relative">
                                                            <img
                                                                 src={`https://api.dicebear.com/7.x/${s.id}/svg?seed=${seed}&backgroundColor=${bgColor}`}
                                                                 className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                                 alt={s.name}
                                                            />
                                                       </div>

                                                       <div className="font-bold text-gray-900 text-sm mb-1">{s.name}</div>
                                                       <div className="flex items-center gap-1">
                                                            <span className="text-xs">🫘</span>
                                                            <span className="text-sm font-black text-purple-600">{s.price}</span>
                                                       </div>
                                                  </button>
                                             ))}
                                             {styles.filter(s => !unlockedStyles.includes(s.id)).length === 0 && (
                                                  <div className="col-span-2 text-center py-10 text-gray-400">
                                                       모든 스타일을 보유하고 있어요! 💖
                                                  </div>
                                             )}
                                        </div>
                                   </div>
                              )}
                         </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-white border-t border-gray-100 absolute bottom-0 w-full rounded-b-[2rem]">
                         <button
                              onClick={handleSave}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                         >
                              <Check className="w-5 h-5" />
                              이 모습으로 저장하기
                         </button>
                    </div>

                    {/* === Purchase Confirmation Modal Overlay === */}
                    {purchaseModalOpen && (
                         <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
                              <div className="bg-white w-full rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
                                   <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <ShoppingBag className="w-8 h-8 text-purple-600" />
                                   </div>
                                   <h3 className="text-xl font-black text-gray-900 mb-2">스타일 구매</h3>
                                   <p className="text-gray-500 mb-6 text-sm">
                                        <span className="font-bold text-purple-600">'{purchaseModalOpen.name}'</span> 스타일을<br />
                                        구매하시겠습니까?
                                   </p>

                                   <div className="bg-yellow-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                                        <span className="text-sm text-gray-500">내 보유 콩</span>
                                        <span className="font-bold text-gray-900">{userBeanCount.toLocaleString()} ➔ {(userBeanCount - purchaseModalOpen.price).toLocaleString()}</span>
                                   </div>

                                   <div className="flex gap-2">
                                        <button
                                             onClick={() => setPurchaseModalOpen(null)}
                                             className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200"
                                        >
                                             취소
                                        </button>
                                        <button
                                             onClick={executePurchase}
                                             className="flex-1 py-3 font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200"
                                        >
                                             {purchaseModalOpen.price} 콩 결제
                                        </button>
                                   </div>
                              </div>
                         </div>
                    )}
               </div>
          </div>
     );
};

export default AvatarCustomizer;
