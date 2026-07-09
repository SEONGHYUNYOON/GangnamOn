import { Client, Databases, Storage, ID, Query, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import * as cheerio from 'cheerio';

// ────────────────────────────────────────────────────────────────
// 강남 픽 자동 큐레이션 Function ("blogFeed") — v2.2
//
// 12시간마다(cron: 0 */12 * * *) 자동 실행되어:
//   1) 네이버 블로그 검색 오픈API로 "강남 맛집/카페" 관련 블로그 글을 찾고
//   2) 이미 올린 적 없는 글 하나를 골라
//   3) 모바일 블로그 페이지(m.blog.naver.com)에서 본문 텍스트 + 사진 최대 5장을 가져오고
//   4) Gemini(Google AI)로 소개 문구를 정리하고
//   5) 네이버 지역(플레이스) 검색 API로 실제 주소/전화번호/업종을 찾아 붙이고
//   6) "posts" 컬렉션에 type: 'gangnam_pick' 게시글로 자동 등록합니다.
//
// 필요한 환경변수 (Appwrite 콘솔 > Functions > blogFeed > Settings > Variables):
//   - NAVER_CLIENT_ID / NAVER_CLIENT_SECRET  (developers.naver.com 에서 발급, "검색" API 하나로
//     블로그 검색 + 지역 검색 둘 다 사용 가능 — 추가 신청 필요 없음)
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

// 네이버 이미지 URL의 해상도 파라미터(type=wXXX)를 고화질로 바꿔줍니다.
// (blur-up 미리보기나 목록용 작은 썸네일 URL을 그대로 쓰면 카드에서 확대되며 흐려짐)
function upsizeNaverImageUrl(url) {
    if (!url) return url;
    try {
        const u = new URL(url);
        if (u.searchParams.has('type')) {
            u.searchParams.set('type', 'w966');
        }
        return u.toString();
    } catch {
        return url;
    }
}

// 블로그 링크에서 blogId/logNo를 뽑아냅니다 (경로형 링크 + 쿼리파라미터형 링크 둘 다 지원)
function parseBlogIdLogNo(link) {
    const pathMatch = link.match(/blog\.naver\.com\/([^/?]+)\/(\d+)/);
    if (pathMatch) return { blogId: pathMatch[1], logNo: pathMatch[2] };

    const blogIdMatch = link.match(/[?&]blogId=([^&]+)/);
    const logNoMatch = link.match(/[?&]logNo=(\d+)/);
    if (blogIdMatch && logNoMatch) return { blogId: blogIdMatch[1], logNo: logNoMatch[1] };

    return null;
}

// 모바일 블로그 페이지에서 본문 텍스트 + 대표 사진들(최대 5장)을 가져옵니다.
// (PC 버전은 본문이 iframe 안에 있어서 못 읽지만, 모바일 버전은 본문이 그대로 HTML에 있음)
async function fetchBlogDetail(link) {
    const parsed = parseBlogIdLogNo(link);
    if (!parsed) return { text: '', images: [], mobileUrl: null };
    const mobileUrl = `https://m.blog.naver.com/${parsed.blogId}/${parsed.logNo}`;

    try {
        const res = await fetch(mobileUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GangnamOnBot/1.0)' },
        });
        if (!res.ok) return { text: '', images: [], mobileUrl };
        const html = await res.text();
        const $ = cheerio.load(html);

        let container = $('.se-main-container');
        if (container.length === 0) container = $('body');

        const text = container.text().replace(/\s+/g, ' ').trim().slice(0, 3000);

        const images = [];
        container.find('img').each((_, el) => {
            // data-lazy-src/data-src가 실제 고화질 원본이고, src는 로딩 전 흐린
            // 미리보기(blur-up placeholder)인 경우가 많아서 우선순위를 바꿈
            const src = $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src');
            if (!src) return;
            if (!/(pstatic\.net|naver\.net)/.test(src)) return;
            if (src.includes('sticker')) return;
            const normalized = upsizeNaverImageUrl(src.startsWith('//') ? `https:${src}` : src);
            if (!images.includes(normalized)) images.push(normalized);
        });

        return { text, images: images.slice(0, 5), mobileUrl };
    } catch {
        return { text: '', images: [], mobileUrl };
    }
}

// 네이버 지역(플레이스) 검색으로 실제 주소/전화번호/업종을 찾습니다.
async function fetchLocalInfo(query, clientId, clientSecret) {
    if (!query || !query.trim()) return null;
    try {
        const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1`;
        const res = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const item = data.items?.[0];
        if (!item) return null;
        return {
            name: stripHtml(item.title),
            address: item.roadAddress || item.address || '',
            phone: item.telephone || '',
            category: (item.category || '').split('>').pop()?.trim() || '',
        };
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

async function downloadAndUploadImage(imageUrl, storage) {
    const buffer = await downloadImageBuffer(imageUrl);
    if (!buffer) return null;
    try {
        const rawExt = (imageUrl.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
        const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
        const filename = `blogfeed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const file = await storage.createFile(IMAGE_BUCKET, ID.unique(), InputFile.fromBuffer(buffer, filename));
        return `${process.env.APPWRITE_FUNCTION_API_ENDPOINT}/storage/buckets/${IMAGE_BUCKET}/files/${file.$id}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;
    } catch {
        return null;
    }
}

async function fetchOgImage(pageUrl) {
    try {
        const res = await fetch(pageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GangnamOnBot/1.0)' },
        });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);
        const content = $('meta[property="og:image"]').attr('content') || null;
        return content ? upsizeNaverImageUrl(content) : null;
    } catch {
        return null;
    }
}

async function summarizeWithGemini(post, bodyExcerpt, apiKey) {
    const prompt = `아래는 네이버 블로그 맛집/카페 후기 글이야.
이 정보를 바탕으로 강남On 서비스의 "강남 픽" 게시판에 올릴 소개 게시글을 만들어줘.
실제로 방문한 것처럼 과장하지 말고, 블로그 후기를 소개하는 톤으로 써줘.
블로그에 대표 메뉴, 가격, 분위기에 대한 언급이 있으면 content에 자연스럽게 녹여줘.

블로그 제목: ${post.title}
블로그 요약: ${post.description}
${bodyExcerpt ? `블로그 본문 일부: ${bodyExcerpt}` : ''}

아래 JSON 형식으로만 답변해 (다른 설명 없이, 코드블록 없이):
{
  "placeName": "가게 이름 (알 수 없으면 블로그 제목에서 추정)",
  "location": "강남구 내 동네 이름 (예: 역삼동, 신사동 등. 모르면 강남)",
  "title": "게시글 제목 (20자 이내, 이모지 1개 정도 사용 가능)",
  "content": "3~4문장짜리 소개 (존댓말, 대표 메뉴/분위기 언급, 강남On 커뮤니티 말투)"
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

        // 본문 텍스트 + 사진 최대 5장 확보
        const detail = await fetchBlogDetail(fresh.link);
        log(`본문 확보: ${detail.text.length}자, 이미지 ${detail.images.length}장`);

        // AI로 소개 문구 생성 (본문이 있으면 더 풍부한 내용으로)
        const summary = await summarizeWithGemini(fresh, detail.text, GEMINI_API_KEY);

        // 네이버 지역 검색으로 실제 주소/전화번호/업종 확인
        const localQuery = `${summary.location || ''} ${summary.placeName || ''}`.trim();
        const localInfo = await fetchLocalInfo(localQuery, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET);
        if (localInfo) log(`지역 정보 매칭: ${localInfo.name} / ${localInfo.address}`);

        // 이미지 업로드 (본문에서 찾은 사진 우선, 없으면 PC/모바일 og:image로 대체)
        let candidateImages = detail.images;
        if (candidateImages.length === 0) {
            const og = (await fetchOgImage(fresh.link)) || (detail.mobileUrl ? await fetchOgImage(detail.mobileUrl) : null);
            if (og) candidateImages = [og];
        }
        const imageUrls = [];
        for (const imgUrl of candidateImages.slice(0, 5)) {
            const uploaded = await downloadAndUploadImage(imgUrl, storage);
            if (uploaded) imageUrls.push(uploaded);
        }

        const doc = await databases.createDocument(
            DATABASE_ID,
            POSTS,
            ID.unique(),
            {
                authorId: BOT_AUTHOR_ID,
                authorUsername: BOT_AUTHOR_NAME,
                type: 'gangnam_pick',
                title: summary.title || summary.placeName || fresh.title,
                content: summary.content || fresh.description,
                locationName: summary.location || '강남',
                imageUrls,
                sourceUrl: fresh.link,
                placeAddress: localInfo?.address || '',
                placePhone: localInfo?.phone || '',
                placeCategory: localInfo?.category || '',
            },
            [Permission.read(Role.any())]
        );

        log(`게시 완료: ${doc.$id} (${fresh.link})`);
        return res.json({ success: true, postId: doc.$id, title: doc.title, imageCount: imageUrls.length, hasAddress: !!localInfo?.address });
    } catch (err) {
        error(err.message || String(err));
        return res.json({ success: false, message: '자동 게시 중 오류가 발생했습니다.' }, 500);
    }
};
