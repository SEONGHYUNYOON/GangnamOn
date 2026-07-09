// ────────────────────────────────────────────────────────────────
// backfill-missing-profiles.mjs
//
// 일부 계정(예: kimtk2232)이 관리자 대시보드의 "신규 가입 회원" 목록에
// 안 보이는 문제를 조사한 결과, profiles 컬렉션에서 avatarUrl 속성이
// 누락돼 있던 시기에 최초 로그인 시 프로필 문서 생성이 조용히 실패해서,
// Auth 계정은 있지만 profiles 문서가 아예 없는 "유령 계정"이 된 것으로
// 보입니다. 이 스크립트는 그런 계정을 전부 찾아서 기본 프로필 문서를
// 만들어줍니다 (스키마는 이미 고쳐졌으니 이제는 실패하지 않습니다).
//
// - 이미 profiles 문서가 있는 계정은 절대 건드리지 않습니다.
// - 성별 정보는 Auth 계정에는 없기 때문에, 새로 만드는 프로필은 gender를
//   비워두고 중립 기본 아바타를 사용합니다. 해당 사용자가 로그인해서
//   본인 성별을 설정하면 이후 backfill-gender-avatars.mjs 로직과 동일한
//   방식으로 프론트엔드가 알아서 성별 아바타를 보여줍니다.
//
// 실행 방법 (Cursor가 실행):
//   cd GangNam_On
//   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=6a4be56a00369cf49a31 \
//   APPWRITE_API_KEY=<서버 API 키, users.read + databases.write 스코프 필요> \
//   node scripts/backfill-missing-profiles.mjs
// ────────────────────────────────────────────────────────────────

import { Client, Databases, Users, Query, Permission, Role } from 'node-appwrite';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DATABASE_ID = 'main';
const PROFILES = 'profiles';

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

    // 1) 모든 Auth 계정 목록 수집 (페이지네이션)
    const allAccounts = [];
    {
        let offset = 0;
        const pageSize = 100;
        while (true) {
            const res = await users.list([Query.limit(pageSize), Query.offset(offset)]);
            allAccounts.push(...res.users);
            if (res.users.length < pageSize) break;
            offset += pageSize;
        }
    }

    // 2) 모든 profiles 문서 ID 수집 (페이지네이션)
    const existingProfileIds = new Set();
    {
        let offset = 0;
        const pageSize = 100;
        while (true) {
            const res = await databases.listDocuments(DATABASE_ID, PROFILES, [Query.limit(pageSize), Query.offset(offset)]);
            res.documents.forEach((doc) => existingProfileIds.add(doc.$id));
            if (res.documents.length < pageSize) break;
            offset += pageSize;
        }
    }

    // 3) profiles 문서가 없는 계정 찾기
    const missing = allAccounts.filter((account) => !existingProfileIds.has(account.$id));

    console.log(`전체 Auth 계정: ${allAccounts.length}개, 기존 profiles 문서: ${existingProfileIds.size}개`);
    console.log(`profiles 문서가 없는 계정: ${missing.length}개\n`);

    for (const account of missing) {
        const username = account.name || account.email?.split('@')[0] || '강남주민';
        try {
            // 라이브 DB에 실제 존재하는 속성만 사용 (username, avatarUrl, isAdmin).
            // fullName/beans 등은 appwrite.json에는 있으나 아직 라이브에 없을 수 있습니다.
            await databases.createDocument(
                DATABASE_ID,
                PROFILES,
                account.$id,
                {
                    username,
                    avatarUrl: '',
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(account.$id)),
                    Permission.delete(Role.user(account.$id)),
                ]
            );
            console.log(`✔ ${username} (${account.email || account.$id}) → 프로필 새로 생성`);
        } catch (err) {
            console.error(`✖ ${username} (${account.$id}) 처리 중 오류:`, err.message || err);
        }
    }

    console.log('\n완료. 이 계정들은 이제 관리자 대시보드에도 보이고, 다음 로그인 시 정상적으로 프로필이 로드됩니다.');
    console.log('아바타/성별은 기본값이니, 해당 사용자가 로그인해서 미니홈피에서 직접 설정하도록 안내해주세요.');
}

main().catch((err) => {
    console.error('backfill-missing-profiles 스크립트 오류:', err);
    process.exit(1);
});
