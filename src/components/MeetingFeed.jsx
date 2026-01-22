import React, { useState, useEffect } from 'react';
import { MapPin, Users, Star, Calendar, ChevronRight, Heart, Share2, Loader2, Clock } from 'lucide-react';
import MeetingDetail from './MeetingDetail';
import { supabase } from '../lib/supabase';

const EventTimer = ({ expiresAt }) => {
     const [timeLeft, setTimeLeft] = useState('');
     const [isExpired, setIsExpired] = useState(false);

     useEffect(() => {
          const calculateTimeLeft = () => {
               const difference = new Date(expiresAt) - new Date();

               if (difference <= 0) {
                    setIsExpired(true);
                    setTimeLeft('종료됨');
                    return;
               }

               const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
               const minutes = Math.floor((difference / 1000 / 60) % 60);
               const seconds = Math.floor((difference / 1000) % 60);

               setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          };

          calculateTimeLeft();
          const timer = setInterval(calculateTimeLeft, 1000);

          return () => clearInterval(timer);
     }, [expiresAt]);

     return (
          <div className={`flex items-center gap-1 text-xs font-bold ${isExpired ? 'text-gray-400' : 'text-red-500 animate-pulse'}`}>
               <Clock className="w-3.5 h-3.5" />
               <span>{isExpired ? '이벤트 종료' : `${timeLeft} 남음`}</span>
          </div>
     );
};

const MeetingFeed = ({ items: initialItems }) => {
     const [selectedMeeting, setSelectedMeeting] = useState(null);
     const [likedItems, setLikedItems] = useState(new Set());
     const [animatingHearts, setAnimatingHearts] = useState(new Set());
     const [meetings, setMeetings] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const fetchMeetings = async () => {
               setLoading(true);
               const { data, error } = await supabase
                    .from('posts')
                    .select(`
          *,
          profiles:author_id (username, avatar_url)
        `)
                    .in('type', ['gathering', 'club']) // 'event' removed to fix menu context
                    .order('created_at', { ascending: false });

               if (error) {
                    console.error("Error fetching meetings:", error);
               } else {
                    const mapped = data.map(p => ({
                         id: p.id,
                         // Handle 'event' category
                         category: p.type === 'club' ? '🏫 동호회' : (p.type === 'event' ? '🎉 이벤트' : '⚡ 번개모임'),
                         isEvent: p.type === 'event',
                         expiresAt: p.expires_at,
                         title: p.title,
                         host: p.profiles?.username || '파주주민',
                         hostBadge: '열정멤버',
                         date: new Date(p.created_at).toLocaleDateString(),
                         location: p.location_name || p.location || '장소 미정', // location_name added
                         participants: p.current_participants || 1,
                         maxParticipants: p.max_participants || 99, // default max for events
                         isHot: (p.likes_count || 0) > 5,
                         status: (p.current_participants >= (p.max_participants || 99)) ? 'closed' : 'open',
                         image: p.image_urls?.[0] || 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800'
                    }));
                    setMeetings(mapped);
               }
               setLoading(false);
          };

          fetchMeetings();
     }, []);

     const toggleLike = (e, id) => {
          e.stopPropagation();
          const newLiked = new Set(likedItems);
          if (newLiked.has(id)) {
               newLiked.delete(id);
          } else {
               newLiked.add(id);
               const newAnimating = new Set(animatingHearts);
               newAnimating.add(id);
               setAnimatingHearts(newAnimating);
               setTimeout(() => {
                    setAnimatingHearts(prev => {
                         const next = new Set(prev);
                         next.delete(id);
                         return next;
                    });
               }, 300);
          }
          setLikedItems(newLiked);
     };

     const handleShare = (e, title) => {
          e.stopPropagation();
          alert(`${title} 링크가 복사되었습니다! (시뮬레이션)`);
     };

     if (loading) {
          return (
               <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
               </div>
          );
     }

     return (
          <>
               <div className="space-y-6">
                    <div className="flex justify-between items-end px-2">
                         <h2 className="text-xl font-bold text-gray-900">🔥 지금 핫한 파주 모임</h2>
                         <button className="text-sm text-purple-600 font-bold hover:underline underline-offset-4 flex items-center">
                              전체 모임 일정 보기 <ChevronRight className="w-4 h-4 ml-1" />
                         </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                         {meetings.length > 0 ? meetings.map((item) => (
                              <div
                                   key={item.id}
                                   onClick={() => setSelectedMeeting(item)}
                                   className={`bg-white rounded-3xl p-5 border shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden ${item.isEvent ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'}`}
                              >
                                   <div className="flex gap-5">
                                        {/* Left: Thumbnail Image */}
                                        <div className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0 rounded-2xl overflow-hidden relative">
                                             <img
                                                  src={item.image}
                                                  alt={item.title}
                                                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                             />

                                             {/* Gradient Overlay */}
                                             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                                             {/* Image Overlay Badge */}
                                             {item.isHot && (
                                                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-orange-600 border border-orange-100 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                                       🔥 HOT
                                                  </div>
                                             )}
                                             {item.isEvent && (
                                                  <div className="absolute top-2 left-2 bg-purple-600/90 backdrop-blur-sm text-white border border-purple-500 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                                                       🎁 EVENT
                                                  </div>
                                             )}
                                             {item.status === 'imminent' && !item.isEvent && (
                                                  <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                                                       마감임박
                                                  </div>
                                             )}
                                        </div>

                                        {/* Right: Content */}
                                        <div className="flex-1 flex flex-col justify-between py-1 relative">

                                             {/* Top Icons Layer */}
                                             <div className="absolute top-0 right-0 flex gap-2">
                                                  <button
                                                       onClick={(e) => handleShare(e, item.title)}
                                                       className="p-2 rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                                                  >
                                                       <Share2 className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                       onClick={(e) => toggleLike(e, item.id)}
                                                       className={`p-2 rounded-full hover:bg-pink-50 transition-colors ${animatingHearts.has(item.id) ? 'animate-heart-burst' : ''}`}
                                                  >
                                                       <Heart className={`w-4 h-4 transition-colors ${likedItems.has(item.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-300'}`} />
                                                  </button>
                                             </div>

                                             <div>
                                                  {/* Category Badge */}
                                                  <div className="flex items-center gap-2 mb-2">
                                                       <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${item.isEvent ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 border-transparent' : 'text-purple-600 bg-purple-50 border-purple-100'}`}>
                                                            {item.category}
                                                       </span>
                                                  </div>

                                                  {/* Title */}
                                                  <h3 className="text-lg md:text-xl font-bold text-gray-900 leading-snug mb-2 pr-16 group-hover:text-purple-700 transition-colors line-clamp-2">
                                                       {item.title}
                                                  </h3>

                                                  {/* Location Tags */}
                                                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-3 font-medium">
                                                       <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                       <span>{item.location}</span>
                                                  </div>
                                             </div>

                                             {/* Footer Info: Host, Date, Participants */}
                                             <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                                                  <div className="flex items-center gap-3">
                                                       <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                                                                 <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-700">{item.host}</span>
                                                       </div>
                                                       <div className="h-3 w-[1px] bg-gray-200"></div>

                                                       {/* Show Timer for Events, Date for others */}
                                                       {item.isEvent && item.expiresAt ? (
                                                            <EventTimer expiresAt={item.expiresAt} />
                                                       ) : (
                                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                 <Calendar className="w-3.5 h-3.5" />
                                                                 <span>{item.date}</span>
                                                            </div>
                                                       )}
                                                  </div>

                                                  {/* Participant Status */}
                                                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                                                       <Users className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-400" />
                                                       <span className={`text-xs font-bold ${item.participants >= item.maxParticipants ? 'text-red-500' : 'text-gray-900'
                                                            }`}>
                                                            {item.participants}/{item.maxParticipants}명
                                                       </span>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              </div>
                         )) : (
                              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
                                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <Star className="w-8 h-8 text-gray-300" />
                                   </div>
                                   <p className="text-gray-500 font-bold">아직 등록된 모임이 없어요.</p>
                                   <p className="text-xs text-gray-400 mt-1">첫 번째 모임을 개설해보세요!</p>
                              </div>
                         )}
                    </div>
               </div>

               {/* Meeting Detail Modal */}
               {selectedMeeting && (
                    <MeetingDetail
                         meeting={selectedMeeting}
                         onClose={() => setSelectedMeeting(null)}
                    />
               )}
          </>
     );
};

export default MeetingFeed;
