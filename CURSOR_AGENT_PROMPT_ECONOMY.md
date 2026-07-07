# Cursor AI 에이전트용 프롬프트 (온/재화 보안 강화 배포)

아래 내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.
현재 폴더(D:\DEV\GangNam_On)를 열어놓은 상태에서 실행하시면 됩니다.

이 작업은 이미 라이브로 배포된 https://gangnam-on.vercel.app/ 사이트에
"온(재화) 조작 방지" 보안 강화를 배포하는 후속 작업입니다. 코드는 이미 다
작성돼 있고, 실제 Appwrite Function 배포와 재확인만 남아있습니다.

---

## 프롬프트 (복사해서 붙여넣기)

```
너는 GangnamOn 프로젝트(D:\DEV\GangNam_On)에 새로 추가된 Appwrite Function을
실제 Appwrite 프로젝트에 배포하고, 배포된 사이트에서 정상 동작하는지 확인해야 해.

## 배경
- 지금까지 아바타 스타일 구매, 이벤트 부스트(상단고정), 닉네임 변경, 좋아요/슈퍼라이크
  등 온(재화)이 걸린 모든 동작을 브라우저(클라이언트)에서 직접 databases.updateDocument로
  처리했어. 이러면 누구나 브라우저 개발자도구로 Appwrite SDK를 직접 호출해서 온을
  무한정 늘리거나 모든 스타일을 공짜로 잠금 해제할 수 있는 보안 구멍이 있었어.
- 이 구멍을 막기 위해 "economy"라는 Appwrite Function(서버 코드)을 새로 작성했어:
  - 위치: functions/economy/src/main.js, functions/economy/package.json
  - appwrite.json의 "functions" 배열에 이미 등록돼 있음 (runtime: node-20.0,
    entrypoint: src/main.js, execute: ["users"])
  - src/lib/appwrite.js에 이 Function을 호출하는 callEconomy() 헬퍼 함수를 추가했고,
    App.jsx / RightPanel.jsx / OwnersNote.jsx / GangnamRomance.jsx의 온 관련 로직을
    전부 이 Function을 호출하도록 이미 재배선(rewiring) 완료했어.
  - 로컬 빌드(npm run build)는 이미 에러 없이 통과 확인했어.
- 이제 남은 건: 이 Function을 실제 Appwrite 클라우드 프로젝트에 배포하고,
  git에 커밋/푸시해서 Vercel에 반영하고, 실제 사이트에서 동작을 확인하는 것뿐이야.

## 네가 해야 할 일 (순서대로)

1. `npm run build` 다시 한번 실행해서 에러 없는지 최종 확인.

2. Appwrite CLI로 스키마 + Function을 실제 프로젝트에 반영:
   - Appwrite CLI가 이미 설치/로그인돼 있을 거야 (이전 세션에서 세팅함).
   - `appwrite push collections --all` 실행 (기존 컬렉션에 새로 추가된 속성 없음,
     안전하게 재실행 가능).
   - `appwrite push functions --all` (또는 설치된 CLI 버전에 따라
     `appwrite deploy function` / `appwrite functions createDeployment` 등
     비슷한 이름일 수 있음 — `appwrite --help` 또는 `appwrite push --help`로
     정확한 명령어 확인해줘) 실행해서 economy Function을 실제로 배포해줘.
   - 배포 중 "npm install" 단계가 자동으로 실행되도록 appwrite.json에
     `"commands": "npm install"`이 이미 설정돼 있어. node-appwrite 패키지가
     정상 설치되는지 확인해줘.

3. Appwrite 콘솔(웹) 또는 CLI로 economy Function이 "Ready" 상태로 배포됐는지 확인.
   - 만약 Function의 실행 권한(Execute Access)이 "users"로 안 잡혀있으면
     콘솔에서 직접 "Any authenticated user"로 설정해줘 (appwrite.json에는
     이미 execute: ["users"]로 설정돼 있으니 정상 배포되면 자동 반영될 거야).

4. `npm run dev`로 로컬 서버 띄우고 실제로 테스트:
   - 로그인 후 "강남 썸&쌈"(로맨스) 탭에서 좋아요(♥) 클릭 → 온이 5 차감되는지
   - 아바타 커스터마이저에서 유료 스타일 구매 → 온 차감 + 스타일 잠금 해제되는지
   - Owner's Note에서 본인이 등록한 이벤트에 "부스트" 구매 → 온 300 차감 +
     24시간 상단 고정되는지
   - 우측 패널에서 닉네임 변경 → 온 1000 차감되는지
   - 브라우저 개발자도구 콘솔에서 직접
     `window.appwrite` 같은 걸로 온을 조작하려고 해도 이제 안 먹히는지
     (실제로는 온이 서버(Function)에서만 계산되므로, 클라이언트에서
     beans 필드를 직접 updateDocument로 바꾸려는 시도는 여전히 Appwrite
     권한상 본인 프로필이면 가능할 수 있음 — 이건 알려진 잔여 리스크이니
     막힌다고 확신하지 말고, 그냥 정상 플로우가 잘 동작하는지만 확인하면 돼).
   - 에러가 나면 원인 파악해서 고쳐줘. 특히 "economy function not found" 같은
     에러가 나면 2번 단계의 Function 배포가 제대로 안 된 것이니 다시 확인해줘.

5. 로컬 테스트가 전부 정상이면 git에 커밋 & 푸시:
   - `git add -A`
   - `git commit -m "Add server-side economy validation via Appwrite Function"`
   - `git push`

6. Vercel이 자동 배포될 텐데, 배포 완료 후 실제 사이트
   (https://gangnam-on.vercel.app/ 또는 최신 배포 URL)에서 4번의 테스트를
   다시 한번 반복해줘.

7. 모든 게 정상이면 나에게 다음을 요약해서 알려줘:
   - economy Function 배포 상태 (Ready 여부)
   - 실제로 테스트해본 기능과 결과 (좋아요/구매/부스트/닉네임 변경)
   - 혹시 발견한 문제와 어떻게 고쳤는지

## 하지 말아야 할 것
- economy Function의 가격표(스타일 가격, 부스트 300온, 닉네임 1000온 등)를
  임의로 바꾸지 마. 클라이언트 화면에 표시되는 가격과 정확히 일치해야 해.
- ActivityRewardCenter.jsx와 GangnamLounge.jsx의 온 지급/차감 로직은 이번
  작업 범위가 아니야 (알려진 잔여 리스크로 남겨둔 것). 건드리지 마.
- deploy_appwrite_and_push.bat 파일은 이미 API 키 기반으로 수정돼 있으니
  임의로 원래 방식으로 되돌리지 마.
```
