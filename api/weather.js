// 강남 역삼동 기상청 초단기실황 + 초단기예보(하늘상태) 프록시
// 환경변수: KMA_SERVICE_KEY (공공데이터포털 > 기상청_단기예보 조회서비스 인증키)
const YEOKSAM_NX = 61;
const YEOKSAM_NY = 126;
const KMA_BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

function getKstNow() {
     const now = new Date();
     const utc = now.getTime() + now.getTimezoneOffset() * 60000;
     return new Date(utc + 9 * 3600000);
}

function formatBaseDate(date) {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     return `${year}${month}${day}`;
}

function getFcstBaseDatetime(kst) {
     let target = new Date(kst);
     if (kst.getMinutes() < 45) {
          target = new Date(kst.getTime() - 3600000);
     }
     return {
          baseDate: formatBaseDate(target),
          baseTime: `${String(target.getHours()).padStart(2, '0')}30`,
     };
}

function normalizeServiceKey(rawKey = '') {
     return rawKey
          .trim()
          .replace(/^["']+|["']+$/g, '')
          .replace(/\\r\\n/g, '')
          .replace(/[\r\n]+/g, '');
}

async function fetchKma(endpoint, params, serviceKey) {
     const url = new URL(`${KMA_BASE}/${endpoint}`);
     url.searchParams.set('serviceKey', serviceKey);
     url.searchParams.set('pageNo', '1');
     url.searchParams.set('numOfRows', '100');
     url.searchParams.set('dataType', 'JSON');
     Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

     const response = await fetch(url.toString(), {
          headers: { 'User-Agent': 'GangnamOn/1.0 (+https://gangnam-on.vercel.app)' },
     });
     if (!response.ok) {
          throw new Error(`KMA ${endpoint} HTTP ${response.status}`);
     }

     const data = await response.json();
     const header = data?.response?.header;
     if (header?.resultCode !== '00') {
          throw new Error(`KMA ${endpoint}: ${header?.resultMsg || 'unknown error'}`);
     }

     const items = data?.response?.body?.items?.item;
     if (!items) {
          throw new Error(`KMA ${endpoint}: empty items`);
     }

     return Array.isArray(items) ? items : [items];
}

async function fetchKmaWithKey(endpoint, params, rawKey) {
     const candidates = [decodeURIComponent(rawKey), rawKey, encodeURIComponent(decodeURIComponent(rawKey))];
     const uniqueKeys = [...new Set(candidates)];
     let lastError;

     for (const key of uniqueKeys) {
          try {
               return await fetchKma(endpoint, params, key);
          } catch (error) {
               lastError = error;
          }
     }

     throw lastError;
}

function itemsToMap(items, valueKey) {
     return Object.fromEntries(items.map((item) => [item.category, item[valueKey]]));
}

function mapSkyPtyToCode(sky, pty) {
     const precipitation = parseInt(pty, 10);
     if ([1, 4, 5].includes(precipitation)) return 61;
     if (precipitation === 2) return 63;
     if ([3, 7].includes(precipitation)) return 71;
     if (precipitation === 6) return 63;

     const skyState = parseInt(sky, 10);
     if (skyState === 1) return 0;
     if (skyState === 3) return 2;
     if (skyState === 4) return 3;
     return 0;
}

function mapSkyPtyToText(sky, pty) {
     const precipitation = parseInt(pty, 10);
     if ([1, 4, 5].includes(precipitation)) return '비';
     if (precipitation === 2) return '비/눈';
     if ([3, 7].includes(precipitation)) return '눈';
     if (precipitation === 6) return '눈날림';

     const skyState = parseInt(sky, 10);
     if (skyState === 1) return '맑음';
     if (skyState === 3) return '구름 많음';
     if (skyState === 4) return '흐림';
     return '맑음';
}

function mapOpenMeteoCode(code) {
     const value = parseInt(code, 10);
     if (value === 0) return { code: 0, condition: '맑음' };
     if ([1, 2, 3].includes(value)) return { code: value, condition: '구름 조금' };
     if ([45, 48].includes(value)) return { code: value, condition: '안개' };
     if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(value)) return { code: value, condition: '비' };
     if ([71, 73, 75, 77, 85, 86].includes(value)) return { code: value, condition: '눈' };
     if ([95, 96, 99].includes(value)) return { code: value, condition: '천둥번개' };
     return { code: value, condition: '흐림' };
}

async function fetchPm10() {
     try {
          const response = await fetch(
               'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=37.5012&longitude=127.0396&current=pm10',
          );
          if (!response.ok) return null;
          const data = await response.json();
          return data?.current?.pm10 ?? null;
     } catch {
          return null;
     }
}

async function fetchOpenMeteoWeather() {
     const [weatherRes, airRes] = await Promise.all([
          fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5012&longitude=127.0396&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul'),
          fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=37.5012&longitude=127.0396&current=pm10'),
     ]);

     if (!weatherRes.ok) {
          throw new Error(`Open-Meteo weather HTTP ${weatherRes.status}`);
     }

     const weatherData = await weatherRes.json();
     const airData = airRes.ok ? await airRes.json() : null;
     const current = weatherData?.current;
     if (!current) {
          throw new Error('Open-Meteo: empty current data');
     }

     const mapped = mapOpenMeteoCode(current.weather_code);
     return {
          temp: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          code: mapped.code,
          condition: mapped.condition,
          pm10: airData?.current?.pm10 ?? null,
          location: '강남 역삼동',
          source: 'Open-Meteo',
          observedAt: current.time ? `${current.time}:00+09:00` : null,
          updatedAt: new Date().toISOString(),
          fallback: true,
     };
}

async function fetchLatestNcst(rawKey, kst) {
     const attempts = [];
     let target = new Date(kst);
     if (kst.getMinutes() < 10) {
          target = new Date(kst.getTime() - 3600000);
     }

     if (kst.getMinutes() >= 10) {
          const nextHour = new Date(target.getTime() + 3600000);
          attempts.push({
               baseDate: formatBaseDate(nextHour),
               baseTime: `${String(nextHour.getHours()).padStart(2, '0')}00`,
          });
     }

     attempts.push({
          baseDate: formatBaseDate(target),
          baseTime: `${String(target.getHours()).padStart(2, '0')}00`,
     });

     let lastError;
     for (const attempt of attempts) {
          try {
               const items = await fetchKmaWithKey('getUltraSrtNcst', {
                    base_date: attempt.baseDate,
                    base_time: attempt.baseTime,
                    nx: String(YEOKSAM_NX),
                    ny: String(YEOKSAM_NY),
               }, rawKey);
               return { items, base: attempt };
          } catch (error) {
               lastError = error;
          }
     }

     throw lastError;
}

async function fetchKmaWeather(rawKey) {
     const kst = getKstNow();
     const fcstBase = getFcstBaseDatetime(kst);

     const { items: ncstItems, base: ncstBase } = await fetchLatestNcst(rawKey, kst);

     const [fcstItems, pm10] = await Promise.all([
          fetchKmaWithKey('getUltraSrtFcst', {
               base_date: fcstBase.baseDate,
               base_time: fcstBase.baseTime,
               nx: String(YEOKSAM_NX),
               ny: String(YEOKSAM_NY),
          }, rawKey),
          fetchPm10(),
     ]);

     const ncst = itemsToMap(ncstItems, 'obsrValue');
     const currentHourStr = `${String(kst.getHours()).padStart(2, '0')}00`;
     const ncstHour = parseInt(ncstBase.baseTime.slice(0, 2), 10);

     let skyItem = fcstItems.find((item) => item.category === 'SKY' && item.fcstTime === currentHourStr)
          || fcstItems.find((item) => item.category === 'SKY');
     let sky = skyItem?.fcstValue ?? '1';
     let pty = ncst.PTY ?? '0';
     let temp = parseFloat(ncst.T1H);
     let humidity = parseInt(ncst.REH, 10);

     const buildObservedAt = (hourStr, useKstDate = false) => {
          const dateSource = useKstDate ? kst : {
               getFullYear: () => parseInt(ncstBase.baseDate.slice(0, 4), 10),
               getMonth: () => parseInt(ncstBase.baseDate.slice(4, 6), 10) - 1,
               getDate: () => parseInt(ncstBase.baseDate.slice(6, 8), 10),
          };
          const y = dateSource.getFullYear();
          const m = String(dateSource.getMonth() + 1).padStart(2, '0');
          const d = String(dateSource.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}T${hourStr.slice(0, 2)}:${hourStr.slice(2, 4)}:00+09:00`;
     };

     let observedAt = buildObservedAt(ncstBase.baseTime);

     // 정시 실황은 매시 10분 이후 공개 → 19:00~19:09에는 18:00 실황만 있음
     // 이때 초단기예보(30분 단위)로 현재 시각 데이터를 보완합니다.
     const needsFcstBridge = kst.getHours() > ncstHour
          || (kst.getHours() === ncstHour && kst.getMinutes() < 10);

     if (needsFcstBridge) {
          const fcstTempItem = fcstItems.find((item) => item.category === 'T1H' && item.fcstTime === currentHourStr);
          const fcstHumidityItem = fcstItems.find((item) => item.category === 'REH' && item.fcstTime === currentHourStr);
          const fcstSkyItem = fcstItems.find((item) => item.category === 'SKY' && item.fcstTime === currentHourStr);
          const fcstPtyItem = fcstItems.find((item) => item.category === 'PTY' && item.fcstTime === currentHourStr);
          const fcstTemp = parseFloat(fcstTempItem?.fcstValue);
          const fcstHumidity = parseInt(fcstHumidityItem?.fcstValue, 10);
          if (!Number.isNaN(fcstTemp)) temp = fcstTemp;
          if (!Number.isNaN(fcstHumidity)) humidity = fcstHumidity;
          if (fcstSkyItem?.fcstValue) sky = fcstSkyItem.fcstValue;
          if (fcstPtyItem?.fcstValue) pty = fcstPtyItem.fcstValue;
          observedAt = buildObservedAt(currentHourStr, true);
     } else {
          const minutesSinceObs = (kst.getHours() - ncstHour) * 60 + kst.getMinutes();
          if (minutesSinceObs >= 30) {
               const nextFcstTime = `${String((ncstHour + 1) % 24).padStart(2, '0')}00`;
               const fcstTempItem = fcstItems.find((item) => item.category === 'T1H' && item.fcstTime === nextFcstTime);
               const fcstHumidityItem = fcstItems.find((item) => item.category === 'REH' && item.fcstTime === nextFcstTime);
               const fcstTemp = parseFloat(fcstTempItem?.fcstValue);
               const fcstHumidity = parseInt(fcstHumidityItem?.fcstValue, 10);
               if (!Number.isNaN(fcstTemp)) temp = fcstTemp;
               if (!Number.isNaN(fcstHumidity)) humidity = fcstHumidity;
          }
     }

     if (Number.isNaN(temp) || Number.isNaN(humidity)) {
          throw new Error('KMA: invalid temperature or humidity');
     }

     return {
          temp: Math.round(temp),
          humidity,
          code: mapSkyPtyToCode(sky, pty),
          condition: mapSkyPtyToText(sky, pty),
          pm10,
          location: '강남 역삼동',
          source: '기상청',
          observedAt,
          updatedAt: new Date().toISOString(),
          fallback: false,
     };
}

export default async function handler(req, res) {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, must-revalidate');

     const rawKey = normalizeServiceKey(process.env.KMA_SERVICE_KEY);

     try {
          if (rawKey) {
               const kmaWeather = await fetchKmaWeather(rawKey);
               return res.status(200).json(kmaWeather);
          }

          const fallbackWeather = await fetchOpenMeteoWeather();
          return res.status(200).json({
               ...fallbackWeather,
               warning: 'KMA_SERVICE_KEY not configured',
          });
     } catch (error) {
          try {
               const fallbackWeather = await fetchOpenMeteoWeather();
               return res.status(200).json({
                    ...fallbackWeather,
                    warning: error.message,
               });
          } catch (fallbackError) {
               return res.status(502).json({ error: `${error.message}; fallback: ${fallbackError.message}` });
          }
     }
}
