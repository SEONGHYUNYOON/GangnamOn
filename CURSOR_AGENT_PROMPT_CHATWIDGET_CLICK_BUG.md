# Cursor AI 에이전트용 프롬프트 (회원가입 버튼 안눌리는 버그 — 원인 찾음, 수정 완료)

## 원인 (라이브 사이트에서 직접 디버깅해서 확정함)

"회원가입" 버튼이 안 눌리는 게 아니라, **우측 하단 채팅 위젯(ChatWidget)의
접혀있는 채팅창 패널이 화면에 안 보이는 상태에서도 여전히 클릭을 가로채고
있었던 것**이었어요.

`src/components/ChatWidget.jsx`의 채팅창 패널 div가:
```
scale-50 opacity-0 translate-y-24   ← 접혀있을 때 (안 보임)
```
이 클래스들로 시각적으로만 숨겨져 있었는데, `pointer-events-auto`가 항상
켜져 있어서 **투명하지만 여전히 클릭 가능한 상태**로 화면 우측 하단
영역(로그인 카드 하단부, 회원가입 버튼 위치와 겹침) 위에 계속 떠 있었어요.
브라우저 개발자도구로 `document.elementFromPoint()`를 직접 찍어봐서 확인
완료했습니다 — 회원가입 버튼을 클릭했을 때 실제로 이벤트를 받은 건 그
버튼이 아니라 숨겨진 채팅창 패널(`로그인 후 채팅을 사용할 수 있어요` 텍스트를
담은 div)이었어요.

## 수정 내용 (이미 코드 작성 완료, 로컬 빌드 통과 확인함)

`src/components/ChatWidget.jsx`에서 채팅창 패널의 `pointer-events-auto`를
무조건 켜두지 않고, 열려있을 때만 켜지도록 수정:
```jsx
// 이전: pointer-events-auto가 항상 적용됨
// 이후: isOpen일 때만 pointer-events-auto, 닫혀있으면 pointer-events-none
```

이제 채팅창이 닫혀있을 때는 완전히 클릭이 통과되어 뒤에 있는 회원가입
버튼(및 그 주변 다른 UI)을 정상적으로 누를 수 있습니다.

## 네가 해야 할 일 (순서대로)

1. `npm run build` 실행해서 에러 없는지 확인.
2. `npm run dev`로 로컬에서 확인:
   - 채팅 위젯이 닫혀있는 상태에서 우측 하단 근처 UI(특히 로그인 카드의
     "회원가입" 링크)를 클릭했을 때 정상 반응하는지
   - 채팅 위젯 열기/닫기 자체는 여전히 정상 동작하는지
   - 회원가입까지 실제로 폼 채워서 끝까지 진행되는지
3. 로컬 테스트 통과하면 git 커밋 & 푸시:
   - `git add -A`
   - `git commit -m "Fix ChatWidget invisible panel blocking clicks behind it when closed"`
   - `git push`
4. 배포 후 실제 사이트에서 다시 한번 회원가입 버튼 테스트.
5. 결과 요약해서 알려줘.

## 참고
- 스키마/DB 변경 없음, 순수 프론트엔드 CSS 버그 수정.
- 비슷한 패턴(opacity-0인데 pointer-events-auto가 그대로 켜진 곳)이 프로젝트
  전체에서 이 파일 한 곳뿐인 것도 확인했음 (다른 곳은 안전함).
