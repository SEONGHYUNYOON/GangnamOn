const RANK_KEY_PREFIX = 'gangnam_rank_';
const MAX_ENTRIES = 10;

/**
 * @param {string} gameKey - e.g. 'block', 'snake', 'whack', 'brick', 'reaction', 'typing'
 * @param {boolean} higherIsBetter - true: 점수 높을수록 좋음, false: 점수 낮을수록 좋음(반응속도 ms)
 */
export function getRankTop10(gameKey, higherIsBetter = true) {
     try {
          const raw = localStorage.getItem(RANK_KEY_PREFIX + gameKey);
          const list = raw ? JSON.parse(raw) : [];
          const sorted = [...list].sort((a, b) =>
               higherIsBetter ? (b.score - a.score) : (a.score - b.score)
          );
          return sorted.slice(0, MAX_ENTRIES).map((e, i) => ({ ...e, rank: i + 1 }));
     } catch {
          return [];
     }
}

/**
 * @param {string} gameKey
 * @param {string} name - 표시 이름
 * @param {number} score
 * @param {boolean} higherIsBetter
 */
export function addScore(gameKey, name, score, higherIsBetter = true) {
     const list = getRankTop10(gameKey, higherIsBetter);
     const next = [...list, { name: name || '게스트', score }].sort((a, b) =>
          higherIsBetter ? (b.score - a.score) : (a.score - b.score)
     ).slice(0, MAX_ENTRIES);
     try {
          localStorage.setItem(RANK_KEY_PREFIX + gameKey, JSON.stringify(next.map(({ name: n, score: s }) => ({ name: n, score: s }))));
     } catch (_) {}
     return getRankTop10(gameKey, higherIsBetter);
}
