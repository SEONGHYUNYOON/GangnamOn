# Cursor AI 에이전트용 프롬프트 (썸&쌈 현실화 배포)

지금 하고 있는 다른 작업(스키마 push 등)이 있다면 먼저 마무리하고, 그 다음
아래 내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.

⚠️ **주의**: 이번 작업은 `CURSOR_AGENT_PROMPT_SCHEMA_FIX.md`(authorUsername
스키마 push)에 의존합니다. 그 작업이 아직 안 끝났다면, 이번 것도 같은
"Unknown attribute: authorUsername" 에러가 즉석모임 등록 시 그대로 날 수
있어요. 스키마 push를 먼저 끝내고 이 프롬프트를 실행해주세요.

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)의 "강남 썸&쌈"(GangnamRomance) 기능을
가짜 목업 상태에서 실제 서비스 가능한 상태로 고쳤어. 검증하고 배포해줘.

## 이번에 고친 것 (전부 코드 작성 완료, 로컬 빌드 통과 확인함)

1. **가짜 프로필에 실제 온(재화)이 차감되던 버그 수정**
   - 기존에는 스톡사진 가짜 프로필 12명(mockProfiles)이 실제 유저와 항상
     섞여 나왔고, 가짜 프로필을 "좋아요"해도 실제 매칭은 절대 안 되는데
     온은 정상적으로 차감되고 있었어. 사용자 입장에서 돈 쓰고 아무 일도
     안 일어나는 상황이라 심각한 문제였음.
   - 이제는 실제 유저(DB profiles)가 6명 이상이면 가짜 프로필을 아예
     섞지 않고, 부족할 때만 모자란 만큼만 "샘플" 표시를 붙여서 보여줘.
   - 샘플 프로필 카드에는 "샘플 프로필 · 실제 매칭 없음" 배지가 뜨고,
     좋아요/슈퍼라이크 버튼도 "-5온" 대신 "무료"로 표시되고 실제로 온이
     차감되지 않아.
   - src/components/GangnamRomance.jsx 수정.

2. **"지금 바로 만나요"(즉석모임) 실제 기능으로 구현**
   - 기존에는 클릭해도 아무 반응 없는 완전 정적 목업 3개였음.
   - 이제 실제 posts 컬렉션(type: "gangnam_lightning")을 사용해서:
     - "모임 만들기" 버튼으로 실제 모임을 등록할 수 있음 (제목/장소/현재
       상황/최대인원/모집마감시간 입력)
     - 등록된 모임이 실시간으로 목록에 뜨고, 다른 유저가 "참여하기"를
       누르면 참여 인원수가 실제로 올라감 (정원 차면 "마감" 표시)
     - 마감시간이 지난 모임은 목록에서 자동으로 빠짐
   - 새 컴포넌트: src/components/LightningMeetupModal.jsx
   - posts 컬렉션에 새 스키마 속성 추가는 필요 없음 (기존 title,
     locationName, content, maxParticipants, currentParticipants,
     expiresAt 필드를 그대로 재사용함)

## 네가 해야 할 일 (순서대로)

1. `npm run build` 실행해서 에러 없는지 확인.

2. `npm run dev`로 로컬 서버 띄우고 "강남 썸&쌈" 탭에서 직접 테스트:
   - 스와이프 카드에 "샘플 프로필" 배지와 "무료" 표시가 정상적으로
     보이는지 (실제 유저가 적은 지금 상태에서는 샘플이 섞여 나올 거야)
   - 샘플 프로필에 좋아요를 눌러도 화면 상단 온(재화) 카운트가 줄지
     않는지 확인
   - "모임 만들기" 버튼으로 즉석모임 하나 등록해보고, 목록에 바로
     뜨는지 확인
   - 다른 계정(또는 시크릿 창)으로 로그인해서 그 모임에 "참여하기"를
     눌러보고 인원수가 올라가는지 확인
   - 최대 인원이 꽉 찬 모임은 "마감"으로 바뀌고 버튼이 비활성화되는지
     확인
   - 혹시 "Unknown attribute: authorUsername" 에러가 뜨면, 스키마 push가
     아직 안 된 것이니 CURSOR_AGENT_PROMPT_SCHEMA_FIX.md 작업을 먼저
     해달라고 나한테 알려줘.

3. 로컬 테스트가 전부 정상이면 git에 커밋 & 푸시:
   - `git add -A`
   - `git commit -m "Fix romance mock-profile currency bug, add real lightning meetup feature"`
   - `git push`

4. Vercel 자동 배포 완료 후, 실제 사이트(https://gangnam-on.vercel.app)에서
   2번 테스트를 다시 한번 반복해줘.

5. 결과를 나에게 요약해서 알려줘.

## 하지 말아야 할 것
- posts 컬렉션에 새 속성을 추가하는 스키마 변경은 필요 없어. 기존
  authorUsername 관련 스키마 push(다른 작업)만 끝나 있으면 충분해.
- mockProfiles 배열 자체를 삭제하지는 마 (실제 유저 부족할 때 샘플로
  계속 써야 함).
```
