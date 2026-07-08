export const ACTIVITY_RANKS = [
     { min: 0, title: '강남 새싹', badge: '🌱' },
     { min: 30, title: '골목 지기', badge: '📍' },
     { min: 80, title: '통장', badge: '🗂️' },
     { min: 160, title: '동장', badge: '🏘️' },
     { min: 320, title: '구의원', badge: '🎙️' },
     { min: 640, title: '구청장', badge: '🏛️' },
     { min: 1200, title: '부시장', badge: '🌆' },
     { min: 2200, title: '시장', badge: '👑' },
];

export function getActivityRank(score = 0) {
     return ACTIVITY_RANKS.reduce((current, rank) => (score >= rank.min ? rank : current), ACTIVITY_RANKS[0]);
}
