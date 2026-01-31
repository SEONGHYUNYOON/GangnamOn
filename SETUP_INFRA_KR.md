# 강남온(GangnamOn) GitHub & Supabase 설정 가이드

강남온 서비스를 독립적으로 운영하기 위해 **GitHub 저장소**와 **Supabase 데이터베이스**를 새로 설정하는 방법입니다.

## 1단계: GitHub 새 저장소 만들기

기존 'PajuOn' 저장소와 섞이지 않도록, 강남온을 위한 새 저장소를 만듭니다.

1. [GitHub](https://github.com/new)에 로그인하여 **New repository**를 클릭합니다.
2. **Repository name**에 `GangnamOn` (또는 원하는 이름)을 입력합니다.
3. **Public/Private** 중 원하는 것을 선택합니다.
4. **Create repository** 버튼을 누릅니다. (README나 .gitignore 추가하지 마세요. 이미 로컬에 있습니다.)
5. 생성 후 나오는 화면에서 **HTTPS 주소**를 복사합니다. (예: `https://github.com/YourID/GangnamOn.git`)

### 로컬 연결 및 푸시 (터미널 명령어)

터미널에서 다음 명령어를 한 줄씩 입력하세요. (이미 로컬 변경사항은 커밋해 두었습니다)

```powershell
# 1. 새 저장소 연결 (주소 부분에 복사한 주소를 붙여넣으세요)
git remote add origin https://github.com/본인아이디/GangnamOn.git

# 2. 코드 올리기
git push -u origin main
```

---

## 2단계: Supabase 새 프로젝트 만들기

강남온 전용 데이터베이스를 만듭니다. 기존 파주온 DB를 쓰면 데이터가 뒤섞입니다.

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속하여 **New Project**를 클릭합니다.
2. **Name**: `GangnamOn`
3. **Database Password**: 강력한 비밀번호 설정 (꼭 기억해 두세요)
4. **Region**: `Seoul` (Seoul이 없다면 Tokyo 선택)
5. **Create new project** 클릭 후 잠시 기다립니다 (몇 분 소요).

---

## 3단계: 데이터베이스 테이블 & 초기 데이터 세팅

프로젝트가 생성되면 테이블과 초기 데이터를 넣어야 합니다. 제가 작성해 둔 완벽한 스크립트(`supabase_reset_schema.sql`)를 사용합니다.

1. Supabase 왼쪽 메뉴에서 **SQL Editor** 아이콘을 클릭합니다.
2. **+ New Query**를 클릭합니다.
3. VS Code에서 `d:\DEV\GangNam_On\supabase_reset_schema.sql` 파일을 엽니다.
4. 파일의 **모든 내용(Ctrl+A -> Ctrl+C)**을 복사합니다.
5. Supabase 쿼리 창에 **붙여넣기(Ctrl+V)** 합니다.
6. 오른쪽 하단 **Run** 버튼을 클릭합니다.
    * *Success* 메시지가 뜨면 성공입니다.
    * 이제 `profiles`, `posts` 테이블이 생성되고, '강남역 이자카야' 사장님과 '강남사랑꾼' 주민 계정이 생성되었습니다.

---

## 4단계: 환경 변수 연결 (Vercel)

새로 만든 Supabase와 배포된 사이트(Vercel)를 연결합니다.

1. **Supabase 값 복사**:
    * Supabase 대시보드 -> 왼쪽 하단 **Project Settings** (톱니바퀴) -> **API**.
    * `Project URL`과 `anon public` 키 두 가지가 필요합니다.

2. **Vercel 환경 변수 설정**:
    * Vercel 대시보드 -> 해당 프로젝트 -> **Settings** -> **Environment Variables**.
    * 다음 두 변수 값을 새 Supabase 값으로 수정(또는 추가)합니다.
        * `VITE_SUPABASE_URL`: (Supabase Project URL 붙여넣기)
        * `VITE_SUPABASE_ANON_KEY`: (Supabase anon public key 붙여넣기)
    * *Save* 후, **Deployments** 탭으로 가서 최신 배포를 **Redeploy** 해야 적용됩니다. (또는 로컬에서 다시 `vercel --prod` 실행)

### (참고) 로컬 개발 환경 변수 수정

내 컴퓨터에서 `npm run dev`로 개발할 때도 새 DB를 쓰려면, VS Code의 `.env.local` 파일 내용을 새 키값으로 바꿔주세요.

```
VITE_SUPABASE_URL=새로운_URL
VITE_SUPABASE_ANON_KEY=새로운_KEY
```
