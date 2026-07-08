import React, { useState } from 'react';
import {
     X, Calendar, MapPin, Wallet, Backpack,
     Map, MessageCircle, ChevronRight, Crown, Loader2
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Permission, Role } from '../lib/appwrite';

const MeetingDetail = ({ meeting, onClose, user }) => {
     if (!meeting) return null;
     const [joining, setJoining] = useState(false);
     const [joined, setJoined] = useState(false);

     // Mock Participants Data
     const participants = [
          { id: 1, name: '산다람쥐', role: 'Host', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', badge: 'crown' },
          { id: 2, name: '역삼댁', role: 'Member', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', badge: 'leaf' },
          { id: 3, name: '강남사랑', role: 'Member', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jude', badge: null },
     ];

     // Mock Comments
     const comments = [
          { id: 1, user: '초보등산러', content: '등산화 꼭 신어야 하나요?', time: '2시간 전' },
          { id: 2, user: '산다람쥐', content: '운동화도 괞찮습니다! 가벼운 코스예요~', time: '1시간 전', isHost: true },
     ];

     const handleJoin = async () => {
          if (!user?.id) {
               alert('로그인 후 참여할 수 있습니다.');
               return;
          }
          if (!meeting?.id) return;
          if (meeting.hostId === user.id) {
               alert('내가 개설한 모임입니다.');
               return;
          }

          setJoining(true);
          try {
               const participantId = `${meeting.id}_${user.id}`.replace(/[^a-zA-Z0-9._-]/g, '_');
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.meetingParticipants,
                    documentId: participantId,
                    data: {
                         meetingId: meeting.id,
                         userId: user.id,
                         status: 'joined',
                    },
                    permissions: [
                         Permission.read(Role.user(user.id)),
                         Permission.update(Role.user(user.id)),
                         Permission.delete(Role.user(user.id)),
                    ],
               });
               setJoined(true);
          } catch (error) {
               if (error?.code === 409) {
                    setJoined(true);
               } else {
                    console.error('모임 참여 실패:', error);
                    alert('참여 신청에 실패했습니다.');
               }
          } finally {
               setJoining(false);
          }
     };

     return (
          <div
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
               onClick={onClose}
          >
               <div
                    className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative scrollbar-hide flex flex-col"
                    onClick={(e) => e.stopPropagation()}
               >

                    {/* === Hero Section === */}
                    <div className="relative h-64 md:h-80 shrink-0">
                         <img
                              src={meeting.image}
                              alt="Meeting Cover"
                              className="w-full h-full object-cover"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                         {/* Close Button */}
                         <button
                              onClick={onClose}
                              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
                         >
                              <X className="w-6 h-6" />
                         </button>

                         {/* Title & Host Info */}
                         <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                              <div className="flex gap-2 mb-3">
                                   <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
                                        모집중 D-3
                                   </span>
                                   <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                        🌡️ 매너온도 37.5℃
                                   </span>
                              </div>
                              <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4 shadow-black drop-shadow-md">
                                   {meeting.title}
                              </h2>

                              <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full border-2 border-white/50 p-0.5 bg-white/10">
                                        <img src={participants[0].image} className="w-full h-full rounded-full bg-white" alt="host" />
                                   </div>
                                   <div>
                                        <div className="flex items-center gap-1.5 font-bold text-sm">
                                             {meeting.host}
                                             <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        </div>
                                        <p className="text-xs text-white/80">👑 {meeting.hostBadge}</p>
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* === Main Content === */}
                    <div className="p-6 md:p-8 space-y-8 flex-1 text-left">

                         {/* 1. Info Grid */}
                         <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
                                   <Calendar className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                                   <div>
                                        <p className="text-xs text-gray-500 font-bold mb-0.5">일시</p>
                                        <p className="text-sm font-bold text-gray-900">{meeting.date}</p>
                                   </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3 group cursor-pointer hover:bg-purple-50 transition-colors">
                                   <MapPin className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                                   <div>
                                        <p className="text-xs text-gray-500 font-bold mb-0.5 group-hover:text-purple-600">장소 (지도보기)</p>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700">{meeting.location.replace(/#/g, '').split(' ')[0]}</p>
                                   </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
                                   <Wallet className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                                   <div>
                                        <p className="text-xs text-gray-500 font-bold mb-0.5">회비</p>
                                        <p className="text-sm font-bold text-gray-900">1/N (정산)</p>
                                   </div>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
                                   <Backpack className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                                   <div>
                                        <p className="text-xs text-gray-500 font-bold mb-0.5">준비물</p>
                                        <p className="text-sm font-bold text-gray-900">편한 신발, 물</p>
                                   </div>
                              </div>
                         </div>

                         {/* 2. Map Preview (Fake) */}
                         <div className="relative rounded-2xl overflow-hidden h-32 bg-gray-200 group cursor-pointer">
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                   <button className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transform group-hover:scale-105 transition-transform">
                                        <Map className="w-4 h-4" /> 지도 크게 보기
                                   </button>
                              </div>
                         </div>

                         {/* 3. Participants (Social Proof) */}
                         <div>
                              <div className="flex justify-between items-center mb-4">
                                   <h3 className="font-bold text-lg text-gray-900">
                                        함께하는 멤버 <span className="text-purple-600">{meeting.participants}/{meeting.maxParticipants}</span>
                                   </h3>
                              </div>
                              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                   {participants.map((p) => (
                                        <div key={p.id} className="flex flex-col items-center gap-1 min-w-[60px]">
                                             <div className="relative">
                                                  <div className="w-14 h-14 rounded-full bg-gray-100 p-0.5 border-2 border-white shadow-sm overflow-hidden">
                                                       <img src={p.image} alt={p.name} className="w-full h-full bg-white" />
                                                  </div>
                                                  {p.role === 'Host' && (
                                                       <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full p-1 border-2 border-white">
                                                            <Crown className="w-3 h-3 fill-white" />
                                                       </div>
                                                  )}
                                             </div>
                                             <span className="text-xs font-medium text-gray-700">{p.name}</span>
                                        </div>
                                   ))}

                                   {/* Empty Slots */}
                                   {[...Array(meeting.maxParticipants - meeting.participants)].map((_, i) => (
                                        <div key={`empty-${i}`} className="flex flex-col items-center gap-1 min-w-[60px] opacity-40">
                                             <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                                  <span className="text-lg font-bold text-gray-300">?</span>
                                             </div>
                                             <span className="text-xs text-gray-400">모집중</span>
                                        </div>
                                   ))}
                              </div>
                         </div>

                         {/* 4. Comments / Q&A */}
                         <div>
                              <h3 className="font-bold text-lg text-gray-900 mb-4">Q&A / 댓글</h3>
                              <div className="space-y-4">
                                   {comments.map(c => (
                                        <div key={c.id} className="flex gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                                             <div className="bg-gray-50 rounded-2xl rounded-tl-none p-3 text-sm">
                                                  <div className="flex items-center gap-2 mb-1">
                                                       <span className={`font-bold ${c.isHost ? 'text-purple-600' : 'text-gray-900'}`}>{c.user}</span>
                                                       <span className="text-[10px] text-gray-400">{c.time}</span>
                                                  </div>
                                                  <p className="text-gray-700">{c.content}</p>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                              <button className="w-full mt-4 py-3 text-sm font-medium text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                   질문 남기기
                              </button>
                         </div>

                    </div>

                    {/* === Sticky Footer (Action) === */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 md:p-6 pb-6 md:pb-8 flex justify-between items-center z-10 shrink-0">
                         <div className="hidden md:block">
                              <p className="text-xs text-gray-500 font-bold">현재 {meeting.participants}명이 참여 중이에요!</p>
                              <p className="text-[10px] text-purple-500">지금 참여하면 '임진강의 샛별 ⭐' 뱃지 획득 가능</p>
                         </div>
                         <button
                              onClick={handleJoin}
                              disabled={joining || joined || meeting.hostId === user?.id}
                              className="w-full md:w-auto md:min-w-[200px] bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                         >
                              {joining && <Loader2 className="w-4 h-4 animate-spin" />}
                              {joined ? '참여 신청 완료' : meeting.hostId === user?.id ? '내가 개설한 모임' : `참여하고 뱃지 받기 (${meeting.participants}/${meeting.maxParticipants})`}
                              {!joined && !joining && <ChevronRight className="w-4 h-4" />}
                         </button>
                    </div>

               </div>
          </div>
     );
};

export default MeetingDetail;
