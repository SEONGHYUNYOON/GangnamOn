const STORAGE_KEY = 'gangnam:on:home-clicks';
const DEFAULT_ORDER = ['gangnam_pick', 'school_find', 'wine', 'news'];

const QUICK_ACTIONS = {
     gangnam_pick: { title: '핫플 가이드', desc: 'AI 강남 픽', tab: 'gangnam_pick' },
     school_find: { title: '동창 찾기', desc: '추억 속 친구', tab: 'school_find' },
     wine: { title: '밥친구', desc: '오늘의 약속', tab: 'wine' },
     news: { title: '강남 트렌드', desc: '실시간 소식', tab: 'news' },
};

function readClicks() {
     try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : {};
     } catch {
          return {};
     }
}

function writeClicks(clicks) {
     try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clicks));
     } catch {
          // ignore quota errors
     }
}

export function trackHomeQuickAction(actionId) {
     if (!QUICK_ACTIONS[actionId]) return;
     const clicks = readClicks();
     clicks[actionId] = (clicks[actionId] || 0) + 1;
     writeClicks(clicks);
}

export function getSortedQuickActionIds() {
     const clicks = readClicks();
     return [...DEFAULT_ORDER].sort((a, b) => (clicks[b] || 0) - (clicks[a] || 0));
}

export function getQuickActionMeta(actionId) {
     return QUICK_ACTIONS[actionId] || null;
}

export { QUICK_ACTIONS, DEFAULT_ORDER };
