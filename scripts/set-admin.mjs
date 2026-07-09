// ────────────────────────────────────────────────────────────────
// set-admin.mjs
//
// profiles 컬렉션에 새로 추가된 isAdmin 속성을, 지정한 이메일 계정에 대해
// true로 설정하는 1회성 스크립트입니다. 이메일로 계정을 찾기 위해
// node-appwrite의 Users 서비스(서버 전용, API 키 필요)를 사용합니다.
//
// 실행 방법 (Cursor가 실행):
//   cd GangNam_On
//   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=6a4be56a00369cf49a31 \
//   APPWRITE_API_KEY=<서버 API 키, users.read + databases.write 스코프 필요> \
//   node scripts/set-admin.mjs
//
// API 키에 반드시 "users.read" 스코프가 있어야 이메일로 계정을 찾을 수
// 있습니다. 기존에 쓰던 키에 이 스코프가 없다면 Appwrite 콘솔에서 스코프를
// 추가하거나 새 키를 발급해주세요.
// ────────────────────────────────────────────────────────────────

import { Client, Databases, Users, Query } from 'node-appwrite';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DATABASE_ID = 'main';
const PROFILES = 'profiles';

// 관리자로 지정할 이메일 목록 (App.jsx의 ADMIN_EMAILS와 동일하게 유지해주세요)
const ADMIN_EMAILS = ['a23642514@gmail.com', 'united6494@naver.com'];

async function main() {
    const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_PROJECT_ID || '6a4be56a00369cf49a31';
    let apiKey = process.env.APPWRITE_API_KEY;
    if (!apiKey) {
        try {
            const prefs = JSON.parse(readFileSync(join(homedir(), '.appwrite', 'prefs.json'), 'utf8'));
            const current = prefs.current;
            apiKey = (current && prefs[current]?.key) || Object.values(prefs).find((v) => v?.key)?.key;
        } catch {
            apiKey = null;
        }
    }

    if (!endpoint || !projectId || !apiKey) {
        console.error('APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY 환경변수가 필요합니다.');
        process.exit(1);
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const databases = new Databases(client);
    const users = new Users(client);

    for (const email of ADMIN_EMAILS) {
        try {
            const found = await users.list([Query.equal('email', [email])]);
            const account = found.users?.[0];
            if (!account) {
                console.warn(`⚠ ${email} 계정을 찾을 수 없습니다 (아직 가입하지 않았을 수 있어요). 건너뜁니다.`);
                continue;
            }

            await databases.updateDocument(DATABASE_ID, PROFILES, account.$id, { isAdmin: true });
            console.log(`✔ ${email} (${account.$id}) → isAdmin: true`);
        } catch (err) {
            console.error(`✖ ${email} 처리 중 오류:`, err.message || err);
        }
    }

    console.log('\n완료. 관리자 계정 목록:', ADMIN_EMAILS.join(', '));
}

main().catch((err) => {
    console.error('set-admin 스크립트 오류:', err);
    process.exit(1);
});
