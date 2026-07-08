import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, X, Send, Search, UserPlus, Loader2 } from 'lucide-react';
import { client, databases, DATABASE_ID, COLLECTIONS, ID, Permission, Query, Role } from '../lib/appwrite';

const displayNameOf = (profile) => profile?.username || profile?.fullName || '강남 이웃';

const ChatWidget = ({ user, initialPeer = null, onConsumeInitialPeer }) => {
     const [isOpen, setIsOpen] = useState(false);
     const [query, setQuery] = useState('');
     const [profiles, setProfiles] = useState([]);
     const [rooms, setRooms] = useState([]);
     const [activeRoom, setActiveRoom] = useState(null);
     const [messages, setMessages] = useState([]);
     const [messageDraft, setMessageDraft] = useState('');
     const [loading, setLoading] = useState(false);

     const activePeer = activeRoom?.peer;
     const canChat = Boolean(user?.id);

     const filteredProfiles = useMemo(() => {
          const term = query.trim().toLowerCase();
          return profiles
               .filter(profile => profile.$id !== user?.id)
               .filter(profile => {
                    if (!term) return true;
                    return [profile.username, profile.fullName, profile.location]
                         .filter(Boolean)
                         .some(value => String(value).toLowerCase().includes(term));
               })
               .slice(0, 8);
     }, [profiles, query, user?.id]);

     const fetchProfiles = async () => {
          try {
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    queries: [Query.limit(50)],
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

               const peerIds = [...new Set(peerParticipants.flatMap(res => res.documents)
                    .map(doc => doc.userId)
                    .filter(id => id !== user.id))];
               const peerProfiles = await Promise.all(peerIds.map(id =>
                    databases.getDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         documentId: id,
                    }).catch(() => null)
               ));
               const profileMap = new Map(peerProfiles.filter(Boolean).map(profile => [profile.$id, profile]));

               setRooms(roomIds.map((roomId, index) => {
                    const peerId = peerParticipants[index].documents.find(doc => doc.userId !== user.id)?.userId;
                    return { roomId, peer: profileMap.get(peerId) || { $id: peerId, username: '알 수 없음' } };
               }).filter(room => room.peer?.$id));
          } catch (error) {
               console.warn('대화방 로딩 실패:', error);
          }
     };

     const openRoomWithProfile = async (profile) => {
          if (!user?.id || !profile?.$id || profile.$id === user.id) return;
          setLoading(true);
          try {
               const roomId = [user.id, profile.$id].sort().join('_dm_').replace(/[^a-zA-Z0-9._-]/g, '_');
               try {
                    await databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatRooms,
                         documentId: roomId,
                         data: { type: 'dm' },
                         permissions: [Permission.read(Role.user(user.id)), Permission.read(Role.user(profile.$id))],
                    });
               } catch {
                    // 이미 존재하는 1:1 방이면 그대로 사용합니다.
               }

               await Promise.all([user.id, profile.$id].map(memberId =>
                    databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatParticipants,
                         documentId: `${roomId}_${memberId}`.replace(/[^a-zA-Z0-9._-]/g, '_'),
                         data: { roomId, userId: memberId },
                         permissions: [Permission.read(Role.user(memberId)), Permission.read(Role.user(user.id)), Permission.read(Role.user(profile.$id))],
                    }).catch(() => null)
               ));

               setActiveRoom({ roomId, peer: profile });
               setIsOpen(true);
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
          if (!content || !activeRoom?.roomId || !user?.id || !activePeer?.$id) return;

          setMessageDraft('');
          try {
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.chatMessages,
                    documentId: ID.unique(),
                    data: {
                         roomId: activeRoom.roomId,
                         senderId: user.id,
                         content,
                    },
                    permissions: [
                         Permission.read(Role.user(user.id)),
                         Permission.read(Role.user(activePeer.$id)),
                         Permission.update(Role.user(user.id)),
                         Permission.delete(Role.user(user.id)),
                    ],
               });
               await fetchMessages();
          } catch (error) {
               console.error('메시지 전송 실패:', error);
               alert('메시지 전송에 실패했습니다.');
          }
     };

     useEffect(() => {
          if (!isOpen || !canChat) return;
          fetchProfiles();
          fetchRooms();
     }, [isOpen, canChat]);

     useEffect(() => {
          fetchMessages();
          if (!activeRoom?.roomId) return undefined;
          const unsubscribe = client.subscribe(
               [`databases.${DATABASE_ID}.collections.${COLLECTIONS.chatMessages}.documents`],
               (response) => {
                    if (response.payload?.roomId === activeRoom.roomId) fetchMessages();
               },
          );
          return () => unsubscribe();
     }, [activeRoom?.roomId]);

     useEffect(() => {
          if (!initialPeer) return;
          setIsOpen(true);
          openRoomWithProfile(initialPeer);
          if (onConsumeInitialPeer) onConsumeInitialPeer();
     }, [initialPeer?.$id]);

     return (
          <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none">
               <div className={`pointer-events-auto bg-white rounded-card shadow-2xl border border-surface-border w-[min(390px,calc(100vw-32px))] h-[min(620px,calc(100vh-120px))] mb-4 origin-bottom-right transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-24'} overflow-hidden flex flex-col`}>
                    <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                         <div>
                              <h3 className="font-black text-gray-900 text-sm">{activePeer ? displayNameOf(activePeer) : '강남온 채팅'}</h3>
                              <p className="text-xs text-gray-400 font-bold">{canChat ? '아이디·대화명 검색 후 1:1 대화' : '로그인이 필요합니다'}</p>
                         </div>
                         {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />}
                    </div>

                    {!canChat ? (
                         <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                              <MessageCircle className="mb-4 h-12 w-12 text-slate-300" />
                              <p className="text-sm font-black text-brand-ink">로그인 후 채팅을 사용할 수 있어요.</p>
                         </div>
                    ) : (
                         <div className="grid min-h-0 flex-1 grid-cols-[130px_1fr]">
                              <aside className="border-r border-slate-100 bg-slate-50 p-3">
                                   <div className="relative mb-3">
                                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
                                        <input
                                             value={query}
                                             onChange={(event) => setQuery(event.target.value)}
                                             className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-2 text-xs font-bold outline-none focus:border-brand-gold"
                                             placeholder="검색"
                                        />
                                   </div>
                                   <div className="space-y-2 overflow-y-auto">
                                        {(query ? filteredProfiles : rooms).map((item) => {
                                             const profile = query ? item : item.peer;
                                             const roomId = query ? profile.$id : item.roomId;
                                             return (
                                                  <button
                                                       key={roomId}
                                                       type="button"
                                                       onClick={() => query ? openRoomWithProfile(profile) : setActiveRoom(item)}
                                                       className="flex w-full items-center gap-2 rounded-xl bg-white p-2 text-left hover:bg-brand-light"
                                                  >
                                                       <img src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayNameOf(profile)}`} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                       <span className="min-w-0 truncate text-xs font-black text-brand-ink">{displayNameOf(profile)}</span>
                                                  </button>
                                             );
                                        })}
                                        {!query && rooms.length === 0 && (
                                             <p className="px-1 py-4 text-center text-[11px] font-bold text-slate-400">검색으로 대화를 시작하세요.</p>
                                        )}
                                        {query && filteredProfiles.length === 0 && (
                                             <p className="px-1 py-4 text-center text-[11px] font-bold text-slate-400">검색 결과가 없습니다.</p>
                                        )}
                                   </div>
                              </aside>

                              <main className="flex min-w-0 flex-col">
                                   {activeRoom ? (
                                        <>
                                             <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
                                                  {messages.map((message) => {
                                                       const mine = message.senderId === user.id;
                                                       return (
                                                            <div key={message.$id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                                 <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm font-semibold ${mine ? 'rounded-br-none bg-brand text-white' : 'rounded-bl-none bg-white text-slate-700 shadow-sm'}`}>
                                                                      {message.content}
                                                                 </div>
                                                            </div>
                                                       );
                                                  })}
                                                  {messages.length === 0 && (
                                                       <div className="flex h-full items-center justify-center text-center text-xs font-bold text-slate-400">
                                                            첫 메시지를 보내보세요.
                                                       </div>
                                                  )}
                                             </div>
                                             <div className="border-t border-gray-100 bg-white p-3">
                                                  <div className="flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2">
                                                       <input
                                                            type="text"
                                                            value={messageDraft}
                                                            onChange={(event) => setMessageDraft(event.target.value)}
                                                            onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                                                            placeholder="메시지 보내기..."
                                                            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                                                       />
                                                       <button type="button" onClick={sendMessage} className="text-brand-accent hover:text-brand">
                                                            <Send className="w-5 h-5" />
                                                       </button>
                                                  </div>
                                             </div>
                                        </>
                                   ) : (
                                        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                                             <UserPlus className="mb-3 h-10 w-10 text-slate-300" />
                                             <p className="text-sm font-black text-brand-ink">대화 상대를 검색하세요.</p>
                                             <p className="mt-1 text-xs font-bold leading-5 text-slate-400">아이디나 대화명으로 찾아 1:1 대화를 시작할 수 있습니다.</p>
                                        </div>
                                   )}
                              </main>
                         </div>
                    )}
               </div>

               <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`pointer-events-auto rounded-full w-14 h-14 flex items-center justify-center shadow-[0_12px_34px_rgba(15,23,42,0.24)] transition-all duration-300 hover:scale-110 active:scale-95 z-[70] ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-brand hover:bg-brand-dark hover:rotate-12'}`}
               >
                    {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-7 h-7 text-white fill-current" />}
               </button>
          </div>
     );
};

export default ChatWidget;
