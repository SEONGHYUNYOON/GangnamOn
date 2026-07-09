# Cursor AI 에이전트용 프롬프트 (강남 픽 v2.2 — 사진 화질 개선 + 12시간 주기 변경)

성현님이 실제 배포된 화면을 보시고 사진이 너무 흐리다고 하셨고, 게시 주기도
2시간에서 12시간으로 늘려달라고 하셨습니다. 둘 다 코드로 반영 완료했고,
**이번에도 새 스키마 변경이나 환경변수 변경이 없습니다.** 아래 내용을 그대로
Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.

---

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)의 "강남 픽" 기능을 v2.2로 패치했어.
코드는 이미 다 작성해뒀고 로컬 빌드도 검증 완료했어. 새 posts 컬렉션 속성이나
환경변수는 없어서 스키마 push는 필요 없어.

## 무엇이 바뀌었나

1. **사진 흐림 현상 수정** (functions/blogFeed/src/main.js)
   - 원인: 네이버 블로그 본문 이미지 태그는 `src`에 로딩 전 흐린 미리보기
     (blur-up placeholder)를, `data-lazy-src`/`data-src`에 실제 고화질 원본을
     담아두는 경우가 많은데, 기존 코드가 `src`를 최우선으로 가져오고 있었음.
     우선순위를 `data-lazy-src` → `data-src` → `src` 순으로 바꿈.
   - 추가로 네이버 이미지 URL의 해상도 파라미터(`?type=wXXX`)를 큰 사이즈
     (`w966`)로 강제 치환하는 `upsizeNaverImageUrl()` 함수를 추가해서, 목록용
     작은 썸네일 URL이 섞여 들어와도 고화질로 요청하도록 함. 본문 이미지와
     og:image 대체 경로 둘 다에 적용됨.

2. **게시 주기 2시간 → 12시간으로 변경**
   - appwrite.json의 blogFeed Function `schedule`을 `0 */2 * * *`에서
     `0 */12 * * *`로 변경 (하루 12번 → 하루 2번)
   - functions/blogFeed/src/main.js 상단 주석, src/components/GangnamPickBoard.jsx
     안내 문구도 "12시간마다"로 함께 수정

## 이미 완료된 것 (코드 작성 + 로컬 빌드 검증 완료, 배포만 하면 됨)
- functions/blogFeed/src/main.js — 이미지 화질 개선 로직 추가
- appwrite.json — blogFeed 스케줄만 변경 (스키마 변경 없음)
- src/components/GangnamPickBoard.jsx — 안내 문구 텍스트만 변경
- `npx vite build` 로컬 빌드 성공 확인함

## 네가 해야 할 것

1. **blogFeed Function 재배포**
   - functions/blogFeed/src/main.js 변경사항 반영해서 재배포
   - Function 설정의 Schedule 값이 `0 */12 * * *`로 바뀌었는지 Appwrite
     콘솔에서 확인 (재배포 시 appwrite.json 기준으로 자동 반영되어야 하는데,
     혹시 안 바뀌어 있으면 콘솔에서 직접 Schedule 필드를 `0 */12 * * *`로
     수동 수정해줘)
   - 스키마 push, 환경변수 변경 전부 필요 없음

2. **프론트엔드 배포**
   - 평소대로 git push 시 자동 배포 확인, 안 되면 `vercel --prod` 수동 배포

3. **테스트**
   - blogFeed Function을 "지금 실행"으로 2~3번 수동 실행해보고, 새로 올라온
     사진들이 이전보다 선명한지 확인 (완벽하진 않을 수 있음 — 블로그 원본
     사진 자체가 저화질인 경우까지 보정할 순 없음)
   - 사이트에서 최근 게시물들 카드 사진 화질 눈으로 확인
   - 콘솔에서 blogFeed Function의 다음 예정 실행 시각이 12시간 간격으로
     찍히는지 확인

4. **문제 없으면 git 커밋 & 푸시**
   - `git add -A`
   - `git commit -m "강남 픽 v2.2: 이미지 화질 개선 (lazy-src 우선 + 해상도 파라미터 보정), 게시 주기 12시간으로 변경"`
   - `git push`

## 참고
- 결과 요약해서 알려줘: Function 재배포 결과, 스케줄 변경 확인, 사진 화질
  개선 전후 체감 차이, 문제 있었으면 뭘 어떻게 고쳤는지.
```
