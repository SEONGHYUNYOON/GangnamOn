import React, { useEffect, useMemo, useState } from 'react';
import { Book, CalendarDays, ChevronLeft, GraduationCap, Loader2, MessageCircle, Plus, Search, Send, Sparkles, Users, X } from 'lucide-react';
import { client, databases, DATABASE_ID, COLLECTIONS, ID, Permission, Query, Role } from '../lib/appwrite';

const DEFAULT_SCHOOLS = [
     { $id: 'dandae-2008', schoolName: '단대부고', graduationYear: 2008, emoji: '🏫', description: '2008년 졸업 동문들의 편안한 온라인 교실', roomId: 'school_dandae_2008', memberCount: 25 },
     { $id: 'kyunggi-2010', schoolName: '경기고', graduationYear: 2010, emoji: '🎒', description: '오랜 친구와 근황을 나누는 경기고 놀이터', roomId: 'school_kyunggi_2010', memberCount: 12 },
     { $id: 'sejong-2005', schoolName: '세종고', graduationYear: 2005, emoji: '🎀', description: '다시 만난 세종고 동문들의 이야기방', roomId: 'school_sejong_2005', memberCount: 30 },
     { $id: 'apgujeong-2015', schoolName: '압구정고', graduationYear: 2015, emoji: '🌲', description: '압구정고 동문들의 모임과 추억 저장소', roomId: 'school_apgujeong_2015', memberCount: 8 },
     { $id: 'cheongdam-2012', schoolName: '청담고', graduationYear: 2012, emoji: '🌤️', description: '청담고 친구들과 다시 이어지는 공간', roomId: 'school_cheongdam_2012', memberCount: 15 },
];

const displayName = (profile) => profile?.username || profile?.fullName || '강남 동문';

const ILoveSchool = ({ user }) => {
     const [searchTerm, setSearchTerm] = useState('');
     const [schools, setSchools] = useState(DEFAULT_SCHOOLS);
     const [activeSchool, setActiveSchool] = useState(null);
     const [showCreate, setShowCreate] = useState(false);
     const [createForm, setCreateForm] = useState({ schoolName: '', graduationYear: '', description: '' });
     const [creating, setCreating] = useState(false);
     const [messages, setMessages] = useState([]);
     const [messageDraft, setMessageDraft] = useState('');
     const [profiles, setProfiles] = useState(new Map());
     const [chatLoading, setChatLoading] = useState(false);
     const [activeMemberCount, setActiveMemberCount] = useState(null);
     const [errorText, setErrorText] = useState('');

     const filteredSchools = useMemo(() => {
          const term = searchTerm.trim().toLowerCase();
          if (!term) return schools;
          return schools.filter((school) => [school.schoolName, school.graduationYear]
               .some((value) => String(value).toLowerCase().includes(term)));
     }, [schools, searchTerm]);

     const loadSchools = async () => {
          try {
               const result = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.schools,
                    queries: [Query.orderDesc('$createdAt'), Query.limit(50)],
               });
               const persistedIds = new Set(result.documents.map((school) => school.$id));
               setSchools([...result.documents, ...DEFAULT_SCHOOLS.filter((school) => !persistedIds.has(school.$id))]);
          } catch (error) {
               console.warn('학교 목록 로딩 실패:', error);
               setSchools(DEFAULT_SCHOOLS);
          }
     };

     useEffect(() => {
          loadSchools();
     }, []);

     const ensureSchoolRoom = async (school) => {
          if (!user?.id) return;
          await databases.createDocument({
               databaseId: DATABASE_ID,
               collectionId: COLLECTIONS.chatRooms,
               documentId: school.roomId,
               data: { type: 'school' },
               permissions: [Permission.read(Role.users())],
          }).catch(() => null);
          await databases.createDocument({
               databaseId: DATABASE_ID,
               collectionId: COLLECTIONS.chatParticipants,
               documentId: `${school.roomId}_${user.id}`.replace(/[^a-zA-Z0-9._-]/g, '_'),
               data: { roomId: school.roomId, userId: user.id },
               permissions: [Permission.read(Role.users())],
          }).catch(() => null);
     };

     const loadMessages = async (school) => {
          setChatLoading(true);
          setErrorText('');
          if (!user?.id) {
               setMessages([]);
               setActiveMemberCount(null);
               setChatLoading(false);
               return;
          }
          try {
               await ensureSchoolRoom(school);
               const [result, participants] = await Promise.all([
                    databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatMessages,
                         queries: [Query.equal('roomId', school.roomId), Query.orderAsc('$createdAt'), Query.limit(100)],
                    }),
                    databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.chatParticipants,
                         queries: [Query.equal('roomId', school.roomId), Query.limit(100)],
                    }),
               ]);
               setMessages(result.documents);
               setActiveMemberCount(participants.total || 1);

               const senderIds = [...new Set(result.documents.map((message) => message.senderId))];
               const loadedProfiles = await Promise.all(senderIds.map((senderId) =>
                    databases.getDocument({ databaseId: DATABASE_ID, collectionId: COLLECTIONS.profiles, documentId: senderId }).catch(() => null)
               ));
               setProfiles(new Map(loadedProfiles.filter(Boolean).map((profile) => [profile.$id, profile])));
          } catch (error) {
               console.error('학교 단체방 로딩 실패:', error);
               setErrorText('동문 단체방을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
          } finally {
               setChatLoading(false);
          }
     };

     const openSchool = (school) => {
          setActiveSchool(school);
          loadMessages(school);
     };

     useEffect(() => {
          if (!activeSchool?.roomId) return undefined;
          const unsubscribe = client.subscribe(
               [`databases.${DATABASE_ID}.collections.${COLLECTIONS.chatMessages}.documents`],
               (event) => {
                    if (event.payload?.roomId === activeSchool.roomId) loadMessages(activeSchool);
               },
          );
          return () => unsubscribe();
     }, [activeSchool?.roomId, user?.id]);

     const createSchool = async (event) => {
          event.preventDefault();
          if (!user?.id) {
               setErrorText('개교 신청은 로그인 후 이용할 수 있습니다.');
               return;
          }
          const schoolName = createForm.schoolName.trim();
          const graduationYear = Number(createForm.graduationYear);
          if (!schoolName || graduationYear < 1950 || graduationYear > new Date().getFullYear()) {
               setErrorText('학교 이름과 올바른 졸업연도를 입력해주세요.');
               return;
          }

          setCreating(true);
          setErrorText('');
          try {
               const documentId = ID.unique();
               const roomId = `school_${documentId}`;
               const school = await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.schools,
                    documentId,
                    data: {
                         schoolName,
                         graduationYear,
                         description: createForm.description.trim() || `${schoolName} ${graduationYear}년 졸업 동문들의 놀이터`,
                         creatorId: user.id,
                         roomId,
                         memberCount: 1,
                         status: 'active',
                    },
                    permissions: [
                         Permission.read(Role.any()),
                         Permission.update(Role.user(user.id)),
                         Permission.delete(Role.user(user.id)),
                    ],
               });
               await ensureSchoolRoom(school);
               setCreateForm({ schoolName: '', graduationYear: '', description: '' });
               setShowCreate(false);
               await loadSchools();
               openSchool(school);
          } catch (error) {
               console.error('개교 신청 실패:', error);
               setErrorText('학교를 개설하지 못했습니다. 잠시 후 다시 시도해주세요.');
          } finally {
               setCreating(false);
          }
     };

     const sendMessage = async () => {
          const content = messageDraft.trim();
          if (!user?.id) {
               setErrorText('동문 단체 채팅은 로그인 후 이용할 수 있습니다.');
               return;
          }
          if (!content || !activeSchool) return;
          setMessageDraft('');
          setErrorText('');
          try {
               await ensureSchoolRoom(activeSchool);
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.chatMessages,
                    documentId: ID.unique(),
                    data: { roomId: activeSchool.roomId, senderId: user.id, content },
                    permissions: [
                         Permission.read(Role.users()),
                         Permission.update(Role.user(user.id)),
                         Permission.delete(Role.user(user.id)),
                    ],
               });
               await loadMessages(activeSchool);
          } catch (error) {
               console.error('학교 메시지 전송 실패:', error);
               setErrorText('메시지를 보내지 못했습니다.');
          }
     };

     if (activeSchool) {
          return (
               <section className="overflow-hidden rounded-card border border-surface-border bg-white shadow-soft">
                    <header className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white md:p-7">
                         <button type="button" onClick={() => setActiveSchool(null)} className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-white/70 hover:text-white">
                              <ChevronLeft className="h-4 w-4" /> 학교 목록
                         </button>
                         <div className="flex items-start justify-between gap-4">
                              <div>
                                   <p className="text-xs font-black text-amber-300">{activeSchool.graduationYear}년 졸업 동문회</p>
                                   <h2 className="mt-1 text-2xl font-black md:text-3xl">{activeSchool.schoolName} 놀이터</h2>
                                   <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-300">{activeSchool.description}</p>
                              </div>
                              <div className="rounded-2xl bg-white/10 px-3 py-2 text-center backdrop-blur">
                                   <Users className="mx-auto h-4 w-4 text-amber-300" />
                                   <p className="mt-1 text-xs font-black">{activeMemberCount ?? activeSchool.memberCount ?? 1}명</p>
                              </div>
                         </div>
                    </header>

                    <div className="grid gap-4 bg-slate-50 p-4 md:grid-cols-[0.8fr_1.2fr] md:p-6">
                         <div className="space-y-3">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                   <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /><h3 className="font-black">우리 학교 놀이터</h3></div>
                                   <div className="mt-4 grid grid-cols-2 gap-2">
                                        {['자유게시판', '동문 찾기', '번개 모임', '추억 사진첩'].map((label) => (
                                             <div key={label} className="rounded-xl bg-slate-50 p-3 text-center text-xs font-black text-slate-600">{label}</div>
                                        ))}
                                   </div>
                              </div>
                              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                   <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-amber-700" /><h3 className="text-sm font-black text-amber-900">첫 동문 모임을 열어보세요</h3></div>
                                   <p className="mt-2 text-xs font-semibold leading-5 text-amber-800/70">단체 채팅에서 날짜와 장소를 정하고 강남온 모임으로 이어갈 수 있습니다.</p>
                              </div>
                         </div>

                         <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                                   <MessageCircle className="h-4 w-4 text-brand-accent" />
                                   <h3 className="text-sm font-black">동문 단체 채팅</h3>
                                   <span className="ml-auto text-[10px] font-bold text-emerald-600">실시간</span>
                              </div>
                              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
                                   {chatLoading ? (
                                        <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-slate-300" />
                                   ) : messages.length === 0 ? (
                                        <div className="pt-20 text-center"><MessageCircle className="mx-auto h-8 w-8 text-slate-200" /><p className="mt-2 text-sm font-bold text-slate-400">첫 인사를 남겨보세요.</p></div>
                                   ) : messages.map((message) => {
                                        const mine = message.senderId === user?.id;
                                        return (
                                             <div key={message.$id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                  <div className="max-w-[82%]">
                                                       {!mine && <p className="mb-1 text-[10px] font-black text-slate-400">{displayName(profiles.get(message.senderId))}</p>}
                                                       <p className={`rounded-2xl px-3 py-2 text-sm font-semibold ${mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-white text-slate-700 shadow-sm'}`}>{message.content}</p>
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>
                              <div className="border-t border-slate-100 p-3">
                                   <div className="flex gap-2">
                                        <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendMessage(); }} placeholder={user?.id ? '동문들에게 메시지 보내기' : '로그인 후 대화할 수 있어요'} disabled={!user?.id} className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-100 disabled:opacity-60" />
                                        <button type="button" onClick={sendMessage} disabled={!user?.id || !messageDraft.trim()} className="rounded-xl bg-brand p-2.5 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button>
                                   </div>
                                   {errorText && <p className="mt-2 text-xs font-bold text-red-500">{errorText}</p>}
                              </div>
                         </div>
                    </div>
               </section>
          );
     }

     return (
          <section className="rounded-card border border-surface-border bg-white p-5 shadow-soft md:p-6">
               <div className="mb-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                         <div className="rounded-lg bg-brand p-2 text-brand-gold"><Book className="h-5 w-5" /></div>
                         <div><h2 className="text-lg font-bold text-gray-900">아이러브스쿨</h2><p className="text-xs text-gray-500">학교별 놀이터에서 동문을 다시 만나보세요</p></div>
                    </div>
                    <button type="button" onClick={() => { setShowCreate(true); setErrorText(''); }} className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/20 bg-brand-light px-3 py-2 text-xs font-bold text-brand-accent hover:bg-brand-light/70">
                         <Plus className="h-3.5 w-3.5" /> 개교 신청
                    </button>
               </div>

               <div className="relative mb-7">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input type="search" placeholder="학교 이름이나 졸업연도를 검색해보세요" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-xl border border-transparent bg-surface-muted py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-brand-gold/20 focus:ring-2 focus:ring-brand-gold/20" />
               </div>

               <div className="mb-4 flex items-end justify-between px-1"><div><p className="text-[10px] font-black uppercase text-brand-accent">School Community</p><h3 className="text-sm font-bold text-gray-800">학교별 동문 놀이터</h3></div><span className="text-xs font-bold text-gray-400">{filteredSchools.length}개 학교</span></div>
               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {filteredSchools.map((school) => (
                         <button type="button" key={school.$id} onClick={() => openSchool(school)} className="group min-w-0 rounded-card border border-surface-border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-gold/30 hover:shadow-soft">
                              <div className="mb-3 flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-xl">{school.emoji || '🎓'}</div><GraduationCap className="h-4 w-4 text-slate-300 group-hover:text-brand-accent" /></div>
                              <span className="text-[10px] font-bold text-gray-400">{school.graduationYear}년 졸업</span>
                              <h4 className="mt-0.5 truncate text-base font-black text-gray-900">{school.schoolName}</h4>
                              <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-400">{school.description}</p>
                              <div className="mt-3 flex items-center gap-1 text-[10px] font-black text-brand-accent"><MessageCircle className="h-3 w-3" /> 놀이터 입장</div>
                         </button>
                    ))}
               </div>

               {showCreate && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
                         <form onSubmit={createSchool} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
                              <div className="flex items-center justify-between"><div><p className="text-xs font-black text-brand-accent">OPEN A SCHOOL</p><h3 className="text-xl font-black">우리 학교 놀이터 개설</h3></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-full bg-slate-100 p-2 text-slate-500"><X className="h-4 w-4" /></button></div>
                              <div className="mt-5 grid gap-3">
                                   <input value={createForm.schoolName} onChange={(event) => setCreateForm((prev) => ({ ...prev, schoolName: event.target.value }))} placeholder="학교 이름" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-gold" />
                                   <input type="number" min="1950" max={new Date().getFullYear()} value={createForm.graduationYear} onChange={(event) => setCreateForm((prev) => ({ ...prev, graduationYear: event.target.value }))} placeholder="졸업연도 (예: 2012)" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-gold" />
                                   <textarea value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="동문들에게 보여줄 소개 (선택)" className="min-h-24 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-gold" />
                              </div>
                              {errorText && <p className="mt-3 text-xs font-bold text-red-500">{errorText}</p>}
                              <button type="submit" disabled={creating} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-black text-white disabled:opacity-60">{creating && <Loader2 className="h-4 w-4 animate-spin" />} 개교하고 놀이터 입장</button>
                         </form>
                    </div>
               )}
          </section>
     );
};

export default ILoveSchool;
