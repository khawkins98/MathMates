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

  cellEat(): void {
    this.tone(660, 0.12, 'sine', 0.25);
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

  crewmateEject(): void {
    this.tone(300, 0.2, 'triangle', 0.3);
  }


  sabotageEat(): void {
    this.tone(440, 0.1, 'sawtooth', 0.2);
  }

  repair(): void {
    this.tone(880, 0.08, 'sine', 0.15);
  }
}
