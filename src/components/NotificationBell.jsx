import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Heart, MessageCircle, BookOpen, X } from 'lucide-react';
import { client, databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

// 홈화면 프로필 위젯의 종 모양 알림 버튼.
// 새 방명록(guestbook_entries) / 새 1:1 쪽지(chat_messages) / 일촌 신청(user_relations)을
// 모아서 보여줍니다. (댓글 컬렉션이 생기면 같은 방식으로 소스를 추가하면 됩니다)
const lastReadStorageKey = (userId) => `gangnam:on:notif-last-read:${userId}`;

const timeAgo = (iso) => {
     const diff = Date.now() - new Date(iso).getTime();
     const minutes = Math.floor(diff / 60000);
     if (minutes < 1) return '방금 전';
     if (minutes < 60) return `${minutes}분 전`;
     const hours = Math.floor(minutes / 60);
     if (hours < 24) return `${hours}시간 전`;
     return `${Math.floor(hours / 24)}일 전`;
};

const TYPE_META = {
     guestbook: { icon: BookOpen, label: '방명록', color: 'text-sky-600 bg-sky-50' },
     message: { icon: MessageCircle, label: '쪽지', color: 'text-purple-600 bg-purple-50' },
     friend: { icon: Heart, label: '일촌', color: 'text-rose-600 bg-rose-50' },
};

const NotificationBell = ({ user }) => {
     const [isOpen, setIsOpen] = useState(false);
     const [items, setItems] = useState([]);
     const [lastReadAt, setLastReadAt] = useState(null);
     // 패널 위치(화면 고정 좌표). 프로필 카드가 overflow-hidden이라 카드 안에 absolute로 띄우면
     // 잘리거나 겹쳐 보여서, portal + fixed로 body에 직접 띄웁니다.
     const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
     const panelRef = useRef(null);
     const buttonRef = useRef(null);

     // 마지막으로 알림을 확인한 시각 (localStorage에 보관)
     useEffect(() => {
          if (!user?.id) return;
          const saved = window.localStorage.getItem(lastReadStorageKey(user.id));
          setLastReadAt(saved || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
     }, [user?.id]);

     const fetchNotifications = async () => {
          if (!user?.id) return;
          const myPrefix = user.id.slice(0, 15);
          const [guestbookRes, messagesRes, friendsRes] = await Promise.allSettled([
               databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.guestbookEntries,
                    queries: [Query.equal('hostId', user.id), Query.orderDesc('$createdAt'), Query.limit(10)],
               }),
               databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.chatMessages,
                    queries: [Query.orderDesc('$createdAt'), Query.limit(50)],
               }),
               databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.userRelations,
                    queries: [Query.equal('targetId', user.id), Query.equal('relationType', 'friend'), Query.orderDesc('$createdAt'), Query.limit(10)],
               }),
          ]);

          const next = [];

          if (guestbookRes.status === 'fulfilled') {
               guestbookRes.value.documents
                    .filter((doc) => doc.authorId !== user.id)
                    .forEach((doc) => next.push({
                         id: `gb_${doc.$id}`,
                         type: 'guestbook',
                         text: `${doc.authorUsername || '이웃'}님이 미니홈피에 방명록을 남겼어요`,
                         preview: doc.content,
                         createdAt: doc.$createdAt,
                    }));
          }

          if (messagesRes.status === 'fulfilled') {
               messagesRes.value.documents
                    .filter((doc) => doc.roomId?.includes(myPrefix) && doc.senderId !== user.id)
                    .slice(0, 10)
                    .forEach((doc) => next.push({
                         id: `msg_${doc.$id}`,
                         type: 'message',
                         text: '새 1:1 쪽지가 도착했어요',
                         preview: doc.content,
                         createdAt: doc.$createdAt,
                    }));
          }

          if (friendsRes.status === 'fulfilled') {
               friendsRes.value.documents.forEach((doc) => next.push({
                    id: `fr_${doc.$id}`,
                    type: 'friend',
                    text: '새 일촌 신청이 도착했어요',
                    preview: null,
                    createdAt: doc.$createdAt,
               }));
          }

          next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setItems(next.slice(0, 20));
     };

     useEffect(() => {
          if (!user?.id) return undefined;
          fetchNotifications();

          // 실시간 갱신: 관련 컬렉션에 새 문서가 생기면 목록을 다시 불러옵니다.
          const channels = [
               `databases.${DATABASE_ID}.collections.${COLLECTIONS.guestbookEntries}.documents`,
               `databases.${DATABASE_ID}.collections.${COLLECTIONS.chatMessages}.documents`,
               `databases.${DATABASE_ID}.collections.${COLLECTIONS.userRelations}.documents`,
          ];
          const unsubscribe = client.subscribe(channels, (response) => {
               if (response.events.some((event) => event.endsWith('.create'))) fetchNotifications();
          });
          return () => unsubscribe();
     }, [user?.id]);

     // 패널 밖 클릭 시 닫기 (portal로 띄우므로 버튼과 패널 둘 다 확인)
     useEffect(() => {
          if (!isOpen) return undefined;
          const handleClick = (event) => {
               if (panelRef.current?.contains(event.target)) return;
               if (buttonRef.current?.contains(event.target)) return;
               setIsOpen(false);
          };
          document.addEventListener('mousedown', handleClick);
          return () => document.removeEventListener('mousedown', handleClick);
     }, [isOpen]);

     const unreadCount = useMemo(() => {
          if (!lastReadAt) return 0;
          return items.filter((item) => new Date(item.createdAt) > new Date(lastReadAt)).length;
     }, [items, lastReadAt]);

     const handleToggle = (event) => {
          event.stopPropagation();
          const nextOpen = !isOpen;
          if (nextOpen && buttonRef.current) {
               const rect = buttonRef.current.getBoundingClientRect();
               setPanelPos({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
          }
          setIsOpen(nextOpen);
          if (nextOpen && user?.id) {
               const nowIso = new Date().toISOString();
               window.localStorage.setItem(lastReadStorageKey(user.id), nowIso);
               // 배지는 패널을 닫을 때 사라지도록, 열려 있는 동안에는 이전 기준을 유지합니다.
               setTimeout(() => setLastReadAt(nowIso), 0);
          }
     };

     if (!user?.id) return null;

     return (
          <div className="relative">
               <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleToggle}
                    className="relative rounded-full p-1.5 text-gray-400 transition-colors hover:bg-brand-light hover:text-brand-accent"
                    title="알림"
               >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                         <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                         </span>
                    )}
               </button>

               {isOpen && createPortal(
                    <div
                         ref={panelRef}
                         onClick={(event) => event.stopPropagation()}
                         style={{ position: 'fixed', top: panelPos.top, right: panelPos.right }}
                         className="z-[90] w-72 rounded-2xl border border-surface-border bg-white p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                         <div className="mb-2 flex items-center justify-between px-1">
                              <h4 className="text-xs font-black uppercase tracking-wider text-brand-accent">알림</h4>
                              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1 text-gray-300 hover:text-gray-500">
                                   <X className="h-3.5 w-3.5" />
                              </button>
                         </div>
                         <div className="max-h-80 space-y-1 overflow-y-auto">
                              {items.length === 0 && (
                                   <p className="px-2 py-6 text-center text-xs font-semibold text-gray-400">아직 새 알림이 없어요.</p>
                              )}
                              {items.map((item) => {
                                   const meta = TYPE_META[item.type];
                                   const Icon = meta.icon;
                                   return (
                                        <div key={item.id} className="flex items-start gap-2.5 rounded-xl px-2 py-2 hover:bg-surface-muted">
                                             <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                                                  <Icon className="h-3.5 w-3.5" />
                                             </div>
                                             <div className="min-w-0 flex-1">
                                                  <p className="text-xs font-bold leading-4 text-gray-800">{item.text}</p>
                                                  {item.preview && (
                                                       <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-gray-400">{item.preview}</p>
                                                  )}
                                                  <p className="mt-0.5 text-[10px] font-bold text-gray-300">{timeAgo(item.createdAt)}</p>
                                             </div>
                                        </div>
                                   );
                              })}
                         </div>
                    </div>,
                    document.body
               )}
          </div>
     );
};

export default NotificationBell;
