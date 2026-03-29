// SoundManager - Procedural audio via Web Audio API
// No external sound files needed!

class SoundManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicPlaying = false;
    this.musicOsc = null;
    this.musicInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    if (this.sfxGain) this.sfxGain.gain.value = vol / 100 * 0.4;
  }

  setMusicVolume(vol) {
    if (this.musicGain) this.musicGain.gain.value = vol / 100 * 0.15;
  }

  setMusicEnabled(on) {
    if (on && !this.musicPlaying) this.startMusic();
    else if (!on && this.musicPlaying) this.stopMusic();
  }

  // ── Background Music (procedural dark cave ambient) ──
  startMusic() {
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;

    // Deep ambient drone
    const drone = this.ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55; // Low A
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.08;
    drone.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone.start();
    this.musicOsc = drone;
    this.musicDroneGain = droneGain;

    // Secondary drone (fifth)
    const drone2 = this.ctx.createOscillator();
    drone2.type = 'triangle';
    drone2.frequency.value = 82; // Low E
    const droneGain2 = this.ctx.createGain();
    droneGain2.gain.value = 0.04;
    drone2.connect(droneGain2);
    droneGain2.connect(this.musicGain);
    drone2.start();
    this.musicOsc2 = drone2;

    // Slow LFO modulation on pitch
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(drone.frequency);
    lfo.start();
    this.musicLfo = lfo;

    // Periodic cave drip notes
    const notes = [220, 330, 262, 196, 294, 247];
    let noteIdx = 0;
    this.musicInterval = setInterval(() => {
      if (!this.musicPlaying) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = notes[noteIdx % notes.length];
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.06, this.ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
      osc.connect(env);
      env.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
      noteIdx++;
    }, 3000 + Math.random() * 2000);
  }

  stopMusic() {
    this.musicPlaying = false;
    try {
      if (this.musicOsc) { this.musicOsc.stop(); this.musicOsc = null; }
      if (this.musicOsc2) { this.musicOsc2.stop(); this.musicOsc2 = null; }
      if (this.musicLfo) { this.musicLfo.stop(); this.musicLfo = null; }
    } catch (e) {}
    if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; }
  }

  // ── Sound Effects ──

  _playTone(freq, duration, type = 'square', volume = 0.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(volume, this.ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _playNoise(duration, volume = 0.15) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(volume, this.ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    noise.connect(env);
    env.connect(this.sfxGain);
    noise.start();
  }

  playSwordSwing() {
    this._playNoise(0.12, 0.2);
    this._playTone(300, 0.08, 'sawtooth', 0.1);
    setTimeout(() => this._playTone(200, 0.06, 'sawtooth', 0.08), 40);
  }

  playAxeSwing() {
    this._playNoise(0.15, 0.25);
    this._playTone(180, 0.1, 'sawtooth', 0.12);
  }

  playPunch() {
    this._playNoise(0.08, 0.15);
    this._playTone(120, 0.06, 'square', 0.1);
  }

  playGunshot() {
    this._playNoise(0.1, 0.35);
    this._playTone(800, 0.05, 'square', 0.2);
    setTimeout(() => this._playTone(200, 0.08, 'square', 0.1), 30);
  }

  playHit() {
    this._playTone(200, 0.1, 'square', 0.15);
    this._playNoise(0.06, 0.1);
  }

  playMobDeath() {
    this._playTone(400, 0.08, 'square', 0.12);
    setTimeout(() => this._playTone(200, 0.12, 'square', 0.1), 60);
    setTimeout(() => this._playTone(100, 0.15, 'square', 0.08), 120);
  }

  playPlayerHurt() {
    this._playTone(300, 0.08, 'sawtooth', 0.2);
    setTimeout(() => this._playTone(150, 0.12, 'sawtooth', 0.15), 50);
  }

  playPickup() {
    this._playTone(523, 0.06, 'sine', 0.15);
    setTimeout(() => this._playTone(659, 0.06, 'sine', 0.15), 60);
    setTimeout(() => this._playTone(784, 0.08, 'sine', 0.12), 120);
  }

  playBlock() {
    this._playTone(500, 0.05, 'square', 0.15);
    this._playNoise(0.05, 0.1);
  }

  playParry() {
    this._playTone(800, 0.06, 'square', 0.2);
    setTimeout(() => this._playTone(1000, 0.08, 'sine', 0.15), 40);
    setTimeout(() => this._playTone(1200, 0.1, 'sine', 0.12), 80);
  }

  playExplosion() {
    this._playNoise(0.4, 0.35);
    this._playTone(80, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this._playTone(50, 0.3, 'sawtooth', 0.15), 100);
  }

  playWaveComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.2, 'sine', 0.15), i * 120);
    });
  }

  playDeath() {
    const notes = [400, 350, 300, 200, 150];
    notes.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.25, 'sawtooth', 0.12), i * 150);
    });
  }

  playVictory() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.2, 'sine', 0.18), i * 150);
    });
  }

  playCoinPickup() {
    this._playTone(988, 0.05, 'sine', 0.12);
    setTimeout(() => this._playTone(1319, 0.08, 'sine', 0.12), 50);
  }

  playShopBuy() {
    this._playTone(440, 0.06, 'sine', 0.12);
    setTimeout(() => this._playTone(554, 0.06, 'sine', 0.12), 60);
    setTimeout(() => this._playTone(659, 0.1, 'sine', 0.15), 120);
  }

  playJump() {
    this._playTone(300, 0.05, 'sine', 0.1);
    setTimeout(() => this._playTone(500, 0.08, 'sine', 0.08), 30);
  }

  playArrow() {
    this._playTone(600, 0.08, 'sawtooth', 0.08);
    this._playNoise(0.04, 0.05);
  }

  playEasterEgg() {
    const notes = [262, 330, 392, 523, 392, 523, 659, 523];
    notes.forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.15, 'sine', 0.12), i * 100);
    });
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.initialized = false;
  }
}

// Singleton
const soundManager = new SoundManager();
export default soundManager;
