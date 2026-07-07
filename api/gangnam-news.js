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

export default async function handler(req, res) {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

     try {
          const response = await fetch(RSS_URL, {
               headers: {
                    'User-Agent': 'GangnamOn/1.0 (+https://gangnam-on.vercel.app)',
                    Accept: 'application/rss+xml, application/xml, text/xml',
               },
          });

          if (!response.ok) {
               throw new Error(`Gangnam RSS responded ${response.status}`);
          }

          const xml = await response.text();
          const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
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

          res.status(200).json({
               source: '강남구청뉴스',
               sourceUrl: RSS_URL,
               items,
          });
     } catch (error) {
          res.status(502).json({
               source: '강남구청뉴스',
               sourceUrl: RSS_URL,
               error: error.message,
               items: [],
          });
     }
}
