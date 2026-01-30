import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Download, ChevronRight, Send, User } from 'lucide-react';
import KakaoMap from './KakaoMap';
import { supabase } from '../lib/supabase';
import EventTimer from './EventTimer';
import { normalizeForGangnamDisplay } from '../lib/displayGangnam';

const NoteCard = ({ note, onOpenMinihome }) => {
     const [isLiked, setIsLiked] = useState(false);
     const [likeCount, setLikeCount] = useState(note.likes || Math.floor(Math.random() * 50) + 10);
     const [showComments, setShowComments] = useState(false);
     const [comments, setComments] = useState([]); // Real comments could be fetched here
     const [newComment, setNewComment] = useState('');
     const [showMap, setShowMap] = useState(false);

     const handleLike = () => {
          setIsLiked(!isLiked);
          setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
          // Here you would optimally add an API call to update likes in Supabase
     };

     const handleShare = () => {
          alert('게시글 주소가 복사되었습니다! (시뮬레이션)');
     };

     const handleAddComment = (e) => {
          e.preventDefault();
          if (!newComment.trim()) return;

          const comment = {
               id: Date.now(),
               user: '나(You)',
               text: newComment,
               time: '방금 전'
          };

          setComments([...comments, comment]);
          setNewComment('');
     };

     // Calculate time ago helper
     const getTimeAgo = (dateString) => {
          const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
          let interval = seconds / 31536000;
          if (interval > 1) return Math.floor(interval) + "년 전";
          interval = seconds / 2592000;
          if (interval > 1) return Math.floor(interval) + "달 전";
          interval = seconds / 86400;
          if (interval > 1) return Math.floor(interval) + "일 전";
          interval = seconds / 3600;
          if (interval > 1) return Math.floor(interval) + "시간 전";
          interval = seconds / 60;
          if (interval > 1) return Math.floor(interval) + "분 전";
          return "방금 전";
     };

     return (
          <div className="bg-white rounded-sm md:rounded-3xl border border-stone-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden group">

               {/* Card Header (Profile) */}
               <div className="p-4 flex items-center justify-between">
                    <div
                         className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                         onClick={() => onOpenMinihome && onOpenMinihome({ name: note.storeName, avatar: note.ownerAvatar, location: note.location })}
                    >
                         <div className="w-10 h-10 rounded-full bg-stone-100 p-0.5 border border-stone-200">
                              <img src={note.ownerAvatar} alt={note.storeName} className="w-full h-full rounded-full object-cover" />
                         </div>
                         <div>
                              <h3 className="text-sm font-bold text-gray-900">{note.storeName}</h3>
                              <p className="text-xs text-stone-400 flex items-center gap-1">
                                   <MapPin className="w-3 h-3" /> {note.location} • {getTimeAgo(note.createdAt)}
                              </p>
                         </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                         <MoreHorizontal className="w-5 h-5" />
                    </button>
               </div>

               {/* Main Image */}
               <div className="relative aspect-[4/5] bg-stone-50 overflow-hidden">
                    <img
                         src={note.image}
                         alt="Post"
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Visual Label */}
                    {note.eventLabel && (
                         <div className="absolute top-6 right-6 transform rotate-3">
                              <div className="relative bg-[#FFFAF0] text-gray-800 px-4 py-2 shadow-lg drop-shadow-md border border-stone-200/50"
                                   style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 95%, 50% 100%, 0% 95%)' }}>
                                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 bg-rose-200/80 transform -rotate-2 opacity-90 backdrop-blur-sm" />
                                   <div className="pt-1 text-center">
                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">Today's Event</p>
                                        <p className="text-sm font-bold text-gray-900 leading-tight whitespace-nowrap">{note.eventLabel}</p>
                                   </div>
                              </div>
                         </div>
                    )}
               </div>

               {/* Content & Actions */}
               <div className="p-5 md:p-6 bg-white">
                    {/* Action Bar */}
                    <div className="flex justify-between items-center mb-4">
                         <div className="flex gap-4">
                              <button
                                   onClick={handleLike}
                                   className={`transition-all active:scale-95 hover:text-rose-500 ${isLiked ? 'text-rose-500' : 'text-gray-900'}`}
                              >
                                   <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                   onClick={() => setShowComments(!showComments)}
                                   className="text-gray-900 hover:text-gray-600 transition-colors"
                              >
                                   <MessageCircle className="w-6 h-6" />
                              </button>
                              <button
                                   onClick={handleShare}
                                   className="text-gray-900 hover:text-gray-600 transition-colors"
                              >
                                   <Share2 className="w-6 h-6" />
                              </button>
                         </div>
                    </div>

                    {/* Likes Count */}
                    <div className="mb-4 text-sm font-bold text-gray-900">
                         좋아요 {likeCount}개
                    </div>

                    {/* Note Content */}
                    <div className="mb-6 space-y-2">
                         <h4 className="font-serif text-lg font-bold text-gray-900 italic">Day's Note</h4>
                         <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line font-medium">
                              {note.note}
                         </p>
                    </div>

                    {/* Timer Section if expiresAt exists */}
                    {note.expiresAt && (
                         <div className="mb-6 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                              <span className="text-xs font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                                   ⚡ 이벤트 마감까지
                              </span>
                              <EventTimer expiresAt={note.expiresAt} />
                         </div>
                    )}

                    {/* Comments Section (Toggled) */}
                    {showComments && (
                         <div className="mb-6 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                              {/* Comment List */}
                              <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                   {comments.length > 0 ? comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-2 text-sm">
                                             <span className="font-bold text-gray-900 shrink-0">{comment.user}</span>
                                             <span className="text-gray-600">{comment.text}</span>
                                             <span className="text-xs text-gray-300 ml-auto shrink-0">{comment.time}</span>
                                        </div>
                                   )) : <p className="text-xs text-gray-400 text-center py-2">첫 번째 댓글을 남겨보세요!</p>}
                              </div>

                              {/* Input Form */}
                              <form onSubmit={handleAddComment} className="flex items-center gap-2 relative">
                                   <input
                                        type="text"
                                        placeholder="따뜻한 댓글을 남겨주세요..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-full py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-stone-400 focus:bg-white transition-colors placeholder:text-stone-400"
                                   />
                                   <button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="absolute right-1.5 p-1.5 bg-stone-900 text-white rounded-full hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-900 transition-colors"
                                   >
                                        <Send className="w-3.5 h-3.5" />
                                   </button>
                              </form>
                         </div>
                    )}

                    {/* Bottom Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                         {note.expiresAt && new Date() > new Date(note.expiresAt) ? (
                              <button disabled className="flex items-center justify-center gap-2 py-3 border border-stone-100 bg-stone-50 text-stone-400 font-bold rounded-xl cursor-default text-sm">
                                   종료된 이벤트
                              </button>
                         ) : (
                              <button className="flex items-center justify-center gap-2 py-3 border border-rose-200 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors text-sm">
                                   <Download className="w-4 h-4" /> 혜택 받기
                              </button>
                         )}

                         <button
                              onClick={() => setShowMap(!showMap)}
                              className={`flex items-center justify-center gap-2 py-3 border font-bold rounded-xl transition-colors group/btn text-sm ${showMap ? 'bg-gray-900 text-white border-gray-900' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                         >
                              {showMap ? '지도 닫기' : '가게 구경하기'}
                              <MapPin className={`w-4 h-4 transition-transform ${showMap ? 'text-white' : 'text-gray-400'}`} />
                         </button>
                    </div>

                    {showMap && (
                         <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                              {/* Using random slight variation for demo, in real app use actual lat/lng */}
                              <KakaoMap
                                   latitude={37.751853 + (Math.random() * 0.01 - 0.005)}
                                   longitude={126.764666 + (Math.random() * 0.01 - 0.005)}
                                   style={{ width: '100%', height: '200px' }}
                              />
                         </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-[10px] text-stone-400 mt-4 text-right uppercase tracking-wider">
                         Posted {new Date(note.createdAt).toLocaleDateString()}
                    </p>
               </div>
          </div>
     );
};

const OwnersNote = ({ onOpenMinihome }) => {
     const [notes, setNotes] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
          const fetchNotes = async () => {
               setLoading(true);
               // Fetch only 'event' type posts for Owner's Note
               const { data, error } = await supabase
                    .from('posts')
                    .select(`
                         *,
                         profiles:author_id (username, avatar_url, location)
                    `)
                    .eq('type', 'event')
                    .order('created_at', { ascending: false });

               if (error) {
                    console.error('Error fetching owner notes:', error);
               } else {
                    const mappedNotes = data.map(post => ({
                         id: post.id,
                         storeName: normalizeForGangnamDisplay(post.profiles?.username || '강남 사장님'),
                         ownerAvatar: post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gangnam',
                         time: '방금 전',
                         createdAt: post.created_at,
                         image: post.image_urls?.[0] || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600',
                         eventLabel: post.title,
                         note: post.content,
                         hasCoupon: true,
                         expiresAt: post.expires_at,
                         location: normalizeForGangnamDisplay(post.location_name || post.profiles?.location || '강남'),
                         likes: post.likes_count
                    }));
                    setNotes(mappedNotes);
               }
               setLoading(false);
          };

          fetchNotes();
     }, []);

     if (loading) {
          return <div className="text-center py-20 text-gray-500">로딩중...</div>;
     }

     return (
          <div className="w-full max-w-xl mx-auto pb-20">
               {/* 1. Header Area */}
               <div className="bg-white py-8 px-4 text-center mb-6 sticky top-0 z-10 border-b border-gray-50/80 backdrop-blur-sm">
                    <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                         Owner's Note
                    </h1>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">
                         오늘의 소식 & 깜짝 이벤트 혜택 🎁
                    </p>
               </div>

               {/* 2. Feed List */}
               <div className="space-y-12 px-4 md:px-0">
                    {notes.length > 0 ? (
                         notes.map((note) => (
                              <NoteCard key={note.id} note={note} onOpenMinihome={onOpenMinihome} />
                         ))
                    ) : (
                         <div className="text-center py-10">
                              <p className="text-stone-400">아직 등록된 이벤트가 없어요.</p>
                         </div>
                    )}
               </div>

               <div className="text-center py-10">
                    <p className="text-stone-400 text-sm font-serif italic">More notes coming soon...</p>
               </div>
          </div>
     );
};

export default OwnersNote;
