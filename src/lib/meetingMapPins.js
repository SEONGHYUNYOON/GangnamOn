const GANGNAM_CENTER = { lat: 37.4979, lng: 127.0276 };

const LOCATION_HINTS = [
     { keyword: '강남역', lat: 37.4979, lng: 127.0276 },
     { keyword: '역삼', lat: 37.5007, lng: 127.0365 },
     { keyword: '선릉', lat: 37.5045, lng: 127.0490 },
     { keyword: '삼성', lat: 37.5088, lng: 127.0632 },
     { keyword: '논현', lat: 37.5110, lng: 127.0214 },
     { keyword: '신사', lat: 37.5163, lng: 127.0202 },
     { keyword: '청담', lat: 37.5194, lng: 127.0473 },
     { keyword: '압구정', lat: 37.5271, lng: 127.0286 },
     { keyword: '테헤란', lat: 37.5012, lng: 127.0396 },
     { keyword: '잠실', lat: 37.5133, lng: 127.1002 },
     { keyword: '관악', lat: 37.4710, lng: 126.9816 },
     { keyword: '도봉', lat: 37.7011, lng: 127.0465 },
     { keyword: '북한산', lat: 37.6588, lng: 126.9780 },
];

function hashJitter(text) {
     let hash = 0;
     const s = String(text || '');
     for (let i = 0; i < s.length; i++) {
          hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
     }
     const angle = (hash % 360) * (Math.PI / 180);
     const radius = 0.002 + (hash % 100) / 50000;
     return {
          lat: GANGNAM_CENTER.lat + Math.cos(angle) * radius,
          lng: GANGNAM_CENTER.lng + Math.sin(angle) * radius,
     };
}

export function guessMeetingCoords(locationName, seed = '') {
     const location = String(locationName || '');
     if (!location || location === '장소미정') {
          return hashJitter(seed || location);
     }

     const match = LOCATION_HINTS.find((hint) => location.includes(hint.keyword));
     if (match) {
          const jitter = hashJitter(seed || location);
          return {
               lat: match.lat + (jitter.lat - GANGNAM_CENTER.lat) * 0.35,
               lng: match.lng + (jitter.lng - GANGNAM_CENTER.lng) * 0.35,
          };
     }

     return hashJitter(seed || location);
}

export function buildMeetingMapMarkers(meetings = [], limit = 6) {
     return meetings
          .filter((item) => item?.location && item.location !== '장소미정')
          .slice(0, limit)
          .map((item) => {
               const coords = guessMeetingCoords(item.location, item.id || item.title);
               return {
                    id: item.id,
                    lat: coords.lat,
                    lng: coords.lng,
                    label: item.title,
                    subtitle: item.location,
               };
          });
}
