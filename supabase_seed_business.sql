-- ==============================================================================
-- Migration: Add Business Posts Seed Data
-- ==============================================================================
-- WARNING: Run this SQL only ONCE in Supabase SQL Editor to populate business posts.
DO $$
DECLARE v_resident_id uuid;
v_owner_id uuid;
BEGIN -- 1. Get User IDs (Reuse existing Owner/Resident if available)
SELECT id INTO v_resident_id
FROM auth.users
WHERE email = 'resident@gangnamon.com'
LIMIT 1;
SELECT id INTO v_owner_id
FROM auth.users
WHERE email = 'owner@gangnamon.com'
LIMIT 1;
-- If no users found, you might need to run the full reset script first.
-- Assuming users exist from previous seed.
-- ==============================================================
-- 1. 스타트업/프리랜서 (startup_freelance) - 3개
-- ==============================================================
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          likes_count,
          views,
          created_at
     )
VALUES (
          v_resident_id,
          'startup_freelance',
          '🚀 핀테크 스타트업 초기 멤버(디자이너) 모십니다',
          '강남역 공유오피스에서 치열하게 성장하실 분!
현재 개발자 2명, 기획자 1명 있습니다.
초기 지분 쉐어 가능하며, 식대/커피 무한 제공입니다.
가볍게 티타임 먼저 가지실 분 연락주세요!',
          '스파크플러스 강남점',
          12,
          105,
          now() - interval '2 hours'
     ),
     (
          v_resident_id,
          'startup_freelance',
          '🎨 프리랜서 UI/UX 디자이너 협업 구해요',
          '급하게 앱 리뉴얼 작업 도와주실 분 찾습니다.
기간은 1달 정도 예상하며, 주 1회 강남역 오프라인 미팅 가능하신 분 선호합니다.
포트폴리오 링크와 함께 메세지 주세요!',
          '강남역 인근 카페',
          8,
          45,
          now() - interval '5 hours'
     ),
     (
          v_resident_id,
          'startup_freelance',
          '📹 유튜브 영상 편집자 구합니다 (건별)',
          '스타트업 브이로그 및 인터뷰 영상 편집해주실 분 모십니다.
재미있는 센스 보유하신 분 환영합니다!
편집 단가는 협의 가능합니다.',
          '역삼동',
          5,
          30,
          now() - interval '1 day'
     );
-- ==============================================================
-- 2. 점심 네트워킹 (lunch_networking) - 3개
-- ==============================================================
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          likes_count,
          views,
          created_at
     )
VALUES (
          v_resident_id,
          'lunch_networking',
          '🍔 11/20(수) 테헤란로 개발자 점심 모임',
          '판교에서 강남으로 이직한지 얼마 안 된 백엔드 개발자입니다.
근처 개발자분들과 가볍게 햄버거 먹으며 IT 수다 떨고 싶어요.
장소는 다운타우너 역삼점 생각 중입니다! (N빵)',
          '다운타우너 역삼점',
          15,
          88,
          now() - interval '30 minutes'
     ),
     (
          v_resident_id,
          'lunch_networking',
          '🍣 이번주 금요일, 스시 오마카세 같이 가실 1분!',
          '예약하기 힘든 스시소라 강남점 런치 2자리 예약 성공했는데
친구가 갑자기 못 가게 되어서요 ㅠㅠ
조용히 초밥 좋아하시는 분 계신가요?
제가 쏩니다! (대신 커피 사주세요 ㅎㅎ)',
          '스시소라 강남점',
          42,
          210,
          now() - interval '1 day'
     ),
     (
          v_resident_id,
          'lunch_networking',
          '☕ 점심시간 30분, 영어회화 파트너 구해요',
          '역삼역 GFC 근무 중입니다.
점심 먹기엔 헤비하고, 가볍게 샌드위치 먹으면서 영어로 대화하실 분!
실력은 중급 이상 원합니다. 꾸준히 하실 분이면 좋겠어요.',
          'GFC 지하 카페',
          9,
          56,
          now() - interval '3 hours'
     );
-- ==============================================================
-- 3. 구인/협업 제안 (recruit_proposal) - 3개
-- ==============================================================
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          likes_count,
          views,
          created_at
     )
VALUES (
          v_owner_id,
          'recruit_proposal',
          '🍳 (급구) 강남역 브런치 카페 주말 알바 구합니다',
          '오전 10시 ~ 오후 3시 (5시간)
시급 1.3만원 (주휴수당 별도)
손 빠르고 밝으신 분 환영합니다!
식사 제공해드려요~',
          '강남역 11번 출구',
          6,
          95,
          now() - interval '4 hours'
     ),
     (
          v_resident_id,
          'recruit_proposal',
          '🐶 펫시터 구합니다 (역삼동)',
          '이번주 주말에 여행을 가게 되어 강아지(비숑 5kg) 봐주실 분 찾아요.
산책 1회 필수이고, 저희 집(오피스텔)에서 봐주셔야 합니다.
강아지 키워보신 경험 있으신 여성분 선호합니다.
일급 10만원 드립니다.',
          '역삼 래미안 인근',
          24,
          150,
          now() - interval '6 hours'
     ),
     (
          v_resident_id,
          'recruit_proposal',
          '💄 뷰티 모델 구해요 (헤어 컷+염색 무료)',
          '청담동 샵 디자이너 승급 시험용 모델 구합니다.
단발 태슬컷 + 애쉬브라운 염색 가능하신 분.
시술비 전액 무료 + 소정의 교통비 드립니다.
사진 촬영 가능하신 분 연락주세요!',
          '청담동 헤어샵',
          58,
          320,
          now() - interval '2 days'
     );
-- ==============================================================
-- 4. 사무실/임대 정보 (office_rent) - 3개
-- ==============================================================
INSERT INTO public.posts (
          author_id,
          type,
          title,
          content,
          location_name,
          price,
          likes_count,
          views,
          created_at
     )
VALUES (
          v_resident_id,
          'office_rent',
          '🏢 삼성역 도보 5분 공유오피스 4인실 양도',
          '[보증금: 200만원] 월세 120만원 (관리비 포함)
계약기간 6개월 남았는데 회사가 확장이전하게 되어 내놓습니다.
책상, 의자 풀옵션이고 바로 입주 가능합니다.
주차 1대 무료입니다.',
          '삼성역 4번 출구',
          1200000,
          18,
          140,
          now() - interval '1 day'
     ),
     (
          v_owner_id,
          'office_rent',
          '🏪 강남역 이면도로 1층 상가 임대 (권리금 無)',
          '[보증금: 5000만원] 월세 350만원
실평수 15평, 현재 공실입니다.
카페나 꽃집 추천드립니다.
유동인구 많고 점심시간 직장인들 바글바글합니다.',
          '역삼동 812번지',
          3500000,
          35,
          410,
          now() - interval '3 days'
     ),
     (
          v_resident_id,
          'office_rent',
          '💻 역삼역 소호사무실 1인실 (창측)',
          '[보증금: 50만원] 월세 45만원
사업자 등록 가능합니다.
조용히 코딩하거나 공부하실 분께 추천드려요.
24시간 개방, 커피머신 무료.',
          '역삼역 3번 출구',
          450000,
          8,
          62,
          now() - interval '12 hours'
     );
END $$;