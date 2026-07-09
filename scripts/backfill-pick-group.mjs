// ────────────────────────────────────────────────────────────────
// backfill-pick-group.mjs
//
// "강남 픽" 하위 메뉴(맛집/카페/문화·예술)를 새로 추가하면서, 이 기능이
// 생기기 전에 이미 만들어진 gangnam_pick 게시글들은 실제로는 분류된 적이
// 없습니다 (스키마 기본값 때문에 조회 시 pickGroup이 'restaurant'로 보일
// 뿐입니다). 이 스크립트는 그런 기존 글들을 제목/본문/업종 키워드로 분석해서
// restaurant(맛집) 또는 cafe(카페)로 다시 분류해줍니다. (이 기능이 생기기
// 전에는 문화/예술 글이 없었으므로 카페 키워드가 없으면 전부 restaurant로
// 분류하고, 이미 culture로 분류된 글은 건드리지 않습니다.)
//
// 실행 방법 (Cursor가 실행):
//   cd GangNam_On
//   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=6a4be56a00369cf49a31 \
//   APPWRITE_API_KEY=<서버 API 키> \
//   node scripts/backfill-pick-group.mjs
//
// API 키는 Appwrite 콘솔 > Settings > API Keys 에서, 최소 databases.read +
// databases.write 스코프로 발급하면 됩니다 (이미 있는 키가 있으면 재사용 가능).
// ────────────────────────────────────────────────────────────────

import { Client, Databases, Query } from 'node-appwrite';

import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DATABASE_ID = 'main';
const POSTS = 'posts';

const CAFE_KEYWORDS = ['카페', '디저트', '브런치', '베이커리', '커피', '빵집', '케이크', '마카롱', '크로플'];

function classify(post) {
    const haystack = `${post.title || ''} ${post.content || ''} ${post.placeCategory || ''}`;
    const isCafe = CAFE_KEYWORDS.some((kw) => haystack.includes(kw));
    return isCafe ? 'cafe' : 'restaurant';
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

    let updated = 0;
    let skipped = 0;
    let offset = 0;
    const pageSize = 100;

    // gangnam_pick 글 전체를 페이지 단위로 순회하면서, pickGroup이 비어있는
    // (또는 스키마 기본값 'restaurant'가 아직 실제로 분류된 적 없는) 글만 갱신합니다.
    for (;;) {
        const res = await databases.listDocuments(DATABASE_ID, POSTS, [
            Query.equal('type', ['gangnam_pick']),
            Query.limit(pageSize),
            Query.offset(offset),
        ]);

        if (res.documents.length === 0) break;

        for (const post of res.documents) {
            // 주의: Appwrite는 새 속성(pickGroup)에 기본값(default: 'restaurant')이 있으면
            // 기존 문서를 조회할 때도 그 기본값을 채워서 돌려줍니다. 즉 이 스크립트를 실행하기
            // 전이라도 post.pickGroup은 이미 'restaurant'로 보일 수 있어서, "비어있는지"가
            // 아니라 "카페 키워드로 다시 분류했을 때 값이 달라지는지"로 판단합니다.
            // 문화/예술 글은 이 백필 스크립트가 손대지 않습니다 (아직 존재하지 않거나,
            // 나중에 재실행되더라도 실수로 재분류되지 않도록 보호).
            if (post.pickGroup === 'culture') {
                skipped += 1;
                continue;
            }

            const group = classify(post);
            if (group === post.pickGroup) {
                skipped += 1;
                continue;
            }

            await databases.updateDocument(DATABASE_ID, POSTS, post.$id, { pickGroup: group });
            updated += 1;
            console.log(`✔ ${post.$id} → ${group} (${post.title || '(제목 없음)'})`);
        }

        offset += pageSize;
    }

    console.log(`\n완료: ${updated}개 분류, ${skipped}개는 이미 분류되어 있어 건너뜀.`);
}

main().catch((err) => {
    console.error('백필 스크립트 오류:', err);
    process.exit(1);
});
