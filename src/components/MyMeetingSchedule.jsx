import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2, MapPin, Users } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import { normalizeForGangnamDisplay } from '../lib/displayGangnam';

const meetingTypes = ['gathering', 'hiking', 'sports', 'pet', 'wine', 'startup_freelance', 'lunch_networking', 'recruit_proposal', 'office_rent', 'housing_trade'];

const labelForType = (type) => ({
     gathering: '번개',
     hiking: '등산',
     sports: '스포츠',
     pet: '반려동물',
     wine: '맛집',
     startup_freelance: '스타트업',
     lunch_networking: '점심 네트워킹',
     recruit_proposal: '구인/협업',
     office_rent: '사무실',
     housing_trade: '부동산',
}[type] || '모임');

const ScheduleList = ({ items, emptyText }) => (
     <div className="grid gap-3">
          {items.length === 0 ? (
               <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                    <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-black text-slate-400">{emptyText}</p>
               </div>
          ) : items.map(item => (
               <article key={item.$id} className="rounded-2xl border border-surface-border bg-white p-4 shadow-soft">
                    <div className="mb-3 flex items-start justify-between gap-3">
                         <div className="min-w-0">
                              <span className="rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-black text-brand-accent">{labelForType(item.type)}</span>
                              <h3 className="mt-2 truncate text-base font-black text-brand-ink">{item.title || '제목 없는 모임'}</h3>
                         </div>
                         <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
                              {new Date(item.$createdAt).toLocaleDateString('ko-KR')}
                         </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                         <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {normalizeForGangnamDisplay(item.locationName || '장소 미정')}
                         </span>
                         <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {(item.currentParticipants || 1)}/{item.maxParticipants || 99}
                         </span>
                    </div>
               </article>
          ))}
     </div>
);

const MyMeetingSchedule = ({ user }) => {
     const [activeView, setActiveView] = useState('joined');
     const [loading, setLoading] = useState(true);
     const [createdMeetings, setCreatedMeetings] = useState([]);
     const [joinedMeetings, setJoinedMeetings] = useState([]);

     useEffect(() => {
          const load = async () => {
               if (!user?.id) {
                    setLoading(false);
                    return;
               }
               setLoading(true);
               try {
                    const createdRes = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [
                              Query.equal('authorId', user.id),
                              Query.equal('type', meetingTypes),
                              Query.orderDesc('$createdAt'),
                              Query.limit(50),
                         ],
                    });

                    let joinedPosts = [];
                    try {
                         const joinedRes = await databases.listDocuments({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.meetingParticipants,
                              queries: [Query.equal('userId', user.id), Query.orderDesc('$createdAt'), Query.limit(50)],
                         });

                         const ids = [...new Set(joinedRes.documents.map(doc => doc.meetingId))];
                         joinedPosts = (await Promise.all(ids.map(id =>
                              databases.getDocument({
                                   databaseId: DATABASE_ID,
                                   collectionId: COLLECTIONS.posts,
                                   documentId: id,
                              }).catch(() => null)
                         ))).filter(Boolean);
                    } catch (error) {
                         console.warn('참여 모임 로딩 실패:', error);
                    }

                    setCreatedMeetings(createdRes.documents);
                    setJoinedMeetings(joinedPosts);
               } catch (error) {
                    console.error('나의 모임 일정 로딩 실패:', error);
               } finally {
                    setLoading(false);
               }
          };

          load();
     }, [user?.id]);

     if (!user) {
          return (
               <div className="rounded-card border border-surface-border bg-white p-10 text-center shadow-soft">
                    <p className="text-sm font-black text-slate-500">로그인 후 나의 모임 일정을 확인할 수 있어요.</p>
               </div>
          );
     }

     return (
          <section className="rounded-card border border-surface-border bg-white p-5 shadow-soft">
               <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                    <div>
                         <h2 className="text-2xl font-black text-brand-ink">나의 모임 일정</h2>
                         <p className="mt-1 text-sm font-semibold text-slate-500">내가 참여 신청한 모임과 직접 개설한 모임을 분리해서 봅니다.</p>
                    </div>
                    <div className="inline-flex rounded-xl border border-surface-border bg-surface-muted p-1">
                         {[
                              { id: 'joined', label: '참여 신청 모임', count: joinedMeetings.length },
                              { id: 'created', label: '내가 개설한 모임', count: createdMeetings.length },
                         ].map(tab => (
                              <button
                                   key={tab.id}
                                   type="button"
                                   onClick={() => setActiveView(tab.id)}
                                   className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${activeView === tab.id ? 'bg-white text-brand-ink shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                   {tab.label} {tab.count}
                              </button>
                         ))}
                    </div>
               </div>

               {loading ? (
                    <div className="flex items-center justify-center py-16">
                         <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
                    </div>
               ) : activeView === 'joined' ? (
                    <ScheduleList items={joinedMeetings} emptyText="참여한 모임이 없음" />
               ) : (
                    <ScheduleList items={createdMeetings} emptyText="개설한 모임이 없음" />
               )}
          </section>
     );
};

export default MyMeetingSchedule;
