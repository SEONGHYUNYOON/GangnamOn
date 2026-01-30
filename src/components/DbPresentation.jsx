import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Database, Server, Shield, Activity, Users, FileText, ShoppingBag, MessageCircle, GitBranch, Key, Lock, Zap, Layers, Code, Play } from 'lucide-react';

const DbPresentation = () => {
     const [currentSlide, setCurrentSlide] = useState(0);

     const slides = [
          {
               id: 0,
               type: 'title',
               title: 'GangnamOn: 기술 아키텍처 심층 분석',
               subtitle: '고도화된 DB 스키마, 구축 로직 및 백엔드 전략',
               author: '백엔드 리드 엔지니어',
               icon: <Server className="w-24 h-24 text-indigo-600" />
          },
          {
               id: 1,
               type: 'content',
               title: '1. 아키텍처 원칙 (Why?)',
               content: [
                    '단일 진실 공급원 (Single Source of Truth): 모든 핵심 상태는 클라이언트 캐시가 아닌 Postgres에 저장됩니다.',
                    'BaaS (Backend-as-a-Service): Supabase를 활용하여 DevOps 비용을 최소화하면서 SQL의 강력함은 유지합니다.',
                    '데이터 계층 보안 (Security at Data Layer): RLS(행 수준 보안)를 통해 DB 자체가 API 보안 게이트웨이 역할을 수행합니다.',
                    '낙관적 동시성 제어 (Optimistic Concurrency Control): 강력한 락(Lock) 대신 버전/타임스탬프를 사용하여 다중 사용자 쓰기 충돌을 방지합니다.'
               ]
          },
          {
               id: 2,
               type: 'diagram',
               title: '2. 인증 흐름 & 데이터 무결성',
               description: 'Supabase Auth(GoTrue)와 애플리케이션 데이터 간의 연결 고리입니다.',
               diagramContent: (
                    <div className="flex flex-col gap-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
                         <div className="flex items-center justify-between">
                              <div className="w-48 p-4 bg-gray-800 text-white rounded-lg text-center font-mono text-sm">
                                   인증 서비스<br />(auth.users)
                              </div>
                              <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-4 relative">
                                   <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-50 px-2 text-xs text-gray-500">JWT 토큰 발급</span>
                              </div>
                              <div className="w-48 p-4 bg-indigo-600 text-white rounded-lg text-center font-mono text-sm">
                                   클라이언트 앱<br />(Headers)
                              </div>
                         </div>
                         <div className="flex justify-center">
                              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-xs font-bold border border-orange-200">
                                   ⚠️ 위험: 인증 유저 vs 공개 프로필 불일치 가능성
                              </div>
                         </div>
                         <div className="flex items-center justify-between mt-4">
                              <div className="w-48 p-4 bg-white border-2 border-green-500 rounded-lg text-center font-mono text-sm">
                                   Postgres 트리거
                              </div>
                              <div className="flex-1 h-2 bg-green-500 mx-4 rounded-full relative">
                                   <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-green-700">자동 동기화 (Atomic)</span>
                              </div>
                              <div className="w-48 p-4 bg-white border border-gray-300 rounded-lg text-center font-mono text-sm">
                                   공개 스키마<br />(public.profiles)
                              </div>
                         </div>
                    </div>
               )
          },
          {
               id: 3,
               type: 'code',
               title: '3. 트리거를 이용한 인증 신뢰성 향상',
               description: '클라이언트 사이드 프로필 생성이 아닌 PL/pgSQL 트리거를 사용하는 이유입니다. 부분 실패를 원천 차단합니다.',
               code: `
-- 함수: 신규 유저 처리 (Handle New User)
-- Security Definer: Public 테이블에 쓰기 권한이 있는 관리자 권한으로 실행
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username', -- 메타데이터에서 추출
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 정의 (회원가입 직후 실행)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`
          },
          {
               id: 4,
               type: 'schema',
               title: '4. 핵심 엔티티: 프로필 스키마 설계',
               description: '유저 프로필 테이블 설계 결정 사항입니다.',
               tables: [
                    {
                         name: 'public.profiles',
                         columns: [
                              'id (UUID, PK): auth.users의 ID와 1:1 매칭 (FK)',
                              'username (TEXT, Unique): 멘션(@) 기능을 위한 고유 식별자',
                              'manner_temp (FLOAT): 매너온도. 기본 36.5도, 평가에 따라 변동',
                              'beans (BIGINT): 화폐(온). 오버플로우 방지를 위해 BIGINT 사용',
                              'unlocked_titles (TEXT[]): 칭호 목록. 조회 성능을 위해 조인 테이블 대신 배열(Array) 선택'
                         ]
                    }
               ]
          },
          {
               id: 5,
               type: 'schema',
               title: '5. 피드 아키텍처: 게시글 & 성능 최적화',
               description: '읽기 중심(Read-Heavy) 워크로드를 위한 최적화 설계입니다.',
               tables: [
                    {
                         name: 'public.posts',
                         columns: [
                              'id (UUID, PK)',
                              'user_id (UUID, FK, Indexed): 작성자 조회용 인덱스',
                              'category_id (INT, Indexed): 필터링 속도 향상',
                              'location_geo (GEOGRAPHY): "내 주변" 쿼리를 위한 PostGIS 좌표',
                              'comment_count (INT): 역정규화(Denormalization) 필드. 트리거로 자동 업데이트.'
                         ]
                    }
               ],
               content: [
                    '역정규화 이유: 피드 50개를 불러올 때마다 댓글 수를 세기 위해(Count) 50번의 서브 쿼리를 날리는 것은 비효율적입니다.',
                    'Comment_count 컬럼을 두어 O(1)로 조회하고, 댓글 작성 시 트리거가 +1 업데이트를 수행합니다.'
               ]
          },
          {
               id: 6,
               type: 'code',
               title: '6. 대규모 "좋아요" 처리 전략',
               description: '동시성 이슈 없는 "좋아요" 토글 구현 및 경쟁 조건(Race Condition) 방지.',
               code: `
-- 좋아요 테이블
CREATE TABLE public.post_likes (
  user_id UUID REFERENCES public.profiles(id),
  post_id UUID REFERENCES public.posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id) -- 복합 키(Composite PK)로 중복 방지
);

-- RLS 정책: 토글 로직
-- 명시적인 DELETE 체크 대신, 삽입 시도 후 충돌 시 무시(ON CONFLICT) 전략 사용 가능
-- 하지만 RLS가 권한을 엄격히 제어함.
CREATE POLICY "Toggle Like" ON public.post_likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
`
          },
          {
               id: 7,
               type: 'schema',
               title: '7. 중고 거래 상태 머신 (State Machine)',
               description: '이중 판매를 방지하기 위한 엄격한 상태 관리 로직입니다.',
               diagramContent: (
                    <div className="flex items-center justify-around p-8 bg-gray-50 rounded-xl relative">
                         <div className="z-10 bg-green-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-lg font-bold">
                              판매중 (ON_SALE)
                         </div>
                         <div className="h-1 bg-gray-300 w-24"></div>
                         <div className="z-10 bg-yellow-100 border-2 border-yellow-500 text-yellow-800 px-6 py-3 rounded-lg font-bold">
                              예약중 (RESERVED)
                         </div>
                         <div className="h-1 bg-gray-300 w-24"></div>
                         <div className="z-10 bg-gray-800 text-white px-6 py-3 rounded-lg font-bold">
                              판매완료 (SOLD)
                         </div>

                         <div className="absolute bottom-2 text-xs text-gray-500 w-full text-center">
                              * 트랜잭션은 원자적(Atomic)이어야 합니다. 상태 변경 시 Row-Level Locking 사용 권장.
                         </div>
                    </div>
               )
          },
          {
               id: 8,
               type: 'content',
               title: '8. 실시간 채팅 아키텍처',
               content: [
                    '전략: HTTP + WebSocket 하이브리드 방식.',
                    '전송 (쓰기): 일반적인 POST 요청 (HTTP) 사용. 이유: 확실한 수신 확인(Ack), RLS 적용 용이, 에러 핸들링.',
                    '수신 (읽기): Supabase Realtime (WebSocket) 구독을 통해 실시간 수신.',
                    '파티셔닝 계획: 데이터가 쌓이면 월별(Month) 파티셔닝을 통해 조회 속도 유지.'
               ],
               tables: [
                    {
                         name: 'public.messages',
                         columns: [
                              'room_id (UUID, Partition Key)',
                              'created_at (TIMESTAMPTZ, Partition Key)',
                              'content (TEXT): DB 저장 시 암호화 고려'
                         ]
                    }
               ]
          },
          {
               id: 9,
               type: 'content',
               title: '9. 알림 시스템 (Fan-Out on Write)',
               content: [
                    '푸시 모델 (Fan-out on Write):',
                    '동네에 새 글이 올라왔을 때 모든 주민에게 알림을 보낼 것인가?',
                    '판단: 아니오. 너무 많은 쓰기 비용 발생.',
                    '하이브리드 접근법:',
                    '1. 직접적인 상호작용 (댓글/좋아요): 즉시 `notifications` 테이블에 Insert.',
                    '2. 대량 이벤트 (새 글): 클라이언트가 "배지"를 당겨오는(Pull) 방식 사용 (마지막 접속 시간 vs 최신 글 시간 비교).'
               ]
          },
          {
               id: 10,
               type: 'code',
               title: '10. 보안: 고급 RLS 정책 (Advanced RLS)',
               description: '복잡한 권한 제어 예시 (채팅방 참여자만 읽기).',
               code: `
-- 예시: 채팅방 참여자(Participants)만 메시지를 읽을 수 있음
CREATE POLICY "Room Members Only"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = messages.room_id
    AND rp.user_id = auth.uid()
  )
);

-- 성능 참고: 
-- 이 정책은 모든 행을 읽을 때마다 JOIN을 수행합니다. 
-- 따라서 \`room_participants(room_id, user_id)\` 복합 인덱스가 필수입니다.
`
          },
          {
               id: 11,
               type: 'diagram',
               title: '11. 데이터베이스 인덱싱 전략',
               description: 'B-Tree vs GIN 인덱스 활용법 시각화.',
               content: [
                    'B-Tree: ID(UUID), 날짜(Date) 등 정확한 값, 범위 검색에 사용. 복잡도 O(log n).',
                    'GIN (Generalized Inverted Index): 태그(Text 배열), JSONB 필드 검색에 사용. "포함(Contains)" 쿼리에 필수.'
               ],
               diagramContent: (
                    <div className="grid grid-cols-2 gap-4">
                         <div className="border p-4 rounded bg-blue-50">
                              <div className="font-bold text-blue-800 mb-2">WHERE user_id = '...'</div>
                              <div className="text-sm">표준 <strong>B-TREE</strong> 인덱스. 빠른 정확 일치 검색.</div>
                         </div>
                         <div className="border p-4 rounded bg-purple-50">
                              <div className="font-bold text-purple-800 mb-2">WHERE tags @&gt; ARRAY['hiking']</div>
                              <div className="text-sm"><strong>GIN</strong> 인덱스. 배열 내부 요소 검색에 최적화.</div>
                         </div>
                    </div>
               )
          },
          {
               id: 12,
               type: 'content',
               title: '12. 포인트/화폐 시스템 (원장 관리)',
               content: [
                    '절대 단순 "잔액(Balance)" 컬럼을 직접 수정(Update)하지 마십시오.',
                    '패턴: 복식 부기(Double Entry) 또는 추가 전용 로그(Append-Only Log).',
                    '우리 방식: `point_history` 테이블에 모든 내역(+/-)을 기록.',
                    '현재 잔액 = SUM(amount) WHERE user_id = X.',
                    '이유: 감사(Audit) 가능성. 사용자가 "내 온이 왜 없어졌나요?"라고 물으면 정확한 이력을 제시해야 함.',
                    '최적화: 읽기 속도를 위해 `profiles.beans`에 트리거로 합계를 캐싱.'
               ]
          },
          {
               id: 13,
               type: 'content',
               title: '13. 동창 찾기 로직 (개인정보 보호)',
               content: [
                    '챌린지: 졸업 연도와 이름이 결합되면 특정인을 식별할 수 있는 민감 정보(PII)가 됩니다.',
                    '해결책: 졸업 연도 컬럼에 대해 `auth.uid() = user_id` RLS 정책을 적용하여 본인만 볼 수 있게 함.',
                    '공개 뷰: 정확한 연도 대신 "2010년대 학번" 또는 "동문 인증됨" 상태만 노출.'
               ]
          },
          {
               id: 14,
               type: 'content',
               title: '14. 이미지 스토리지 & CDN',
               content: [
                    'Supabase Storage는 AWS S3 위에 구축되어 있습니다.',
                    'DB에는 이미지를 직접 저장하지 않고, 파일 경로(Path) 문자열만 저장합니다.',
                    '클라이언트는 CDN을 통해 캐싱된 공개 URL을 제공받습니다.',
                    '최적화: 업로드 전 클라이언트 사이드 리사이징(Resizing)으로 대역폭 절약.'
               ]
          },
          {
               id: 15,
               type: 'content',
               title: '15. 위치 기반 서비스 (PostGIS)',
               content: [
                    '확장 기능: `postgis` 활성화 필요.',
                    '컬럼 타입: `location GEOGRAPHY(POINT, 4326)`.',
                    '쿼리: `ST_DWithin(location, user_location, 5000)` -> 반경 5km 이내 검색.',
                    '인덱스: 위치 컬럼에 GIST 인덱스를 걸어야 공간 검색 성능이 나옵니다.'
               ]
          },
          {
               id: 16,
               type: 'code',
               title: '16. 크론 작업 & 유지보수 (pg_cron)',
               description: 'DB 내부에서 스케줄링 작업을 처리하는 방법.',
               code: `
-- 확장 기능 활성화
CREATE EXTENSION pg_cron;

-- 작업: 미인증 유저 정리 (24시간 경과 시 삭제)
SELECT cron.schedule('0 0 * * *', $$
  DELETE FROM auth.users 
  WHERE email_confirmed_at IS NULL 
  AND created_at < NOW() - INTERVAL '24 hours'
$$);

-- 작업: 인기 게시글 뷰(Materialized View) 갱신
SELECT cron.schedule('*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.trending_posts');
`
          },
          {
               id: 17,
               type: 'content',
               title: '17. 백업 & 시점 복구 (PITR)',
               content: [
                    'WAL (Write Ahead Log) 아카이빙 활성화.',
                    '지난 7일간의 어떤 시점(초 단위)으로든 DB를 되돌릴 수 있습니다 (Point-in-Time Recovery).',
                    '실수로 인한 삭제(예: WHERE 절 없는 DELETE) 사고 복구에 필수적입니다.',
                    '재해 복구(DR): 매일 스냅샷을 다른 리전(Region)에 저장.'
               ]
          },
          {
               id: 18,
               type: 'content',
               title: '18. API 레이어 자동 생성',
               content: [
                    'PostgREST가 DB 스키마를 분석하여 즉시 REST API를 생성합니다.',
                    '따라서 별도의 Controller나 Resolver 코드를 작성할 필요가 없습니다.',
                    '복잡한 비즈니스 로직이 필요하면 DB 함수(Stored Procedure)나 뷰(View)를 작성합니다.',
                    '장점: 보일러플레이트 코드 0 (Zero Boilerplate). 타입 안전성 보장.'
               ]
          },
          {
               id: 19,
               type: 'title',
               title: '19. 요약 및 개발 이관',
               subtitle: '이 시스템은 높은 일관성, 읽기 확장성, 그리고 제로 트러스트 보안을 위해 설계되었습니다.',
               author: '문서 끝',
               icon: <CheckeredFlag className="w-24 h-24 text-gray-800" />
          }
     ];

     /* Helper Icons */
     function CheckeredFlag(props) {
          return (
               <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
          )
     }

     const handleNext = () => {
          if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1);
     };

     const handlePrev = () => {
          if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
     };

     const renderSlide = (slide) => {
          if (slide.type === 'title') {
               return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in duration-700 bg-gradient-to-br from-white to-slate-50 rounded-2xl p-10 border border-slate-100">
                         <div className="p-8 bg-indigo-50 rounded-full shadow-lg mb-4 ring-8 ring-indigo-50/50">
                              {slide.icon}
                         </div>
                         <h1 className="text-5xl font-black text-slate-800 tracking-tight leading-tight">{slide.title}</h1>
                         <p className="text-2xl text-slate-500 font-light">{slide.subtitle}</p>
                         <div className="mt-12 inline-block px-6 py-2 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded-full shadow-md">
                              {slide.author}
                         </div>
                    </div>
               );
          }

          return (
               <div className="flex flex-col h-full animate-in slide-in-from-right duration-500">
                    <div className="flex items-center gap-4 border-b border-slate-200 pb-6 mb-6">
                         <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl shadow-md shrink-0">
                              {slide.id}
                         </div>
                         <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                              {slide.title.replace(/^[0-9]+\.\s/, '')}
                         </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                         {/* Description Box */}
                         {slide.description && (
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
                                   <p className="text-lg text-blue-900 leading-relaxed font-medium">{slide.description}</p>
                              </div>
                         )}

                         {/* Bullet Points */}
                         {slide.content && (
                              <ul className="grid gap-4 mb-8">
                                   {slide.content.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                             <div className="w-6 h-6 mt-1 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                                  <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                             </div>
                                             <span className="text-lg text-slate-700 leading-relaxed font-medium">{item}</span>
                                        </li>
                                   ))}
                              </ul>
                         )}

                         {/* Schema Tables */}
                         {slide.tables && (
                              <div className="grid gap-6 mb-8">
                                   {slide.tables.map((table, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                             <div className="bg-slate-800 px-5 py-3 font-mono font-bold text-white flex items-center gap-2 border-b border-slate-700">
                                                  <Database className="w-4 h-4 text-green-400" />
                                                  {table.name}
                                             </div>
                                             <div className="p-4 bg-slate-50">
                                                  <ul className="space-y-2">
                                                       {table.columns.map((col, cIdx) => (
                                                            <li key={cIdx} className="font-mono text-sm text-slate-700 flex items-center gap-3 py-1 border-b border-slate-200 last:border-0">
                                                                 <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                                                                 {col}
                                                            </li>
                                                       ))}
                                                  </ul>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         )}

                         {/* Code Blocks */}
                         {slide.code && (
                              <div className="relative group mb-8">
                                   <div className="absolute top-0 right-0 p-2 bg-slate-800 rounded-bl-lg rounded-tr-lg text-xs text-gray-400 font-mono border-l border-b border-gray-700">
                                        PGSQL
                                   </div>
                                   <div className="bg-slate-900 text-blue-300 p-6 rounded-xl font-mono text-sm shadow-xl overflow-x-auto ring-1 ring-white/10">
                                        <pre className="loading-relaxed">{slide.code}</pre>
                                   </div>
                              </div>
                         )}

                         {/* Diagrams */}
                         {slide.diagramContent && (
                              <div className="flex items-center justify-center py-8 bg-white border border-slate-100 rounded-2xl shadow-inner mb-8">
                                   {slide.diagramContent}
                              </div>
                         )}
                    </div>
               </div>
          );
     };

     return (
          <div className="flex items-center justify-center h-[calc(100vh-60px)] lg:h-[calc(100vh-80px)] p-4 lg:p-10 bg-slate-100 font-sans">
               <div className="w-full max-w-6xl aspect-[16/9] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/60 transition-all duration-500">

                    {/* Slide Viewport */}
                    <div className="flex-1 p-8 lg:p-12 relative overflow-hidden bg-white">
                         {/* Background Decor */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                         <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                         {/* Slide Number Watermark */}
                         <div className="absolute top-6 right-8 text-slate-100 font-black text-8xl select-none pointer-events-none z-0">
                              {currentSlide.toString().padStart(2, '0')}
                         </div>

                         <div className="relative z-10 h-full">
                              {renderSlide(slides[currentSlide])}
                         </div>
                    </div>

                    {/* Control Bar */}
                    <div className="h-20 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
                         <div className="text-sm font-semibold text-slate-500 font-mono flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              라이브 프리뷰
                         </div>

                         <div className="flex items-center gap-6">
                              <button
                                   onClick={handlePrev}
                                   disabled={currentSlide === 0}
                                   className="group p-3 rounded-full hover:bg-white hover:shadow-lg hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all border border-transparent hover:border-slate-100"
                              >
                                   <ChevronLeft className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                              </button>
                              <div className="flex flex-col items-center gap-1 w-64">
                                   <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</div>
                                   <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                             className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                                             style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                                        />
                                   </div>
                              </div>
                              <button
                                   onClick={handleNext}
                                   disabled={currentSlide === slides.length - 1}
                                   className="group p-3 rounded-full hover:bg-white hover:shadow-lg hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all border border-transparent hover:border-slate-100"
                              >
                                   <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                              </button>
                         </div>

                         <div className="text-sm font-bold text-slate-400 flex items-center gap-2">
                              DEV MODE <Code className="w-4 h-4" />
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default DbPresentation;
