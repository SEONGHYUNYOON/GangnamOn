# Cursor AI 에이전트용 프롬프트 (Gangnam Live 접속자 클릭 → 1:1 채팅)

우측 패널의 "Gangnam Live" 실시간 접속자 목록에서, 유저를 클릭하면 바로 1:1
채팅이 열리도록 기능을 추가했습니다. 새로운 백엔드/스키마 없이, 이미 있는
채팅 인프라(ChatWidget)를 재사용한 순수 프론트엔드 변경입니다. 아래 내용을
그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)에 "Gangnam Live" 실시간 접속자 목록을
클릭하면 1:1 채팅이 열리는 기능을 추가했어. 코드는 이미 다 작성해뒀고 로컬
빌드도 검증 완료했어. 새 스키마나 환경변수는 없어.

## 무엇이 바뀌었나
1. src/components/RightPanel.jsx — 우측 패널 하단의 실시간 접속자 목록 항목을
   div에서 클릭 가능한 button으로 바꾸고, 클릭 시 onStartChat(profile) 콜백을
   호출하도록 함. 본인 항목은 클릭 비활성화(회색 처리, "(나)" 표시)
2. src/App.jsx — RightPanel에 onStartChat={handleStartChat} prop 전달 추가.
   handleStartChat은 이미 MeetingFeed 등 다른 곳에서 쓰던 기존 함수를 그대로
   재사용함 (로그인 안 했으면 로그인 유도, 로그인 했으면 chatPeer 상태를 세팅
   해서 우측 하단 ChatWidget이 해당 유저와의 DM방을 열거나 새로 만듦)

## 이미 완료된 것
- 코드 작성 완료, `npx vite build` 로컬 빌드 성공 확인함
- 새로운 Appwrite 컬렉션/속성/Function 변경 전혀 없음 (기존 chat_rooms,
  chat_participants, chat_messages 컬렉션과 ChatWidget 로직을 그대로 재사용)

## 네가 해야 할 것
1. 평소대로 git push 시 자동 배포 확인 (스키마 변경 없으니 별도 push 불필요)
2. 사이트에서 로그인한 상태로 우측 패널 "Gangnam Live" 목록의 다른 사용자를
   클릭했을 때 우측 하단 채팅창이 해당 유저와의 대화로 바로 열리는지 확인
   (본인 항목은 클릭이 안 먹혀야 정상)
3. 로그아웃 상태에서 클릭하면 로그인 유도 토스트가 뜨는지 확인
4. 문제 없으면:
   - `git add -A`
   - `git commit -m "Gangnam Live 접속자 목록 클릭 시 1:1 채팅 시작 기능 추가"`
   - `git push`
5. 결과 요약해서 알려줘.
```
