# Cursor AI 배포 가이드 (For Cursor Agent)

현재 프로젝트는 **Vercel**과 **Supabase**로 구성되어 있으며, 배포 설정이 모두 완료된 상태입니다.
Cursor AI를 사용하여 추가 개발 후 배포할 때 아래 내용을 참고하세요.

## 1. 프로젝트 상태

- **GitHub**: `SEONGHYUNYOON/GangnamOn` (origin/main)
- **배포 플랫폼**: Vercel (프로젝트명: `gangnam-on`)
- **데이터베이스**: Supabase (URL/Key가 `src/lib/supabase.js`에 적용됨)

## 2. 배포 방법 (터미널 명령어)

개발 수정 후 배포하려면 Cursor의 터미널에서 다음 명령어를 실행하면 됩니다.

### 🚀 정식 배포 (Production)

실제 사용자가 보는 사이트(`gangnam-on.vercel.app`)를 업데이트합니다.

```powershell
npx vercel --prod
```

- 질문이 나오면 모두 엔터(Enter)나 `y`를 입력하세요.
- 배포가 완료되면 `Production: https://...` 주소가 나옵니다.

### 🧪 프리뷰 배포 (Test)

정식 반영 전 테스트용 URL을 생성합니다.

```powershell
npx vercel
```

## 3. 주의사항

- **데이터베이스 키**: 현재 배포 편의를 위해 `src/lib/supabase.js` 파일에 API Key가 직접 입력되어 있습니다. 만약 이 파일을 수정할 때는 Key가 지워지지 않도록 주의하세요.
- **API Proxy**: Vercel 배포 시 별도의 `vercel.json` 설정이 적용되어 있습니다. (`npm run build` 명령어 사용)

## 4. 바로가기

- **배포된 사이트**: <https://gangnam-on.vercel.app>
- **GitHub 저장소**: <https://github.com/SEONGHYUNYOON/GangnamOn>
