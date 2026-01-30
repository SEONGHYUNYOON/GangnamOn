# 강남온(GangnamOn) 배포 가이드

파주온과 동일하게 온라인으로 서비스를 배포하기 위한 단계별 가이드입니다.
현재 로컬 컴퓨터에서 빌드 테스트(`npm run build`)는 성공적으로 완료되었습니다.

## 1. Vercel CLI 설치

가장 간편한 배포 방법은 Vercel CLI를 사용하는 것입니다. 아래 명령어를 터미널에 입력하여 설치하세요.

```powershell
npm install -g vercel
```

## 2. 배포 실행

설치가 완료되면, 아래 명령어를 순서대로 입력하여 배포를 진행합니다.

1. **로그인**:

   ```powershell
   vercel login
   ```

   (브라우저가 열리면 이메일 또는 GitHub 등으로 로그인하세요)

2. **배포 시작**:
   프로젝트 루트 폴더(`d:\DEV\GangNam_On`)에서 아래 명령어를 실행합니다.

   ```powershell
   vercel
   ```

3. **설정 확인 (엔터키만 누르세요)**:
   명령어를 실행하면 몇 가지 질문이 나옵니다. 대부분 기본값이 맞으므로 `Enter` 키를 눌러 진행하면 됩니다.

   - `Set up and deploy “d:\DEV\GangNam_On”?` -> **y**
   - `Which scope do you want to deploy to?` -> (본인 계정 선택 후 Enter)
   - `Link to existing project?` -> **no** (새로 만드는 것이므로)
   - `What’s your project’s name?` -> **GangnamOn** (또는 원하는 이름 입력)
   - `In which directory is your code located?` -> **./** (그대로 Enter)
   - `Want to modify these settings?` -> **n** (그대로 Enter)

## 3. 프로덕션(실서비스) 배포

위 과정은 'Preview' 배포일 수 있습니다. 최종 도메인 연결을 위해서는 아래 명령어를 실행하세요.

```powershell
vercel --prod
```

## 4. 환경 변수 설정

만약 배포된 사이트에서 데이터베이스 연결이 안 된다면, Vercel 대시보드(웹사이트)의 프로젝트 설정(Settings) -> Environment Variables 메뉴로 이동하여 다음 값들을 추가해야 합니다.
(로컬의 `.env.local` 파일 내용을 참고하세요)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---
**참고**: 현재 로컬에 'rebranding' 관련 변경 사항들이 커밋되지 않은 상태입니다. 배포 후에는 꼭 git commit을 통해 작업을 저장하는 것을 추천드립니다.
