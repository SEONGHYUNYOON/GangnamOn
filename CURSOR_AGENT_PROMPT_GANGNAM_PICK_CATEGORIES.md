# Cursor AI 에이전트용 프롬프트 (강남 픽 하위 카테고리: 맛집/카페/문화·예술)

강남 픽 메뉴에 하위 카테고리(맛집 / 카페 / 문화·예술)를 추가했습니다. 문화·예술
카테고리는 AI가 강남권 전시/공연/문화행사 블로그를 12시간마다 새로 찾아서
올려줍니다. 코드는 이미 다 작성해뒀고 로컬 빌드도 검증 완료했어요. 아래 내용을
그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)의 "강남 픽" 메뉴에 하위 카테고리(맛집 /
카페 / 문화·예술)를 추가했어. 코드는 이미 다 작성해뒀고 로컬 빌드
(npx vite build)도 검증 완료했어. 아래 순서대로 배포해줘.

## 무엇이 바뀌었나

1. appwrite.json — posts 컬렉션에 pickGroup 속성(문자열, 기본값
   'restaurant')과 pick_group_idx 인덱스 추가. blogFeed Function의
   timeout을 300초로 늘림 (문화/예술 테스트 실행 시 여러 개를 한 번에
   생성하기 위함).

2. functions/blogFeed/src/main.js — KEYWORDS를 KEYWORD_GROUPS로 재구성해서
   restaurant/cafe/culture 세 카테고리별 검색 키워드를 분리했어. AI(Gemini)
   프롬프트도 카테고리별로 다르게 동작해: 맛집/카페는 기존처럼 메뉴·가격·
   분위기 중심, 문화/예술은 전시/공연 이름·장소·기간·볼거리 중심으로 소개
   문구를 만들어. 평소 cron 자동 실행(12시간마다)은 세 카테고리 중 무작위로
   골라서 1개만 올리고, pickGroup 필드에 어떤 카테고리인지 저장해.

   수동 테스트 실행도 지원해: Appwrite 콘솔에서 Body에
   { "forceGroup": "culture", "count": 5 } 를 넣고 실행하면 문화/예술
   카테고리로 5개를 한 번에 생성해줘 (아래 4번 단계에서 사용).

3. scripts/backfill-pick-group.mjs — 이 기능이 생기기 전에 이미 올라간
   기존 강남 픽 글들(전부 맛집/카페)을 제목·본문 키워드로 분석해서
   pickGroup을 맛집(restaurant) 또는 카페(cafe)로 분류해주는 1회성 스크립트.

4. src/components/GangnamPickBoard.jsx — 상단에 전체/맛집/카페/문화·예술
   탭을 추가해서 pickGroup으로 필터링할 수 있게 했어.

## 네가 해야 할 것

### 1) 스키마 푸시 (posts 컬렉션에만, 절대 --all --force 쓰지 마)

`appwrite push collections --all --force` 같은 전체 강제 푸시는 이전에
profiles 컬렉션을 통째로 재생성하려던 적이 있어서 절대 금지야. 대신
posts 컬렉션 하나만 스코프를 좁혀서 안전하게 추가해줘. Appwrite CLI로
개별 push가 안 되면 Node SDK(node-appwrite)로 아래처럼 직접 호출해:

```js
await databases.createStringAttribute(DATABASE_ID, 'posts', 'pickGroup', 20, false, 'restaurant');
// 속성 생성 반영까지 몇 초 걸릴 수 있으니 잠깐 대기 후
await databases.createIndex(DATABASE_ID, 'posts', 'pick_group_idx', 'key', ['pickGroup']);
```

(pickGroup 속성/인덱스가 이미 존재하면 "already exists" 에러가 날 텐데,
그러면 이미 반영된 거니 그냥 넘어가면 돼.)

### 2) blogFeed Function 재배포

코드가 바뀌었고 timeout도 300초로 늘어났으니 재배포해줘
(`appwrite push functions` 또는 콘솔에서 새 배포 생성). 기존 환경변수
(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, GEMINI_API_KEY)는 그대로 재사용하면
되고 새로 추가할 환경변수는 없어.

### 3) 백필 스크립트 1회 실행

기존 맛집/카페 글들을 분류해줘:

```
cd GangNam_On
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 \
APPWRITE_PROJECT_ID=6a4be56a00369cf49a31 \
APPWRITE_API_KEY=<서버 API 키, 최소 databases.read+write 스코프> \
node scripts/backfill-pick-group.mjs
```

콘솔에 "완료: N개 분류, M개는 이미 분류되어 있어 건너뜀" 로그가 뜨면 성공.

### 4) 문화/예술 테스트 실행 (5개 생성)

Appwrite 콘솔 > Functions > blogFeed > Execute now 에서 Body(JSON)에
아래처럼 넣고 수동 실행해줘:

```json
{ "forceGroup": "culture", "count": 5 }
```

실행 로그에서 5개 중 몇 개가 성공했는지 확인해줘 (검색 결과가 없거나 전부
중복이면 일부만 생성될 수도 있어 — 그래도 정상 동작이야). 응답에
`created` 필드로 실제 생성된 개수가 나와.

### 5) 프론트엔드 배포

```
git add -A
git commit -m "강남 픽 하위 카테고리(맛집/카페/문화·예술) 추가"
git push
```

### 6) 확인

- 사이트에서 강남 픽 메뉴 열어서 전체/맛집/카페/문화·예술 탭이 보이는지
- 문화·예술 탭을 눌렀을 때 방금 생성한 5개(또는 그 이하)가 보이는지
- 기존 맛집/카페 글들도 각자 맞는 탭에 잘 들어가 있는지 (백필 확인)
- 문제 없으면 결과 요약해서 알려줘.
```
