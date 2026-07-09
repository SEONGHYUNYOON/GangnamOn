# Cursor 배포 요청 — 실제 데이터화 + 성별 아바타 + 유령계정 복구 + 신규가입 팝업

이번 배치는 **DB 스키마 변경이나 Function 재배포가 필요 없습니다.** 전부 프론트엔드 코드 변경 + 1회성 백필 스크립트 2개 실행입니다.

## 1) 변경된 내용 (코드, 이미 완료됨 — 로컬 빌드 검증 완료)

- `src/lib/avatar.js` (신규): 성별 기반 기본 아바타 URL을 계산하는 공용 헬퍼. 남성/여성 각각 6종 시드 풀에서 사용자 ID 해시로 고정 배정 (같은 사람은 항상 같은 캐릭터).
- `src/components/AdminNewSignupPopup.jsx` (신규): 관리자 전용 신규 가입 알림 팝업 컴포넌트.
- `src/App.jsx`: Appwrite Realtime으로 `profiles` 컬렉션 생성 이벤트를 구독해서, 관리자가 어느 화면에 있든 신규 가입자 팝업이 뜨도록 처리.
- `src/components/AdminDashboard.jsx`: 통계 카드(총 회원수/총 게시글/누적 방문자/유통된 온)와 최근 7일 방문 추이 그래프를 전부 실제 Appwrite 쿼리 기반으로 교체 (기존 가짜 하드코딩 수치 15,420 / 85,400 등 제거).
- `src/components/RightPanel.jsx`: "GANGNAM LIVE" 접속자 수 초기값을 가짜 1204 → 실제 0부터 시작하도록 수정. 아바타 표시를 공용 헬퍼로 교체.
- `src/components/AuthWidget.jsx`, `ChatWidget.jsx`, `CreatePostModal.jsx`, `MiniHomepage.jsx`, `AdminDashboard.jsx`: 아바타 표시 로직을 전부 `resolveAvatarUrl`/`getDefaultAvatarUrl` 공용 헬퍼로 통일.

## 2) 배포 전 실행해야 할 1회성 스크립트 2개

기존 가입자들에게 성별 아바타를 채워주고, "유령 계정"(Auth는 있지만 profiles 문서가 없는 계정 — kimtk2232 포함)을 복구합니다. 순서 상관없지만 아래 순서 권장:

```bash
cd GangNam_On

# 1) kimtk2232 등 profiles 문서가 없는 계정 복구 (Users API 필요 — users.read 스코프)
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 \
APPWRITE_PROJECT_ID=6a4be56a00369cf49a31 \
APPWRITE_API_KEY=<서버 API 키, users.read + databases.write 스코프 필요> \
node scripts/backfill-missing-profiles.mjs

# 2) 기존 가입자 중 avatarUrl이 비어있고 gender가 설정된 사람에게 성별 아바타 배정
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 \
APPWRITE_PROJECT_ID=6a4be56a00369cf49a31 \
APPWRITE_API_KEY=<서버 API 키, databases.read + databases.write 스코프 필요> \
node scripts/backfill-gender-avatars.mjs
```

두 스크립트 모두:
- 이미 값이 있는 필드는 절대 덮어쓰지 않습니다 (안전하게 반복 실행 가능).
- 실행 후 콘솔에 처리 결과 요약(성공/건너뜀 목록)을 출력합니다. 실행 로그를 그대로 붙여넣어 주세요.
- API 키가 없으면 `~/.appwrite/prefs.json`에서 자동으로 읽으려고 시도합니다 (기존 `set-admin.mjs`와 동일한 방식).

## 3) 배포

스키마/Function 변경 없음 — 표준 프론트엔드 배포만 하면 됩니다.

```bash
git add -A
git commit -m "feat: 실시간 데이터 전환, 성별 기반 아바타, 신규가입 관리자 팝업, 유령계정 복구"
git push
```

Vercel 자동 배포 확인 후 다음을 알려주세요:
1. 두 백필 스크립트 실행 로그 (몇 명 처리됐는지)
2. 프론트엔드 배포 커밋 해시
3. 가능하면: 관리자 계정으로 로그인해서 대시보드 통계가 실제 숫자로 보이는지, kimtk2232가 신규 가입 리스트에 나타나는지 육안 확인

## 참고 (본인 계정에서 직접 확인이 필요한 항목)

- 신규 가입 실시간 팝업은 실제로 새 계정이 가입할 때만 뜹니다 (테스트용 새 계정 하나 만들어보시는 게 가장 확실합니다).
- `RightPanel.jsx`의 "로맨스 랭킹"(역삼불주먹 등)은 여전히 목업 데이터입니다 — 이번 배치 범위 밖이라 건드리지 않았습니다. 필요하시면 별도로 요청해주세요.
