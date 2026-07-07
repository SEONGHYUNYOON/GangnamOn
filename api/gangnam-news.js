const ISSUE_URL = 'https://www.gangnam.go.kr/board/article/list.do?mid=ID01_0501';
const RSS_URL = 'https://www.gangnam.go.kr/portal/bbs/rss.do?bbsId=B_000065';

const decodeHtml = (value = '') => value
     .replace(/<!\[CDATA\[|\]\]>/g, '')
     .replace(/&amp;/g, '&')
     .replace(/&lt;/g, '<')
     .replace(/&gt;/g, '>')
     .replace(/&quot;/g, '"')
     .replace(/&#39;/g, "'")
     .replace(/<[^>]*>/g, '')
     .trim();

const getTag = (item, tag) => {
     const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
     return decodeHtml(match?.[1] || '');
};

const normalizeLink = (href = '') => {
     if (!href) return ISSUE_URL;
     if (href.startsWith('http')) return href;
     if (href.startsWith('/')) return `https://www.gangnam.go.kr${href}`;
     return `https://www.gangnam.go.kr/${href}`;
};

const parseIssueList = (html) => {
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
               description: '강남구청 강남이슈에서 가져온 공식 소식입니다.',
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
               description: getTag(raw, 'description'),
          };
     })
     .filter((item) => item.title);

export default async function handler(req, res) {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

     try {
          const response = await fetch(ISSUE_URL, {
               headers: {
                    'User-Agent': 'GangnamOn/1.0 (+https://gangnam-on.vercel.app)',
                    Accept: 'text/html,application/xhtml+xml',
               },
          });

          if (!response.ok) {
               throw new Error(`Gangnam issue page responded ${response.status}`);
          }

          const html = await response.text();
          const items = parseIssueList(html);

          if (!items.length) {
               throw new Error('No Gangnam issue items parsed');
          }

          res.status(200).json({
               source: '강남구청 강남이슈',
               sourceUrl: ISSUE_URL,
               items,
          });
     } catch (error) {
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
                    warning: error.message,
                    items,
               });
          } catch (fallbackError) {
               res.status(502).json({
                    source: '강남구청 강남이슈',
                    sourceUrl: ISSUE_URL,
                    error: fallbackError.message,
                    items: [],
               });
          }
     }
}
