// 강남 라운지 게임 공용 효과음 엔진
// 음원 파일 없이 Web Audio API로 효과음을 합성합니다.
//
// 오디오 컨텍스트와 음소거 상태는 기존 soundManager를 그대로 사용합니다.
// (라운지 헤더의 스피커 버튼이 여기서 나는 소리까지 함께 켜고 끕니다.)
//
// 사용법: import { playSound } from '../lib/gameSounds';
//         playSound('score');
// 지원 효과음: click, move, pop, score, combo, bounce, hit, explosion,
//              powerup, win, gameover, tick, whoosh, coin, wrong
import { soundManager } from './soundManager';

const getAudio = () => {
     soundManager.init();
     if (!soundManager.initialized || soundManager.isMuted || !soundManager.ctx) return null;
     // 모바일 브라우저는 사용자 제스처 전까지 suspended 상태입니다.
     if (soundManager.ctx.state === 'suspended') soundManager.ctx.resume().catch(() => {});
     return { ctx: soundManager.ctx, out: soundManager.masterGain };
};

// 단일 톤 재생 (주파수 스윕 + 감쇠 엔벨로프)
const tone = ({ ctx, out }, { freq = 440, endFreq, type = 'sine', duration = 0.15, volume = 0.5, delay = 0 }) => {
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     const start = ctx.currentTime + delay;

     osc.type = type;
     osc.frequency.setValueAtTime(freq, start);
     if (endFreq && endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration);

     gain.gain.setValueAtTime(0.0001, start);
     gain.gain.linearRampToValueAtTime(volume, start + 0.008);
     gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

     osc.connect(gain).connect(out);
     osc.start(start);
     osc.stop(start + duration + 0.02);
};

// 화이트노이즈 버스트 (타격/폭발용)
const noise = ({ ctx, out }, { duration = 0.2, volume = 0.45, delay = 0, filterFreq = 1200 }) => {
     const start = ctx.currentTime + delay;
     const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

     const source = ctx.createBufferSource();
     source.buffer = buffer;

     const filter = ctx.createBiquadFilter();
     filter.type = 'lowpass';
     filter.frequency.setValueAtTime(filterFreq, start);

     const gain = ctx.createGain();
     gain.gain.setValueAtTime(volume, start);
     gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

     source.connect(filter).connect(gain).connect(out);
     source.start(start);
};

const SOUNDS = {
     click: (audio) => tone(audio, { freq: 660, endFreq: 520, type: 'triangle', duration: 0.06, volume: 0.35 }),
     move: (audio) => tone(audio, { freq: 300, endFreq: 260, type: 'square', duration: 0.05, volume: 0.16 }),
     pop: (audio) => tone(audio, { freq: 420, endFreq: 880, type: 'sine', duration: 0.1, volume: 0.45 }),
     score: (audio) => {
          tone(audio, { freq: 523, type: 'sine', duration: 0.09, volume: 0.4 });
          tone(audio, { freq: 784, type: 'sine', duration: 0.12, volume: 0.4, delay: 0.07 });
     },
     combo: (audio) => {
          [523, 659, 784, 1047].forEach((freq, index) => tone(audio, { freq, type: 'sine', duration: 0.09, volume: 0.38, delay: index * 0.055 }));
     },
     bounce: (audio) => tone(audio, { freq: 240, endFreq: 420, type: 'sine', duration: 0.07, volume: 0.38 }),
     hit: (audio) => {
          noise(audio, { duration: 0.08, volume: 0.35, filterFreq: 2400 });
          tone(audio, { freq: 180, endFreq: 90, type: 'square', duration: 0.09, volume: 0.3 });
     },
     explosion: (audio) => {
          noise(audio, { duration: 0.35, volume: 0.5, filterFreq: 900 });
          tone(audio, { freq: 110, endFreq: 40, type: 'sawtooth', duration: 0.3, volume: 0.35 });
     },
     powerup: (audio) => {
          [392, 523, 659, 784].forEach((freq, index) => tone(audio, { freq, type: 'triangle', duration: 0.07, volume: 0.35, delay: index * 0.045 }));
     },
     win: (audio) => {
          [523, 659, 784, 1047, 1319].forEach((freq, index) => tone(audio, { freq, type: 'triangle', duration: 0.16, volume: 0.38, delay: index * 0.09 }));
     },
     gameover: (audio) => {
          [392, 330, 262, 196].forEach((freq, index) => tone(audio, { freq, type: 'sawtooth', duration: 0.18, volume: 0.33, delay: index * 0.12 }));
     },
     tick: (audio) => tone(audio, { freq: 880, type: 'square', duration: 0.03, volume: 0.2 }),
     whoosh: (audio) => noise(audio, { duration: 0.16, volume: 0.25, filterFreq: 600 }),
     coin: (audio) => {
          tone(audio, { freq: 988, type: 'square', duration: 0.06, volume: 0.26 });
          tone(audio, { freq: 1319, type: 'square', duration: 0.16, volume: 0.26, delay: 0.06 });
     },
     wrong: (audio) => {
          tone(audio, { freq: 220, type: 'sawtooth', duration: 0.14, volume: 0.33 });
          tone(audio, { freq: 185, type: 'sawtooth', duration: 0.2, volume: 0.33, delay: 0.1 });
     },
};

export const playSound = (name) => {
     try {
          const audio = getAudio();
          if (!audio) return;
          SOUNDS[name]?.(audio);
     } catch {
          // 효과음 실패는 게임 진행을 막지 않는다
     }
};
