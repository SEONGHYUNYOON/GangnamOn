# Cursor 작업 지시서 — 방문자/재화 통계, 강남구 소식, 중고마켓 카테고리, 미니홈피 피드

이 배치는 5개 사용자 요청을 반영합니다. 프론트엔드 코드는 이미 전부 작성/빌드 검증 완료 상태입니다 (`npx vite build` 정상 통과). Cursor가 할 일은 **Appwrite 스키마 반영 + Function 재배포 + git 배포**입니다.

절대 `appwrite push collections --all --force` 사용 금지. 아래 스코프된 API 호출만 사용하세요.

## 1. 새 컬렉션 생성: `bean_transactions`

재화(온) 발급/소모 내역을 남기는 원장(ledger) 컬렉션입니다. 관리자 대시보드의 "발급된 재화/소모된 재화" 통계가 이걸 합산합니다.

```js
await databases.createCollection(DATABASE_ID, 'bean_transactions', 'bean_transactions', [
  Permission.read(Role.any()),
  Permission.create(Role.users()),
], true /* documentSecurity */);

await databases.createStringAttribute(DATABASE_ID, 'bean_transactions', 'userId', 64, true);
await databases.createStringAttribute(DATABASE_ID, 'bean_transactions', 'type', 32, true);
await databases.createIntegerAttribute(DATABASE_ID, 'bean_transactions', 'amount', true);
await databases.createStringAttribute(DATABASE_ID, 'bean_transactions', 'note', 128, false);

// 속성 생성이 반영될 때까지 몇 초 대기 후 인덱스 생성
await databases.createIndex(DATABASE_ID, 'bean_transactions', 'userId_idx', 'key', ['userId']);
await databases.createIndex(DATABASE_ID, 'bean_transactions', 'type_idx', 'key', ['type']);
```

정확한 스키마는 저장소 루트 `appwrite.json`의 `bean_transactions` 블록을 참고하세요 (이미 문서화되어 있습니다).

## 2. 기존 `posts` 컬렉션에 속성 추가: `productCategory`

중고마켓 카테고리 필터용입니다.

```js
await databases.createStringAttribute(DATABASE_ID, 'posts', 'productCategory', 32, false, '기타');
await databases.createIndex(DATABASE_ID, 'posts', 'product_category_idx', 'key', ['productCategory']);
```

## 3. `economy` Appwrite Function 재배포

`functions/economy/src/main.js`가 이번에 수정됐습니다 (재화가 오갈 때마다 `bean_transactions`에 기록을 남기는 `logBeanTx` 헬퍼 추가). 코드는 이미 완성되어 있으니 **기존 방식대로 재배포만** 하면 됩니다.

```
appwrite deploy function --function-id economy
```

⚠️ 위 1번(컬렉션 생성)이 먼저 완료되어야 합니다 — 컬렉션이 없는 상태에서 Function이 먼저 배포되면 재화 관련 동작 자체는 정상 작동하지만(로그 실패는 조용히 무시되도록 만들어둠), 통계가 비어있게 됩니다.

## 4. 프론트엔드 git 배포

평소처럼 커밋 & 푸시:

```
git add -A
git commit -m "feat: 사이트 전체 방문자 통계, 재화 발급/소모 구분, 강남구 소식 3개 게시판, 중고마켓 카테고리, 인스타형 사진 피드"
git push
```

이 커밋에는 다음이 포함됩니다:
- `src/App.jsx`, `src/lib/appwrite.js`, `src/components/AdminDashboard.jsx`, `src/components/RightPanel.jsx` — 사이트 전체 방문자 집계 (요청 #1)
- `api/gangnam-news.js`, `src/components/GangnamNews.jsx` — 강남구청 보도자료·언론보도 게시판 추가 스크래핑 (요청 #2)
- `src/components/AdminDashboard.jsx` — 발급된 재화/소모된 재화 분리 통계 (요청 #3)
- `src/components/UsedMarket.jsx`, `src/components/CreatePostModal.jsx` — 중고마켓 카테고리, "라이프" 문구 제거 (요청 #4)
- `src/components/MiniHomepage.jsx` — 일상 사진 인스타그램 스타일 단일 열 피드 (요청 #5)
- `src/components/AuthWidget.jsx` — 가입 보너스 재화 발급 기록 추가

## 5. 배포 후 확인 사항

- **`/api/gangnam-news`**: `https://gangnam-on.vercel.app/api/gangnam-news`에 접속해서 응답의 `sources` 배열에 `["강남이슈", "보도자료", "언론보도"]` 3개가 다 들어있는지, `failedSources`가 비어있는지 확인해주세요. 만약 보도자료/언론보도 둘 중 하나라도 파싱에 실패하면(강남구청 게시판 HTML 구조가 강남이슈 게시판과 다를 가능성이 있음) `failedSources`에 표시됩니다 — 그 경우 저에게 알려주시면 해당 게시판 HTML 구조를 다시 확인해서 파서를 조정하겠습니다.
- **관리자 대시보드**: "누적 방문자"가 0이 아니라 실제 값으로 뜨는지, "발급된 재화"/"소모된 재화" 카드가 표시되는지 확인.
- **중고마켓**: 카테고리 탭이 뜨고, 새 글 작성 시 카테고리 선택이 되는지 확인.
- **미니홈피**: 사진 올렸을 때 최신 사진이 맨 위, 세로 한 줄로 쌓이는지 확인.

## 참고: 재화 통계는 "지금부터" 집계입니다

`bean_transactions`는 이번에 새로 만든 컬렉션이라 과거 내역은 없습니다. "발급된 재화"/"소모된 재화" 숫자는 이 배포 이후 발생하는 거래부터 정확하게 쌓입니다 (가짜 데이터로 과거를 채우지 않았습니다). "유통된 온(재화)" 카드(전 회원 보유 합계)는 기존 방식 그대로 실시간 정확합니다.
