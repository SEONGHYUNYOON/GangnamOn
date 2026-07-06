import React, { useState, useEffect } from 'react';
import { client, databases, DATABASE_ID, COLLECTIONS, ID, Query, Permission, Role } from '../lib/appwrite';
import { X, Heart, MoreHorizontal, Send, Mail, MapPin, Sparkles } from 'lucide-react';

const MiniHomepage = ({ onClose, user, onOpenAvatarCustomizer, currentUser }) => {
     // Guestbook State
     const [guestbookEntries, setGuestbookEntries] = useState([]);
     const [newComment, setNewComment] = useState('');
     const [isPublic, setIsPublic] = useState(false);
     const [ilchonCount] = useState(Math.floor(Math.random() * 50) + 10);

     // Profile & Edit State
     const [profileData, setProfileData] = useState(null);
     const [isEditing, setIsEditing] = useState(false);
     const [editForm, setEditForm] = useState({
          location: '',
          mbti: '',
          job: '',
          bio: ''
     });

     // 🛑 Safeguard: If no user is logged in, show login prompt instead of crashing
     if (!user || !user.id) {
          return (
               <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                         <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Sparkles className="w-8 h-8 text-purple-600" />
                         </div>
                         <h3 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요해요! 😅</h3>
                         <p className="text-gray-500 mb-6">나만의 강남 라이프를 기록하려면<br />먼저 로그인해주세요.</p>
                         <button onClick={onClose} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors">
                              확인
                         </button>
                    </div>
               </div>
          );
     }

     // Fetch Profile Data
     useEffect(() => {
          const fetchProfile = async () => {
               if (!user?.id) return;
               try {
                    const data = await databases.getDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         documentId: user.id,
                    });
                    setProfileData(data);
                    setEditForm({
                         location: data.location || '',
                         mbti: data.mbti || '',
                         job: data.job || '',
                         bio: data.statusMessage || '' // mapping bio to statusMessage
                    });
               } catch (error) {
                    console.error('프로필 로딩 실패:', error);
               }
          };
          fetchProfile();
     }, [user?.id]);

     // Save Profile Data
     const handleSaveProfile = async () => {
          if (!currentUser || currentUser.id !== user.id) return;

          try {
               await databases.updateDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    documentId: user.id,
                    data: {
                         location: editForm.location,
                         mbti: editForm.mbti,
                         job: editForm.job,
                         statusMessage: editForm.bio,
                    },
               });

               // Update local state
               setProfileData(prev => ({
                    ...prev,
                    location: editForm.location,
                    mbti: editForm.mbti,
                    job: editForm.job,
                    statusMessage: editForm.bio,
               }));
               setIsEditing(false);
          } catch (error) {
               console.error("Profile update failed:", error);
               alert("프로필 저장 실패");
          }
     };

     // Mock Gallery Images (Keep for now, or fetch if we had a gallery table)
     const galleryImages = [
          'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=300&h=300',
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=300&h=300',
     ];

     // Fetch Guestbook Entries
     useEffect(() => {
          const fetchGuestbook = async () => {
               if (!user?.id) return;

               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.guestbookEntries,
                         queries: [Query.equal('hostId', user.id), Query.orderDesc('$createdAt')],
                    });
                    setGuestbookEntries(res.documents);
               } catch (error) {
                    console.error('방명록 로딩 실패:', error);
               }
          };

          fetchGuestbook();

          if (!user?.id) return;

          // Realtime Subscription (Appwrite Realtime)
          const unsubscribe = client.subscribe(
               [`databases.${DATABASE_ID}.collections.${COLLECTIONS.guestbookEntries}.documents`],
               (response) => {
                    const isCreate = response.events.some(e => e.endsWith('.create'));
                    if (isCreate && response.payload?.hostId === user.id) {
                         fetchGuestbook();
                    }
               }
          );

          return () => {
               unsubscribe();
          };
     }, [user?.id]);

     const handlePostComment = async () => {
          if (!newComment.trim()) return;
          if (!currentUser) {
               alert("로그인이 필요합니다!");
               return;
          }

          try {
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.guestbookEntries,
                    documentId: ID.unique(),
                    data: {
                         hostId: user.id, // Profile owner
                         authorId: currentUser.id, // Writer
                         authorUsername: currentUser.user_metadata?.username || '방문자',
                         authorAvatarUrl: currentUser.user_metadata?.avatar_url || '',
                         content: newComment,
                         isSecret: false,
                    },
                    permissions: [
                         Permission.read(Role.any()),
                         Permission.update(Role.user(currentUser.id)),
                         Permission.delete(Role.user(currentUser.id)),
                    ],
               });
               setNewComment('');
          } catch (error) {
               console.error("Guestbook error:", error);
               alert("방명록 작성 실패");
          }
     };

     return (
          <div
               className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
               onClick={onClose}
          >

               {/* Card Container */}
               <div
                    className="bg-white w-full max-w-[480px] max-h-[80vh] h-full rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-300 border-4 border-gray-100/50 filter-drop-shadow"
                    onClick={(e) => e.stopPropagation()}
               >

                    {/* Top Buttons (Close & Message) */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                         <button
                              className="p-3 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md border border-white/20 shadow-lg group"
                              title="1:1 메시지 보내기"
                         >
                              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                         </button>
                         <button
                              onClick={onClose}
                              className="p-3 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
                         >
                              <X className="w-5 h-5" />
                         </button>
                    </div>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide bg-white pb-6">

                         {/* === 1. Header Section === */}
                         <div className="relative">
                              {/* Cover */}
                              <div className="h-64 w-full bg-gradient-to-bl from-indigo-400 via-purple-400 to-pink-400 relative overflow-hidden">
                                   <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              </div>

                              {/* Profile Info Overlay */}
                              <div className="absolute bottom-0 left-0 w-full p-8 pb-10 text-white">
                                   <div className="flex justify-between items-end mb-4">
                                        <div
                                             className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white -mb-6 relative z-10 group cursor-pointer"
                                             onClick={onOpenAvatarCustomizer}
                                        >
                                             <img
                                                  src={profileData?.avatarUrl || user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                                  alt="Profile"
                                                  className="w-full h-full object-cover"
                                             />
                                             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Sparkles className="w-6 h-6 text-white" />
                                             </div>
                                        </div>

                                        {/* Visitor Stats */}
                                        <div className="flex items-center gap-4 mb-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                             <div className="text-center">
                                                  <span className="text-orange-400 font-bold text-xl drop-shadow-sm">128</span>
                                                  <span className="block text-[10px] text-gray-300 uppercase font-medium">Today</span>
                                             </div>
                                             <div className="w-[1px] h-6 bg-white/20"></div>
                                             <div className="text-center">
                                                  <span className="text-white font-bold text-xl drop-shadow-sm">12k</span>
                                                  <span className="block text-[10px] text-gray-300 uppercase font-medium">Total</span>
                                             </div>
                                             <div className="w-[1px] h-6 bg-white/20"></div>
                                             <div className="text-center">
                                                  <span className="text-pink-400 font-bold text-xl drop-shadow-sm">{ilchonCount}</span>
                                                  <span className="block text-[10px] text-gray-300 uppercase font-medium">일촌</span>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Name & Bio */}
                                   <div className="mt-8">
                                        <div className="flex items-center justify-between mb-2">
                                             <h2 className="text-3xl font-black flex items-center gap-2">
                                                  {profileData?.fullName || profileData?.username || '나의 강남 라이프 🏡'}
                                             </h2>

                                             {/* Edit Button (Only for Owner) */}
                                             {currentUser?.id === user?.id && (
                                                  <button
                                                       onClick={() => {
                                                            if (isEditing) handleSaveProfile();
                                                            setIsEditing(!isEditing);
                                                       }}
                                                       className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 transition-all"
                                                  >
                                                       {isEditing ? '저장 완료' : '프로필 편집'}
                                                  </button>
                                             )}
                                        </div>

                                        {isEditing ? (
                                             <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3 mb-4">
                                                  <div className="grid grid-cols-2 gap-3">
                                                       <input
                                                            value={editForm.location}
                                                            onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                                            className="bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                                                            placeholder="지역 (예: 강남 역삼)"
                                                       />
                                                       <input
                                                            value={editForm.mbti}
                                                            onChange={e => setEditForm(prev => ({ ...prev, mbti: e.target.value }))}
                                                            className="bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                                                            placeholder="MBTI"
                                                       />
                                                       <input
                                                            value={editForm.job}
                                                            onChange={e => setEditForm(prev => ({ ...prev, job: e.target.value }))}
                                                            className="bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 col-span-2"
                                                            placeholder="직업 / 하는 일"
                                                       />
                                                  </div>
                                                  <textarea
                                                       value={editForm.bio}
                                                       onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                                       className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400 h-20 resize-none"
                                                       placeholder="자기소개를 입력하세요..."
                                                  />
                                             </div>
                                        ) : (
                                             <>
                                                  <div className="flex items-center gap-1 text-sm text-gray-300 mb-4">
                                                       <MapPin className="w-3.5 h-3.5" />
                                                       {profileData?.location || '강남 미설정'}
                                                       <span className="mx-1">·</span>
                                                       {profileData?.mbti || 'MBTI 미설정'}
                                                       <span className="mx-1">·</span>
                                                       {profileData?.job || '직업 미설정'}
                                                  </div>
                                                  <p className="text-base text-gray-200 leading-relaxed font-light mb-6 whitespace-pre-wrap">
                                                       {profileData?.statusMessage || profileData?.bio || "자기소개가 없습니다."}
                                                  </p>
                                             </>
                                        )}

                                        {/* Privacy Toggle & Incentive */}
                                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between">
                                             <div>
                                                  <div className="text-xs text-yellow-300 font-bold mb-0.5">✨ 전체공개 챌린지</div>
                                                  <div className="text-[10px] text-gray-300">1개월 유지 시 <span className="text-white font-bold">+1,000온</span> 지급!</div>
                                             </div>
                                             <button
                                                  onClick={() => setIsPublic(!isPublic)}
                                                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isPublic
                                                       ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                                       : 'bg-gray-600 text-gray-300'
                                                       }`}
                                             >
                                                  {isPublic ? '전체공개 ON' : '비공개'}
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         {/* === 2. Gallery Section (Instagram Grid) === */}
                         <div className="px-1 mt-10">
                              <div className="flex items-center justify-between px-5 mb-4">
                                   <h3 className="font-bold text-lg text-gray-900">Gallery</h3>
                                   <span className="text-xs text-gray-400 cursor-pointer hover:text-purple-600 transition-colors">더보기 &gt;</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                   {galleryImages.map((img, i) => (
                                        <div key={i} className="aspect-square bg-gray-100 overflow-hidden relative group cursor-pointer">
                                             <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`feed-${i}`} />
                                             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                   ))}
                              </div>
                         </div>

                         {/* === 3. Guestbook Section === */}
                         <div className="mt-10 px-6 pb-8">
                              <h3 className="font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
                                   방명록 <span className="text-purple-600 text-sm font-normal">{guestbookEntries.length}</span>
                              </h3>

                              {/* Input */}
                              <div className="flex items-center gap-3 mb-8">
                                   <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                        <img src={currentUser?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Visitor"} className="w-full h-full" alt="me" />
                                   </div>
                                   <div className="flex-1 bg-gray-50 rounded-full px-5 py-3 flex items-center border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-50 transition-all shadow-sm">
                                        <input
                                             type="text"
                                             placeholder="따뜻한 한마디를 남겨주세요..."
                                             className="flex-1 bg-transparent text-sm focus:outline-none min-w-0 mr-2"
                                             value={newComment}
                                             onChange={(e) => setNewComment(e.target.value)}
                                             onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                                        />
                                        <button
                                             onClick={handlePostComment}
                                             className="text-white bg-purple-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-700 transition-colors shrink-0 whitespace-nowrap shadow-md shadow-purple-200"
                                        >
                                             게시
                                        </button>
                                   </div>
                              </div>

                              {/* Comments List */}
                              <div className="space-y-4">
                                   {guestbookEntries.map((entry) => (
                                        <div key={entry.$id} className="flex gap-3 items-start group">
                                             <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-100 shrink-0">
                                                  <img
                                                       src={entry.authorAvatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anon"}
                                                       className="w-full h-full object-cover"
                                                       alt="author"
                                                  />
                                             </div>
                                             <div className="flex-1">
                                                  <div className="flex items-baseline gap-2 mb-0.5">
                                                       <span className="font-bold text-sm text-gray-900">{entry.authorUsername || '익명'}</span>
                                                       <span className="text-[10px] text-gray-400">{new Date(entry.$createdAt).toLocaleDateString()}</span>
                                                  </div>
                                                  <p className="text-sm text-gray-700 leading-relaxed">{entry.content}</p>

                                                  <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <button className="text-[11px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1">
                                                            <Heart className="w-3 h-3" /> 좋아요
                                                       </button>
                                                       <button className="text-[11px] font-bold text-gray-400 hover:text-gray-600">
                                                            답글달기
                                                       </button>
                                                  </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>

                              <div className="mt-6 text-center">
                                   <button className="text-xs text-gray-400 font-medium hover:text-gray-600 border-b border-gray-200 pb-0.5">
                                        이전 방명록 더보기
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default MiniHomepage;
