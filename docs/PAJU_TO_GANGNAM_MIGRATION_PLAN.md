# 파주온 → 강남온 전환 기획서

## 1. 개요

| 항목 | 내용 |
|------|------|
| **목표** | 파주 전용 커뮤니티 사이트(파주온)를 **강남온**으로 전면 전환 |
| **범위** | 브랜딩, 지역 데이터, UI 문구, 컴포넌트/탭 ID, 목업 데이터, DB 기본값 및 시드, 정적 문서 |
| **대상** | 루트 `src/`, `public/`, `index.html`, `package.json`, Supabase 스키마/시드 SQL |

---

## 2. 변경 대상 요약

### 2.1 브랜딩·앱명

| 현재 | 변경 후 |
|------|---------|
| `PajuOn` / `파주on` | `GangnamOn` / `강남온` |
| `paju-on` (package name) | `gangnam-on` |
| `index.html` title: "파주on - 우리 동네 커뮤니티" | "강남온 - 우리 동네 커뮤니티" |
| 로고 영역 (LeftSidebar, 모바일 상단): "Paju On" | "Gangnam On" |
| 모바일 로고 "P" 아이콘 | "G" 등 강남온 아이덴티티 유지 가능 (선택) |

**파일:** `package.json`, `package-lock.json`, `index.html`, `src/App.jsx`, `src/components/LeftSidebar.jsx`

---

### 2.2 지역 데이터

#### (1) AuthWidget – 회원가입 시 지역 선택

| 현재 | 변경 후 |
|------|---------|
| `pajuRegions` (운정, 금촌, 교하, 문산, 조리, 법원, 파주읍, 광탄, 탄현, 월롱, 적성, 파평, 장단) | `gangnamRegions`: 역삼동, 삼성동, 논현동, 신사동, 청담동, 압구정동, 서초동, 방배동, 사평동 등 강남권 동 단위 |
| 기본 `region`: `운정1동` | `역삼1동` 등 |

**파일:** `src/components/AuthWidget.jsx`

#### (2) NeighborhoodLife – 지역 필터

| 현재 | 변경 후 |
|------|---------|
| `regionList`: 파주 전체, 운정, 교하, 금촌, 문산, 조리/봉일천, 광탄, 탄현, 월롱, 적성/파평 | 강남 전체, 역삼, 삼성, 논현, 신사, 청담, 압구정, 서초, 방배 등 |
| 기본 `selectedRegion`: `파주 전체` | `강남 전체` |
| Fallback `파주이웃` / `파주` | `강남이웃` / `강남` |

**파일:** `src/components/NeighborhoodLife.jsx`

#### (3) 기본 location / region

- **App.jsx**: 프로필 생성 시 `location: '파주'` → `'강남'`, 마켓/모임 `location` fallback `'파주'` → `'강남'`, `hostBadge: '파주 이웃'` → `'강남 이웃'`, 미니홈 타깃 `'파주'` → `'강남'`
- **CreatePostModal**: `'파주주민'` → `'강남주민'`
- **MeetingFeed**: `'파주주민'`, `'지금 핫한 파주 모임'` → `'강남주민'`, `'지금 핫한 강남 모임'`
- **MiniHomepage**: `'나만의 파주 라이프'`, `'파주 운정'` placeholder, `'파주 미설정'` → 강남 버전
- **OwnersNote**: `'파주 사장님'`, `'파주'` location fallback, DiceBear seed `Paju` → `Gangnam`
- **PostDetailModal**: `'파주 금촌동'` 등 하드코딩 → `'강남 역삼동'` 등
- **ActivityRewardCenter**: `'파주 인싸'`, `'오늘 파주 이야기'` → `'강남 인싸'`, `'오늘 강남 이야기'`
- **ILoveSchool**: `'파주여고'` 포함 동창회 목업 → 강남권 학교(예: 단대부고, 경기고, 세종고, 압구정고 등)로 교체

**파일:** 위 각 컴포넌트 + `src/App.jsx`

---

### 2.3 탭 ID 및 기능 네이밍

| 현재 | 변경 후 |
|------|---------|
| 탭 ID `paju_lounge` | `gangnam_lounge` |
| 탭 ID `paju_pick` | `gangnam_pick` |
| "파주 라운지" | "강남 라운지" |
| "파주 픽" | "강남 픽" |
| "파주 썸&쌈" | "강남 썸&쌈" |
| "산타는 파주" | "산타는 강남" |
| "FC 파주 & 스포츠" | "FC 강남 & 스포츠" |
| "[동네 모임] 취미로 하나 되는 파주" | "취미로 하나 되는 강남" |
| "[문화 생활] 감성 충전 파주" | "감성 충전 강남" |
| "[마이 파주]" | "[마이 강남]" |
| "파주토박이" | "강남토박이" |
| "파주 리더 뱃지" | "강남 리더 뱃지" |
| "나의 파주 활동 Badge" | "나의 강남 활동 Badge" |
| "👍 파주 픽" | "👍 강남 픽" |

**영향 파일:** `App.jsx`, `LeftSidebar.jsx`, `NeighborhoodLife.jsx`, `PajuLounge.jsx`(및 라운지 계열), 라우팅/히스토리 `paju_lounge` → `gangnam_lounge` 처리

---

### 2.4 컴포넌트 파일명 및 내부 참조

| 현재 파일 | 변경 후 | 비고 |
|-----------|---------|------|
| `PajuRomance.jsx` | `GangnamRomance.jsx` | import 경로 및 컴포넌트명 일괄 수정 |
| `PajuLounge.jsx` | `GangnamLounge.jsx` | `PajuBlockGame`, `PajuTarot` import 경로 변경 |
| `PajuBlockGame.jsx` | `GangnamBlockGame.jsx` | 랭킹 "파주불주먹" 등 닉네임 → 강남 버전 |
| `PajuTarot.jsx` | `GangnamTarot.jsx` | "오늘의 파주 타로" → "오늘의 강남 타로" |
| `PajuTraffic.jsx` | `GangnamTraffic.jsx` | 노선/정거장 목데이터를 강남권(2호선, 분당선, 7호선 등) 기반으로 교체 |

- **PajuLounge 내부**: "파주 날씨", "파주 보안관", "자유로의 독수리", "파주 마당발", "운정 신도시주", "임진각 평화지킴이", "파주 캐릭터", "실시간 파주 톡", "Paju Lounge", "PAJU BLOCK", "파주 짱", "파주 타로" 등 → 강남 버전으로 문구 변경.
- **RightPanel**: `PajuTraffic` import → `GangnamTraffic`, "파주on 여행" → "강남온 여행", Mock 사용자 "파주지킴이" 등 → 강남권 닉네임.

**파일:** `App.jsx`, `LeftSidebar.jsx`, `RightPanel.jsx`, `PajuLounge.jsx` → `GangnamLounge.jsx`, `PajuBlockGame` → `GangnamBlockGame`, `PajuTarot` → `GangnamTarot`, `PajuTraffic` → `GangnamTraffic`, `PajuRomance` → `GangnamRomance`

---

### 2.5 목업·콘텐츠 데이터

#### (1) 배너 메시지 (App.jsx)

- "파주on 공식 오픈!" → "강남온 공식 오픈!", 운정/금촌/야당역 등 파주 지명 → 강남권 지명(역삼, 강남역, 신사 등)으로 변경.

#### (2) RightPanel

- 날씨: "파주 금촌동" → "강남 역삼동" (또는 삼성동 등).  
- Open-Meteo 위경도: 파주 금촌 (37.7594, 126.7746) → 강남구 역삼동 (예: 37.5012, 127.0396).  
- 네이버 검색 링크: `파주+금촌동+날씨` → `강남+역삼동+날씨` 등.  
- "파주on 여행" → "강남온 여행".  
- Mock 사용자: 금촌사랑꾼, 운정댁, 파주지킴이, 문산토박이, 운정불주먹, 야당역여신 등 → 강남권 닉네임으로 변경.

#### (3) LocalBiz (가게 목업)

- 주소 `파주시 목동동`, `금촌동`, `야당동`, `탄현면 헤이리`, `출판단지` 등 → 강남권 주소(역삼동, 삼성동, 청담동 등).  
- "파주옥", "파주쉐프", "#운정카페", "#금촌네일" 등 → 강남 버전 해시태그/상호.

#### (4) PajuTraffic → GangnamTraffic

- GTX(운정중앙, 킨텍스, 대곡, …), 떠킹버스(운정1/2지구, 금촌/조리, …) → 강남권 노선(2호선 역, 분당선, 7호선, 간선버스 등) 기반 목데이터로 교체.

#### (5) PajuRomance / Block / Tarot / Lounge

- 프로필 location "금촌동", "교하동", "파주 주민" 등 → "역삼동", "삼성동", "강남 주민" 등.  
- MBTI 캐릭터 "파주 보안관", "운정 신도시주" 등 → 강남 버전 캐릭터명.

**파일:** `App.jsx`, `RightPanel.jsx`, `LocalBiz.jsx`, `PajuTraffic`→`GangnamTraffic`, `PajuRomance`→`GangnamRomance`, `PajuLounge`→`GangnamLounge`, `PajuBlockGame`→`GangnamBlockGame`, `PajuTarot`→`GangnamTarot`

---

### 2.6 DB·스키마·시드

#### (1) Post type

| 현재 | 변경 후 |
|------|---------|
| `paju_pick` | `gangnam_pick` |

- `posts.type` 사용처: `NeighborhoodLife` (fetch filter, badge, tab filter), `supabase_reset_schema` 시드.
- **옵션 A (권장)**  
  - DB enum/기본값 및 시드에서 `paju_pick` → `gangnam_pick` 마이그레이션.  
  - 기존 `paju_pick` 데이터가 있다면 `UPDATE posts SET type = 'gangnam_pick' WHERE type = 'paju_pick'` 등으로 이관.

#### (2) 프로필 기본값

- `location` default `'파주 운정'` → `'강남 역삼'` (또는 동일 구체적 기본값).  
- `region` default `'파주'` → `'강남'`.

**파일:** `supabase_schema.sql`, `supabase_schema_final.sql`, `supabase_reset_schema.sql`

#### (3) 시드 데이터 (supabase_reset_schema)

- `owner@pajuon.com`, `resident@pajuon.com` → `owner@gangnamon.com`, `resident@gangnamon.com` 등.  
- `username` / `full_name` / `location`: "야당역_이자카야", "파주 야당동", "파주사랑꾼", "김파주", "파주 운정", "파주 교하" 등 → 강남권 버전으로 변경.  
- `paju_pick` 타입 시드 → `gangnam_pick`.

**파일:** `supabase_reset_schema.sql`

---

### 2.7 서비스·기타 소스

| 현재 | 변경 후 | 비고 |
|------|---------|------|
| `pajuService.js` | `gangnamService.js` | 파일명 변경. 내부 로직은 Supabase 공통이므로 그대로 두고, import 경로만 수정. (사용처 없으면 미사용으로 두어도 무방) |

---

### 2.8 프레젠테이션·정적 문서

- `DbPresentation.jsx`: "PajuOn: 기술 아키텍처 심층 분석" → "GangnamOn: 기술 아키텍처 심층 분석".  
- `db_presentation.html`, `public/presentation.html`: title "PajuOn DB Architecture" → "GangnamOn DB Architecture".  
- `AdminDashboard`: "PajuOn 서비스 현황" → "GangnamOn 서비스 현황".

**파일:** `src/components/DbPresentation.jsx`, `db_presentation.html`, `public/presentation.html`, `src/components/AdminDashboard.jsx`

---

### 2.9 `gangnamon` 서브폴더

- `gangnamon/`는 별도 빌드(또는 프로토타입)로 보입니다.  
- **이번 작업 범위**: 루트 `src/` 기준 메인 앱 전환에 집중.  
- `gangnamon` 내 `GangnamRomance`, `LeftSidebar` 등 일부 이미 강남 관련 네이밍이 있는데, 메인 앱과 중복 정리 여부는 추후 결정 가능.

---

## 3. 작업 순서 제안

1. **브랜딩·앱명**  
   `package.json`/`package-lock.json`, `index.html`, `App.jsx`, `LeftSidebar.jsx`에서 PajuOn/파주on → GangnamOn/강남온, 로고 문구 변경.

2. **지역 데이터**  
   `AuthWidget`, `NeighborhoodLife` 지역 목록·기본값 변경.  
   전역 기본 `location`/`region` fallback을 `App.jsx` 등에서 `'강남'`으로 통일.

3. **탭 ID·기능 네이밍**  
   `paju_lounge` → `gangnam_lounge`, `paju_pick` → `gangnam_pick` 및 관련 라우팅/히스토리, 사이드바·헤더 문구 변경.

4. **컴포넌트 rename 및 문구**  
   - `PajuRomance` → `GangnamRomance`, `PajuLounge` → `GangnamLounge`, `PajuBlockGame` → `GangnamBlockGame`, `PajuTarot` → `GangnamTarot`, `PajuTraffic` → `GangnamTraffic`  
   - 각 파일 내 "파주" 문구, 목데이터(지역, 닉네임, 노선 등) 강남 버전으로 수정.  
   - `App.jsx`, `LeftSidebar.jsx`, `RightPanel.jsx` 등 import/사용처 일괄 수정.

5. **나머지 UI·목업**  
   `CreatePostModal`, `MeetingFeed`, `MiniHomepage`, `OwnersNote`, `PostDetailModal`, `ActivityRewardCenter`, `ILoveSchool`, `LocalBiz`, `RightPanel`(날씨/네이버 링크/Mock 유저) 등 나머지 "파주" 문구 및 목데이터 강남 반영.

6. **DB·스키마·시드**  
   - `paju_pick` → `gangnam_pick` 마이그레이션 및 스키마 기본값 수정.  
   - `supabase_reset_schema` 시드 이메일/지역/타입 등 강남 버전으로 수정.

7. **문서·프레젠**  
   `DbPresentation`, `db_presentation.html`, `presentation.html`, `AdminDashboard` 문구 수정.

8. **선택**  
   `pajuService.js` → `gangnamService.js` rename 및 사용처 정리.

---

## 4. 주의사항

- **DB 마이그레이션**: 이미 프로덕션 `posts`에 `paju_pick` 데이터가 있다면, **`supabase_migrate_paju_to_gangnam.sql`** (`UPDATE posts SET type = 'gangnam_pick' WHERE type = 'paju_pick';`)을 먼저 실행한 뒤 앱 배포하는 순서 권장.
- **역할 구분**: "표시용 문구만 강남" vs "탭/type ID까지 강남"을 혼동하지 않도록, 이 기획서 기준으로 **탭 ID·DB type 모두 강남 버전**으로 통일하는 것을 전제로 함.
- **날씨/교통**: 강남 구체 동·노선은 위 예시(역삼, 삼성 등)를 기준으로 하되, 필요 시 실제 서비스 정책에 맞게 미세 조정 가능.

---

## 5. 동의 후 진행

위 계획에 동의하시면, **1번(브랜딩) → 2번(지역) → 3번(탭/기능) → 4번(컴포넌트) → 5번(나머지 UI) → 6번(DB·시드) → 7번(문서)** 순으로 실제 수정 작업을 진행하겠습니다.

필요한 부분만 단계별로 진행하거나, 특정 파일/기능을 제외하고 싶으시면 알려주세요.
