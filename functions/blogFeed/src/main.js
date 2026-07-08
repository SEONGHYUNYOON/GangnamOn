import { Client, Databases, Storage, ID, Query, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

// ────────────────────────────────────────────────────────────────
// 강남 픽 자동 큐레이션 Function ("blogFeed")
//
// 2시간마다(cron: 0 */2 * * *) 자동 실행되어:
//   1) 네이버 블로그 검색 오픈API로 "강남 맛집/카페" 관련 블로그 글을 찾고
//   2) 이미 올린 적 없는 글 하나를 골라
//   3) 블로그 대표 이미지를 가져와 Appwrite Storage에 재업로드하고
//   4) Gemini(Google AI) API로 소개 문구를 짧게 정리해서
//   5) "posts" 컬렉션에 type: 'gangnam_pick' 게시글로 자동 등록합니다.
//
// 필요한 환경변수 (Appwrite 콘솔 > Functions > blogFeed > Settings > Variables):
//   - NAVER_CLIENT_ID / NAVER_CLIENT_SECRET  (developers.naver.com 에서 발급)
//   - GEMINI_API_KEY                          (aistudio.google.com/apikey 에서 발급, 완전 무료)
// ────────────────────────────────────────────────────────────────

const DATABASE_ID = 'main';
const POSTS = 'posts';
const IMAGE_BUCKET = 'post-images';

const BOT_AUTHOR_ID = 'gangnamon-bot';
const BOT_AUTHOR_NAME = '강남On 큐레이터';

const KEYWORDS = [
    '강남 맛집', '강남역 맛집', '신사동 맛집', '청담동 맛집', '역삼동 맛집',
    '삼성동 맛집', '논현동 맛집', '강남 카페', '강남 브런치 카페',
    '강남 디저트 카페', '강남 데이트 맛집', '압구정 맛집',
];

function pickKeyword() {
    return KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
}

function stripHtml(str = '') {
    return str
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .trim();
}

async function fetchNaverBlogPosts(keyword, clientId, clientSecret) {
    const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=20&sort=sim`;
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': clientId,
            'X-Naver-Client-Secret': clientSecret,
        },
    });
    if (!res.ok) {
        throw new Error(`네이버 검색 API 오류: ${res.status}`);
    }
    const data = await res.json();
    return (data.items || []).map((item) => ({
        title: stripHtml(item.title),
        description: stripHtml(item.description),
        link: item.link,
        bloggername: item.bloggername,
        postdate: item.postdate,
    }));
}

function extractMetaContent(html, property) {
    const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    ];
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return match[1];
    }
    return null;
}

async function fetchOgImage(pageUrl) {
    try {
        const res = await fetch(pageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GangnamOnBot/1.0)' },
        });
        if (!res.ok) return null;
        const html = await res.text();
        return extractMetaContent(html, 'og:image');
    } catch {
        return null;
    }
}

async function downloadImageBuffer(imageUrl) {
    try {
        const res = await fetch(imageUrl, {
            headers: {
                Referer: 'https://blog.naver.com/',
                'User-Agent': 'Mozilla/5.0 (compatible; GangnamOnBot/1.0)',
            },
        });
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return buffer.length > 0 ? buffer : null;
    } catch {
        return null;
    }
}

async function summarizeWithGemini(post, apiKey) {
    const prompt = `아래는 네이버 블로그 맛집/카페 후기 글의 제목과 요약이야.
이 정보를 바탕으로 강남On 서비스의 "강남 픽" 게시판에 올릴 짧은 소개 게시글을 만들어줘.
실제로 방문한 것처럼 과장하지 말고, 블로그 후기를 소개하는 톤으로 써줘.

블로그 제목: ${post.title}
블로그 요약: ${post.description}

아래 JSON 형식으로만 답변해 (다른 설명 없이, 코드블록 없이):
{
  "placeName": "가게 이름 (알 수 없으면 블로그 제목에서 추정)",
  "location": "강남구 내 동네 이름 (예: 역삼동, 신사동 등. 모르면 강남)",
  "title": "게시글 제목 (20자 이내, 이모지 1개 정도 사용 가능)",
  "content": "2~3문장짜리 소개 (존댓말, 강남On 커뮤니티 말투)"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!res.ok) {
        throw new Error(`Gemini API 오류: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
    return JSON.parse(jsonMatch[0]);
}

export default async ({ req, res, log, error }) => {
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.');
        return res.json({ success: false, message: '네이버 API 키가 설정되지 않았습니다.' }, 500);
    }
    if (!GEMINI_API_KEY) {
        error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
        return res.json({ success: false, message: 'Gemini API 키가 설정되지 않았습니다.' }, 500);
    }

    const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY || '';
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(apiKey);

    const databases = new Databases(client);
    const storage = new Storage(client);

    try {
        const keyword = pickKeyword();
        log(`검색 키워드: ${keyword}`);

        const candidates = await fetchNaverBlogPosts(keyword, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET);
        if (candidates.length === 0) {
            return res.json({ success: false, message: '검색 결과가 없습니다.' });
        }

        // 이미 게시한 블로그 글인지 sourceUrl로 중복 체크
        const links = candidates.map((c) => c.link);
        const existing = await databases.listDocuments(DATABASE_ID, POSTS, [
            Query.equal('sourceUrl', links),
            Query.limit(candidates.length),
        ]);
        const usedLinks = new Set(existing.documents.map((d) => d.sourceUrl));

        const fresh = candidates.find((c) => !usedLinks.has(c.link));
        if (!fresh) {
            log('후보 20개 모두 이미 게시된 글이라 이번 회차는 건너뜁니다.');
            return res.json({ success: false, message: '새로운 후보가 없습니다 (모두 이미 게시됨).' });
        }

        // 대표 이미지 추출 → 다운로드 → Appwrite Storage 재업로드
        let imageUrl = null;
        const ogImage = await fetchOgImage(fresh.link);
        if (ogImage) {
            const buffer = await downloadImageBuffer(ogImage);
            if (buffer) {
                const rawExt = (ogImage.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
                const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
                const file = await storage.createFile(
                    IMAGE_BUCKET,
                    ID.unique(),
                    InputFile.fromBuffer(buffer, `blogfeed_${Date.now()}.${ext}`)
                );
                imageUrl = `${process.env.APPWRITE_FUNCTION_API_ENDPOINT}/storage/buckets/${IMAGE_BUCKET}/files/${file.$id}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;
            }
        }

        // Gemini로 소개 문구 생성
        const summary = await summarizeWithGemini(fresh, GEMINI_API_KEY);
        const content = `${summary.content || fresh.description}\n\n📎 출처: 네이버 블로그 (${fresh.bloggername || '블로거'})`;

        const doc = await databases.createDocument(
            DATABASE_ID,
            POSTS,
            ID.unique(),
            {
                authorId: BOT_AUTHOR_ID,
                authorUsername: BOT_AUTHOR_NAME,
                type: 'gangnam_pick',
                title: summary.title || summary.placeName || fresh.title,
                content,
                locationName: summary.location || '강남',
                imageUrls: imageUrl ? [imageUrl] : [],
                sourceUrl: fresh.link,
            },
            [Permission.read(Role.any())]
        );

        log(`게시 완료: ${doc.$id} (${fresh.link})`);
        return res.json({ success: true, postId: doc.$id, title: doc.title, hasImage: !!imageUrl });
    } catch (err) {
        error(err.message || String(err));
        return res.json({ success: false, message: '자동 게시 중 오류가 발생했습니다.' }, 500);
    }
};
