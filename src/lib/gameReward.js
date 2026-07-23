// 라운지 게임 보상(ON) 공용 헬퍼
// 게임에서 좋은 성과(스테이지 클리어, 최고기록, 보스 처치 등)를 냈을 때 ON을 지급합니다.
// 클라이언트에서 profile.beans에 직접 반영되는 구조(updateBeanCount)라, 무한 파밍을
// 막기 위해 게임별 "일일 지급 상한"을 localStorage로 둡니다. (완벽한 치팅 방지는 아니지만
// 기존 앱의 신뢰 모델과 동일한 수준입니다.)
const REWARD_PREFIX = 'gangnam:on:game-reward:';

const today = () => new Date().toISOString().slice(0, 10);
const storageKey = (gameKey) => `${REWARD_PREFIX}${gameKey}:${today()}`;

export const getRewardedToday = (gameKey) => {
     try {
          return Number(window.localStorage.getItem(storageKey(gameKey))) || 0;
     } catch {
          return 0;
     }
};

export const getRewardRemaining = (gameKey, dailyCap = 100) =>
     Math.max(0, dailyCap - getRewardedToday(gameKey));

/**
 * 게임 보상 ON을 일일 상한 내에서 지급합니다.
 * @param {string} gameKey 게임 식별자 (예: 'snake', 'brick', 'towerdefense')
 * @param {number} amount 지급하려는 ON
 * @param {(delta:number)=>void} updateBeanCount App에서 내려주는 잔액 갱신 함수 (없을 수 있음)
 * @param {number} dailyCap 게임별 하루 지급 상한 (기본 100)
 * @returns {number} 실제로 지급된 ON (상한 초과분은 잘림, 0일 수 있음)
 */
export const awardGameReward = (gameKey, amount, updateBeanCount, dailyCap = 100) => {
     if (typeof updateBeanCount !== 'function' || !(amount > 0)) return 0;
     const already = getRewardedToday(gameKey);
     const grant = Math.max(0, Math.min(Math.floor(amount), dailyCap - already));
     if (grant <= 0) return 0;
     try {
          window.localStorage.setItem(storageKey(gameKey), String(already + grant));
     } catch {
          // localStorage가 막혀 있어도 지급 자체는 진행
     }
     updateBeanCount(grant);
     return grant;
};
