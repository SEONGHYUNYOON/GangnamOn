# 강남온(GangNam_On) 온라인 배포 가이드

Vercel(프론트엔드) + Supabase(백엔드)로 배포하는 방법을 단계별로 안내합니다.

---

## 1. 배포 전 준비

### 1-1. Git 저장소
- 이 프로젝트를 **GitHub**에 올려두세요.
- 예: `Yoon-Seong-hyun/GangNam_On` (새 저장소) 또는 기존 `pajuon` 저장소를 이 폴더로 교체 후 푸시

### 1-2. Supabase 프로젝트
1. [Supabase 대시보드](https://supabase.com/dashboard/organizations) → 조직 선택
2. **New project**로 새 프로젝트 생성 (또는 기존 프로젝트 사용)
3. 프로젝트가 준비되면:
   - **Settings** → **API** 이동
   - **Project URL** → `VITE_SUPABASE_URL`로 사용
   - **anon public** 키 → `VITE_SUPABASE_ANON_KEY`로 사용

### 1-3. DB 스키마 적용 (Supabase)
- Supabase **SQL Editor**에서 아래 순서로 실행:
  1. `supabase_schema.sql` 또는 `supabase_schema_final.sql`
  2. (기존 파주 데이터가 있다면) `supabase_migrate_paju_to_gangnam.sql`

---

## 2. Vercel에 배포하기

### 방법 A: 새 프로젝트로 배포 (강남온 전용)

1. [Vercel 대시보드](https://vercel.com) 로그인
2. **Add New...** → **Project** 클릭
3. **Import Git Repository**
   - GitHub 계정 연결 후 `GangNam_On`(또는 사용하는 저장소) 선택
   - **Import** 클릭
4. **Configure Project** 화면에서:
   - **Framework Preset**: Vite (자동 감지될 수 있음)
   - **Root Directory**: 비워두기 (프로젝트 루트가 맞다면)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables** 추가 (중요):
   - **Name**: `VITE_SUPABASE_URL`  
     **Value**: Supabase 프로젝트의 Project URL
   - **Name**: `VITE_SUPABASE_ANON_KEY`  
     **Value**: Supabase의 anon public 키
6. **Deploy** 클릭

배포가 끝나면 `https://프로젝트이름.vercel.app` 주소로 접속할 수 있습니다.

---

### 방법 B: 기존 `pajuon` 프로젝트를 강남온으로 바꾸기

1. Vercel 대시보드에서 **pajuon** 프로젝트 클릭
2. **Settings** → **Git**
   - 연결된 저장소를 이 강남온 저장소(`GangNam_On`)로 변경하거나,
   - 현재 저장소를 이 코드로 덮어쓴 뒤 `main`에 푸시
3. **Settings** → **Environment Variables**
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 확인/수정
   - 강남온용 Supabase 프로젝트 URL·키로 맞추기
4. **Deployments** → 최신 배포 옆 **⋯** → **Redeploy**  
   또는 저장소에 새로 푸시하면 자동 재배포됩니다.

---

## 3. 환경 변수 정리

| 변수 이름 | 설명 | 예시 (값은 비공개로) |
|-----------|------|----------------------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public 키 | `eyJhbGciOi...` |

- Vercel에서 수정 후에는 **재배포**해야 반영됩니다.
- 로컬에서는 프로젝트 루트에 `.env.local` 파일을 만들고 같은 변수를 넣으면 됩니다.

---

## 4. 배포 후 확인

1. **Vercel**  
   - Deployments 탭에서 상태가 **Ready**인지 확인  
   - 배포된 URL로 접속해 화면이 정상인지 확인
2. **Supabase**  
   - Table Editor에서 필요한 테이블·데이터가 있는지 확인  
   - Authentication / API 사용 시 대시보드에서 에러 로그 확인
3. **브라우저**  
   - 로그인, 게시글 조회 등 주요 기능이 동작하는지 테스트

---

## 5. 자주 하는 작업

- **코드 반영**: GitHub `main`에 push → Vercel이 자동으로 새 배포 생성
- **환경 변수 변경**: Vercel 프로젝트 → Settings → Environment Variables 수정 후 Redeploy
- **커스텀 도메인**: Vercel 프로젝트 → Settings → Domains에서 추가

---

## 요약 체크리스트

- [ ] GitHub에 GangNam_On(또는 사용 중인 저장소) 푸시
- [ ] Supabase 프로젝트 생성 및 URL·anon key 확인
- [ ] Supabase에 스키마 SQL 실행
- [ ] Vercel에서 새 프로젝트 Import 또는 기존 pajuon 설정 변경
- [ ] Vercel에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정
- [ ] Deploy 후 배포 URL에서 동작 확인

이 순서대로 진행하시면 강남온을 온라인으로 배포할 수 있습니다.
