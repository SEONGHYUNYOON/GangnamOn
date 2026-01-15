import React, { useState } from 'react';
import { MapPin, Calendar, Clock, Ticket, Plus, Heart } from 'lucide-react';

const CultureClass = () => {
     const [activeFilter, setActiveFilter] = useState('전체');

     const filters = ['전체', '원데이클래스', '인문학 강연', '전시/공연', '아이와 함께'];

     const classes = [
          {
               id: 1,
               category: '원데이클래스',
               title: '헤이리 도자기 물레 체험',
               date: '10.28 (토)',
               time: '14:00',
               location: '헤이리 예술마을',
               fee: '35,000원',
               image: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&q=80&w=800',
               badge: '선착순 마감',
               dDay: 'D-3'
          },
          {
               id: 2,
               category: '인문학 강연',
               title: '밤에 읽는 파주의 역사',
               date: '10.30 (월)',
               time: '19:00',
               location: '지혜의 숲',
               fee: '무료',
               image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800',
               badge: '인기',
               dDay: 'D-5'
          },
          {
               id: 3,
               category: '전시/공연',
               title: '가을 재즈 나잇 in 운정',
               date: '11.03 (금)',
               time: '20:00',
               location: '운정 호수공원',
               fee: '무료',
               image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800',
               badge: '야외 공연',
               dDay: 'D-9'
          },
          {
               id: 4,
               category: '원데이클래스',
               title: '나만의 시그니처 향수 만들기',
               date: '11.04 (토)',
               time: '11:00',
               location: '야당역 공방거리',
               fee: '50,000원',
               image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=80&w=800',
               badge: '소수 정예',
               dDay: 'D-10'
          },
          {
               id: 5,
               category: '아이와 함께',
               title: '숲 해설사와 함께하는 자연탐험',
               date: '11.05 (일)',
               time: '10:00',
               location: '심학산 둘레길',
               fee: '5,000원',
               image: 'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?auto=format&fit=crop&q=80&w=800',
               badge: '가족 추천',
               dDay: 'D-11'
          },
          {
               id: 6,
               category: '원데이클래스',
               title: '비건 베이킹 : 쌀 쿠키 클래스',
               date: '11.07 (화)',
               time: '13:00',
               location: '문산 쿠킹스튜디오',
               fee: '45,000원',
               image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800',
               badge: '재료 포함',
               dDay: 'D-13'
          }
     ];

     const filteredClasses = activeFilter === '전체'
          ? classes
          : classes.filter(c => c.category === activeFilter);

     return (
          <div className="w-full relative min-h-screen pb-20">
               {/* Header */}
               <div className="mb-8 px-2 pt-4">
                    <h2 className="text-3xl font-black text-gray-900 mb-2 font-sans tracking-tight">
                         파주 문화 캘린더 <span className="text-purple-500">.</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-sm">
                         예술과 지식으로 채우는 당신의 특별한 하루
                    </p>
               </div>

               {/* Filter Tabs */}
               <div className="flex gap-2 overflow-x-auto pb-4 mb-6 px-1 scrollbar-hide">
                    {filters.map((filter) => (
                         <button
                              key={filter}
                              onClick={() => setActiveFilter(filter)}
                              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${activeFilter === filter
                                   ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 transform scale-105'
                                   : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50 hover:text-gray-600'
                                   }`}
                         >
                              {filter}
                         </button>
                    ))}
               </div>

               {/* Gallery Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1">
                    {filteredClasses.map((item) => (
                         <div
                              key={item.id}
                              className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-gray-100 cursor-pointer"
                         >
                              {/* Poster Image Area (3:4 Ratio) */}
                              <div className="relative aspect-[3/4] overflow-hidden">
                                   <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-95 group-hover:brightness-105"
                                   />
                                   {/* Overlay Gradient */}
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                                   {/* Badges */}
                                   <div className="absolute top-4 left-4 flex flex-col gap-2 scale-95 group-hover:scale-100 transition-transform">
                                        <span className="bg-white/90 backdrop-blur-md text-gray-900 text-xs font-black px-3 py-1.5 rounded-lg shadow-lg">
                                             {item.dDay}
                                        </span>
                                        <span className="bg-purple-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                                             {item.badge}
                                        </span>
                                   </div>

                                   {/* Like Button */}
                                   <button className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors">
                                        <Heart className="w-5 h-5" />
                                   </button>

                                   {/* Category Label on Image */}
                                   <div className="absolute bottom-4 left-4">
                                        <span className="text-white/90 text-[10px] font-bold tracking-widest uppercase bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
                                             {item.category}
                                        </span>
                                   </div>
                              </div>

                              {/* Info Section */}
                              <div className="p-6">
                                   <h3 className="text-xl font-black text-gray-900 mb-4 leading-tight group-hover:text-purple-600 transition-colors line-clamp-2">
                                        {item.title}
                                   </h3>

                                   <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                                             <Calendar className="w-4 h-4 text-purple-400" />
                                             <span>{item.date}</span>
                                             <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                             <Clock className="w-4 h-4 text-purple-400" />
                                             <span>{item.time}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                                             <MapPin className="w-4 h-4 text-purple-400" />
                                             <span>{item.location}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
                                             <Ticket className="w-4 h-4 text-purple-400" />
                                             <span className={item.fee === '무료' ? 'text-purple-600 font-bold' : ''}>{item.fee}</span>
                                        </div>
                                   </div>

                                   {/* CTA Button */}
                                   <button className="w-full py-4 rounded-xl bg-gray-50 text-gray-900 font-bold text-sm hover:bg-gray-900 hover:text-white transition-all duration-300 border border-gray-100">
                                        신청하기 🎫
                                   </button>
                              </div>
                         </div>
                    ))}
               </div>

               {/* Floating Action Button (FAB) */}
               <div className="fixed bottom-24 md:bottom-10 right-6 md:right-[22%] z-50">
                    <button
                         className="flex items-center gap-2 bg-gray-900 text-white pl-5 pr-6 py-4 rounded-full shadow-2xl hover:scale-105 hover:bg-purple-600 transition-all duration-300 group"
                         onClick={() => alert("클래스 개설 신청 페이지로 이동합니다!")}
                    >
                         <div className="bg-white/20 p-1 rounded-full group-hover:rotate-90 transition-transform duration-300">
                              <Plus className="w-5 h-5" />
                         </div>
                         <span className="font-bold">나도 클래스 열기</span>
                    </button>
               </div>
          </div>
     );
};

export default CultureClass;
