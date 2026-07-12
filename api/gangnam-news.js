// 강남구청 홈페이지에서 "강남이슈"뿐 아니라 "보도자료"와 "언론보도" 게시판까지
// 함께 긁어와서 합쳐 보여줍니다. 세 게시판 모두 강남구청 홈페이지의 동일한 게시판
// 스킨(테이블 목록 + 등록일)을 쓰고 있어서 같은 파서를 재사용할 수 있습니다.
const SOURCES = [
     {
          label: '강남이슈',
          url: 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501',
     },
     {
          label: '보도자료',
          url: 'https://www.gangnam.go.kr/board/B_000031/list.do?mid=ID01_0313',
     },
     {
          label: '언론보도',
          url: 'https://www.gangnam.go.kr/board/external_article/list.do?mid=ID01_0314',
     },
];
const RSS_URL = 'https://www.gangnam.go.kr/portal/bbs/rss.do?bbsId=B_000065';

const decodeHtml = (value = '') => value
     .replace(/<!\[CDATA\[|\]\]>/g, '')
     .replace(/&amp;/g, '&')
     .replace(/&lt;/g, '<')
     .replace(/&gt;/g, '>')
     .replace(/&quot;/g, '"')
     .replace(/&#39;/g, "'")
     .replace(/<[^>]*>/g, '')
     .replace(/\(새창\)/g, '')
     .replace(/\s+/g, ' ')
     .trim();

const getTag = (item, tag) => {
     const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
     return decodeHtml(match?.[1] || '');
};

const normalizeLink = (href = '') => {
     if (!href) return 'https://www.gangnam.go.kr/';
     if (href.startsWith('http')) return href;
     if (href.startsWith('/')) return `https://www.gangnam.go.kr${href}`;
     return `https://www.gangnam.go.kr/${href}`;
};

// 강남구청 게시판 목록 페이지(HTML 테이블)를 파싱합니다. 게시판마다 URL 구조는
// 다르지만(article/list.do, B_000031/list.do, external_article/list.do), 렌더링되는
// 목록 테이블 구조는 동일한 CMS 스킨을 써서 같은 정규식으로 파싱됩니다.
const parseBoardHtml = (html, sourceLabel) => {
     const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
     const parsedRows = rows.map((row) => {
          const raw = row[0];
          const linkMatch = raw.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
          const dateMatch = raw.match(/(20\d{2}[.-]\d{2}[.-]\d{2})/);
          const title = decodeHtml(linkMatch?.[2] || '');

          if (!title || !dateMatch) return null;
          if (title.includes('Image:') || title.length < 6) return null;

          return {
               title,
               link: normalizeLink(linkMatch[1]),
               date: dateMatch[1].replace(/\./g, '-'),
               source: sourceLabel,
               description: `강남구청 ${sourceLabel}에서 가져온 공식 소식입니다.`,
          };
     }).filter(Boolean);

     const unique = [];
     const seen = new Set();
     parsedRows.forEach((item) => {
          const key = `${item.title}-${item.date}`;
          if (!seen.has(key)) {
               seen.add(key);
               unique.push(item);
          }
     });

     return unique.slice(0, 10);
};

const parseRss = (xml) => [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
     .slice(0, 8)
     .map((match) => {
          const raw = match[1];
          return {
               title: getTag(raw, 'title'),
               link: getTag(raw, 'link'),
               date: getTag(raw, 'pubDate'),
               source: '강남구청 RSS',
               description: getTag(raw, 'description'),
          };
     })
     .filter((item) => item.title);

const fetchSource = async ({ label, url }) => {
     const response = await fetch(url, {
          headers: {
               'User-Agent': 'GangnamOn/1.0 (+https://gangnam-on.vercel.app)',
               Accept: 'text/html,application/xhtml+xml',
          },
     });
     if (!response.ok) throw new Error(`${label} 게시판 응답 ${response.status}`);
     const html = await response.text();
     const items = parseBoardHtml(html, label);
     if (!items.length) throw new Error(`${label} 게시판에서 항목을 파싱하지 못함`);
     return items;
};

export default async function handler(req, res) {
     res.setHeader('Access-Control-Allow-Origin', '*');
     // 강남구청의 공식 목록을 매일 한 번만 새로 읽습니다. Vercel Cron이 매일 아침
     // 이 엔드포인트를 호출해 캐시를 갱신하고, 사용자는 같은 검증된 목록을 봅니다.
     res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
     res.setHeader('CDN-Cache-Control', 'max-age=86400, stale-while-revalidate=3600');
     res.setHeader('Vercel-CDN-Cache-Control', 'max-age=86400, stale-while-revalidate=3600');

     const results = await Promise.allSettled(SOURCES.map(fetchSource));
     const succeeded = results.filter((r) => r.status === 'fulfilled');
     const merged = succeeded.flatMap((r) => r.value);

     if (merged.length) {
          // 제목 기준 중복 제거 후 출처별 최신 5건씩 섞어 보여줍니다.
          // 각 하위 메뉴가 실제로 보이도록 출처별로 최신 항목을 섞어 보여줍니다.
          const seen = new Set();
          const uniqueItems = merged
               .sort((a, b) => new Date(b.date) - new Date(a.date))
               .filter((item) => {
                    if (seen.has(item.title)) return false;
                    seen.add(item.title);
                    return true;
               });
          const items = SOURCES.flatMap((source) => uniqueItems
               .filter((item) => item.source === source.label)
               .slice(0, 5));

          return res.status(200).json({
               source: '강남구청 (강남이슈·보도자료·언론보도)',
               sourceUrl: 'https://www.gangnam.go.kr/',
               sources: SOURCES.map((s) => s.label),
               failedSources: results
                    .map((r, i) => (r.status === 'rejected' ? SOURCES[i].label : null))
                    .filter(Boolean),
               items,
          });
     }

     // 세 게시판 모두 실패했을 때만 RSS로 폴백
     try {
          const fallbackResponse = await fetch(RSS_URL, {
               headers: {
                    'User-Agent': 'GangnamOn/1.0 (+https://gangnam-on.vercel.app)',
                    Accept: 'application/rss+xml, application/xml, text/xml',
               },
          });
          const xml = await fallbackResponse.text();
          const items = parseRss(xml);

          res.status(200).json({
               source: '강남구청 RSS',
               sourceUrl: RSS_URL,
               warning: results.map((r) => (r.status === 'rejected' ? r.reason?.message : null)).filter(Boolean).join('; '),
               items,
          });
     } catch (fallbackError) {
          res.status(502).json({
               source: '강남구청',
               sourceUrl: 'https://www.gangnam.go.kr/',
               error: fallbackError.message,
               items: [],
          });
     }
}
