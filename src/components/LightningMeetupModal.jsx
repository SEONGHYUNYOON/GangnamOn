import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Permission, Role } from '../lib/appwrite';

// "지금 바로 만나요" (즉석 모임) 등록 모달.
// posts 컬렉션을 재사용하고 type: 'gangnam_lightning' 으로 구분합니다.
// currentParticipants는 다른 로그인 유저가 "참여하기"를 누를 때도 갱신해야 하므로,
// 문서 단위 권한에 Permission.update(Role.users())를 명시적으로 부여합니다.
const LightningMeetupModal = ({ user, onClose, onCreated }) => {
     const [title, setTitle] = useState('');
     const [location, setLocation] = useState('');
     const [statusText, setStatusText] = useState('');
     const [maxParticipants, setMaxParticipants] = useState(4);
     const [durationHours, setDurationHours] = useState(3);
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);

     const handleSubmit = async (e) => {
          e.preventDefault();
          setError(null);

          if (!title.trim() || !location.trim()) {
               setError('모임 이름과 장소는 꼭 입력해주세요.');
               return;
          }
          if (!user) {
               setError('로그인 후 이용할 수 있어요.');
               return;
          }

          setLoading(true);
          try {
               const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

               const doc = await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    documentId: ID.unique(),
                    data: {
                         authorId: user.id,
                         authorUsername: user.user_metadata?.username || user.user_metadata?.full_name || '강남주민',
                         authorAvatarUrl: user.user_metadata?.avatar_url || '',
                         type: 'gangnam_lightning',
                         title: title.trim(),
                         locationName: location.trim(),
                         content: statusText.trim() || '누구나 환영해요',
                         maxParticipants: Math.max(2, Number(maxParticipants) || 4),
                         currentParticipants: 1,
                         expiresAt,
                    },
                    permissions: [
                         Permission.read(Role.any()),
                         Permission.update(Role.users()),
                         Permission.delete(Role.user(user.id)),
                    ],
               });

               onCreated?.(doc);
               onClose?.();
          } catch (err) {
               console.error('즉석모임 등록 실패:', err);
               setError('등록에 실패했어요. 잠시 후 다시 시도해주세요.');
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                         <h2 className="text-lg font-bold text-white flex items-center gap-2">
                              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> 즉석 모임 만들기
                         </h2>
                         <button onClick={onClose} className="text-gray-500 hover:text-white">
                              <X className="w-5 h-5" />
                         </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                         <input
                              type="text"
                              placeholder="모임 이름 (예: 2:2 볼링장 가실 분!)"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              maxLength={80}
                              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-400"
                         />
                         <input
                              type="text"
                              placeholder="장소 (예: 강남역)"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              maxLength={40}
                              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-400"
                         />
                         <input
                              type="text"
                              placeholder="현재 상황 (예: 여2 대기중, 누구나 환영)"
                              value={statusText}
                              onChange={(e) => setStatusText(e.target.value)}
                              maxLength={40}
                              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-400"
                         />

                         <div className="flex gap-3">
                              <div className="flex-1">
                                   <label className="text-xs text-gray-500 mb-1 block">최대 인원</label>
                                   <select
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-400"
                                   >
                                        {[2, 3, 4, 5, 6, 8].map(n => <option key={n} value={n}>{n}명</option>)}
                                   </select>
                              </div>
                              <div className="flex-1">
                                   <label className="text-xs text-gray-500 mb-1 block">모집 마감</label>
                                   <select
                                        value={durationHours}
                                        onChange={(e) => setDurationHours(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-pink-400"
                                   >
                                        <option value={1}>1시간 후</option>
                                        <option value={3}>3시간 후</option>
                                        <option value={6}>6시간 후</option>
                                        <option value={24}>24시간 후</option>
                                   </select>
                              </div>
                         </div>

                         {error && <p className="text-xs text-center font-bold text-red-400 px-2">{error}</p>}

                         <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-purple-500/20 disabled:opacity-60"
                         >
                              {loading ? '등록 중...' : '모임 등록하기'}
                         </button>
                    </form>
               </div>
          </div>
     );
};

export default LightningMeetupModal;
