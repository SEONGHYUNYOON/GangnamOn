// 서울시 실시간 도시데이터(실시간 인구현황) 프록시
// 환경변수: SEOUL_OPENAPI_KEY (서울 열린데이터광장 > 인증키 신청)
// 강남 주요 지점의 실시간 혼잡도를 5분 캐시로 제공합니다.
const SEOUL_BASE = 'http://openapi.seoul.go.kr:8088';
const GANGNAM_AREAS = ['강남역', '선릉역', '코엑스'];

const CONGEST_META = {
     '여유': { emoji: '🟢', rank: 0 },
     '보통': { emoji: '🟡', rank: 1 },
     '약간 붐빔': { emoji: '🟠', rank: 2 },
     '붐빔': { emoji: '🔴', rank: 3 },
};

async function fetchAreaPopulation(serviceKey, areaName) {
     const url = `${SEOUL_BASE}/${serviceKey}/json/citydata_ppltn/1/5/${encodeURIComponent(areaName)}`;
     const response = await fetch(url);
     if (!response.ok) throw new Error(`Seoul API HTTP ${response.status}`);
     const payload = await response.json();

     const row = payload?.['SeoulRtd.citydata_ppltn']?.[0];
     if (!row) {
          const message = payload?.RESULT?.MESSAGE || payload?.['SeoulRtd.citydata_ppltn']?.RESULT?.MESSAGE;
          throw new Error(message || `${areaName} 데이터 없음`);
     }

     const level = row.AREA_CONGEST_LVL || '보통';
     return {
          area: row.AREA_NM || areaName,
          congestLevel: level,
          congestEmoji: CONGEST_META[level]?.emoji || '🟡',
          congestRank: CONGEST_META[level]?.rank ?? 1,
          congestMessage: row.AREA_CONGEST_MSG || '',
          populationMin: Number(row.AREA_PPLTN_MIN) || null,
          populationMax: Number(row.AREA_PPLTN_MAX) || null,
          updatedAt: row.PPLTN_TIME || null,
     };
}

export default async function handler(req, res) {
     const serviceKey = (process.env.SEOUL_OPENAPI_KEY || '').trim();
     if (!serviceKey) {
          res.status(503).json({ error: 'missing_key', message: 'SEOUL_OPENAPI_KEY 환경변수가 설정되지 않았습니다.' });
          return;
     }

     const requested = typeof req.query.area === 'string' && req.query.area.trim()
          ? [req.query.area.trim()]
          : GANGNAM_AREAS;

     try {
          const results = await Promise.allSettled(requested.map(area => fetchAreaPopulation(serviceKey, area)));
          const areas = results
               .filter(result => result.status === 'fulfilled')
               .map(result => result.value);

          if (!areas.length) {
               const firstError = results.find(result => result.status === 'rejected');
               throw new Error(firstError?.reason?.message || '모든 지점 조회 실패');
          }

          res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
          res.status(200).json({ areas, fetchedAt: new Date().toISOString() });
     } catch (error) {
          res.status(502).json({ error: 'seoul_api_failed', message: error.message });
     }
}
