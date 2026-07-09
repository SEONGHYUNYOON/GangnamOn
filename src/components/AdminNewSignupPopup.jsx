import React, { useEffect } from 'react';
import { X, UserPlus, MessageCircle } from 'lucide-react';
import { resolveAvatarUrl } from '../lib/avatar';

// 관리자 전용 — 새 회원이 가입하면 화면 우측 상단에 즉시 뜨는 알림 카드입니다.
// App.jsx에서 profiles 컬렉션의 실시간 생성 이벤트를 구독해서 렌더링합니다.
const AdminNewSignupPopup = ({ profile, onClose, onStartChat }) => {
     useEffect(() => {
          const timer = setTimeout(onClose, 9000);
          return () => clearTimeout(timer);
     }, [onClose, profile?.$id]);

     if (!profile) return null;

     const genderLabel = profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '성별 미설정';

     return (
          <div className="fixed top-6 right-6 z-[300] w-80 animate-in slide-in-from-right-5 fade-in duration-300">
               <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-4 shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                    <button
                         onClick={onClose}
                         className="absolute right-3 top-3 text-gray-300 transition-colors hover:text-gray-500"
                         aria-label="닫기"
                    >
                         <X className="h-4 w-4" />
                    </button>

                    <div className="mb-3 flex items-center gap-2 text-purple-600">
                         <UserPlus className="h-4 w-4" />
                         <span className="text-xs font-black">신규 회원 가입!</span>
                    </div>

                    <div className="flex items-center gap-3">
                         <img
                              src={resolveAvatarUrl(profile)}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-full bg-gray-100 object-cover"
                         />
                         <div className="min-w-0">
                              <p className="truncate font-bold text-gray-900">{profile.username || '익명'}</p>
                              <p className="text-xs text-gray-400">{genderLabel} · {profile.location || '위치 미설정'}</p>
                         </div>
                    </div>

                    {onStartChat && (
                         <button
                              onClick={() => {
                                   onStartChat({
                                        $id: profile.$id,
                                        username: profile.username,
                                        fullName: profile.fullName,
                                        avatarUrl: profile.avatarUrl || '',
                                   });
                                   onClose();
                              }}
                              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-50 py-2 text-xs font-bold text-purple-600 transition-colors hover:bg-purple-100"
                         >
                              <MessageCircle className="h-3.5 w-3.5" />
                              1:1 메시지 보내기
                         </button>
                    )}
               </div>
          </div>
     );
};

export default AdminNewSignupPopup;
