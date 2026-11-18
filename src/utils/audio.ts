class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private step = 0;
  private isPlayingMusic = false;
  private comboStep = 0;
  private lastCoinTime = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.gain.value = 0.22;
      this.sfxGain.gain.value = 0.45;
      this.masterGain.gain.value = this.muted ? 0 : 1;

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.03);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public startMusic(): void {
    if (this.isPlayingMusic) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.isPlayingMusic = true;
    const bassNotes = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42]; // A1 groove
    const arpNotes = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63, 246.94, 293.66, 369.99, 440, 523.25, 440, 369.99, 293.66];
    const stepDurationMs = 135;

    const tick = () => {
      if (!this.isPlayingMusic || !this.ctx || !this.musicGain) return;
      if (this.muted) {
        this.step = (this.step + 1) % 16;
        return;
      }

      const now = this.ctx.currentTime;
      const s = this.step % 16;

      // Kick drum on 0, 4, 8, 12
      if (s % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(130, now);
        kick.frequency.exponentialRampToValueAtTime(38, now + 0.11);
        kGain.gain.setValueAtTime(0.45, now);
        kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kick.connect(kGain);
        kGain.connect(this.musicGain);
        kick.start(now);
        kick.stop(now + 0.13);
      }

      // Snare / clap on 4 and 12
      if (s === 4 || s === 12) {
        this.playNoiseBurst(now, 0.09, 1400, 0.16, this.musicGain);
      }

      // Hi-hat on offbeats
      if (s % 2 === 1) {
        this.playNoiseBurst(now, 0.03, 6000, 0.05, this.musicGain);
      }

      // Driving synthwave bass
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassEnv = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      const bassFreq = bassNotes[Math.floor(s / 2) % bassNotes.length];
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(420, now);
      bassFilter.frequency.exponentialRampToValueAtTime(160, now + 0.11);
      bassEnv.gain.setValueAtTime(0.22, now);
      bassEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassEnv);
      bassEnv.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.125);

      // Neon synth arpeggio
      if (s % 2 === 0 || s === 7 || s === 15) {
        const arpOsc = this.ctx.createOscillator();
        const arpEnv = this.ctx.createGain();
        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(arpNotes[s % arpNotes.length], now);
        arpEnv.gain.setValueAtTime(0.11, now);
        arpEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        arpOsc.connect(arpEnv);
        arpEnv.connect(this.musicGain);
        arpOsc.start(now);
        arpOsc.stop(now + 0.15);
      }

      this.step = (this.step + 1) % 16;
    };

    tick();
    this.musicTimer = window.setInterval(tick, stepDurationMs);
  }

  public stopMusic(): void {
    this.isPlayingMusic = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playNoiseBurst(
    startTime: number,
    duration: number,
    filterFreq: number,
    volume: number,
    target: AudioNode
  ): void {
    if (!this.ctx) return;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(target);
    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  public playLaneSwitch(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.055);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playJump(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.14);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playSlide(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.13);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
    this.playNoiseBurst(now, 0.12, 900, 0.1, this.sfxGain);
  }

  public playCoin(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    if (now - this.lastCoinTime < 0.7) {
      this.comboStep = Math.min(8, this.comboStep + 1);
    } else {
      this.comboStep = 0;
    }
    this.lastCoinTime = now;

    const base = 780 + this.comboStep * 48;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.setValueAtTime(base * 1.32, now + 0.045);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playDiamond(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const notes = [880, 1174.66, 1567.98];
    notes.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.04;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.23);
    });
  }

  public playPowerUp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  public playShieldBreak(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.24);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
    this.playNoiseBurst(now, 0.2, 1200, 0.22, this.sfxGain);
  }

  public playLevelUp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      if (!this.sfxGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playCrash(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.35);
    gain.gain.setValueAtTime(0.36, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
    this.playNoiseBurst(now, 0.32, 320, 0.35, this.sfxGain);
  }

  public playClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.04);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }
}

export const soundEngine = new SoundEngine();
