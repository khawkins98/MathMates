export class AudioManager {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3): void {
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio can be blocked until first user gesture.
    }
  }

  /** Pitched noise burst — crunches, breaks. */
  private noise(duration: number, gain = 0.3, filterFreq = 1200): void {
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const length = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      src.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    } catch {
      // Audio can be blocked until first user gesture.
    }
  }

  /** A tone whose pitch slides between two frequencies. */
  private slide(from: number, to: number, duration: number, type: OscillatorType = 'sine', gain = 0.3): void {
    try {
      const ctx = this.getCtx();
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(from, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio can be blocked until first user gesture.
    }
  }

  // Pentatonic ladder — each streak step climbs a note, so you can HEAR your streak.
  private static STREAK_SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];

  /** Correct eat: pitch climbs with the streak (resets on a miss). */
  cellEat(streak = 0): void {
    const scale = AudioManager.STREAK_SCALE;
    const note = scale[Math.min(streak, scale.length - 1)];
    this.tone(note, 0.12, 'sine', 0.25);
  }

  /** Streak milestone (x1.5/x2/x3): a quick rising arpeggio. */
  streakUp(): void {
    this.tone(659, 0.09, 'square', 0.18);
    window.setTimeout(() => this.tone(784, 0.09, 'square', 0.18), 70);
    window.setTimeout(() => this.tone(1047, 0.16, 'square', 0.2), 140);
  }

  errorBuzz(): void {
    this.tone(120, 0.3, 'sawtooth', 0.4);
  }

  missionComplete(): void {
    this.tone(523, 0.15, 'sine', 0.3);
    window.setTimeout(() => this.tone(659, 0.15, 'sine', 0.3), 120);
    window.setTimeout(() => this.tone(784, 0.3, 'sine', 0.3), 240);
  }

  eliminationSting(): void {
    this.tone(200, 0.4, 'square', 0.35);
  }

  /** Ejection: a long descending slide as the body tumbles away. */
  crewmateEject(): void {
    this.slide(700, 110, 0.9, 'triangle', 0.3);
  }

  /** Suspicion notch — the Among Us "!" sting flavour. */
  suspicionSting(): void {
    this.tone(880, 0.07, 'square', 0.3);
    window.setTimeout(() => this.tone(587, 0.18, 'square', 0.28), 80);
  }


  sabotageEat(): void {
    this.noise(0.18, 0.3, 900);
    this.tone(220, 0.1, 'sawtooth', 0.15);
  }

  /** The hungry impostor started chewing a correct answer — urgent nibbling. */
  impostorChomp(): void {
    this.tone(330, 0.06, 'square', 0.15);
    window.setTimeout(() => this.tone(294, 0.06, 'square', 0.15), 90);
  }

  repair(): void {
    this.tone(880, 0.08, 'sine', 0.15);
  }
}
