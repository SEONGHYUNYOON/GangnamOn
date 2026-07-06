# Cursor AI 에이전트용 프롬프트

아래 내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.
현재 폴더(D:\DEV\GangNam_On)를 열어놓은 상태에서 실행하시면 됩니다.

---

## 프롬프트 (복사해서 붙여넣기)

```
너는 이 GangnamOn 프로젝트(강남 주민 커뮤니티 웹앱, React + Vite + Tailwind)를
Supabase에서 Appwrite로 백엔드를 완전히 이전하는 작업의 마지막 단계를 마무리해야 해.

## 배경
- Supabase 프로젝트가 플랫폼 장애로 계속 파운즈(paused) 상태라서 Appwrite로 이전하기로 결정했어.
- 컴포넌트 코드(App.jsx, AuthWidget.jsx, RightPanel.jsx, CreatePostModal.jsx, OwnersNote.jsx,
  MiniHomepage.jsx, AdminDashboard.jsx, NeighborhoodLife.jsx, GangnamRomance.jsx 등)는
  이미 전부 supabase-js 호출을 Appwrite SDK(Databases/Account/Storage/Realtime) 호출로
  교체 완료된 상태야. src/lib/appwrite.js 에 클라이언트 설정이 있고,
  appwrite.json 에 필요한 데이터베이스(main)/컬렉션 6개(profiles, posts,
  romance_interactions, chat_rooms, chat_participants, guestbook_entries)/
  스토리지 버킷(post-images) 스키마가 이미 정의돼 있어.
- Appwrite 프로젝트는 이미 클라우드에 생성돼 있어:
  - Project ID: 6a4be56a00369cf49a31
  - Endpoint: https://fra.cloud.appwrite.io/v1
  - .env.local에 VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID로 이미 채워져 있음
- 카카오 로그인은 Appwrite가 지원하지 않아서 이번 단계에서는 제외했고,
  이메일/비밀번호 로그인만 구현돼 있어. (의도된 것, 버그 아님)
- purchase_avatar_style 같은 Supabase RPC(서버 트랜잭션)는 Appwrite에 동일한 기능이
  없어서, 이 앱이 기존에도 사용하던 방식(클라이언트에서 직접 온(재화) 차감/지급)과
  동일하게 클라이언트 로직으로 재구현해뒀어. 보안/인증 강화는 나중에 별도로 진행할
  예정이니 지금 단계에서 서버 검증 로직을 추가하려고 하지 마.

## 네가 해야 할 일 (순서대로)

1. `npm install` 실행해서 의존성 설치 확인 (package.json에 appwrite 패키지 이미 추가돼 있음).

2. `npm run build` 실행해서 빌드 에러 없는지 확인. 에러 나면 원인 파악해서 고쳐줘.
   (참고: 이전 세션에서 로컬 빌드 검증은 통과했었어. 혹시 에러가 나면 supabase.js
   관련 잔재나 import 누락일 가능성이 높아.)

3. Appwrite CLI로 실제 스키마 생성:
   - `npm install -g appwrite-cli`
   - `appwrite login` (브라우저 로그인)
   - `appwrite push collections --all` 실행해서 appwrite.json에 정의된 데이터베이스/
     컬렉션/속성/인덱스/버킷을 실제 Appwrite 프로젝트에 생성.
   - 이미 존재하는 리소스가 있다는 에러가 나면 무시하고 넘어가도 돼 (재실행 시 정상).

4. `npm run dev`로 로컬 서버 띄우고 브라우저에서 실제로 테스트:
   - 회원가입 (이메일/비밀번호) → 로그인 성공하는지
   - 글쓰기(중고거래/모임/사장님 이벤트 등) → 실제로 Appwrite Databases에 저장되는지
   - 프로필/아바타 변경, 온(재화) 차감/지급이 정상 동작하는지
   에러 콘솔에 뜨면 원인 파악해서 고쳐줘 (주로 appwrite.json 속성명과 코드에서
   쓰는 필드명이 정확히 일치하는지 확인 — camelCase로 통일돼 있어야 함, 예:
   authorId, locationName, imageUrls, likesCount, maxParticipants, expiresAt 등).

5. **중요**: .env.local은 .gitignore에 걸려있어서 git에는 안 올라가.
   Vercel에 배포된 사이트가 정상 동작하려면 Vercel 프로젝트 설정(Environment Variables)에도
   아래 두 값을 반드시 추가해야 해:
   - VITE_APPWRITE_ENDPOINT = https://fra.cloud.appwrite.io/v1
   - VITE_APPWRITE_PROJECT_ID = 6a4be56a00369cf49a31
   Vercel CLI가 설치/로그인돼 있다면 `vercel env add VITE_APPWRITE_ENDPOINT production`,
   `vercel env add VITE_APPWRITE_PROJECT_ID production` 명령으로 추가해줘.
   CLI가 안 되면 나에게 Vercel 웹 대시보드에서 직접 추가하라고 안내해줘
   (Project → Settings → Environment Variables).

6. 로컬 테스트가 전부 정상이면 git에 커밋 & 푸시:
   - `git add -A`
   - `git commit -m "Migrate backend from Supabase to Appwrite"`
   - `git push`
   (GitHub 로그인은 이미 돼 있음)

7. Vercel이 GitHub 연동으로 자동 배포될 텐데, 배포 완료 후 실제 배포된 사이트
   URL로 접속해서 회원가입/로그인/글쓰기가 실제로 동작하는지 다시 한번 확인해줘.
   문제가 있으면 Vercel 빌드 로그를 확인해서 원인을 알려줘.

8. 모든 게 정상이면 나에게 다음을 요약해서 알려줘:
   - 최종 배포 사이트 URL
   - 실제로 테스트해본 기능과 결과
   - 혹시 발견한 문제와 어떻게 고쳤는지

## 하지 말아야 할 것
- 카카오 로그인 다시 추가하지 마 (의도적으로 뺀 것).
- 인증/보안 강화(비밀번호 정책, 이메일 인증, RLS 유사 서버 검증 등) 작업 시작하지 마.
  이건 나중에 별도로 요청할 예정이야.
- Supabase 관련 코드/의존성을 다시 살리지 마. Appwrite로 완전히 이전하는 게 목표야.
```
