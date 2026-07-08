# Cursor AI 에이전트용 프롬프트 (긴급: economy Function 전체 실패)

실제 사이트에서 **좋아요/슈퍼라이크/스타일 구매/닉네임 변경/부스트 등 온(재화)이
드는 모든 동작이 전부 실패**하고 있어요. 잔액이 충분해도 "온이 부족해요"
모달이 뜹니다. 우선순위 높게 봐주세요.

## 재현 방법 (직접 확인함)

1. 1,250온 보유 중인 테스트유저로 로그인
2. 강남 썸&쌈에서 실제 유저 프로필("온테스트")에게 좋아요(5온) 클릭
3. "앗! 온이 부족해요" 모달이 뜸 (잔액 1,250온으로는 절대 나올 수 없는 에러)

## 원인 조사 결과 (Appwrite executions API로 직접 확인함)

브라우저에서 `fetch`로 economy Function의 최근 실행 기록 3건을 직접 조회했더니:
```
status: "completed"
responseStatusCode: 400
responseBody: ""       ← 완전히 비어있음
errors: ""             ← 비어있음
logs: ""                ← 비어있음
duration: 0.08초        ← 매우 빠름 (정상 실행이라면 DB 조회 때문에 더 걸림)
```

`functions/economy/src/main.js`를 보면 모든 코드 경로(`res.json(...)`)가 반드시
`{ success: false/true, message: ... }` 형태의 body를 반환하도록 되어 있어요.
즉 **body가 완전히 비어있는 400은 우리 함수 코드가 실행된 결과가 아니라,
Appwrite가 함수를 아예 실행하지 못하고 자체적으로 반환한 에러**로 보입니다.

가능성이 높은 원인:
1. 최근 `appwrite push collections` 이후 economy Function이 재빌드/재배포
   되면서 빌드가 실패했거나 비활성(inactive) 상태가 됐을 가능성
2. `npm install` 커맨드가 실패해서 `node-appwrite` 의존성이 없는 상태로
   배포됐을 가능성
3. Function의 활성 배포(active deployment)가 최신 코드를 가리키지 않을 가능성

## 네가 확인해야 할 것 (Appwrite 콘솔에서, CLI API로는 일반 유저 세션으로
안 보이는 정보라 콘솔 직접 확인이 필요함)

1. Appwrite 콘솔 → Functions → economy → **Deployments** 탭
   - 최신 배포의 빌드 상태가 "Ready"(성공)인지, "Failed"인지 확인
   - 실패했다면 빌드 로그에서 에러 메시지 확인 (npm install 실패 등)
   - 성공했다면, 그 배포가 실제로 **활성화(Activate)** 되어 있는지 확인
     (배포는 성공했는데 활성화가 안 돼서 이전 버전이 계속 쓰이고 있을 수도 있음)

2. Functions → economy → 방금 실패한 실행 하나를 클릭해서 **실행 로그
   (Execution log)** 전체를 확인 (stdout/stderr) — 여기엔 우리가 API로 못 본
   상세 에러가 있을 거예요.

3. 문제를 찾으면:
   - 빌드 실패라면 원인(주로 package.json/dependencies 문제) 고쳐서 재배포
   - 활성화 안 된 배포라면 최신 배포를 Activate
   - 그 외 원인이면 원인에 맞게 수정

4. 수정 후 실제 사이트에서 강남 썸&쌈 좋아요를 눌러서 정상적으로 온이
   차감되고 매칭 로직까지 도는지 확인해줘.

5. 결과를 요약해서 알려줘 (콘솔에서 실제로 어떤 에러/상태였는지 포함해서).

## 참고
- 이 문제는 코드 버그가 아니라 배포/인프라 문제일 가능성이 높아서, 코드를
  섣불리 고치기보다 먼저 콘솔에서 실제 배포/실행 상태를 확인하는 게
  우선이에요.
