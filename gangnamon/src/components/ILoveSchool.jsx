import React, { useState } from 'react';
import { Search, Book } from 'lucide-react';

const ILoveSchool = () => {
     const [searchTerm, setSearchTerm] = useState('');

     // Mock Data
     const popularCohorts = [
          { id: 1, school: '문산고', logo: '🏫', round: 25, year: 2008, color: 'bg-blue-50 text-blue-600' },
          { id: 2, school: '금촌중', logo: '🎒', round: 12, year: 2010, color: 'bg-green-50 text-green-600' },
          { id: 3, school: '파주여고', logo: '🎀', round: 30, year: 2005, color: 'bg-pink-50 text-pink-600' },
          { id: 4, school: '교하고', logo: '🌲', round: 8, year: 2015, color: 'bg-indigo-50 text-indigo-600' },
          { id: 5, school: '봉일천고', logo: '🌥️', round: 15, year: 2012, color: 'bg-orange-50 text-orange-600' },
     ];

     return (
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100 mb-8">

               {/* Header */}
               <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg text-white">
                         <Book className="w-5 h-5" />
                    </div>
                    <div>
                         <h2 className="text-lg font-bold text-gray-900">아이러브스쿨</h2>
                         <p className="text-xs text-gray-400">그때 그 시절 친구들을 찾아보세요</p>
                    </div>
               </div>

               {/* Large Search Bar */}
               <div className="relative mb-8">
                    <input
                         type="text"
                         placeholder="학교 이름이나 졸업년도를 검색해보세요"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all text-sm placeholder-gray-400 font-medium"
                    />
                    <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
               </div>

               {/* Horizontal Scroll - Popular Cohorts */}
               <div>
                    <div className="flex justify-between items-end mb-4 px-1">
                         <h3 className="font-bold text-gray-800 text-sm">🔥 요즘 뜨는 동창회</h3>
                         <span className="text-xs text-gray-400 cursor-pointer hover:text-purple-500 transition-colors">전체보기</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                         {popularCohorts.map((item) => (
                              <div
                                   key={item.id}
                                   className="flex-shrink-0 w-40 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer snap-start group"
                              >
                                   <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-xl mb-3`}>
                                        {item.logo}
                                   </div>
                                   <div className="mb-1">
                                        <span className="text-[10px] text-gray-400 block mb-0.5">{item.year}년 졸업</span>
                                        <h4 className="font-bold text-gray-900 text-base group-hover:text-purple-600 transition-colors">
                                             {item.school} <span className="text-sm font-normal text-gray-500">{item.round}회</span>
                                        </h4>
                                   </div>
                              </div>
                         ))}
                    </div>
               </div>
          </div>
     );
};

export default ILoveSchool;
