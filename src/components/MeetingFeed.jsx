import React, { useState, useEffect } from 'react';
import { MapPin, Users, Star, Calendar, ChevronRight, Heart, Share2, Loader2, Clock } from 'lucide-react';
import MeetingDetail from './MeetingDetail';

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

const MeetingFeed = ({
     items,
     onStartChat,
     user,
     title = '지금 핫한 강남 모임',
     actionLabel = '전체 모임 일정 보기',
     emptyTitle = '아직 등록된 모임이 없어요.',
     emptyDescription = '첫 번째 모임을 개설해보세요!',
}) => {
     const [selectedMeeting, setSelectedMeeting] = useState(null);
     const [likedItems, setLikedItems] = useState(new Set());
     const [animatingHearts, setAnimatingHearts] = useState(new Set());

     // Remove internal fetching - use "items" prop passed from App.jsx
     // items are already mapped in App.jsx

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

     const handleHostChat = (event, item) => {
          event.stopPropagation();
          if (!item.hostId || !onStartChat) return;
          onStartChat({
               $id: item.hostId,
               username: item.host,
               fullName: item.host,
               avatarUrl: item.hostAvatarUrl || '',
          });
     };

     if (!items) {
          return (
               <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
               </div>
          );
     }

     return (
          <>
               <div className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                         <h2 className="text-lg font-black text-gray-900">{title}</h2>
                         <button className="text-xs text-brand-accent font-bold hover:underline underline-offset-4 flex items-center">
                              {actionLabel} <ChevronRight className="w-4 h-4 ml-1" />
                         </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                         {items.length > 0 ? items.map((item) => (
                              <div
                                   key={item.id}
                                   onClick={() => setSelectedMeeting(item)}
                                   className={`bg-white rounded-card p-3 border shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group relative overflow-hidden ${item.isEvent ? 'border-brand-gold/30 ring-1 ring-brand-gold/10' : 'border-surface-border'}`}
                              >
                                   <div className="flex gap-3">
                                        {/* Left: Thumbnail Image */}
                                        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden relative">
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
                                        <div className="min-w-0 flex-1 flex flex-col justify-between relative">

                                             {/* Top Icons Layer */}
                                             <div className="absolute top-0 right-0 flex gap-1">
                                                  <button
                                                       onClick={(e) => handleShare(e, item.title)}
                                                       className="p-1.5 rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                                                  >
                                                       <Share2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                       onClick={(e) => toggleLike(e, item.id)}
                                                       className={`p-1.5 rounded-full hover:bg-pink-50 transition-colors ${animatingHearts.has(item.id) ? 'animate-heart-burst' : ''}`}
                                                  >
                                                       <Heart className={`w-3.5 h-3.5 transition-colors ${likedItems.has(item.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-300'}`} />
                                                  </button>
                                             </div>

                                             <div>
                                                  {/* Category Badge */}
                                                  <div className="flex items-center gap-2 mb-1.5">
                                                       <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${item.isEvent ? 'text-white bg-brand border-transparent' : 'text-brand-accent bg-brand-light border-brand-gold/20'}`}>
                                                            {item.category}
                                                       </span>
                                                  </div>

                                                  {/* Title */}
                                                  <h3 className="text-base font-black text-gray-900 leading-snug mb-1.5 pr-12 group-hover:text-brand-accent transition-colors line-clamp-2">
                                                       {item.title}
                                                  </h3>

                                                  {/* Location Tags */}
                                                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-2 font-medium">
                                                       <MapPin className="w-3 h-3 text-gray-400" />
                                                       <span className="truncate">{item.location}</span>
                                                  </div>
                                             </div>

                                             {/* Footer Info: Host, Date, Participants */}
                                             <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                                                  <div className="min-w-0 flex items-center gap-2">
                                                       <button
                                                            type="button"
                                                            onClick={(event) => handleHostChat(event, item)}
                                                            disabled={!item.hostId || !onStartChat}
                                                            className="flex min-w-0 items-center gap-2 rounded-full pr-1 text-left disabled:cursor-default enabled:hover:bg-brand-light"
                                                            title={item.hostId ? '1:1 대화하기' : undefined}
                                                       >
                                                            <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center">
                                                                 <Star className="w-2.5 h-2.5 text-yellow-600 fill-yellow-600" />
                                                            </div>
                                                            <span className="truncate text-[11px] font-bold text-gray-700">{item.host}</span>
                                                       </button>
                                                       <div className="h-3 w-[1px] bg-gray-200 shrink-0"></div>

                                                       {/* Show Timer for Events, Date for others */}
                                                       {item.isEvent && item.expiresAt ? (
                                                            <EventTimer expiresAt={item.expiresAt} />
                                                       ) : (
                                                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                                                 <Calendar className="w-3 h-3" />
                                                                 <span className="truncate">{item.date}</span>
                                                            </div>
                                                       )}
                                                  </div>

                                                  {/* Participant Status */}
                                                  <div className="shrink-0 flex items-center gap-1 bg-surface-muted px-2 py-1 rounded-full border border-surface-border group-hover:bg-brand-light group-hover:border-brand-gold/20 transition-colors">
                                                       <Users className="w-3 h-3 text-gray-400 group-hover:text-brand-accent" />
                                                       <span className={`text-[11px] font-bold ${item.participants >= item.maxParticipants ? 'text-red-500' : 'text-gray-900'
                                                            }`}>
                                                            {item.participants}/{item.maxParticipants}
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
                                   <p className="text-gray-500 font-bold">{emptyTitle}</p>
                                   <p className="text-xs text-gray-400 mt-1">{emptyDescription}</p>
                              </div>
                         )}
                    </div>
               </div>

               {/* Meeting Detail Modal */}
               {selectedMeeting && (
                    <MeetingDetail
                         meeting={selectedMeeting}
                         onClose={() => setSelectedMeeting(null)}
                         user={user}
                    />
               )}
          </>
     );
};

export default MeetingFeed;
