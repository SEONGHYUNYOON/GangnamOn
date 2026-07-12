// 유튜브 곡 검색 프록시 — 미니홈피 BGM 추가용
// YOUTUBE_API_KEY(YouTube Data API v3)가 있으면 공식 API를 사용하고,
// 없으면 유튜브 검색 페이지의 ytInitialData를 파싱하는 폴백으로 동작합니다.

const MAX_RESULTS = 8;

async function searchWithOfficialApi(apiKey, query) {
     const url = new URL('https://www.googleapis.com/youtube/v3/search');
     url.searchParams.set('key', apiKey);
     url.searchParams.set('part', 'snippet');
     url.searchParams.set('type', 'video');
     url.searchParams.set('maxResults', String(MAX_RESULTS));
     url.searchParams.set('q', query);
     url.searchParams.set('videoCategoryId', '10'); // Music

     const response = await fetch(url.toString());
     if (!response.ok) throw new Error(`YouTube API ${response.status}`);
     const payload = await response.json();

     return (payload.items || []).map(item => ({
          videoId: item.id?.videoId,
          title: item.snippet?.title || '',
          channel: item.snippet?.channelTitle || '',
          thumbnail: item.snippet?.thumbnails?.default?.url || '',
     })).filter(item => item.videoId);
}

// ytInitialData에서 videoRenderer 객체들을 재귀적으로 수집합니다.
function collectVideoRenderers(node, found = []) {
     if (!node || typeof node !== 'object' || found.length >= MAX_RESULTS * 2) return found;
     if (node.videoRenderer?.videoId) found.push(node.videoRenderer);
     for (const value of Object.values(node)) {
          if (typeof value === 'object') collectVideoRenderers(value, found);
     }
     return found;
}

async function searchWithScrape(query) {
     const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
          headers: {
               'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
               'Accept-Language': 'ko-KR,ko;q=0.9',
          },
     });
     if (!response.ok) throw new Error(`YouTube ${response.status}`);
     const html = await response.text();

     const match = html.match(/var ytInitialData = (\{[\s\S]+?\});<\/script>/);
     if (!match) throw new Error('검색 결과를 해석하지 못했습니다.');
     const data = JSON.parse(match[1]);

     return collectVideoRenderers(data).slice(0, MAX_RESULTS).map(renderer => ({
          videoId: renderer.videoId,
          title: renderer.title?.runs?.map(run => run.text).join('') || '',
          channel: renderer.ownerText?.runs?.[0]?.text || '',
          thumbnail: renderer.thumbnail?.thumbnails?.[0]?.url || '',
     }));
}

export default async function handler(req, res) {
     const query = String(req.query?.q || '').trim();
     if (!query) {
          res.status(400).json({ error: '검색어가 필요합니다.' });
          return;
     }

     const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();

     try {
          const results = apiKey
               ? await searchWithOfficialApi(apiKey, query)
               : await searchWithScrape(query);

          res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
          res.status(200).json({ results });
     } catch (error) {
          res.status(502).json({ error: error.message || '유튜브 검색에 실패했습니다.' });
     }
}
