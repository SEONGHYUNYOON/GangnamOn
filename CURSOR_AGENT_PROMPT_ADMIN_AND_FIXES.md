# Cursor AI 에이전트용 프롬프트 (관리자 메뉴 + 프로필 사진 업로드 수정 + 푸시알림 통합)

이번에 추가/수정된 내용을 정리했습니다. 로컬 빌드(`npx vite build`) 검증까지
완료했어요. 아래 내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어
주세요.

**중요**: 이전에 드렸던 `CURSOR_AGENT_PROMPT_PUSH_NOTIFICATIONS.md`의 "3)
sendPushNotification Function 배포" 부분은 더 이상 유효하지 않습니다.
Appwrite 플랜이 Function을 2개까지만 허용해서, 푸시 알림 발송 로직을 별도
Function이 아니라 기존 `economy` Function 안으로 통합했습니다. 아래
프롬프트가 이 부분을 대체합니다.

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)에 세 가지를 추가/수정했어. 코드는 이미
다 작성해뒀고 로컬 빌드(npx vite build)도 검증 완료했어. 아래 순서대로
배포해줘.

## 무엇이 바뀌었나

1. 미니홈피 프로필 사진 업로드 실패 버그 수정 — src/lib/imageUpload.js와
   src/App.jsx에 다단계 fallback을 추가했어 (리사이즈 실패 시 원본 파일
   사용 → 권한 지정 업로드 실패 시 권한 없이 재시도 → 프로필 문서 직접
   업데이트 실패 시 economy Function의 새 update_avatar 액션으로 재시도).

2. 관리자 메뉴 — a23642514@gmail.com과 united6494@naver.com 두 계정을
   관리자로 지정했어. 관리자 대시보드(AdminDashboard.jsx)에서 신규 가입
   회원 목록(최근 10명)을 볼 수 있고, "전체 회원에게 공지 보내기" 기능으로
   모든 회원의 1:1 채팅방에 "공지" 표시가 붙은 메시지를 일괄 발송할 수 있어.
   실제 발송 권한 체크는 클라이언트가 아니라 economy Function 서버 쪽에서
   profiles.isAdmin 값을 직접 확인해서 처리하니까 안전해.

3. 푸시 알림 발송 로직을 economy Function으로 통합 — Appwrite 플랜이
   Function 2개까지만 허용한다는 걸 알게 돼서, 원래 별도 Function으로
   만들려던 푸시 발송 로직을 economy Function 안으로 옮겼어. 이제
   economy Function이 chat_messages 컬렉션 생성 이벤트로 트리거되고,
   발신자 인증 헤더가 없는 이벤트 호출이면 푸시 알림 처리로, 있으면 기존
   온(재화)/관리자 로직으로 분기해.

## 네가 해야 할 것

### 1) 스키마 푸시 (새 속성 2개 + 필요 시 push_subscriptions 컬렉션)

`appwrite push collections --all --force`는 이전에 profiles 컬렉션을
통째로 재생성하려던 적이 있어서 절대 금지야. 아래처럼 속성 단위로
좁혀서 추가해줘 (Node SDK 스크립트로 실행하는 걸 추천):

```js
// profiles.isAdmin (관리자 여부)
await databases.createBooleanAttribute(DATABASE_ID, 'profiles', 'isAdmin', false, false);

// chat_messages.isNotice (공지 메시지 여부)
await databases.createBooleanAttribute(DATABASE_ID, 'chat_messages', 'isNotice', false, false);
```

만약 push_subscriptions 컬렉션을 아직 만들지 않았다면 (이전 푸시 알림
프롬프트를 아직 실행 안 했다면) 이것도 함께 만들어줘:

```js
await databases.createCollection(DATABASE_ID, 'push_subscriptions', 'push_subscriptions', [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
], true); // documentSecurity: true

await databases.createStringAttribute(DATABASE_ID, 'push_subscriptions', 'userId', 64, true);
await databases.createStringAttribute(DATABASE_ID, 'push_subscriptions', 'endpoint', 512, true);
await databases.createStringAttribute(DATABASE_ID, 'push_subscriptions', 'keys', 512, true);
// 속성 생성 반영까지 몇 초 걸리니 잠깐 대기 후
await databases.createIndex(DATABASE_ID, 'push_subscriptions', 'user_idx', 'key', ['userId']);
```

속성이 실제로 반영됐는지 확인 후 다음 단계로 넘어가줘 (생성 직후 바로
쓰려고 하면 간헐적으로 실패할 수 있어서 몇 초 정도 대기가 필요해).

### 2) 관리자 계정 지정 (1회성 스크립트 실행)

scripts/set-admin.mjs를 실행해줘. 이메일로 계정을 찾아야 해서 API 키에
"users.read" 스코프가 필요해 (기존 키에 없으면 Appwrite 콘솔에서 스코프
추가하거나 새 키 발급):

```
cd D:\DEV\GangNam_On
APPWRITE_API_KEY=<users.read + databases.write 스코프 있는 키> node scripts/set-admin.mjs
```

a23642514@gmail.com, united6494@naver.com 두 계정 모두 isAdmin: true로
설정됐다는 로그가 뜨는지 확인해줘. (참고: 아직 가입하지 않은 이메일은
건너뛴다는 경고만 뜨고 스크립트는 정상 종료돼.)

### 3) economy Function 재배포

functions/economy 코드가 바뀌었어 (update_avatar / admin_broadcast 액션
추가, chat_messages 생성 이벤트 트리거 추가, timeout 15초 → 60초로 증가).
appwrite.json에 이미 반영돼 있으니 재배포해줘 (`appwrite push functions`
에서 economy만 선택하거나 콘솔에서 재배포).

만약 push_subscriptions 관련 VAPID 환경변수를 아직 economy Function에
설정하지 않았다면 (Appwrite 콘솔 > Functions > economy > Settings >
Variables), 아래 3개를 추가해줘:

- `VAPID_PUBLIC_KEY` — 없으면 `npx web-push generate-vapid-keys`로 새로 생성
- `VAPID_PRIVATE_KEY` — 위와 동일하게 생성된 값
- `VAPID_SUBJECT` = mailto:a23642514@gmail.com

(이미 이전에 별도 sendPushNotification Function용으로 생성해둔 VAPID 키가
있다면 그 값을 그대로 economy Function 환경변수로 옮겨서 재사용하면 돼.
새로 만들 필요 없어.)

프론트엔드도 같은 Public Key가 필요해 — Vercel 프로젝트 설정 >
Environment Variables에 `VITE_VAPID_PUBLIC_KEY`가 아직 없다면 추가해줘
(VAPID_PUBLIC_KEY와 동일한 값). 이건 빌드 시점에 번들에 박히는 값이라
추가 후 재배포가 필요한데, 5번에서 git push하면 자동으로 재배포되니
순서상 이 값을 먼저 넣고 5번을 진행하면 한 번에 해결돼.

### 4) 정리 (있으면 무시해도 되는 파일)

functions/sendPushNotification/ 폴더는 이제 안 써 (economy로 통합됐어).
appwrite.json에서도 이미 빠져있어서 배포는 안 되지만, 폴더 자체는 남아있을
수 있어. 삭제해도 되고 그냥 둬도 상관없어.

### 5) 프론트엔드 배포

```
git add -A
git commit -m "관리자 메뉴(신규회원/전체공지) + 프로필 사진 업로드 버그 수정 + 푸시알림 economy 통합"
git push
```

### 6) 확인

- a23642514@gmail.com 또는 united6494@naver.com으로 로그인해서 관리자
  메뉴가 보이는지, 신규 가입 회원 목록이 뜨는지
- 관리자 대시보드에서 "전체 공지 보내기"로 테스트 메시지를 보내고, 다른
  계정으로 로그인해서 채팅창에 "공지" 표시가 붙은 노란색 말풍선으로
  메시지가 도착하는지
- 프로필 사진 업로드가 실패 없이 정상적으로 되는지 (특히 예전에 실패했던
  계정으로 재확인)
- 문제 없으면 결과 요약해서 알려줘.
```
