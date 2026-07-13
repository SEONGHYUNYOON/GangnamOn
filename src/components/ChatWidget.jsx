import React, { useEffect, useMemo, useState } from 'react';
import { Ban, Bell, BellOff, BellRing, Heart, Loader2, MessageCircle, Search, Send, Star, UserPlus, X } from 'lucide-react';
import { client, databases, DATABASE_ID, COLLECTIONS, ID, Permission, Query, Role } from '../lib/appwrite';
import { isPushSupported, getPushPermission, subscribeToPush } from '../lib/push';
import { resolveAvatarUrl } from '../lib/avatar';

const displayNameOf = (profile) => profile?.username || profile?.fullName || '강남 이웃';
const relationId = (ownerId, targetId, type) => `${ownerId}_${targetId}_${type}`.replace(/[^a-zA-Z0-9._-]/g, '_');
// Appwrite 문서 ID는 36자 제한입니다. 두 유저 ID(각 20자)를 그대로 이어붙이면 44자가 되어
// 방/참가자 문서 생성이 조용히 실패하므로, 앞 15자씩만 사용해 34자 결정적 방 ID를 만듭니다.
const dmRoomId = (idA, idB) => {
     const [a, b] = [String(idA), String(idB)].sort();
     return `dm_${a.slice(0, 15)}_${b.slice(0, 15)}`.replace(/[^a-zA-Z0-9._-]/g, '_');
};
const historyKey = (userId) => `gangnam:on:chat-search-history:${userId}`;
const lastReadKey = (userId) => `gangnam:on:chat-last-read:${userId}`;

const ChatWidget = ({ user, initialPeer = null, onConsumeInitialPeer, onUnreadChange }) => {
     const [isOpen, setIsOpen] = useState(false);
     const [query, setQuery] = useState('');
     const [profiles, setProfiles] = useState([]);
     const [rooms, setRooms] = useState([]);
     const [activeRoom, setActiveRoom] = useState(null);
     const [messages, setMessages] = useState([]);
     const [messageDraft, setMessageDraft] = useState('');
     const [loading, setLoading] = useState(false);
     const [errorText, setErrorText] = useState('');
     const [onlineIds, setOnlineIds] = useState(new Set());
     const [relations, setRelations] = useState([]);
     const [searchHistory, setSearchHistory] = useState([]);
     const [showHistory, setShowHistory] = useState(false);
     const [notice, setNotice] = useState(null);
     const [lastReadMap, setLastReadMap] = useState({});
     const [unreadRoomIds, setUnreadRoomIds] = useState(new Set());
     const [pushState, setPushState] = useState('default');
     const [pushLoading, setPushLoading] = useState(false);

     const activePeer = activeRoom?.peer;
     const canChat = Boolean(user?.id);
     const blockedIds = useMemo(() => new Set(relations.filter(item => item.relationType === 'blocked').map(item => item.targetId)), [relations]);
     const favoriteIds = useMemo(() => new Set(relations.filter(item => item.relationType === 'favorite' || item.relationType === 'friend').map(item => item.targetId)), [relations]);
     const isPeerOnline = activePeer?.$id ? onlineIds.has(activePeer.$id) : false;
     const isBlocked = activePeer?.$id ? blockedIds.has(activePeer.$id) : false;

     useEffect(() => {
          onUnreadChange?.(unreadRoomIds.size);
     }, [unreadRoomIds, onUnreadChange]);

     const filteredProfiles = useMemo(() => {
          const term = query.trim().toLowerCase();
          return profiles
               .filter(profile => profile.$id !== user?.id)
               .filter(profile => !blockedIds.has(profile.$id))
               .filter(profile => {
                    if (!term) return true;
                    return [profile.username, profile.fullName, profile.location].filter(Boolean).some(value => String(value).toLowerCase().includes(term));
               })
               .slice(0, 10);
     }, [profiles, query, user?.id, blockedIds]);

     const saveSearchHistory = (name) => {
          if (!user?.id || !name) return;
          const next = [name, ...searchHistory.filter(item => item !== name)].slice(0, 6);
          setSearchHistory(next);
          window.localStorage.setItem(historyKey(user.id), JSON.stringify(next));
     };

     const fetchPresence = async () => {
          try {
               const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.presence,
                    queries: [Query.greaterThan('lastSeenAt', since), Query.limit(100)],
               });
               setOnlineIds(new Set(res.documents.map(doc => doc.userId)));
          } catch {
               setOnlineIds(new Set());
          }
     };

     const fetchRelations = async () => {
          if (!user?.id) return;
          try {
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.userRelations,
                    queries: [Query.equal('ownerId', user.id), Query.limit(100)],
               });
               setRelations(res.documents);
          } catch (error) {
               console.warn('관계 목록 로딩 실패:', error);
          }
     };

     const fetchProfiles = async () => {
          try {
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    queries: [Query.limit(60)],
               });
               setProfiles(res.documents);
          } catch (error) {
               console.warn('프로필 검색 로딩 실패:', error);
          }
     };

     const fetchRooms = async () => {
          if (!user?.id) return;
          try {
               const participantRes = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.chatParticipants,
                    queries: [Query.equal('userId', user.id), Query.limit(50)],
               });
               const roomIds = participantRes.documents.map(doc => doc.roomId);
               if (roomIds.length === 0) {
                    setRooms([]);
                    return;
               }
               const peerParticipants = await Promise.all(roomIds.map(roomId =>
                    databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatParticipants,
                         queries: [Query.equal('roomId', roomId), Query.limit(10)],
                    }).catch(() => ({ documents: [] }))
               ));
               const peerIds = [...new Set(peerParticipants.flatMap(res => res.documents).map(doc => doc.userId).filter(id => id !== user.id))];
               const peerProfiles = await Promise.all(peerIds.map(id =>
                    databases.getDocument({ databaseId: DATABASE_ID, collectionId: COLLECTIONS.profiles, documentId: id }).catch(() => null)
               ));
               const profileMap = new Map(peerProfiles.filter(Boolean).map(profile => [profile.$id, profile]));

               const nextRooms = roomIds.map((roomId, index) => {
                    const peerId = peerParticipants[index].documents.find(doc => doc.userId !== user.id)?.userId;
                    return { roomId, peer: profileMap.get(peerId) || { $id: peerId, username: '알 수 없음' } };
               }).filter(room => room.peer?.$id && !blockedIds.has(room.peer.$id));

               setRooms(nextRooms);

               // 각 방의 마지막 메시지 시각을 확인해 "안읽음" 상태를 계산합니다.
               const lastMessages = await Promise.all(nextRooms.map(room =>
                    databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatMessages,
                         queries: [Query.equal('roomId', room.roomId), Query.orderDesc('$createdAt'), Query.limit(1)],
                    }).catch(() => ({ documents: [] }))
               ));
               setUnreadRoomIds(prev => {
                    const next = new Set(prev);
                    nextRooms.forEach((room, index) => {
                         const lastMessage = lastMessages[index].documents[0];
                         if (!lastMessage || lastMessage.senderId === user.id) return;
                         const readAt = lastReadMap[room.roomId];
                         if (!readAt || new Date(lastMessage.$createdAt) > new Date(readAt)) {
                              next.add(room.roomId);
                         }
                    });
                    return next;
               });
          } catch (error) {
               console.warn('대화방 로딩 실패:', error);
          }
     };

     const markRoomRead = (roomId) => {
          if (!user?.id || !roomId) return;
          const nowIso = new Date().toISOString();
          setLastReadMap(prev => {
               const next = { ...prev, [roomId]: nowIso };
               try {
                    window.localStorage.setItem(lastReadKey(user.id), JSON.stringify(next));
               } catch {
                    // localStorage 사용 불가 시 무시 (badge는 세션 내에서만 동작)
               }
               return next;
          });
          setUnreadRoomIds(prev => {
               if (!prev.has(roomId)) return prev;
               const next = new Set(prev);
               next.delete(roomId);
               return next;
          });
     };

     const upsertRelation = async (profile, relationType) => {
          if (!user?.id || !profile?.$id) return;
          const existing = relations.find(item => item.targetId === profile.$id && item.relationType === relationType);
          if (existing) {
               await databases.deleteDocument({ databaseId: DATABASE_ID, collectionId: COLLECTIONS.userRelations, documentId: existing.$id }).catch(() => null);
               setRelations(prev => prev.filter(item => item.$id !== existing.$id));
               return;
          }
          const created = await databases.createDocument({
               databaseId: DATABASE_ID,
               collectionId: COLLECTIONS.userRelations,
               documentId: relationId(user.id, profile.$id, relationType),
               data: {
                    ownerId: user.id,
                    targetId: profile.$id,
                    relationType,
                    targetUsername: displayNameOf(profile),
                    targetAvatarUrl: profile.avatarUrl || '',
               },
               permissions: [Permission.read(Role.user(user.id)), Permission.update(Role.user(user.id)), Permission.delete(Role.user(user.id))],
          });
          setRelations(prev => [...prev.filter(item => !(item.targetId === profile.$id && item.relationType === relationType)), created]);
          if (relationType === 'blocked') setActiveRoom(null);
     };

     const openRoomWithProfile = async (profile) => {
          if (!user?.id || !profile?.$id || profile.$id === user.id || blockedIds.has(profile.$id)) return;
          setLoading(true);
          setErrorText('');
          saveSearchHistory(displayNameOf(profile));
          try {
               const roomId = dmRoomId(user.id, profile.$id);
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.chatRooms,
                    documentId: roomId,
                    data: { type: 'dm' },
                    permissions: [Permission.read(Role.user(user.id)), Permission.read(Role.user(profile.$id))],
               }).catch(() => null);

               // 참가자 문서는 ID를 직접 만들면 36자 제한을 넘으므로 ID.unique()를 쓰고,
               // 중복 참가는 (roomId, userId) unique 인덱스가 409로 막아줍니다.
               await Promise.all([user.id, profile.$id].map(memberId =>
                    databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatParticipants,
                         documentId: ID.unique(),
                         data: { roomId, userId: memberId },
                         permissions: [Permission.read(Role.user(memberId)), Permission.read(Role.user(user.id)), Permission.read(Role.user(profile.$id))],
                    }).catch(() => null)
               ));

               setActiveRoom({ roomId, peer: profile });
               setIsOpen(true);
               setQuery('');
               markRoomRead(roomId);
               await fetchRooms();
          } finally {
               setLoading(false);
          }
     };

     const fetchMessages = async () => {
          if (!activeRoom?.roomId) return;
          try {
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.chatMessages,
                    queries: [Query.equal('roomId', activeRoom.roomId), Query.orderAsc('$createdAt'), Query.limit(100)],
               });
               setMessages(res.documents);
          } catch (error) {
               console.warn('메시지 로딩 실패:', error);
               setMessages([]);
          }
     };

     const sendMessage = async () => {
          const content = messageDraft.trim();
          if (!content || !activeRoom?.roomId || !user?.id || !activePeer?.$id || isBlocked) return;
          setMessageDraft('');
          setErrorText('');
          try {
               const data = { roomId: activeRoom.roomId, senderId: user.id, content };
               try {
                    await databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatMessages,
                         documentId: ID.unique(),
                         data,
                         permissions: [
                              Permission.read(Role.user(user.id)),
                              Permission.read(Role.user(activePeer.$id)),
                              Permission.update(Role.user(user.id)),
                              Permission.delete(Role.user(user.id)),
                         ],
                    });
               } catch (permissionError) {
                    await databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatMessages,
                         documentId: ID.unique(),
                         data,
                         permissions: [
                              Permission.read(Role.users()),
                              Permission.update(Role.user(user.id)),
                              Permission.delete(Role.user(user.id)),
                         ],
                    });
               }
               await fetchMessages();
          } catch (error) {
               console.error('메시지 전송 실패:', error);
               setErrorText('메시지를 보내지 못했습니다. 잠시 후 다시 시도해주세요.');
          }
     };

     const handleEnablePush = async () => {
          if (!user?.id || pushLoading) return;
          setPushLoading(true);
          try {
               const result = await subscribeToPush(user.id);
               setPushState(getPushPermission());
               if (!result.success) {
                    if (result.reason === 'denied') {
                         setErrorText('브라우저 알림 권한이 차단되어 있어요. 브라우저 설정에서 알림을 허용해주세요.');
                    } else if (result.reason === 'unsupported') {
                         setErrorText('이 브라우저에서는 오프라인 알림을 지원하지 않아요.');
                    }
               }
          } finally {
               setPushLoading(false);
          }
     };

     useEffect(() => {
          if (!user?.id) return;
          try {
               setSearchHistory(JSON.parse(window.localStorage.getItem(historyKey(user.id)) || '[]'));
          } catch {
               setSearchHistory([]);
          }
          try {
               setLastReadMap(JSON.parse(window.localStorage.getItem(lastReadKey(user.id)) || '{}'));
          } catch {
               setLastReadMap({});
          }
          setPushState(getPushPermission());
     }, [user?.id]);

     useEffect(() => {
          if (!isOpen || !canChat) return;
          fetchProfiles();
          fetchPresence();
          fetchRelations();
          const interval = setInterval(fetchPresence, 30000);
          return () => clearInterval(interval);
     }, [isOpen, canChat]);

     useEffect(() => {
          if (isOpen && canChat) fetchRooms();
     }, [isOpen, canChat, relations.length]);

     useEffect(() => {
          fetchMessages();
          if (!activeRoom?.roomId) return undefined;
          const unsubscribe = client.subscribe([`databases.${DATABASE_ID}.collections.${COLLECTIONS.chatMessages}.documents`], (response) => {
               if (response.payload?.roomId === activeRoom.roomId) {
                    fetchMessages();
                    // 지금 보고 있는 방에 새 메시지가 오면 바로 읽음 처리
                    if (response.payload?.senderId !== user?.id) markRoomRead(activeRoom.roomId);
               }
          });
          return () => unsubscribe();
     }, [activeRoom?.roomId]);

     useEffect(() => {
          if (!canChat) return undefined;
          const unsubscribe = client.subscribe([`databases.${DATABASE_ID}.collections.${COLLECTIONS.chatMessages}.documents`], (response) => {
               const payload = response.payload;
               const isCreate = response.events.some(event => event.endsWith('.create'));
               if (!isCreate || !payload?.roomId || payload.senderId === user.id) return;
               // 내가 참여한 방(방 ID에 내 유저 ID 앞부분이 포함됨)의 메시지만 알림
               if (!payload.roomId.includes(user.id.slice(0, 15))) return;

               const isActiveRoom = payload.roomId === activeRoom?.roomId;

               // 접속 중(온라인)일 때는 지금 보고 있는 방이든 아니든 항상 팝업으로 새 메시지를 알려줍니다.
               setNotice({ roomId: payload.roomId, text: isActiveRoom ? '새 메시지가 도착했어요' : '새 1:1 대화가 도착했어요' });
               setTimeout(() => setNotice(null), 4500);

               if (!isActiveRoom) {
                    setUnreadRoomIds(prev => new Set(prev).add(payload.roomId));
                    if (!rooms.some(room => room.roomId === payload.roomId)) fetchRooms();
               }
          });
          return () => unsubscribe();
     }, [canChat, user?.id, activeRoom?.roomId, rooms]);

     useEffect(() => {
          if (!initialPeer) return;
          setIsOpen(true);
          openRoomWithProfile(initialPeer);
          if (onConsumeInitialPeer) onConsumeInitialPeer();
     }, [initialPeer?.$id]);

     const renderProfileButton = (profile, key, isUnread = false) => (
          <button
               key={key}
               type="button"
               onClick={() => openRoomWithProfile(profile)}
               className="flex w-full items-center gap-2 rounded-xl bg-white p-2 text-left hover:bg-brand-light"
          >
               <div className="relative shrink-0">
                    <img src={resolveAvatarUrl(profile)} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${onlineIds.has(profile.$id) ? 'bg-green-500' : 'bg-slate-300'}`} />
               </div>
               <span className={`min-w-0 flex-1 text-xs leading-4 text-brand-ink ${isUnread ? 'font-black' : 'font-bold'}`}>{displayNameOf(profile)}</span>
               {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" />}
          </button>
     );

     return (
          <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none">
               {isOpen && <button type="button" aria-label="채팅 닫기" onClick={() => setIsOpen(false)} className="fixed inset-0 z-[59] cursor-default bg-transparent" />}
               {notice && (
                    <button type="button" onClick={() => setIsOpen(true)} className="pointer-events-auto mb-3 flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-black text-brand-ink shadow-2xl animate-[chat-pop_0.45s_ease-out]">
                         <Bell className="h-4 w-4 text-brand-accent" />
                         {notice.text}
                    </button>
               )}

               <div className={`relative z-[61] bg-white rounded-card shadow-2xl border border-surface-border w-[min(520px,calc(100vw-32px))] h-[min(620px,calc(100vh-120px))] mb-4 origin-bottom-right transition-all duration-300 transform overflow-hidden flex flex-col ${isOpen ? 'pointer-events-auto scale-100 opacity-100 translate-y-0' : 'pointer-events-none scale-50 opacity-0 translate-y-24'}`}>
                    <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                         <div className="min-w-0">
                              <h3 className="break-words font-black text-gray-900 text-sm">{activePeer ? displayNameOf(activePeer) : '강남온 채팅'}</h3>
                              <p className="text-xs text-gray-400 font-bold">
                                   {activePeer ? `${isPeerOnline ? '온라인 · 바로 대화' : '오프라인 · 쪽지로 전달'}` : canChat ? '아이디·대화명 검색 후 1:1 대화' : '로그인이 필요합니다'}
                              </p>
                         </div>
                         <div className="flex items-center gap-2">
                              {canChat && isPushSupported() && (
                                   <button
                                        type="button"
                                        onClick={handleEnablePush}
                                        disabled={pushLoading || pushState === 'granted'}
                                        title={pushState === 'granted' ? '오프라인 알림이 켜져 있어요' : pushState === 'denied' ? '브라우저 설정에서 알림이 차단되어 있어요' : '오프라인 푸시 알림 켜기'}
                                        className={`rounded-full p-1.5 transition-colors ${pushState === 'granted' ? 'text-emerald-500' : pushState === 'denied' ? 'text-slate-300' : 'text-brand-accent hover:bg-amber-50'}`}
                                   >
                                        {pushLoading ? (
                                             <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : pushState === 'granted' ? (
                                             <BellRing className="h-4 w-4" />
                                        ) : pushState === 'denied' ? (
                                             <BellOff className="h-4 w-4" />
                                        ) : (
                                             <Bell className="h-4 w-4" />
                                        )}
                                   </button>
                              )}
                              {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />}
                         </div>
                    </div>

                    {!canChat ? (
                         <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                              <MessageCircle className="mb-4 h-12 w-12 text-slate-300" />
                              <p className="text-sm font-black text-brand-ink">로그인 후 채팅을 사용할 수 있어요.</p>
                         </div>
                    ) : (
                         <div className="grid min-h-0 flex-1 grid-cols-[176px_1fr]">
                              <aside className="border-r border-slate-100 bg-slate-50 p-3">
                                   <div className="relative mb-3">
                                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
                                        <input
                                             value={query}
                                             onFocus={() => setShowHistory(true)}
                                             onChange={(event) => { setQuery(event.target.value); setShowHistory(true); }}
                                             className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-brand-gold"
                                             placeholder="닉네임 검색"
                                        />
                                        {showHistory && !query && searchHistory.length > 0 && (
                                             <div className="absolute left-0 right-0 top-10 z-20 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                                                  {searchHistory.map(name => (
                                                       <button key={name} type="button" onClick={() => { setQuery(name); setShowHistory(false); }} className="block w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                                                            {name}
                                                       </button>
                                                  ))}
                                             </div>
                                        )}
                                   </div>
                                   <div className="space-y-2 overflow-y-auto">
                                        {(query ? filteredProfiles : rooms).map((item) => {
                                             const profile = query ? item : item.peer;
                                             const key = query ? profile.$id : item.roomId;
                                             const isUnread = !query && unreadRoomIds.has(item.roomId);
                                             return renderProfileButton(profile, key, isUnread);
                                        })}
                                        {!query && rooms.length === 0 && <p className="px-1 py-4 text-center text-[11px] font-bold text-slate-400">검색으로 대화를 시작하세요.</p>}
                                        {query && filteredProfiles.length === 0 && <p className="px-1 py-4 text-center text-[11px] font-bold text-slate-400">검색 결과가 없습니다.</p>}
                                   </div>
                              </aside>

                              <main className="flex min-h-0 min-w-0 flex-col">
                                   {activeRoom ? (
                                        <>
                                             <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                                                  <div className="min-w-0">
                                                       <p className="break-words text-xs font-black text-brand-ink">{displayNameOf(activePeer)}</p>
                                                       <p className={`text-[11px] font-bold ${isPeerOnline ? 'text-green-600' : 'text-slate-400'}`}>{isPeerOnline ? '온라인' : '오프라인 · 쪽지 모드'}</p>
                                                  </div>
                                                  <div className="flex gap-1">
                                                       <button type="button" onClick={() => upsertRelation(activePeer, 'favorite')} className={`rounded-full p-2 ${favoriteIds.has(activePeer.$id) ? 'bg-amber-50 text-brand-accent' : 'text-slate-300 hover:bg-slate-50'}`} title="즐겨찾기">
                                                            <Star className="h-4 w-4" />
                                                       </button>
                                                       <button type="button" onClick={() => upsertRelation(activePeer, 'friend')} className="rounded-full p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="대화 친구">
                                                            <Heart className="h-4 w-4" />
                                                       </button>
                                                       <button type="button" onClick={() => upsertRelation(activePeer, 'blocked')} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="차단">
                                                            <Ban className="h-4 w-4" />
                                                       </button>
                                                  </div>
                                             </div>
                                             <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
                                                  {messages.map((message) => {
                                                       const mine = message.senderId === user.id;
                                                       if (message.isNotice) {
                                                            return (
                                                                 <div key={message.$id} className="flex justify-center">
                                                                      <div className="max-w-[90%] rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm">
                                                                           <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-amber-600">
                                                                                <Bell className="h-3 w-3" />
                                                                                공지
                                                                           </div>
                                                                           {message.content}
                                                                      </div>
                                                                 </div>
                                                            );
                                                       }
                                                       return (
                                                            <div key={message.$id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                                 <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm font-semibold ${mine ? 'rounded-br-none bg-brand text-white' : 'rounded-bl-none bg-white text-slate-700 shadow-sm'}`}>
                                                                      {message.content}
                                                                 </div>
                                                            </div>
                                                       );
                                                  })}
                                                  {messages.length === 0 && <div className="flex h-full items-center justify-center text-center text-xs font-bold text-slate-400">첫 메시지를 보내보세요.</div>}
                                             </div>
                                             <div className="border-t border-gray-100 bg-white p-3">
                                                  {errorText && <p className="mb-2 text-xs font-bold text-red-500">{errorText}</p>}
                                                  {isBlocked ? (
                                                       <div className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600">차단한 상대에게는 메시지를 보낼 수 없습니다.</div>
                                                  ) : (
                                                       <div className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2">
                                                            <input
                                                                 type="text"
                                                                 value={messageDraft}
                                                                 onChange={(event) => setMessageDraft(event.target.value)}
                                                                 onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                                                                 placeholder={isPeerOnline ? '메시지 보내기...' : '쪽지 보내기...'}
                                                                 className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                                                            />
                                                            <button type="button" onClick={sendMessage} className="text-brand-accent hover:text-brand">
                                                                 <Send className="w-5 h-5" />
                                                            </button>
                                                       </div>
                                                  )}
                                             </div>
                                        </>
                                   ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                                             <UserPlus className="mb-3 h-10 w-10 text-slate-300" />
                                             <p className="text-sm font-black text-brand-ink">대화 상대를 검색하세요.</p>
                                             <p className="mt-1 text-xs font-bold leading-5 text-slate-400">온라인 상태를 확인하고, 오프라인이면 쪽지로 남길 수 있습니다.</p>
                                        </div>
                                   )}
                              </main>
                         </div>
                    )}
               </div>

               <button onClick={() => setIsOpen(!isOpen)} className={`pointer-events-auto relative rounded-full w-14 h-14 flex items-center justify-center shadow-[0_12px_34px_rgba(15,23,42,0.24)] transition-all duration-300 hover:scale-110 active:scale-95 z-[70] ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-brand hover:bg-brand-dark hover:rotate-12'}`}>
                    {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-7 h-7 text-white fill-current" />}
                    {!isOpen && unreadRoomIds.size > 0 && (
                         <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black leading-none text-white">
                              {unreadRoomIds.size > 9 ? '9+' : unreadRoomIds.size}
                         </span>
                    )}
               </button>
          </div>
     );
};

export default ChatWidget;
