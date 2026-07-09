# Cursor AI 에이전트용 프롬프트 (강남픽 취미/운동 카테고리 추가 + 좋아요/조회수 실제 저장 수정)

이번에 추가/수정된 내용을 정리했습니다. 로컬 빌드(`npx vite build`) 검증까지
완료했어요. 아래 내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어
주세요.

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)에 두 가지를 추가/수정했어. 코드는 이미
다 작성해뒀고 로컬 빌드(npx vite build)도 검증 완료했어. 아래 순서대로
배포해줘.

## 무엇이 바뀌었나

1. 강남픽에 "취미"/"운동" 카테고리 2개 추가 — functions/blogFeed/src/main.js에
   새 키워드 그룹 2개(hobby, sport)와 카테고리별 AI 프롬프트를 추가했어.
   기존 맛집/카페/문화·예술과 똑같은 방식으로 네이버 블로그에서 글을
   가져오고 Gemini가 요약해. pickGroup 필드는 이미 자유 문자열이라 스키마
   변경은 필요 없어. src/components/GangnamPickBoard.jsx에도 취미/운동
   탭을 추가했어. 업데이트 주기는 기존과 동일하게 12시간이야 (cron 설정
   변경 없음).

2. 강남픽 게시글의 "좋아요"와 "조회수"가 재로그인하면 초기화되는 것처럼
   보이는 버그를 고쳤어. 원인을 찾아보니 좋아요 버튼이 처음부터 화면에서만
   토글되는 눈속임 기능이었고 (DB에 저장된 적이 없음), 조회수도 어디서도
   실제로 증가시키는 코드가 없었어 (그래서 "초기화"된 게 아니라 애초에
   저장이 안 되고 있었던 거야). 이번에 실제로 저장되도록 고쳤어:
   - 새 컬렉션 post_likes를 만들어서 누가 어떤 글에 좋아요를 눌렀는지
     기록해 (userId + postId).
   - economy Function에 toggle_pick_like / record_pick_view 액션 2개를
     추가했어. 좋아요는 이 액션을 통해서만 DB에 반영되고, 조회수도
     마찬가지야 (클라이언트가 직접 DB를 건드리지 않고 서버에서 검증 후
     처리).
   - 로그인한 사용자가 이전에 눌렀던 좋아요는 재접속해도 하트가 채워진
     채로 정확히 보여.

## 네가 해야 할 것

### 1) post_likes 컬렉션 생성 (스키마 좁혀서 추가)

`appwrite push collections --all --force`는 기존 컬렉션을 통째로
재생성할 위험이 있어서 절대 금지야. 아래처럼 Node SDK 스크립트로
post_likes 컬렉션만 새로 만들어줘 (appwrite.json에는 이미 정의를
추가해뒀으니, appwrite.json과 동일한 스펙으로 만들면 돼):

```js
await databases.createCollection(DATABASE_ID, 'post_likes', 'post_likes', [
  Permission.read(Role.users()),
], false); // documentSecurity: false — 클라이언트는 직접 생성/삭제 안 하고 economy Function(API 키)만 씀

await databases.createStringAttribute(DATABASE_ID, 'post_likes', 'userId', 64, true);
await databases.createStringAttribute(DATABASE_ID, 'post_likes', 'postId', 64, true);
// 속성 반영까지 몇 초 대기 후
await databases.createIndex(DATABASE_ID, 'post_likes', 'user_idx', 'key', ['userId']);
```

속성이 실제로 반영됐는지 확인 후 다음 단계로 넘어가줘 (생성 직후 바로
쓰려고 하면 간헐적으로 실패할 수 있어서 몇 초 정도 대기가 필요해).

### 2) economy Function 재배포

functions/economy 코드에 toggle_pick_like / record_pick_view 액션
2개가 추가됐어. 스키마나 timeout 변경은 필요 없고, 코드만 재배포하면 돼
(`appwrite push functions`에서 economy만 선택하거나 콘솔에서 재배포).

### 3) blogFeed Function 재배포

functions/blogFeed 코드에 hobby/sport 키워드 그룹과 프롬프트가
추가됐어. 스키마 변경 없이 코드만 재배포하면 돼 (economy와 동일하게
`appwrite push functions`에서 blogFeed만 선택하거나 콘솔에서 재배포).

### 4) 테스트용으로 취미/운동 게시글 5개씩 미리 생성 (요청사항)

배포가 끝나면 Appwrite 콘솔 > Functions > blogFeed > Execute에서 아래
두 번 실행해서 테스트용 게시글을 미리 채워줘:

- 실행 1: `{"forceGroup": "hobby", "count": 5}`
- 실행 2: `{"forceGroup": "sport", "count": 5}`

각 실행이 성공(success: true)하고 강남픽 화면에 취미/운동 게시글이
5개씩 보이는지 확인해줘. (실행 로그에 에러가 나면 Gemini API 키나
Naver API 키 관련 환경변수가 blogFeed Function에 이미 설정돼 있는지
확인해줘 — 기존 맛집/카페/문화예술 카테고리와 동일한 키를 그대로 씀.)

### 5) 프론트엔드 배포

```
git add -A
git commit -m "강남픽 취미/운동 카테고리 추가 + 좋아요/조회수 실제 DB 저장 구현"
git push
```

### 6) 확인

- 강남픽 메뉴에 취미/운동 탭이 새로 보이는지, 각 탭에 게시글이
  보이는지
- 로그인한 상태에서 강남픽 게시글의 하트(좋아요)를 누르면 숫자가
  올라가는지, 새로고침해도 하트가 채워진 채로 유지되는지
- 게시글을 열어보면(상세 모달) 조회수가 올라가는지, 재로그인 후에도
  조회수가 유지되는지
- 문제 없으면 결과 요약해서 알려줘.
```
