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
          category: 'public',
          description: '민원, 여권, 세금, 생활 행정 서비스를 확인합니다.',
          details: ['학동로 426(삼성동)', '대표 02-3423-5114', '야간·공휴일 02-3423-6000~3'],
     },
     {
          title: '강남구 동주민센터',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/jumin_center/1/view.do',
          category: 'public',
          description: '전입, 주민등록, 인감, 복지 상담 등 22개 동 주민센터의 주소와 담당 업무를 찾습니다.',
          details: ['전입신고·등초본', '복지·돌봄 상담', '동별 연락처 확인'],
     },
     {
          title: '무인민원발급기 위치·운영시간',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/minwonissue/1/view.do?mid=ID06_04162102',
          category: 'public',
          description: '주민등록등초본, 가족관계증명서, 토지·세금 증명서를 가까운 발급기에서 처리합니다.',
          details: ['강남구청 옥외부스 24시간', '발급기별 운영시간 확인', '02-3423-5381'],
     },
     {
          title: '비짓강남 관광·전시 정보',
          date: '상시',
          link: 'https://www.visitgangnam.net/',
          category: 'culture',
          description: '강남구 문화·관광·전시 정보를 확인합니다.',
     },
     {
          title: '강남구 공지·고시공고',
          date: '상시',
          link: 'https://www.gangnam.go.kr/board/B_000001/list.do?mid=ID05_0401',
          category: 'public',
          description: '생활에 필요한 행정 공지와 고시공고를 확인합니다.',
     },
     {
          title: '강남구 보건소 안내',
          date: '상시',
          link: 'https://health.gangnam.go.kr/',
          category: 'health',
          description: '1차 진료, 예방접종, 모자보건, 건강검진과 보건증 업무를 확인합니다.',
          details: ['선릉로 668', '대표 02-3423-7200', '세곡보건지소·수서분소 안내'],
     },
     {
          title: '강남구 웰에이징·치매안심센터',
          date: '상시',
          link: 'https://health.gangnam.go.kr/',
          category: 'health',
          description: '신체기능 평가, 치매검진, 인지 프로그램 등 지역 건강 서비스를 확인합니다.',
          details: ['웰에이징센터 02-3423-7002', '치매안심센터 02-3423-7884', '평일 프로그램 운영'],
     },
     {
          title: '강남경찰서 민원실',
          date: '상시',
          link: 'https://www.smpa.go.kr/gn/',
          category: 'safety',
          description: '분실, 교통민원, 범죄 신고와 생활 안전 관련 경찰 민원을 확인합니다.',
          details: ['긴급 112', '교통·수사 민원 안내', '관할 지구대 확인'],
     },
     {
          title: '강남소방서 안전 정보',
          date: '상시',
          link: 'https://fire.seoul.go.kr/gangnam/',
          category: 'safety',
          description: '화재·구급 신고, 소방 민원, 안전교육과 응급처치 정보를 확인합니다.',
          details: ['긴급 119', '소방시설 민원', '심폐소생술·안전교육'],
     },
     {
          title: '삼성세무서·역삼세무서',
          date: '상시',
          link: 'https://www.nts.go.kr/',
          category: 'public',
          description: '사업자등록, 종합소득세, 부가가치세와 각종 국세 증명을 확인합니다.',
          details: ['국세상담 126', '홈택스 온라인 처리', '관할 세무서 확인'],
     },
     {
          title: '서울강남고용복지+센터',
          date: '상시',
          link: 'https://www.workplus.go.kr/',
          category: 'health',
          description: '구직등록, 취업 상담, 실업급여, 국민취업지원제도 업무를 확인합니다.',
          details: ['고용노동 상담 1350', '방문 전 예약·서류 확인', '구직·기업지원 창구'],
     },
     {
          title: '강남구립도서관',
          date: '상시',
          link: 'https://library.gangnam.go.kr/',
          category: 'culture',
          description: '25개 구립도서관의 도서 대출, 열람실, 휴관일과 문화 프로그램을 확인합니다.',
          details: ['공공도서관 15개', '작은도서관 10개', '통합검색·대출 현황'],
     },
     {
          title: '강남구 복지기관',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/welfare/1/view.do',
          category: 'health',
          description: '복지관, 돌봄, 취약계층 지원 기관을 찾습니다.',
     },
     {
          title: '서울출입국·외국인청',
          date: '상시',
          link: 'https://www.immigration.go.kr/',
          category: 'safety',
          description: '체류기간 연장, 비자, 외국인등록과 출입국 방문예약을 확인합니다.',
          details: ['외국인종합안내 1345', '하이코리아 방문예약', '민원별 준비서류 확인'],
     },
     {
          title: '강남구 공영주차장',
          date: '상시',
          link: 'https://www.gncity.or.kr/',
          category: 'traffic',
          description: '강남구도시관리공단이 운영하는 공영주차장 61개소의 위치, 요금과 할인 정보를 확인합니다.',
          details: ['노상 24·노외 32·부설 5개소', '요금·정기권 확인', '할인 증빙 지참'],
     },
     {
          title: '견인차량 즉시 검색',
          date: '긴급',
          link: 'https://gn.gncity.or.kr/Archive/SearchCar',
          category: 'traffic',
          description: '차량번호를 입력해 견인 여부와 보관 정보를 바로 확인합니다.',
          details: ['차량번호로 조회', '검색 결과의 보관소 확인', '견인보관소 02-558-7230'],
     },
     {
          title: '강남구 견인차량보관소·반환 절차',
          date: '24시간 확인',
          link: 'https://gn.gncity.or.kr/Archive/Present',
          category: 'traffic',
          description: '견인된 차량의 보관 위치와 차량을 되찾는 순서를 확인합니다.',
          details: ['삼성로 628 인근 안내 확인', '신분증·차량 관계 증빙 준비', '견인·보관 비용 납부 후 인수'],
     },
     {
          title: '불법주정차 단속 사전알림 신청',
          date: '상시',
          link: 'https://www.gangnam.go.kr/board/parking/list.do?mid=id02_010901',
          category: 'traffic',
          description: '고정형 CCTV 단속구역 진입 시 차량 이동 안내를 받을 수 있도록 신청합니다.',
          details: ['별별강남 앱에서 신청', '강남구 관내 서비스', '주차관리과 02-3423-6458'],
     },
     {
          title: '불법주정차 CCTV 단속 기준',
          date: '2026 기준',
          link: 'https://www.gangnam.go.kr/board/parking/14/view.do?mid=ID02_010901',
          category: 'traffic',
          description: '단속 시간, 촬영 범위와 주정차 단속 일반기준을 확인합니다.',
          details: ['간선도로 07:00~22:00', '이면도로 08:00~22:00', '5분 이상 주정차 시 탑승 중에도 단속 가능'],
     },
     {
          title: '교통 민원·도로 안내',
          date: '상시',
          link: 'https://topis.seoul.go.kr/',
          category: 'traffic',
          description: '교통 상황, 도로 통제, 대중교통 정보를 확인합니다.',
     },
     {
          title: '강남구 자동차 민원',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/traffic_car/1/view.do',
          category: 'traffic',
          description: '자동차 등록·이전·말소, 과태료, 번호판과 자동차 관련 민원을 확인합니다.',
          details: ['방문 전 구비서류 확인', '자동차민원 대국민포털 병행', '과태료 조회·납부'],
     },
     {
          title: '강남구 재난안전 안내',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/disaster/1/view.do',
          category: 'safety',
          description: '재난 유형별 행동요령과 생활 안전 정보를 확인합니다.',
     },
     {
          title: '강남구 청소·쓰레기 배출',
          date: '상시',
          link: 'https://www.gangnam.go.kr/contents/clean/1/view.do',
          category: 'public',
          description: '생활폐기물, 재활용, 대형폐기물 배출 정보를 확인합니다.',
     },
     {
          title: '강남구 평생학습',
          date: '상시',
          link: 'https://www.gangnam.go.kr/office/longlearn/main.do',
          category: 'culture',
          description: '평생학습 강좌와 교육 프로그램을 찾아봅니다.',
     },
];

const LOCAL_INFO_VIEW = {
     life_info: {
          title: '강남 생활기관 안내',
          eyebrow: '구청 · 주민센터 · 생활 행정',
          description: '강남에서 바로 써먹는 공공기관과 생활 행정 링크를 모았습니다.',
          categories: ['public', 'culture'],
     },
     parking_info: {
          title: '주차·교통 생활',
          eyebrow: '공영주차장 · 도로 · 자동차 민원',
          description: '차량, 주차, 교통 민원처럼 이동 생활에 필요한 정보를 모았습니다.',
          categories: ['traffic'],
     },
     health_info: {
          title: '보건·복지 안내',
          eyebrow: '보건소 · 복지센터 · 고용지원',
          description: '건강, 복지, 고용 지원처럼 생활 안정에 필요한 기관을 모았습니다.',
          categories: ['health'],
     },
     safety_info: {
          title: '안전·민원 기관',
          eyebrow: '경찰 · 소방 · 출입국 · 재난안전',
          description: '긴급 상황과 민원 처리에 필요한 기관 정보를 빠르게 확인합니다.',
          categories: ['safety'],
     },
};

const formatDate = (value) => {
     if (!value) return '';
     const date = new Date(value);
     if (Number.isNaN(date.getTime())) return value.slice(0, 10);
     return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

export const useGangnamNews = (limit = 5) => {
     const [news, setNews] = useState(FALLBACK_NEWS.slice(0, limit));
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(false);
     const [fromCache, setFromCache] = useState(false);
     const [source, setSource] = useState('강남구청');
     const [failedSources, setFailedSources] = useState([]);
     const [reloadKey, setReloadKey] = useState(0);

     useEffect(() => {
          let alive = true;

          const loadNews = async () => {
               setLoading(true);
               setError(false);
               setFromCache(false);
               try {
                    const response = await fetch('/api/gangnam-news');
                    if (!response.ok) throw new Error('news request failed');

                    const data = await response.json();
                    if (alive && data.items?.length) {
                         setNews(data.items.slice(0, limit));
                         setSource(data.source || '강남구청');
                         setFailedSources(data.failedSources || []);
                    } else if (alive) {
                         throw new Error('empty news payload');
                    }
               } catch (loadError) {
                    if (alive) {
                         console.error('강남구 소식 로딩 실패:', loadError);
                         setNews(FALLBACK_NEWS.slice(0, limit));
                         setSource('강남구청 강남이슈 (캐시)');
                         setFailedSources([]);
                         setError(true);
                         setFromCache(true);
                    }
               } finally {
                    if (alive) setLoading(false);
               }
          };

          loadNews();
          return () => {
               alive = false;
          };
     }, [limit, reloadKey]);

     const reload = () => setReloadKey((key) => key + 1);

     return { news, loading, error, fromCache, source, failedSources, reload };
};

export const GangnamLocalInfo = ({ type = 'life_info' }) => {
     const view = LOCAL_INFO_VIEW[type] || LOCAL_INFO_VIEW.life_info;
     const items = LOCAL_INFO.filter((item) => view.categories.includes(item.category));

     return (
          <section className="rounded-card border border-surface-border bg-white p-5 shadow-soft md:p-7">
               <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                         <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-light px-3 py-1 text-xs font-black text-brand-accent">
                              <Newspaper className="h-3.5 w-3.5" />
                              {view.eyebrow}
                         </div>
                         <h2 className="text-2xl font-black tracking-tight text-brand-ink md:text-3xl">{view.title}</h2>
                         <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{view.description}</p>
                    </div>
                    <a
                         href="https://www.gangnam.go.kr/"
                         target="_blank"
                         rel="noreferrer"
                         className="inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border px-4 py-3 text-sm font-black text-brand-ink transition-colors hover:bg-surface-muted"
                    >
                         강남구청 바로가기
                         <ExternalLink className="h-4 w-4" />
                    </a>
               </div>

               <div className="grid gap-3 md:grid-cols-2">
                    {items.map((item) => (
                         <a
                              key={item.title}
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="group rounded-2xl border border-surface-border bg-surface-muted p-4 transition-all hover:border-brand-gold/30 hover:bg-white"
                         >
                              <div className="flex items-start justify-between gap-3">
                                   <div>
                                        <p className="text-xs font-black text-brand-accent">{item.date}</p>
                                        <h3 className="mt-1 text-base font-black leading-6 text-brand-ink group-hover:text-brand-accent">{item.title}</h3>
                                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.description}</p>
                                        {item.details?.length > 0 && (
                                             <ul className="mt-3 space-y-1 border-t border-slate-200/70 pt-3">
                                                  {item.details.map((detail) => (
                                                       <li key={detail} className="flex gap-2 text-xs font-bold leading-5 text-slate-600">
                                                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-gold" />
                                                            {detail}
                                                       </li>
                                                  ))}
                                             </ul>
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

const GangnamNews = ({ compact = false }) => {
     const { news, loading, error, fromCache, source, failedSources, reload } = useGangnamNews(compact ? 3 : 25);
     const [showAllLocalInfo, setShowAllLocalInfo] = useState(false);
     const [sourceFilter, setSourceFilter] = useState('all');

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

     const sourceTabs = ['all', ...Array.from(new Set(news.map((item) => item.source).filter(Boolean)))];
     const visibleNews = sourceFilter === 'all' ? news.slice(0, 15) : news.filter((item) => item.source === sourceFilter).slice(0, 15);

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
                              강남구청 강남이슈, 보도자료, 언론보도, 공지사항, 행사소식 목록에서 기사 데이터를 직접 가져와 보여줍니다.
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

               {(error || failedSources.length > 0) && (
                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                         <span>
                              {fromCache ? '실시간 소식을 불러오지 못해 캐시 목록을 보여드리고 있어요.' : '일부 게시판 연결에 문제가 있어요.'}
                              {failedSources.length > 0 ? ` (${failedSources.join(', ')})` : ''}
                         </span>
                         <button type="button" onClick={reload} className="shrink-0 font-black underline underline-offset-4">
                              다시 시도
                         </button>
                    </div>
               )}

               <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {sourceTabs.map((tab) => (
                         <button
                              key={tab}
                              type="button"
                              onClick={() => setSourceFilter(tab)}
                              className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition-colors ${sourceFilter === tab
                                   ? 'bg-brand text-white'
                                   : 'bg-surface-muted text-slate-500 hover:bg-brand-light hover:text-brand-accent'
                                   }`}
                         >
                              {tab === 'all' ? '전체' : tab}
                         </button>
                    ))}
               </div>

               <div className="grid gap-3">
                    {visibleNews.map((item) => (
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
