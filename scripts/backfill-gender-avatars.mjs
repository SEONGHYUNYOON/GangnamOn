// ────────────────────────────────────────────────────────────────
// backfill-gender-avatars.mjs
//
// profiles 컬렉션의 avatarUrl 속성이 (스키마 누락 버그로 인해) 오랫동안
// 저장되지 못했던 문제를 고친 뒤, 기존 가입자들에게 성별에 맞는 기본
// 아바타를 한 번에 채워주는 1회성 백필 스크립트입니다.
//
// - avatarUrl이 이미 채워진(직접 사진을 올렸거나 스타일을 고른) 사용자는
//   절대 건드리지 않습니다. avatarUrl이 비어있는 사용자만 대상입니다.
// - gender가 'male' 또는 'female'로 설정된 사용자만 성별 기반 아바타를
//   배정합니다. gender가 없는 사용자는 건너뛰고 목록으로 알려드립니다
//   (나중에 본인이 직접 설정하거나, 필요하면 수동으로 처리해주세요).
// - 아바타 선택 로직은 src/lib/avatar.js의 getDefaultAvatarUrl과
//   완전히 동일하게 맞췄습니다 (같은 사람은 항상 같은 캐릭터).
//
// 실행 방법 (Cursor가 실행):
//   cd GangNam_On
//   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=6a4be56a00369cf49a31 \
//   APPWRITE_API_KEY=<서버 API 키, databases.read + databases.write 스코프 필요> \
//   node scripts/backfill-gender-avatars.mjs
// ────────────────────────────────────────────────────────────────

import { Client, Databases, Query } from 'node-appwrite';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DATABASE_ID = 'main';
const PROFILES = 'profiles';

// src/lib/avatar.js와 동일한 시드 풀 + 해시 로직 (프론트엔드와 반드시 일치시켜주세요)
const MALE_SEEDS = ['Felix', 'Oliver', 'Leo', 'Milo', 'Jasper', 'Alexander'];
const FEMALE_SEEDS = ['Aneka', 'Sophia', 'Luna', 'Zoe', 'Nora', 'Mia'];

function hashToIndex(str, mod) {
    let hash = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }
    return hash % mod;
}

function getDefaultAvatarUrl(gender, key) {
    let seed = 'Gangnam';
    if (gender === 'male') {
        seed = MALE_SEEDS[hashToIndex(key, MALE_SEEDS.length)];
    } else if (gender === 'female') {
        seed = FEMALE_SEEDS[hashToIndex(key, FEMALE_SEEDS.length)];
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

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

    let offset = 0;
    const pageSize = 100;
    let updated = 0;
    let updatedNeutral = 0;
    let skippedHasAvatar = 0;
    let total = 0;

    while (true) {
        const res = await databases.listDocuments(DATABASE_ID, PROFILES, [
            Query.limit(pageSize),
            Query.offset(offset),
        ]);
        total += res.documents.length;

        for (const profile of res.documents) {
            if (profile.avatarUrl) {
                skippedHasAvatar += 1;
                continue;
            }
            const gender = profile.gender || null;
            const avatarUrl = getDefaultAvatarUrl(gender, profile.$id);
            const label = gender === 'male' || gender === 'female' ? gender : 'neutral';
            try {
                await databases.updateDocument(DATABASE_ID, PROFILES, profile.$id, { avatarUrl });
                if (label === 'neutral') updatedNeutral += 1;
                else updated += 1;
                console.log(`✔ ${profile.username || profile.$id} (${label}) → ${avatarUrl}`);
            } catch (err) {
                console.error(`✖ ${profile.username || profile.$id} 업데이트 실패:`, err.message || err);
            }
        }

        if (res.documents.length < pageSize) break;
        offset += pageSize;
    }

    console.log(`\n총 ${total}명 중:`);
    console.log(`  - 성별 기반 아바타로 새로 채움: ${updated}명`);
    console.log(`  - 성별 미설정(중립) 아바타로 채움: ${updatedNeutral}명`);
    console.log(`  - 이미 avatarUrl이 있어서 건드리지 않음: ${skippedHasAvatar}명`);
}

main().catch((err) => {
    console.error('backfill-gender-avatars 스크립트 오류:', err);
    process.exit(1);
});
