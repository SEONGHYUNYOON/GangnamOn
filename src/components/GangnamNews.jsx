import React, { useEffect, useState } from 'react';
import { Bell, ExternalLink, Newspaper, RefreshCw } from 'lucide-react';

const FALLBACK_NEWS = [
     {
          title: "논현1동 '복지동네 건강마당' 성황리에 마무리",
          date: '2026-06-23',
          link: 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501',
          source: '강남이슈',
          description: '강남구청 강남이슈 최신 목록 기준 소식입니다.',
     },
     {
          title: "'비일비재' 챌린지 참여로 일상 속 자원순환 실천해요",
          date: '2026-06-01',
          link: 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501',
          source: '강남이슈',
          description: '강남구청 강남이슈 최신 목록 기준 소식입니다.',
     },
     {
          title: "산뜻한 디자인과 촘촘한 콘텐츠로 새로워진 '비짓 강남'",
          date: '2026-05-19',
          link: 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501',
          source: '강남이슈',
          description: '강남구청 강남이슈 최신 목록 기준 소식입니다.',
     },
];

const LOCAL_INFO = [
     {
          title: '강남구청 민원·행정',
          date: '상시',
          link: 'https://www.gangnam.go.kr/',
          description: '민원, 여권, 세금, 생활 행정 서비스를 확인합니다.',
     },
     {
          title: '강남구 동주민센터',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/jumin_center/1/view.do',
          description: '전입, 주민등록, 복지 상담 등 가까운 주민센터를 찾습니다.',
     },
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
     {
          title: '강남경찰서 민원실',
          date: '상시',
          link: 'https://www.smpa.go.kr/gn/',
          description: '분실, 교통민원, 생활 안전 관련 경찰 민원을 확인합니다.',
     },
     {
          title: '강남소방서 안전 정보',
          date: '상시',
          link: 'https://fire.seoul.go.kr/gangnam/',
          description: '소방 민원, 안전교육, 생활 안전 정보를 확인합니다.',
     },
     {
          title: '삼성세무서·역삼세무서',
          date: '상시',
          link: 'https://www.nts.go.kr/',
          description: '사업자, 종합소득세, 부가세 등 세무 업무를 확인합니다.',
     },
     {
          title: '서울강남고용복지+센터',
          date: '상시',
          link: 'https://www.workplus.go.kr/',
          description: '취업 상담, 실업급여, 고용지원 서비스를 확인합니다.',
     },
     {
          title: '강남구립도서관',
          date: '상시',
          link: 'https://library.gangnam.go.kr/',
          description: '도서 대출, 열람실, 문화 프로그램 정보를 확인합니다.',
     },
     {
          title: '강남구 복지기관',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/welfare/1/view.do',
          description: '복지관, 돌봄, 취약계층 지원 기관을 찾습니다.',
     },
     {
          title: '서울출입국·외국인청',
          date: '상시',
          link: 'https://www.immigration.go.kr/',
          description: '체류, 비자, 외국인 등록 관련 기관 정보를 확인합니다.',
     },
     {
          title: '강남구 공영주차장',
          date: '상시',
          link: 'https://www.gncity.or.kr/',
          description: '공영주차장 위치, 요금, 운영 정보를 확인합니다.',
     },
     {
          title: '교통 민원·도로 안내',
          date: '상시',
          link: 'https://topis.seoul.go.kr/',
          description: '교통 상황, 도로 통제, 대중교통 정보를 확인합니다.',
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
     const [showAllLocalInfo, setShowAllLocalInfo] = useState(false);

     if (compact) {
          const compactItems = showAllLocalInfo ? LOCAL_INFO : LOCAL_INFO.slice(0, 4);
          return (
               <section className="rounded-card border border-surface-border bg-white p-4 shadow-soft">
                    <div className="mb-3 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <Newspaper className="h-4 w-4 text-brand-accent" />
                              <h3 className="text-sm font-black text-brand-ink">강남 생활 정보</h3>
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
                                   className="block rounded-xl bg-surface-muted px-3 py-2.5 transition-colors hover:bg-brand-light"
                              >
                                   <p className="line-clamp-2 text-xs font-black leading-5 text-brand-ink">{item.title}</p>
                                   <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-slate-500">{item.description}</p>
                                   <p className="mt-1 text-[10px] font-bold text-slate-400">{formatDate(item.date)}</p>
                              </a>
                         ))}
                    </div>
                    <button
                         type="button"
                         onClick={() => setShowAllLocalInfo(prev => !prev)}
                         className="mt-3 w-full rounded-xl border border-surface-border bg-white py-2 text-xs font-black text-brand-accent transition-colors hover:bg-brand-light"
                    >
                         {showAllLocalInfo ? '접기' : `전체보기 (${LOCAL_INFO.length})`}
                    </button>
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
                                        <div className="flex items-center gap-2">
                                             <p className="text-xs font-black text-brand-accent">{formatDate(item.date)}</p>
                                             {item.source && (
                                                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-black text-brand-accent">
                                                       {item.source}
                                                  </span>
                                             )}
                                        </div>
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
