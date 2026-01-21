import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Download, ChevronRight, Send, User } from 'lucide-react';
import KakaoMap from './KakaoMap';

const NoteCard = ({ note, onOpenMinihome }) => {
     const [isLiked, setIsLiked] = useState(false);
     const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 10); // Random initial likes
     const [showComments, setShowComments] = useState(false);
     const [comments, setComments] = useState([
          { id: 1, user: '파주댁', text: '어머 너무 가보고 싶어요! 😍', time: '10분 전' },
          { id: 2, user: '산책러', text: '이번 주말에 들를게요~', time: '5분 전' }
     ]);
     const [newComment, setNewComment] = useState('');
     const [showMap, setShowMap] = useState(false);

     const handleLike = () => {
          setIsLiked(!isLiked);
          setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
     };

     const handleShare = () => {
          alert('게시글 주소가 복사되었습니다! (가상)');
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
                                   <MapPin className="w-3 h-3" /> {note.location} • {note.time}
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

                    {/* Comments Section (Toggled) */}
                    {showComments && (
                         <div className="mb-6 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
                              {/* Comment List */}
                              <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                   {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-2 text-sm">
                                             <span className="font-bold text-gray-900 shrink-0">{comment.user}</span>
                                             <span className="text-gray-600">{comment.text}</span>
                                             <span className="text-xs text-gray-300 ml-auto shrink-0">{comment.time}</span>
                                        </div>
                                   ))}
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
                         {note.hasCoupon ? (
                              <button className="flex items-center justify-center gap-2 py-3 border border-rose-200 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors text-sm">
                                   <Download className="w-4 h-4" /> 혜택 받기
                              </button>
                         ) : (
                              <button disabled className="flex items-center justify-center gap-2 py-3 border border-stone-100 bg-stone-50 text-stone-400 font-bold rounded-xl cursor-default text-sm">
                                   종료된 이벤트
                              </button>
                         )}

                         <button
                              onClick={() => setShowMap(!showMap)}
                              className={`flex items-center justify-center gap-2 py-3 border font-bold rounded-xl transition-colors group/btn text-sm ${showMap ? 'bg-gray-900 text-white border-gray-900' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                         >
                              {showMap ? '지도 닫기' : '위치 보기'}
                              <MapPin className={`w-4 h-4 transition-transform ${showMap ? 'text-white' : 'text-gray-400'}`} />
                         </button>
                    </div>

                    {showMap && (
                         <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                              <KakaoMap
                                   latitude={37.751853}
                                   longitude={126.764666}
                                   style={{ width: '100%', height: '200px' }}
                              />
                         </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-[10px] text-stone-400 mt-4 text-right uppercase tracking-wider">
                         Posted {note.time}
                    </p>
               </div>
          </div>
     );
};

const OwnersNote = ({ onOpenMinihome }) => {
     // Mock Data for Owner's Note
     const notes = [
          {
               id: 1,
               storeName: '카페 멜로우',
               ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mellow',
               time: '방금 전',
               image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600&h=750',
               eventLabel: '🍪 수제 쿠키 증정',
               note: '오늘 아침 구운 따끈따끈한 쿠키가 나왔어요! \n비 오는 날 방문해주시는 모든 분께 미니 쿠키를 드립니다. \n따뜻한 라떼와 함께 즐겨보세요 ☕️',
               hasCoupon: true,
               location: '운정 카페거리'
          },
          {
               id: 2,
               storeName: '심야식당 파주',
               ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chef',
               time: '2시간 전',
               image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=600&h=750',
               eventLabel: '🍺 하이볼 1+1',
               note: '불금에는 역시 하이볼이죠! \n오늘 저녁 8시부터 10시까지 타임 이벤트 진행합니다.\n혼술 환영, 단체 환영! 분위기에 취해보세요.',
               hasCoupon: true,
               location: '금촌 로타리'
          },
          {
               id: 3,
               storeName: '블룸 플라워',
               ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Flower',
               time: '4시간 전',
               image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600&h=750',
               eventLabel: '💐 미니 꽃다발',
               note: '봄맞이 튤립이 들어왔어요. 🌷\n기분 전환이 필요하신가요? \n지나가다 들러주세요, 구경만 하셔도 눈으로 향기를 선물해드려요.',
               hasCoupon: false,
               location: '헤이리 예술마을'
          },
          {
               id: 4,
               storeName: '바른 필라테스',
               ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pilates',
               time: '5시간 전',
               image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=600&h=750',
               eventLabel: '🧘‍♀️ 1회 체험권',
               note: '곧 여름이 다가옵니다! 💪\n망설이고 계셨던 분들을 위해 무료 그룹 체험권을 준비했어요.\n딱 5분만 모십니다. DM 주세요!',
               hasCoupon: true,
               location: '야당역 앞'
          },
          {
               id: 5,
               storeName: '달콤 제과점',
               ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Baker',
               time: '6시간 전',
               image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600&h=750',
               eventLabel: '🥖 소금빵 3+1',
               note: '버터 향 가득한 소금빵이 1시에 나옵니다.\n오늘은 3개 구매 시 1개를 더 드려요!\n아이들 간식으로 딱이에요 😊',
               hasCoupon: true,
               location: '교하 중심상가'
          },
          {
               id: 6,
               storeName: '책 읽는 고양이',
               ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Book',
               time: '어제',
               image: 'https://images.unsplash.com/photo-1526721966451-22670f1a1963?auto=format&fit=crop&q=80&w=600&h=750',
               eventLabel: '☕️ 아메리카노 무료',
               note: '새로운 독립출판물이 입고되었습니다.\n조용히 책 읽고 싶으신 분들 환영해요.\n책 구매 시 아메리카노 한 잔 드려요. 📚',
               hasCoupon: true,
               location: '출판단지'
          },
          {
               id: 7,
               storeName: '살롱 드 파주',
               ownerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hair',
               time: '어제',
               image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=600&h=750',
               eventLabel: '💇‍♀️ 두피 스파 50%',
               note: '환절기라 두피가 가려우신가요?\n단골 손님들이 극찬하는 두피 쿨링 스파,\n이번 주말까지만 반값에 모십니다. 💆‍♀️',
               hasCoupon: true,
               location: '금촌동'
          }
     ];

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
                    {notes.map((note) => (
                         <NoteCard key={note.id} note={note} onOpenMinihome={onOpenMinihome} />
                    ))}
               </div>

               <div className="text-center py-10">
                    <p className="text-stone-400 text-sm font-serif italic">More notes coming soon...</p>
               </div>
          </div>
     );
};

export default OwnersNote;
