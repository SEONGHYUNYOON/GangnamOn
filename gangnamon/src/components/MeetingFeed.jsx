import React, { useState } from 'react';
import { MapPin, Users, Star, Calendar, ChevronRight } from 'lucide-react';
import MeetingDetail from './MeetingDetail';

const MeetingFeed = ({ items }) => {
     const [selectedMeeting, setSelectedMeeting] = useState(null);

     return (
          <>
               <div className="space-y-6">
                    <div className="flex justify-between items-end px-2">
                         <h2 className="text-xl font-bold text-gray-900">🔥 지금 핫한 강남 모임</h2>
                         <button className="text-sm text-purple-600 font-bold hover:underline underline-offset-4 flex items-center">
                              전체 모임 일정 보기 <ChevronRight className="w-4 h-4 ml-1" />
                         </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                         {items && items.map((item) => (
                              <div
                                   key={item.id}
                                   onClick={() => setSelectedMeeting(item)}
                                   className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all cursor-pointer group"
                              >
                                   <div className="flex gap-5">
                                        {/* Left: Thumbnail Image */}
                                        <div className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden relative">
                                             <img
                                                  src={item.image}
                                                  alt={item.title}
                                                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                             />

                                             {/* Image Overlay Badge */}
                                             {item.isHot && (
                                                  <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                                                       🔥 HOT
                                                  </div>
                                             )}
                                             {item.status === 'imminent' && (
                                                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                                                       마감임박
                                                  </div>
                                             )}
                                        </div>

                                        {/* Right: Content */}
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                             <div>
                                                  {/* Category & Badge */}
                                                  <div className="flex items-center gap-2 mb-2">
                                                       <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                                            {item.category}
                                                       </span>
                                                  </div>

                                                  {/* Title */}
                                                  <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-snug mb-2 group-hover:text-purple-700 transition-colors line-clamp-2">
                                                       {item.title}
                                                  </h3>

                                                  {/* Location Tags */}
                                                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-3 font-medium">
                                                       <MapPin className="w-3.5 h-3.5" />
                                                       <span>{item.location}</span>
                                                  </div>
                                             </div>

                                             {/* Footer Info: Host, Date, Participants */}
                                             <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                                                  <div className="flex items-center gap-3">
                                                       <div className="flex items-center gap-2">
                                                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                                                            <span className="text-xs font-bold text-gray-700">{item.host}</span>
                                                       </div>
                                                       <div className="h-3 w-[1px] bg-gray-200"></div>
                                                       <div className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>{item.date}</span>
                                                       </div>
                                                  </div>

                                                  {/* Participant Status */}
                                                  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                                                       <Users className="w-3.5 h-3.5 text-gray-600" />
                                                       <span className={`text-xs font-bold ${item.participants >= item.maxParticipants ? 'text-red-500' : 'text-gray-900'
                                                            }`}>
                                                            {item.participants}/{item.maxParticipants}명
                                                       </span>
                                                       <span className="text-[10px] text-gray-400">참여중</span>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         ))}
                    </div>
               </div>

               {/* Meeting Detail Modal */}
               {selectedMeeting && (
                    <MeetingDetail
                         meeting={selectedMeeting}
                         onClose={() => setSelectedMeeting(null)}
                    />
               )}

               {!items && <div className="text-center py-4 text-gray-400">데이터가 없습니다.</div>}
          </>
     );
};

export default MeetingFeed;
