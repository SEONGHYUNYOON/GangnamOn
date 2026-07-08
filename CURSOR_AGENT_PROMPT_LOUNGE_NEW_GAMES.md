# Cursor AI 에이전트용 프롬프트 (강남 라운지 신규 게임 7종 추가)

아래 내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.
분량이 많으니, 한 번에 다 시키기보다 **번호별로 순서대로** 하나씩 진행시키는
걸 추천해요 (한 번에 몰아서 시키면 중간에 실수가 생겨도 못 찾음).

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)의 "강남 라운지"(src/components/GangnamLounge.jsx)에
새 미니게임 7개를 추가해줘. 아래 기존 컨벤션을 반드시 그대로 따라야 해:

## 기존 컨벤션 (반드시 확인하고 따라할 것)
- 게임 컴포넌트는 src/components/GangnamXxx.jsx 형태 파일로 분리하고,
  props는 `{ onClose, user }` 형태로 받는다. (참고: GangnamReactionTest.jsx,
  GangnamSnake.jsx, GangnamWhackAMole.jsx, GangnamBrickBreaker.jsx)
- 랭킹은 src/lib/gameRank.js의 `getRankTop10(gameKey, higherIsBetter)`,
  `addScore(gameKey, name, score, higherIsBetter)`를 그대로 사용한다
  (전부 localStorage 기반이라 새 Appwrite 컬렉션이 필요 없음. 그대로 유지해줘).
- 유저 이름은 `user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트'`
  패턴으로 뽑는다.
- 상단 헤더는 `<ArrowLeft>` 뒤로가기 버튼 + 제목 + 우측 spacer 구조를 유지한다
  (GangnamReactionTest.jsx 참고).
- 다크(gray-900~black) 배경에 보라/그린/앰버 등 포인트 컬러, rounded-2xl 카드
  스타일을 그대로 따른다.
- 새 게임은 GangnamLounge.jsx에 (1) import 추가 (2) `renderContent()`의
  `activeFeature === 'xxx'` 분기 추가 (3) `paidFeatures` 배열에 id 추가
  (1온 소모, 이미 있는 `handleLoungeEntry` 흐름 그대로) (4) 대시보드에 카드 추가,
  이렇게 4곳을 수정해서 연결해줘.

---

## 1. 2048 (GangnamGame2048.jsx)
4x4 그리드 숫자 합치기 게임. 방향키(및 모바일 스와이프)로 타일 이동, 같은
숫자 합쳐지면 점수 획득. 더 이상 움직일 칸이 없으면 게임오버 화면 + "다시하기".
점수는 `addScore('game2048', name, score, true)` (높을수록 좋음).
"랭킹 아케이드" 섹션에 기존 벽돌깨기/반응속도/격파와 같은 크기의 카드로 추가.

## 2. 온 점프 (플래피버드 스타일) (GangnamFlapOn.jsx)
캔버스 기반 원터치 게임. 강남온의 골드 코인 캐릭터가 클릭/스페이스바로
점프하면서 장애물(빌딩 파이프 느낌으로 강남 스타일 연출) 사이를 통과.
통과한 장애물 개수 = 점수. `addScore('flapon', name, score, true)`.
"랭킹 아케이드"에 위와 같은 크기 카드로 추가.

## 3. 추억의 짝맞추기 (메모리 카드) (GangnamMemoryMatch.jsx)
4x4(8쌍) 카드 뒤집기 짝맞추기 게임. 강남 테마 이모지(🏙️🚕🥟🏢🌃🚇🏙️🎡 등)
사용. 모든 짝을 맞추면 완료, 소요 시간/시도 횟수 기반 점수 계산(효율적일수록
높은 점수). `addScore('memory', name, score, true)`.
"랭킹 아케이드"에 같은 크기 카드로 추가.

## 4. 골드 다트 (조준 게임) (GangnamDartGame.jsx)
다트판 스타일 조준 게임. 타겟이 살짝씩 움직이거나 크기가 변하고, 클릭한
위치의 정확도에 따라 점수 차등(중앙 100점, 바깥 10점). 10라운드 합산 점수.
`addScore('dart', name, totalScore, true)`.
"랭킹 아케이드"에 같은 크기 카드로 추가.

## 5. 온 룰렛 (GangnamSpinRoulette.jsx)
8칸짜리 회전 룰렛(+5온, +10온, +20온, 꽝, +50온 등 랜덤 배치). 진입은 무료,
"돌리기" 버튼 클릭 시 1온 차감 후(기존 Lounge의 `updateBeanCount` 클라이언트
호출 패턴 그대로 사용 — 서버 economy Function 연동은 이번엔 하지 않음)
CSS 회전 애니메이션으로 결과 연출, 결과 온만큼 `updateBeanCount(+n)`로 지급.
"소통 · 심리" 섹션에 밸런스게임/MBTI/타로와 같은 크기 카드로 추가.

## 6. 눈치게임 (GangnamNunchiGame.jsx)
"1부터 인원수까지 순서대로 숫자를 외치되, 동시에 외치면 아웃"이라는 국민
술자리 게임을 1인용으로 변형: 가상의 AI 참가자 5~7명이 각자 랜덤한 타이밍에
숫자를 외치는 걸 화면에 표시하고, 유저가 "다음 숫자"를 아직 안 나온 타이밍에
맞춰 버튼을 눌러야 함(너무 빠르거나 늦으면 실패). 살아남은 라운드 수 = 점수.
`addScore('nunchi', name, survivedRounds, true)`.
(진짜 여러 유저가 동시 접속하는 실시간 버전은 새 Appwrite 컬렉션+realtime이
필요해서 이번 범위에서는 제외하고, 위의 1인용 AI 버전으로 구현해줘.)
"소통 · 심리" 섹션에 카드 추가.

## 7. 궁합 테스트 (GangnamCompatibility.jsx)
두 사람의 이름(또는 닉네임)을 입력받아, 두 문자열을 조합한 해시값 기반으로
0~100% 궁합 점수를 결정론적으로 계산(같은 조합이면 항상 같은 결과). 점수
구간별로 강남스러운 드립 문구 5~6개를 미리 준비해서 결과에 맞게 보여줌
(예: "이 정도면 테헤란로에서 손잡고 걸어야 함", "친구 그 이상은 아니고..").
"다시하기" 버튼 제공. 랭킹 저장은 필요 없음(1회성 콘텐츠).
"소통 · 심리" 섹션에 MBTI 테스트 옆에 같은 크기 카드로 추가.

## 마무리
1. 7개 다 만들고 나서 `npm run build` 실행해서 에러 없는지 확인.
2. `npm run dev`로 라운지 화면 들어가서 7개 카드가 다 보이고, 각각 눌러서
   최소 한 판씩 플레이까지 되는지 확인 (특히 온 차감/지급이 정상적으로
   반영되는지).
3. 문제 없으면 git 커밋 & 푸시:
   - `git add -A`
   - `git commit -m "Add 7 new Gangnam Lounge games"`
   - `git push`
4. 배포 후 실제 사이트에서도 7개 게임 전부 한 번씩 열어서 정상 동작 확인.
5. 결과 요약해서 알려줘 (게임별로 정상 동작했는지, 문제 있었으면 뭘 어떻게
   고쳤는지).

## 참고
- Appwrite 스키마/Function 변경 전혀 없음. 순수 프론트엔드 작업.
- 게임 로직이 복잡해서 한 번에 다 안 될 수도 있어. 하나씩 만들고 그때그때
  로컬에서 눈으로 확인하면서 진행하는 걸 추천해.
```
