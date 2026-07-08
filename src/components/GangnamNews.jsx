import React, { useEffect, useState } from 'react';
import { Bell, ExternalLink, Newspaper, RefreshCw } from 'lucide-react';

const FALLBACK_NEWS = [
     {
          title: "논현1동 '복지동네 건강마당' 성황리에 마무리",
          date: '2026-06-23',
          link: 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501',
          description: '강남구청 강남이슈 최신 목록 기준 소식입니다.',
     },
     {
          title: "'비일비재' 챌린지 참여로 일상 속 자원순환 실천해요",
          date: '2026-06-01',
          link: 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501',
          description: '강남구청 강남이슈 최신 목록 기준 소식입니다.',
     },
     {
          title: "산뜻한 디자인과 촘촘한 콘텐츠로 새로워진 '비짓 강남'",
          date: '2026-05-19',
          link: 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501',
          description: '강남구청 강남이슈 최신 목록 기준 소식입니다.',
     },
];

const LOCAL_INFO = [
     {
          title: '비짓강남 관광·전시 정보',
          date: '상시',
          link: 'https://www.visitgangnam.net/',
          description: '강남구 문화·관광·전시 정보를 확인합니다.',
     },
     {
          title: '강남구 공지·고시공고',
          date: '상시',
          link: 'https://www.gangnam.go.kr/board/B_000001/list.do?mid=ID05_0401',
          description: '생활에 필요한 행정 공지와 고시공고를 확인합니다.',
     },
     {
          title: '강남구 보건소 안내',
          date: '상시',
          link: 'https://health.gangnam.go.kr/',
          description: '보건, 예방접종, 건강검진 안내를 확인합니다.',
     },
];

const formatDate = (value) => {
     if (!value) return '';
     const date = new Date(value);
     if (Number.isNaN(date.getTime())) return value.slice(0, 10);
     return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

export const useGangnamNews = (limit = 5) => {
     const [news, setNews] = useState(FALLBACK_NEWS.slice(0, limit));
     const [loading, setLoading] = useState(true);
     const [source, setSource] = useState('강남구청');

     useEffect(() => {
          let alive = true;

          const loadNews = async () => {
               try {
                    const response = await fetch('/api/gangnam-news');
                    if (!response.ok) throw new Error('news request failed');

                    const data = await response.json();
                    if (alive && data.items?.length) {
                         setNews(data.items.slice(0, limit));
                         setSource(data.source || '강남구청');
                    }
               } catch (error) {
                    if (alive) {
                         setNews(FALLBACK_NEWS.slice(0, limit));
                         setSource('강남구청 강남이슈');
                    }
               } finally {
                    if (alive) setLoading(false);
               }
          };

          loadNews();
          return () => {
               alive = false;
          };
     }, [limit]);

     return { news, loading, source };
};

const GangnamNews = ({ compact = false }) => {
     const { news, loading, source } = useGangnamNews(compact ? 3 : 6);

     if (compact) {
          const compactItems = LOCAL_INFO;
          return (
               <section className="rounded-card border border-surface-border bg-white p-4 shadow-soft">
                    <div className="mb-3 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <Newspaper className="h-4 w-4 text-brand-accent" />
                              <h3 className="text-xs font-black text-brand-ink">강남 생활 정보</h3>
                         </div>
                         {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-300" />}
                    </div>
                    <div className="space-y-2">
                         {compactItems.map((item) => (
                              <a
                                   key={`${item.title}-${item.date}`}
                                   href={item.link || 'https://www.gangnam.go.kr/'}
                                   target="_blank"
                                   rel="noreferrer"
                                   className="block rounded-xl bg-surface-muted px-3 py-2 transition-colors hover:bg-brand-light"
                              >
                                   <p className="line-clamp-2 text-[11px] font-black leading-5 text-brand-ink">{item.title}</p>
                                   <p className="mt-1 text-[10px] font-bold text-slate-400">{formatDate(item.date)}</p>
                              </a>
                         ))}
                    </div>
               </section>
          );
     }

     return (
          <section className="rounded-card border border-surface-border bg-white p-5 shadow-soft md:p-7">
               <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                         <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-light px-3 py-1 text-xs font-black text-brand-accent">
                              <Bell className="h-3.5 w-3.5" />
                              {source} 수집
                         </div>
                         <h2 className="text-2xl font-black tracking-tight text-brand-ink md:text-3xl">강남구 소식</h2>
                         <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                              강남구청 강남이슈 목록에서 기사 데이터를 직접 가져와 보여줍니다.
                         </p>
                    </div>
                    <a
                         href="https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501"
                         target="_blank"
                         rel="noreferrer"
                         className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border px-4 py-3 text-sm font-black text-brand-ink transition-colors hover:bg-surface-muted"
                    >
                         강남구청에서 보기
                         <ExternalLink className="h-4 w-4" />
                    </a>
               </div>

               <div className="grid gap-3">
                    {news.map((item) => (
                         <a
                              key={`${item.title}-${item.date}`}
                              href={item.link || 'https://www.gangnam.go.kr/'}
                              target="_blank"
                              rel="noreferrer"
                              className="group rounded-2xl border border-surface-border bg-surface-muted p-4 transition-all hover:border-brand-gold/30 hover:bg-white"
                         >
                              <div className="flex items-start justify-between gap-4">
                                   <div>
                                        <p className="text-xs font-black text-brand-accent">{formatDate(item.date)}</p>
                                        <h3 className="mt-1 text-base font-black leading-6 text-brand-ink [word-break:keep-all] group-hover:text-brand-accent">
                                             {item.title}
                                        </h3>
                                        {item.description && (
                                             <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                                                  {item.description}
                                             </p>
                                        )}
                                   </div>
                                   <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-accent" />
                              </div>
                         </a>
                    ))}
               </div>
          </section>
     );
};

export default GangnamNews;
