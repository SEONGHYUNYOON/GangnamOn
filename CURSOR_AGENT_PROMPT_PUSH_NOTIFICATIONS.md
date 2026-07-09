# Cursor AI 에이전트용 프롬프트 (채팅 오프라인 푸시 알림 + 안읽음 뱃지)

1:1 채팅에 브라우저를 켜놨을 때 뜨는 알림 팝업(기존 기능)에 더해서, 브라우저를
꺼놔도(오프라인이어도) OS 알림이 오는 "오프라인 푸시 알림"과, 채팅 아이콘/방
목록에 안 읽은 메시지 개수를 보여주는 "안읽음 뱃지"를 추가했습니다. 코드는 이미
다 작성해뒀고 로컬 빌드도 검증 완료했어요. 아래 내용을 그대로 Cursor의 AI
에이전트(Agent 모드)에 붙여넣어 주세요.

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)의 1:1 채팅에 "오프라인 푸시 알림"과
"안읽음 뱃지" 기능을 추가했어. 코드는 이미 다 작성해뒀고 로컬 빌드
(npx vite build)도 검증 완료했어. 아래 순서대로 배포해줘.

## 무엇이 바뀌었나

1. 안읽음 뱃지 — src/components/ChatWidget.jsx에 localStorage 기반으로
   방별 "마지막으로 읽은 시각"을 기록해서, 채팅 아이콘에 안읽은 대화 수
   뱃지를 띄우고 방 목록에도 점(dot) 표시를 해. 이건 순수 프론트엔드
   변경이라 새 스키마나 배포 절차가 필요 없어.

2. 오프라인 푸시 알림 (Web Push) — 브라우저 탭이 꺼져 있어도 OS가 알림을
   띄워주는 기능. 아래 새 파일들이 추가됐어:
   - public/sw.js — 기존 서비스워커에 push/notificationclick 리스너 추가
   - src/lib/push.js — 알림 권한 요청 + 구독 생성 헬퍼
   - src/components/ChatWidget.jsx 헤더에 종 모양 "알림 켜기" 버튼 추가
   - appwrite.json — 새 컬렉션 push_subscriptions (사용자별 구독 정보 저장)
   - functions/sendPushNotification/ — chat_messages 컬렉션에 새 메시지가
     생성될 때마다 이벤트로 자동 실행되어, 상대방의 저장된 구독으로
     실제 푸시 알림을 보내는 새 Function (web-push 라이브러리 사용)

## 네가 해야 할 것

### 1) 스키마 푸시 (push_subscriptions 컬렉션 새로 생성, 절대 --all --force 쓰지 마)

`appwrite push collections --all --force`는 이전에 profiles 컬렉션을
통째로 재생성하려던 적이 있어서 절대 금지야. push_subscriptions는 완전히
새 컬렉션이니, CLI로 이 컬렉션 하나만 지정해서 push하거나
(`appwrite push collection --collection-id push_subscriptions` 같은 스코프
좁힌 명령이 있으면 그걸로), 안 되면 Node SDK로 직접 만들어줘:

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

### 2) VAPID 키 생성 (Web Push 인증용 키 — 결제/개인정보 아님, 그냥 암호화 키쌍)

```
npx web-push generate-vapid-keys
```

Public Key / Private Key 두 개가 출력돼. 이 둘을 아래에서 사용해.

### 3) sendPushNotification Function 배포

새 Function이야 (`appwrite.json`에 이미 events: 새 chat_messages 문서
생성 시 자동 트리거로 등록해뒀어). `npm install` 후 배포해줘
(`appwrite push functions` 또는 콘솔에서 새로 생성). 배포 후 아래 환경변수를
설정해줘 (Appwrite 콘솔 > Functions > sendPushNotification > Settings > Variables):

- `VAPID_PUBLIC_KEY` = 2번에서 생성한 Public Key
- `VAPID_PRIVATE_KEY` = 2번에서 생성한 Private Key
- `VAPID_SUBJECT` = mailto:a23642514@gmail.com (또는 원하는 연락처 이메일)

### 4) 프론트엔드에도 같은 Public Key 설정

프론트엔드 빌드 시점에 VITE_VAPID_PUBLIC_KEY 환경변수로 같은 Public Key
값을 넣어줘야 브라우저에서 구독이 동작해. Vercel 프로젝트 설정 >
Environment Variables에 추가해줘:

- `VITE_VAPID_PUBLIC_KEY` = 2번에서 생성한 Public Key (VAPID_PUBLIC_KEY와 동일한 값)

이건 빌드 시점에 번들에 박히는 값이라, 추가한 뒤 Vercel에서 재배포
(Redeploy)가 한 번 더 필요해 (아래 5번에서 git push하면 자동으로 재배포
되니 순서상 이 값을 먼저 넣고 5번을 진행하면 한 번에 해결돼).

### 5) 프론트엔드 배포

```
git add -A
git commit -m "채팅 오프라인 푸시 알림 + 안읽음 뱃지 추가"
git push
```

### 6) 확인

- 서로 다른 계정 2개로 로그인해서, A가 채팅창을 열고 종 모양 "알림 켜기"
  버튼을 눌러 브라우저 알림 권한을 허용하는지
- A의 브라우저 탭/창을 완전히 닫은 상태에서 B가 A에게 메시지를 보냈을 때,
  A의 컴퓨터에 OS 알림이 뜨는지 (모바일 크롬/사파리는 PWA로 홈 화면에
  추가한 경우에만 오프라인 푸시가 안정적으로 동작할 수 있어 — 데스크톱
  크롬/엣지에서 먼저 확인해줘)
- 브라우저를 켜놓은 상태에서 새 메시지가 오면 채팅 아이콘에 빨간 숫자
  뱃지가 뜨는지, 채팅창을 열면 사라지는지
- 문제 없으면 결과 요약해서 알려줘. (참고: 모바일 브라우저의 오프라인
  푸시는 iOS Safari의 경우 PWA로 "홈 화면에 추가" 해야만 동작하는 제약이
  있어 — 안 되면 이 제약 때문일 가능성이 커.)
```
