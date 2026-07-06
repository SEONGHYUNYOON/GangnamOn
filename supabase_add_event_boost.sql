-- ==============================================================================
-- Owner's Note 이벤트 "상단 고정 노출(부스트)" 기능 추가 마이그레이션
-- ==============================================================================
-- 이미 있는 posts 테이블에 컬럼만 추가하는 안전한(ADD COLUMN IF NOT EXISTS) 마이그레이션입니다.
-- 어떤 스키마 버전을 쓰고 계시든 (schema.sql / schema_final.sql / reset_schema.sql 무엇을 실행하셨든)
-- 그냥 아래 SQL을 Supabase 대시보드 > SQL Editor에 붙여넣고 실행하시면 됩니다.
--
-- 이 컬럼이 없으면 "우리 가게 이벤트 홍보하기"로 이벤트를 새로 등록하는 것 자체는 문제없이 되지만,
-- 사장님이 온(재화)으로 24시간 상단 고정 노출을 구매하는 "부스트" 버튼만 동작하지 않습니다.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

COMMENT ON COLUMN public.posts.featured_until IS
  '이 시간까지 Owner''s Note 피드 상단에 고정 노출 (온으로 구매하는 부스트 기능)';
