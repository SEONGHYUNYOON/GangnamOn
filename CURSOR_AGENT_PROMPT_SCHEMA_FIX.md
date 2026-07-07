# Cursor AI 에이전트용 프롬프트 (긴급: 글 작성 실패 버그 수정)

실제 사이트(https://gangnam-on.vercel.app)에서 Owner's Note 이벤트 등록 시
아래 에러가 발생하고 있어요. **글쓰기 자체가 막히는 심각한 버그**라 우선순위
높게 처리해주세요.

```
글 작성 실패: Invalid document structure: Unknown attribute: "authorUsername"
```

지금 하고 있는 다른 작업이 있다면 그거 먼저 마무리하고, 그 다음에 아래
내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.

---

## 원인 (파악 완료)

`appwrite.json`(로컬 스키마 설정 파일)에는 `posts`, `guestbook_entries`
컬렉션에 `authorUsername` 등의 필드가 이미 정의돼 있는데, 실제 Appwrite
클라우드 프로젝트에는 이 필드가 아직 생성되지 않은 상태예요. 즉 스키마
설정 파일만 앞서가고, 실제 `appwrite push`가 안 된 상황입니다.

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)에서 실제 Appwrite 프로젝트 스키마가
로컬 appwrite.json 설정보다 뒤처져 있어서 글 작성이 실패하고 있어.
("Unknown attribute: authorUsername" 에러)

## 해야 할 일 (순서대로)

1. Appwrite CLI 로그인 상태 확인: `appwrite client --selfsigned false` 등
   기존에 로그인된 세션이 있는지 확인하고, 없으면 로그인해줘.

2. 스키마를 실제 프로젝트에 반영:
   `appwrite push collections`
   실행해서 posts, guestbook_entries를 포함한 모든 컬렉션의 속성을
   최신 appwrite.json 기준으로 동기화해줘. (대화형 프롬프트가 뜨면
   전부 진행/덮어쓰기 승인해줘. 기존 데이터는 삭제되지 않고 속성만
   추가되는 안전한 작업이야.)

3. 반영 후 실제 사이트(https://gangnam-on.vercel.app)에서 직접 테스트:
   - Owner's Note(사장님 이벤트 홍보) 글쓰기 시도 → 정상적으로 등록되는지
   - 일반 게시판 글쓰기(아무 카테고리나)도 정상 등록되는지
   - 미니홈피 방명록 작성도 정상 등록되는지 (guestbook_entries 사용)
   - 에러가 계속 나면 Appwrite 콘솔에 들어가서 posts/guestbook_entries
     컬렉션의 Attributes 탭을 열어 authorUsername, authorAvatarUrl 등이
     실제로 생성됐는지 직접 확인해줘.

4. 정상 확인되면 나에게 결과를 요약해서 알려줘 (어떤 컬렉션에 어떤 속성이
   빠져 있었는지, push 후 몇 개 속성이 추가됐는지).

## 참고
- 이건 코드 변경이 아니라 순수 Appwrite 스키마 동기화라서 git commit/push는
  필요 없어. appwrite.json 자체도 수정하지 않아.
- 혹시 push 도중 "속성이 이미 존재합니다" 같은 경고가 나오면 정상이야
  (이미 있는 필드는 건너뛰고 없는 필드만 추가됨).
```
