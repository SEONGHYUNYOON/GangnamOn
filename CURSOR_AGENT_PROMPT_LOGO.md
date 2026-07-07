# Cursor AI 에이전트용 프롬프트 (로고 교체 배포)

아래 내용을 그대로 Cursor의 AI 에이전트(Agent 모드)에 붙여넣어 주세요.
현재 폴더(D:\DEV\GangNam_On)를 열어놓은 상태에서 실행하시면 됩니다.

이번 작업도 Appwrite 스키마/Function 변경이 전혀 없는 **순수 프론트엔드 변경**입니다.

---

## 프롬프트 (복사해서 붙여넣기)

```
너는 GangnamOn 프로젝트(D:\DEV\GangNam_On)에서 로고를 교체하는 작업을
검증하고 배포해야 해.

## 이번에 추가/변경된 것 (전부 코드 작성 완료, 로컬 빌드 통과 확인함)
1. 새 컴포넌트 src/components/GangnamOnLogo.jsx 추가:
   기존 부동산 로고처럼 보인다는 피드백을 받았던 860KB PNG 이미지
   (src/assets/gangnam_on_logo.png)를 대체하는 SVG 워드마크야.
   전원 버튼 아이콘 + "강남" + 코인 모양의 o + n 으로 구성돼 있고,
   "온(On)"이라는 브랜드/재화 이름을 시각적으로 표현한 디자인이야.
2. src/components/LeftSidebar.jsx: 기존 <img src={logo}> 부분을
   <GangnamOnLogo /> 컴포넌트로 교체했어. logo import(png)도 제거했어.

## 네가 해야 할 일 (순서대로)

1. `npm run build` 실행해서 에러 없는지 확인.

2. `npm run dev`로 로컬 서버 띄우고 좌측 사이드바 상단에 새 로고가
   깨지지 않고 잘 나오는지 확인 (특히 "강남"과 "n" 사이 코인 모양 o가
   자연스럽게 붙어서 "on"으로 읽히는지 확인해줘).

3. 로컬 테스트가 정상이면 git에 커밋 & 푸시:
   - `git add -A`
   - `git commit -m "Replace logo with SVG wordmark (power icon + coin O)"`
   - `git push`

4. Vercel 자동 배포 완료 후, 실제 사이트(https://gangnam-on.vercel.app)에서
   로고가 정상적으로 보이는지 다시 한번 확인해줘.

5. 결과를 나에게 요약해서 알려줘.

## 하지 말아야 할 것
- Appwrite CLI로 스키마나 Function을 다시 push할 필요 없어.
- src/assets/gangnam_on_logo.png 파일 자체는 굳이 삭제하지 않아도 돼
  (혹시 다른 곳에서 참조할 수도 있으니, import만 제거된 상태면 충분해).
```
