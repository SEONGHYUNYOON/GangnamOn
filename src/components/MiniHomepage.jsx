import React, { useEffect, useMemo, useState } from 'react';
import { client, databases, DATABASE_ID, COLLECTIONS, ID, Query, Permission, Role } from '../lib/appwrite';
import { uploadProfileAvatar } from '../lib/imageUpload';
import { BookOpen, Camera, ChevronRight, Heart, Home, Link2, Loader2, Mail, Send, Settings, UserRound, X, Youtube } from 'lucide-react';

const getMinihomeStorageKey = (user) => `gangnam:on:minihome:${user?.id || user?.user_metadata?.username || 'guest'}`;

const extractYoutubeId = (value = '') => {
     const input = value.trim();
     if (!input) return '';

     const patterns = [
          /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
          /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
          /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
          /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
     ];

     for (const pattern of patterns) {
          const match = input.match(pattern);
          if (match?.[1]) return match[1];
     }

     return /^[a-zA-Z0-9_-]{6,}$/.test(input) ? input : '';
};

const surfLinks = [
     { name: '강남 북클럽', status: '오늘 독서모임 열림', tone: 'bg-amber-50 text-amber-800' },
     { name: '역삼 러너스', status: '한강 10km 모집중', tone: 'bg-blue-50 text-blue-800' },
     { name: '단대부고 25회', status: '동창회 사진 업데이트', tone: 'bg-emerald-50 text-emerald-800' },
     { name: '테헤란 스타트업랩', status: '점심 네트워킹', tone: 'bg-violet-50 text-violet-800' },
];

const MiniHomepage = ({ onClose, user, onOpenAvatarCustomizer, currentUser }) => {
     const [guestbookEntries, setGuestbookEntries] = useState([]);
     const [newComment, setNewComment] = useState('');
     const [profileData, setProfileData] = useState(null);
     const [activePane, setActivePane] = useState('home');
     const [isEditing, setIsEditing] = useState(false);
     const [isBgmOpen, setIsBgmOpen] = useState(false);
     const [miniSettings, setMiniSettings] = useState({ bgmUrl: '', bgmTitle: '', bgmVideoId: '' });
     const [bgmDraft, setBgmDraft] = useState({ bgmUrl: '', bgmTitle: '' });
     const [editForm, setEditForm] = useState({ location: '', mbti: '', job: '', bio: '' });
     const [todayCount, setTodayCount] = useState(0);
     const [totalCount, setTotalCount] = useState(0);
     const [avatarUploading, setAvatarUploading] = useState(false);

     const isOwner = Boolean(currentUser?.id && user?.id && currentUser.id === user.id);
     const displayName = profileData?.fullName || profileData?.username || user?.user_metadata?.username || user?.user_metadata?.name || '강남 이웃';
     const displayLocation = profileData?.location || user?.user_metadata?.location || '강남';
     const avatarUrl = profileData?.avatarUrl || user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gangnam';
     const statusMessage = profileData?.statusMessage || profileData?.bio || '오늘도 강남에서 좋은 사람을 만나는 중.';

     const panes = useMemo(() => [
          { id: 'home', label: '홈', icon: Home },
          { id: 'guestbook', label: '방명록', icon: BookOpen },
          { id: 'surf', label: '파도타기', icon: ChevronRight },
     ], []);

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
                         bio: data.statusMessage || '',
                    });
               } catch (error) {
                    console.error('프로필 로딩 실패:', error);
               }
          };
          fetchProfile();
     }, [user?.id]);

     useEffect(() => {
          const recordVisit = async () => {
               if (!user?.id) return;
               const today = new Date().toISOString().slice(0, 10);
               let guestId = window.localStorage.getItem('gangnam:on:guest-id');
               if (!guestId) {
                    guestId = crypto.randomUUID();
                    window.localStorage.setItem('gangnam:on:guest-id', guestId);
               }
               const visitorId = currentUser?.id || `guest-${guestId}`;
               const documentId = `${user.id}_${visitorId}_${today}`.replace(/[^a-zA-Z0-9._-]/g, '_');

               try {
                    await databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.pageViews,
                         documentId,
                         data: { hostId: user.id, visitorId, visitDate: today },
                         permissions: [Permission.read(Role.any())],
                    });
               } catch {
                    // 이미 오늘 방문한 사용자는 중복 집계하지 않습니다.
               }

               try {
                    const [todayRes, totalRes] = await Promise.all([
                         databases.listDocuments({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.pageViews,
                              queries: [Query.equal('hostId', user.id), Query.equal('visitDate', today), Query.limit(1)],
                         }),
                         databases.listDocuments({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.pageViews,
                              queries: [Query.equal('hostId', user.id), Query.limit(1)],
                         }),
                    ]);
                    setTodayCount(todayRes.total || 0);
                    setTotalCount(totalRes.total || 0);

                    if (isOwner) {
                         await databases.updateDocument({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.profiles,
                              documentId: user.id,
                              data: {
                                   visitorsToday: todayRes.total || 0,
                                   visitorsTotal: totalRes.total || 0,
                              },
                         });
                    }
               } catch (error) {
                    console.warn('방문자 수 집계 실패:', error);
                    setTodayCount(profileData?.visitorsToday || 0);
                    setTotalCount(profileData?.visitorsTotal || 0);
               }
          };

          recordVisit();
     }, [user?.id, currentUser?.id, isOwner, profileData?.visitorsToday, profileData?.visitorsTotal]);

     useEffect(() => {
          if (!user) return;
          try {
               const saved = window.localStorage.getItem(getMinihomeStorageKey(user));
               if (!saved) return;

               const parsed = JSON.parse(saved);
               const next = {
                    bgmUrl: parsed.bgmUrl || '',
                    bgmTitle: parsed.bgmTitle || '',
                    bgmVideoId: parsed.bgmVideoId || extractYoutubeId(parsed.bgmUrl || ''),
               };
               setMiniSettings(next);
               setBgmDraft({ bgmUrl: next.bgmUrl, bgmTitle: next.bgmTitle });
          } catch (error) {
               console.warn('미니홈피 설정 로딩 실패:', error);
          }
     }, [user?.id, user?.user_metadata?.username]);

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
          if (!user?.id) return undefined;

          const unsubscribe = client.subscribe(
               [`databases.${DATABASE_ID}.collections.${COLLECTIONS.guestbookEntries}.documents`],
               (response) => {
                    const isCreate = response.events.some(event => event.endsWith('.create'));
                    if (isCreate && response.payload?.hostId === user.id) fetchGuestbook();
               },
          );

          return () => unsubscribe();
     }, [user?.id]);

     const handleSaveProfile = async () => {
          if (!isOwner) return;
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
               setProfileData(prev => ({
                    ...prev,
                    location: editForm.location,
                    mbti: editForm.mbti,
                    job: editForm.job,
                    statusMessage: editForm.bio,
               }));
               setIsEditing(false);
          } catch (error) {
               console.error('Profile update failed:', error);
               alert('프로필 저장 실패');
          }
     };

     const handleAvatarFile = async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file || !isOwner) return;

          if (!file.type.startsWith('image/')) {
               alert('이미지 파일만 등록할 수 있습니다.');
               return;
          }

          setAvatarUploading(true);
          try {
               const avatarUrl = await uploadProfileAvatar(user.id, file);
               setProfileData(prev => ({ ...prev, avatarUrl }));
          } catch (error) {
               console.error('프로필 사진 업로드 실패:', error);
               alert('프로필 사진 업로드에 실패했습니다.');
          } finally {
               setAvatarUploading(false);
          }
     };

     const handleSaveBgm = () => {
          if (!isOwner) return;
          const videoId = extractYoutubeId(bgmDraft.bgmUrl);
          if (bgmDraft.bgmUrl.trim() && !videoId) {
               alert('유튜브 링크 또는 영상 ID를 확인해주세요.');
               return;
          }

          const next = {
               bgmUrl: bgmDraft.bgmUrl.trim(),
               bgmTitle: bgmDraft.bgmTitle.trim() || '나의 미니홈피 BGM',
               bgmVideoId: videoId,
          };

          setMiniSettings(next);
          window.localStorage.setItem(getMinihomeStorageKey(user), JSON.stringify(next));
          setIsBgmOpen(false);
     };

     const handlePostComment = async () => {
          if (!newComment.trim()) return;
          if (!currentUser) {
               alert('로그인이 필요합니다.');
               return;
          }
          if (!user?.id) {
               alert('이 미니홈피에는 방명록을 남길 수 없습니다.');
               return;
          }

          try {
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.guestbookEntries,
                    documentId: ID.unique(),
                    data: {
                         hostId: user.id,
                         authorId: currentUser.id,
                         authorUsername: currentUser.user_metadata?.username || currentUser.name || '방문자',
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
               console.error('Guestbook error:', error);
               alert('방명록 작성 실패');
          }
     };

     if (!user) {
          return (
               <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
                    <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl" onClick={event => event.stopPropagation()}>
                         <UserRound className="mx-auto mb-4 h-12 w-12 text-brand-accent" />
                         <h3 className="text-xl font-black text-brand-ink">로그인이 필요해요</h3>
                         <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">나만의 미니홈피를 만들려면 먼저 로그인해주세요.</p>
                         <button onClick={onClose} className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-sm font-black text-white">확인</button>
                    </div>
               </div>
          );
     }

     return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm" onClick={onClose}>
               <div
                    className="flex h-[min(86vh,760px)] w-full max-w-[900px] flex-col overflow-hidden rounded-[22px] border border-sky-200 bg-[#eaf6ff] shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
               >
                    <div className="flex h-12 shrink-0 items-center justify-between border-b border-sky-200 bg-[#f8fcff] px-4">
                         <div className="min-w-0">
                              <p className="truncate text-sm font-black text-sky-900">{displayName}님의 미니홈피</p>
                              <p className="text-[11px] font-bold text-sky-500">TODAY {todayCount} | TOTAL {totalCount.toLocaleString()}</p>
                         </div>
                         <div className="flex items-center gap-2">
                              <button type="button" className="rounded-full border border-sky-200 bg-white p-2 text-sky-700 hover:bg-sky-50" title="쪽지 보내기">
                                   <Mail className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" title="닫기">
                                   <X className="h-4 w-4" />
                              </button>
                         </div>
                    </div>

                    <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-[250px_1fr]">
                         <aside className="min-h-0 rounded-2xl border border-sky-200 bg-white p-4">
                              <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-center">
                                   <p className="text-[11px] font-black text-sky-700">TODAY</p>
                                   <p className="text-2xl font-black text-brand-ink">{todayCount}</p>
                              </div>

                              <label className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                   {isOwner && <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />}
                                   <img src={avatarUrl} alt="프로필" className="h-44 w-full object-cover transition-transform group-hover:scale-105" />
                                   {isOwner && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                             {avatarUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                                        </span>
                                   )}
                              </label>

                              <div className="mt-4">
                                   <h2 className="text-xl font-black text-brand-ink">{displayName}</h2>
                                   <p className="mt-1 text-xs font-bold text-slate-500">{displayLocation} · {profileData?.mbti || 'MBTI 미설정'}</p>
                                   <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">{statusMessage}</p>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                   <div className="rounded-xl bg-sky-50 p-2">
                                        <p className="text-sm font-black text-sky-900">{totalCount}</p>
                                        <p className="text-[10px] font-bold text-sky-500">방문</p>
                                   </div>
                                   <div className="rounded-xl bg-amber-50 p-2">
                                        <p className="text-sm font-black text-amber-800">{guestbookEntries.length}</p>
                                        <p className="text-[10px] font-bold text-amber-600">방명록</p>
                                   </div>
                                   <div className="rounded-xl bg-rose-50 p-2">
                                        <p className="text-sm font-black text-rose-800">BGM</p>
                                        <p className="text-[10px] font-bold text-rose-500">{miniSettings.bgmVideoId ? 'ON' : 'OFF'}</p>
                                   </div>
                              </div>
                         </aside>

                         <main className="min-h-0 overflow-hidden rounded-2xl border border-sky-200 bg-white">
                              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                   <div className="flex gap-1">
                                        {panes.map((pane) => {
                                             const Icon = pane.icon;
                                             return (
                                                  <button
                                                       key={pane.id}
                                                       type="button"
                                                       onClick={() => setActivePane(pane.id)}
                                                       className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-colors ${activePane === pane.id ? 'bg-sky-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-sky-50'}`}
                                                  >
                                                       <Icon className="h-3.5 w-3.5" />
                                                       {pane.label}
                                                  </button>
                                             );
                                        })}
                                   </div>

                                   {isOwner && (
                                        <button
                                             type="button"
                                             onClick={() => {
                                                  if (isEditing) handleSaveProfile();
                                                  setIsEditing(!isEditing);
                                             }}
                                             className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"
                                        >
                                             <Settings className="h-3.5 w-3.5" />
                                             {isEditing ? '저장' : '편집'}
                                        </button>
                                   )}
                              </div>

                              <div className="h-full overflow-y-auto p-4 pb-8">
                                   {activePane === 'home' && (
                                        <div className="space-y-4">
                                             <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                  <div className="mb-3 flex items-center justify-between gap-3">
                                                       <div className="min-w-0">
                                                            <p className="text-xs font-black text-sky-700">Mini BGM</p>
                                                            <h3 className="truncate text-lg font-black text-brand-ink">{miniSettings.bgmVideoId ? miniSettings.bgmTitle : '유튜브 BGM을 연결해보세요'}</h3>
                                                       </div>
                                                       <button type="button" onClick={() => setIsBgmOpen(!isBgmOpen)} className="rounded-full bg-brand px-3 py-2 text-xs font-black text-white">
                                                            {miniSettings.bgmVideoId ? '재생/설정' : 'BGM 설정'}
                                                       </button>
                                                  </div>

                                                  {isBgmOpen && (
                                                       <div className="space-y-3">
                                                            {miniSettings.bgmVideoId && (
                                                                 <iframe
                                                                      title="Minihome YouTube BGM"
                                                                      className="aspect-video w-full rounded-xl"
                                                                      src={`https://www.youtube.com/embed/${miniSettings.bgmVideoId}?rel=0&modestbranding=1`}
                                                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                                      allowFullScreen
                                                                 />
                                                            )}
                                                            {isOwner && (
                                                                 <div className="grid gap-2 rounded-xl bg-white p-3">
                                                                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                                           <Youtube className="h-4 w-4 text-red-500" />
                                                                           유튜브 링크를 미니홈피 BGM으로 가져옵니다.
                                                                      </div>
                                                                      <input
                                                                           value={bgmDraft.bgmTitle}
                                                                           onChange={(event) => setBgmDraft(prev => ({ ...prev, bgmTitle: event.target.value }))}
                                                                           className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-100"
                                                                           placeholder="BGM 제목"
                                                                      />
                                                                      <div className="flex gap-2">
                                                                           <div className="relative flex-1">
                                                                                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                                                                                <input
                                                                                     value={bgmDraft.bgmUrl}
                                                                                     onChange={(event) => setBgmDraft(prev => ({ ...prev, bgmUrl: event.target.value }))}
                                                                                     className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-100"
                                                                                     placeholder="https://youtube.com/watch?v=..."
                                                                                />
                                                                           </div>
                                                                           <button type="button" onClick={handleSaveBgm} className="rounded-lg bg-sky-900 px-4 py-2 text-sm font-black text-white">저장</button>
                                                                      </div>
                                                                 </div>
                                                            )}
                                                       </div>
                                                  )}
                                             </section>

                                             {isEditing ? (
                                                  <section className="grid gap-2 rounded-2xl border border-slate-200 p-4">
                                                       <input value={editForm.location} onChange={event => setEditForm(prev => ({ ...prev, location: event.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="지역" />
                                                       <input value={editForm.mbti} onChange={event => setEditForm(prev => ({ ...prev, mbti: event.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="MBTI" />
                                                       <input value={editForm.job} onChange={event => setEditForm(prev => ({ ...prev, job: event.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="직업 / 하는 일" />
                                                       <textarea value={editForm.bio} onChange={event => setEditForm(prev => ({ ...prev, bio: event.target.value }))} className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="자기소개" />
                                                  </section>
                                             ) : (
                                                  <section className="rounded-2xl border border-slate-200 p-4">
                                                       <p className="text-xs font-black text-slate-400">Profile memo</p>
                                                       <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">{statusMessage}</p>
                                                  </section>
                                             )}
                                        </div>
                                   )}

                                   {activePane === 'guestbook' && (
                                        <div className="space-y-4">
                                             <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                  <div className="flex gap-2">
                                                       <input
                                                            type="text"
                                                            value={newComment}
                                                            onChange={(event) => setNewComment(event.target.value)}
                                                            onKeyDown={(event) => event.key === 'Enter' && handlePostComment()}
                                                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-100"
                                                            placeholder="방명록을 남겨주세요"
                                                       />
                                                       <button type="button" onClick={handlePostComment} className="rounded-xl bg-sky-900 px-4 text-sm font-black text-white">
                                                            <Send className="h-4 w-4" />
                                                       </button>
                                                  </div>
                                             </div>

                                             <div className="space-y-3">
                                                  {guestbookEntries.length === 0 && (
                                                       <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
                                                            아직 방명록이 없습니다.
                                                       </div>
                                                  )}
                                                  {guestbookEntries.map((entry) => (
                                                       <article key={entry.$id} className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                 <p className="text-sm font-black text-brand-ink">{entry.authorUsername || '익명'}</p>
                                                                 <p className="text-[11px] font-bold text-slate-400">{new Date(entry.$createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <p className="text-sm font-semibold leading-6 text-slate-600">{entry.content}</p>
                                                            <button type="button" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                                                 <Heart className="h-3 w-3" />
                                                                 공감
                                                            </button>
                                                       </article>
                                                  ))}
                                             </div>
                                        </div>
                                   )}

                                   {activePane === 'surf' && (
                                        <div className="space-y-3">
                                             <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                                                  <h3 className="text-lg font-black text-sky-950">파도타기</h3>
                                                  <p className="mt-1 text-sm font-semibold text-sky-700">일촌과 관심사가 이어진 강남 미니홈피를 둘러보세요.</p>
                                             </div>
                                             {surfLinks.map((link) => (
                                                  <button key={link.name} type="button" className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50">
                                                       <div>
                                                            <p className="text-sm font-black text-brand-ink">{link.name}</p>
                                                            <p className="mt-1 text-xs font-bold text-slate-500">{link.status}</p>
                                                       </div>
                                                       <span className={`rounded-full px-3 py-1 text-[11px] font-black ${link.tone}`}>방문</span>
                                                  </button>
                                             ))}
                                        </div>
                                   )}
                              </div>
                         </main>
                    </div>
               </div>
          </div>
     );
};

export default MiniHomepage;
