import React, { useState } from 'react';
import {
     MapPin, Clock, Phone, Heart, Bookmark, MessageCircle,
     X, ChevronLeft, ChevronRight, Car, Store
} from 'lucide-react';
import KakaoMap from './KakaoMap';

const LocalBiz = () => {
     const [activeCategory, setActiveCategory] = useState('전체');
     const [selectedStore, setSelectedStore] = useState(null);
     const [currentImageIndex, setCurrentImageIndex] = useState(0);

     const categories = [
          '전체', '☕️카페·디저트', '💅뷰티·힐링', '🐶댕댕·집사', '🍝맛집·무드', '🛍️소품·공방'
     ];

     // Mock Data
     const stores = [
          {
               id: 1,
               name: '카페 멜로우',
               category: '☕️카페·디저트',
               owner: '멜로우사장',
               avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mellow',
               images: [
                    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800'
               ],
               hashtags: ['#역삼카페', '#디저트맛집', '#감성카페'],
               location: '서울 강남구 역삼동 943-1',
               time: '10:00 - 22:00 (매주 월 휴무)',
               parking: '가게 앞 3대 가능',
               likes: 128,
               isBookmarked: false
          },
          {
               id: 2,
               name: '네일드림',
               category: '💅뷰티·힐링',
               owner: '네일아티스트',
               avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nail',
               images: [
                    'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80&w=800'
               ],
               hashtags: ['#강남네일', '#이달의아트', '#유지력갑'],
               location: '서울 강남구 삼성동 로타리 부근',
               time: '11:00 - 20:00 (예약제)',
               parking: '공영주차장 이용',
               likes: 85,
               isBookmarked: true
          },
          {
               id: 3,
               name: '멍멍살롱',
               category: '🐶댕댕·집사',
               owner: '개통령',
               avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dog',
               images: [
                    'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800'
               ],
               hashtags: ['#애견미용', '#강남애견', '#스파전문'],
               location: '서울 강남구 논현동 1024',
               time: '10:00 - 19:00',
               parking: '건물 지하주차장',
               likes: 210,
               isBookmarked: false
          },
          {
               id: 4,
               name: '강남옥',
               category: '🍝맛집·무드',
               owner: '강남쉐프',
               avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chef',
               images: [
                    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800'
               ],
               hashtags: ['#파스타', '#데이트코스', '#분위기깡패'],
               location: '서울 강남구 청담동',
               time: '11:30 - 21:00 (브레이크타임 有)',
               parking: '전용 주차장 완비',
               likes: 342,
               isBookmarked: true
          },
          {
               id: 5,
               name: '스튜디오 봄',
               category: '🛍️소품·공방',
               owner: '봄봄',
               avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spring',
               images: [
                    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1456086272160-b28b3a0b949d?auto=format&fit=crop&q=80&w=800'
               ],
               hashtags: ['#도자기공방', '#원데이클래스', '#이색데이트'],
               location: '서울 강남구 신사동',
               time: '13:00 - 18:00',
               parking: '갓길 주차 가능',
               likes: 56,
               isBookmarked: false
          }
     ];

     const filteredStores = activeCategory === '전체'
          ? stores
          : stores.filter(store => store.category === activeCategory);

     const openStoreDetail = (store) => {
          setSelectedStore(store);
          setCurrentImageIndex(0);
     };

     const nextImage = (e) => {
          e.stopPropagation();
          if (selectedStore) {
               setCurrentImageIndex((prev) => (prev + 1) % selectedStore.images.length);
          }
     };

     const prevImage = (e) => {
          e.stopPropagation();
          if (selectedStore) {
               setCurrentImageIndex((prev) => (prev - 1 + selectedStore.images.length) % selectedStore.images.length);
          }
     };

     return (
          <div className="w-full h-full flex flex-col">

               {/* 1. Category Filter (Sticky Header) */}
               <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm -mx-2 px-2 py-3 border-b border-gray-100 mb-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                         {categories.map((cat) => (
                              <button
                                   key={cat}
                                   onClick={() => setActiveCategory(cat)}
                                   className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${activeCategory === cat
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}
                              >
                                   {cat}
                              </button>
                         ))}
                    </div>
               </div>

               {/* 2. Masonry Grid Feed */}
               <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {filteredStores.map((store) => (
                         <div
                              key={store.id}
                              onClick={() => openStoreDetail(store)}
                              className="break-inside-avoid bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all group border border-gray-100 hover:scale-[1.02]"
                         >
                              {/* Image Area */}
                              <div className="relative">
                                   <img
                                        src={store.images[0]}
                                        alt={store.name}
                                        className="w-full object-cover h-auto min-h-[160px]"
                                   />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                   {/* Bookmark Icon */}
                                   <button className="absolute bottom-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-purple-600 transition-colors">
                                        <Bookmark className={`w-4 h-4 ${store.isBookmarked ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                   </button>
                              </div>

                              {/* Info Area */}
                              <div className="p-4">
                                   <h3 className="font-bold text-gray-900 text-lg mb-1">{store.name}</h3>
                                   <div className="flex flex-wrap gap-1 text-xs text-gray-400 font-medium mb-3">
                                        {store.hashtags.map((tag, i) => (
                                             <span key={i}>{tag}</span>
                                        ))}
                                   </div>
                                   <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                                        <Heart className="w-3.5 h-3.5" />
                                        <span>{store.likes}</span>
                                   </div>
                              </div>
                         </div>
                    ))}
               </div>

               {/* 3. Empty State */}
               {filteredStores.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                         <Store className="w-16 h-16 mb-4 opacity-50" />
                         <p className="font-bold">아직 등록된 가게가 없어요</p>
                    </div>
               )}

               {/* 4. Detail Modal (Mini Insta Style) */}
               {selectedStore && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedStore(null)}>
                         <div
                              className="bg-white w-full max-w-sm md:max-w-md h-[85vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative"
                              onClick={(e) => e.stopPropagation()}
                         >
                              {/* Header */}
                              <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
                                   <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                             <img src={selectedStore.avatar} alt="owner" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-bold text-sm text-gray-900">{selectedStore.owner}</span>
                                   </div>
                                   <button onClick={() => setSelectedStore(null)} className="text-gray-400 hover:text-gray-900">
                                        <X className="w-6 h-6" />
                                   </button>
                              </div>

                              {/* Scrollable Content */}
                              <div className="flex-1 overflow-y-auto no-scrollbar pb-20">

                                   {/* Image Carousel */}
                                   <div className="relative aspect-square bg-gray-100 group">
                                        <img
                                             src={selectedStore.images[currentImageIndex]}
                                             alt="content"
                                             className="w-full h-full object-cover"
                                        />

                                        {/* Arrows */}
                                        {selectedStore.images.length > 1 && (
                                             <>
                                                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <ChevronLeft className="w-5 h-5" />
                                                  </button>
                                                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <ChevronRight className="w-5 h-5" />
                                                  </button>

                                                  {/* Indicators */}
                                                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                                                       {selectedStore.images.map((_, idx) => (
                                                            <div
                                                                 key={idx}
                                                                 className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-white w-2 h-2' : 'bg-white/50'
                                                                      }`}
                                                            />
                                                       ))}
                                                  </div>
                                             </>
                                        )}
                                   </div>

                                   {/* Info Section */}
                                   <div className="p-5 space-y-6">
                                        {/* Title & Actions */}
                                        <div className="flex justify-between items-start">
                                             <div>
                                                  <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedStore.name}</h2>
                                                  <p className="text-sm text-purple-600 font-bold">{selectedStore.category}</p>
                                             </div>
                                             <div className="flex gap-2">
                                                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                       <Heart className="w-6 h-6 text-gray-900" />
                                                  </button>
                                                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                                       <Bookmark className="w-6 h-6 text-gray-900" />
                                                  </button>
                                             </div>
                                        </div>

                                        {/* Hashtags */}
                                        <p className="text-sm text-gray-500/90 leading-relaxed font-medium">
                                             {selectedStore.hashtags.join('  ')}
                                             <br /><br />
                                             안녕하세요! {selectedStore.name}입니다.
                                             정성을 다해 모시겠습니다. 편하게 문의주세요! 🙇‍♂️
                                        </p>

                                        {/* Meta Info (Icons) */}
                                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                             <div className="flex items-start gap-3">
                                                  <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                                  <div>
                                                       <p className="text-xs font-bold text-gray-400 mb-0.5">위치</p>
                                                       <p className="text-sm font-bold text-gray-900">{selectedStore.location}</p>
                                                  </div>
                                             </div>
                                             <div className="flex items-start gap-3">
                                                  <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                                  <div>
                                                       <p className="text-xs font-bold text-gray-400 mb-0.5">영업시간</p>
                                                       <p className="text-sm font-bold text-gray-900">{selectedStore.time}</p>
                                                  </div>
                                             </div>
                                             <div className="flex items-start gap-3">
                                                  <Car className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                                  <div>
                                                       <p className="text-xs font-bold text-gray-400 mb-0.5">주차정보</p>
                                                       <p className="text-sm font-bold text-gray-900">{selectedStore.parking}</p>
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Create Map Area */}
                                        <div className="pt-2">
                                             <h4 className="font-bold text-gray-900 mb-3 text-sm">위치 보기</h4>
                                             {/* Pass dummy lat/lng for demo purposes since mock data doesn't have it yet */}
                                             <KakaoMap
                                                  latitude={selectedStore.lat || 37.751853}
                                                  longitude={selectedStore.lng || 126.764666}
                                             />
                                        </div>
                                   </div>
                              </div>

                              {/* Sticky Footer Actions */}
                              <div className="p-4 bg-white border-t border-gray-100 grid grid-cols-2 gap-3 shrink-0">
                                   <button className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                        <MessageCircle className="w-4 h-4" /> 문의하기
                                   </button>
                                   <button className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                                        <Phone className="w-4 h-4" /> 전화/예약
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default LocalBiz;
