// Appwrite Cloud 무료 플랜은 일정 기간 요청이 없으면 프로젝트를 자동 일시정지합니다.
// 이 엔드포인트를 Vercel cron으로 매일 호출해 "활동"을 남겨 일시정지를 방지합니다.
//
// 환경변수:
//   APPWRITE_ENDPOINT   (선택, 기본 https://fra.cloud.appwrite.io/v1)
//   APPWRITE_PROJECT_ID (선택, 기본 6a4be56a00369cf49a31)
//   APPWRITE_API_KEY    (선택) — 있으면 인증된 DB 읽기로 가장 확실하게 활동을 남깁니다.
//                        없으면 프로젝트 헬스 핑으로 대체합니다.
const ENDPOINT = (process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1').replace(/\/$/, '');
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6a4be56a00369cf49a31';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'main';

export default async function handler(req, res) {
     const apiKey = (process.env.APPWRITE_API_KEY || '').trim();

     try {
          let mode;
          let response;

          if (apiKey) {
               // 인증된 요청 — 문서 1건만 읽어 실제 DB 활동을 기록합니다.
               mode = 'authenticated-read';
               response = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/profiles/documents?queries[]=${encodeURIComponent('limit(1)')}`, {
                    headers: {
                         'X-Appwrite-Project': PROJECT_ID,
                         'X-Appwrite-Key': apiKey,
                    },
               });
          } else {
               // API 키가 없으면 프로젝트 스코프 헬스 핑으로 대체합니다.
               mode = 'health-ping';
               response = await fetch(`${ENDPOINT}/health`, {
                    headers: { 'X-Appwrite-Project': PROJECT_ID },
               });
          }

          const ok = response.ok;
          res.status(200).json({
               ok,
               mode,
               status: response.status,
               pinged: `${ENDPOINT} (project ${PROJECT_ID})`,
               at: new Date().toISOString(),
          });
     } catch (error) {
          res.status(502).json({ ok: false, error: error.message, at: new Date().toISOString() });
     }
}
