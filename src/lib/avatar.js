// ────────────────────────────────────────────────────────────────
// 성별 기반 기본 아바타 헬퍼
//
// 사용자가 직접 사진을 올리거나 아바타를 꾸미지 않았을 때, 완전히
// 무작위(성별 구분 없는) 캐릭터 대신 성별에 맞는 기본 캐릭터를 보여줍니다.
// 같은 사용자는 항상 같은 캐릭터를 받도록 userId 기반 해시로 고정합니다.
// ────────────────────────────────────────────────────────────────

const MALE_SEEDS = ['Felix', 'Oliver', 'Leo', 'Milo', 'Jasper', 'Alexander'];
const FEMALE_SEEDS = ['Aneka', 'Sophia', 'Luna', 'Zoe', 'Nora', 'Mia'];
const NEUTRAL_SEED = 'Gangnam';

function hashToIndex(str, mod) {
     let hash = 0;
     const s = String(str || '');
     for (let i = 0; i < s.length; i++) {
          hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
     }
     return hash % mod;
}

// gender: 'male' | 'female' | 그 외(미설정)
// key: 아바타를 고정시킬 기준값 (보통 userId/username). 같은 사람은 항상 같은 캐릭터를 받습니다.
export function getDefaultAvatarUrl(gender, key = 'guest') {
     let seed = NEUTRAL_SEED;
     if (gender === 'male') {
          seed = MALE_SEEDS[hashToIndex(key, MALE_SEEDS.length)];
     } else if (gender === 'female') {
          seed = FEMALE_SEEDS[hashToIndex(key, FEMALE_SEEDS.length)];
     }
     return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

// 프로필 문서(profiles 컬렉션 형태) 또는 user_metadata 형태(App.jsx의 user state) 어느 쪽이든
// 받아서 실제로 화면에 표시할 아바타 URL을 결정합니다.
// 우선순위: 1) 사용자가 직접 설정/업로드한 avatarUrl  2) 성별 기반 기본 아바타  3) 중립 기본 아바타
export function resolveAvatarUrl(entity) {
     if (!entity) return getDefaultAvatarUrl(null);
     const avatarUrl = entity.avatarUrl || entity.avatar_url || entity.user_metadata?.avatar_url;
     if (avatarUrl) return avatarUrl;
     const gender = entity.gender || entity.user_metadata?.gender;
     const key = entity.$id || entity.id || entity.userId || entity.username || entity.user_metadata?.username || 'guest';
     return getDefaultAvatarUrl(gender, key);
}
