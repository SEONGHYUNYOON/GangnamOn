import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

const notices = [
     {
          id: 'welcome-2026-07',
          date: '2026. 07. 08.',
          title: '강남온 베타 운영 안내',
          content: '미니홈피 BGM, 일촌 파도타기, 1:1 대화, 강남 교통·소식 기능을 순차적으로 상용화 수준까지 다듬고 있습니다.',
          tag: '운영',
     },
     {
          id: 'community-safe-chat',
          date: '2026. 07. 08.',
          title: '1:1 대화 안전 기능 적용',
          content: '대화 상대 즐겨찾기, 친구 맺기, 차단 기능이 추가되었습니다. 불쾌한 대화는 즉시 차단해주세요.',
          tag: '안전',
     },
     {
          id: 'reward-policy',
          date: '2026. 07. 08.',
          title: '게시글 활동 보상 정책',
          content: '게시글 작성 시 ON과 활동 점수가 함께 지급됩니다. 반복성·광고성 게시물은 운영 기준에 따라 제한될 수 있습니다.',
          tag: '보상',
     },
];

const NoticeBoard = () => (
     <section className="rounded-card border border-surface-border bg-white p-5 shadow-soft md:p-7">
          <div className="mb-5 flex items-center gap-3">
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                    <Bell className="h-5 w-5" />
               </div>
               <div>
                    <h2 className="text-2xl font-black text-brand-ink">공지사항</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">강남온 운영 소식과 기능 변경 안내입니다.</p>
               </div>
          </div>

          <div className="grid gap-3">
               {notices.map((notice) => (
                    <article key={notice.id} className="rounded-2xl border border-surface-border bg-surface-muted p-4">
                         <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-brand-accent">{notice.tag}</span>
                              <span className="text-xs font-bold text-slate-400">{notice.date}</span>
                         </div>
                         <h3 className="flex items-center gap-2 text-base font-black text-brand-ink">
                              <CheckCircle2 className="h-4 w-4 text-brand-accent" />
                              {notice.title}
                         </h3>
                         <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{notice.content}</p>
                    </article>
               ))}
          </div>
     </section>
);

export default NoticeBoard;
