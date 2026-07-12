export default async function handler(req, res) {
     const url = String(req.query?.url || '').trim();
     if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
          return res.status(400).json({ error: '올바른 YouTube 링크가 필요합니다.' });
     }

     try {
          const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
          if (!response.ok) throw new Error(`YouTube 응답 ${response.status}`);
          const data = await response.json();
          res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
          return res.status(200).json({ title: String(data.title || '').trim() });
     } catch (error) {
          return res.status(502).json({ error: error.message || 'YouTube 제목을 가져오지 못했습니다.' });
     }
}
