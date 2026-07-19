class SoundManager {
     constructor() {
          this.ctx = null;
          this.masterGain = null;
          this.isMuted = false;
          this.initialized = false;
     }

     init() {
          if (this.initialized) return;
          try {
               const AudioContext = window.AudioContext || window.webkitAudioContext;
               this.ctx = new AudioContext();
               this.masterGain = this.ctx.createGain();
               this.masterGain.connect(this.ctx.destination);
               this.masterGain.gain.value = 0.3; // Default volume
               this.initialized = true;
          } catch (e) {
               console.warn("Web Audio API not supported");
          }
     }

     toggleMute() {
          this.isMuted = !this.isMuted;
          if (this.masterGain) {
               this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
          }
          return this.isMuted;
     }

     playTone(freq, type, duration, vol = 1, slideToFreq = null) {
          if (!this.initialized || this.isMuted || !this.ctx) return;
          
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = type;
          
          osc.connect(gain);
          gain.connect(this.masterGain);

          const now = this.ctx.currentTime;
          
          osc.frequency.setValueAtTime(freq, now);
          if (slideToFreq) {
               osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
          }

          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

          osc.start(now);
          osc.stop(now + duration);
     }

     // === Specific Game Sounds === //

     playCoin() {
          this.playTone(987.77, 'sine', 0.1, 0.5); // B5
          setTimeout(() => this.playTone(1318.51, 'sine', 0.2, 0.5), 100); // E6
     }

     playJump() {
          this.playTone(300, 'square', 0.2, 0.3, 600);
     }

     playHit() {
          this.playTone(150, 'sawtooth', 0.15, 0.5, 50);
     }

     playExplosion() {
          this.playTone(100, 'square', 0.3, 0.6, 20);
          setTimeout(() => this.playTone(80, 'sawtooth', 0.4, 0.6, 10), 50);
     }

     playGameOver() {
          this.playTone(300, 'sawtooth', 0.3, 0.5, 100);
          setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.5, 80), 300);
          setTimeout(() => this.playTone(200, 'sawtooth', 0.6, 0.5, 50), 600);
     }

     playMove() {
          this.playTone(400, 'sine', 0.05, 0.2);
     }

     playRotate() {
          this.playTone(600, 'triangle', 0.05, 0.2);
     }

     playDrop() {
          this.playTone(200, 'square', 0.1, 0.3, 100);
     }

     playClearLine() {
          this.playTone(440, 'square', 0.1, 0.3);
          setTimeout(() => this.playTone(554.37, 'square', 0.1, 0.3), 100);
          setTimeout(() => this.playTone(659.25, 'square', 0.2, 0.3), 200);
     }

     playTick() {
          this.playTone(800, 'sine', 0.05, 0.1);
     }
}

export const soundManager = new SoundManager();
