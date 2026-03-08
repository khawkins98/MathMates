export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted = false;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(v: boolean): void {
    this._muted = v;
    if (this.masterGain) {
      this.masterGain.gain.value = v ? 0 : 1;
    }
  }

  private playTone(
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    startTime?: number,
  ): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const t = startTime ?? ctx.currentTime;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(t);
    osc.stop(t + duration);
  }

  cellEat(): void {
    if (this._muted) return;
    // Rising chirp
    this.playTone('square', 400, 800, 0.1);
  }

  errorBuzz(): void {
    if (this._muted) return;
    // Descending sawtooth
    this.playTone('sawtooth', 300, 100, 0.3);
  }

  eliminationSting(): void {
    if (this._muted) return;
    const ctx = this.ensureContext();
    const t = ctx.currentTime;
    // Layered DUN-dun
    this.playTone('square', 200, 180, 0.3, t);
    this.playTone('sawtooth', 150, 80, 0.4, t + 0.15);
  }

  missionComplete(): void {
    if (this._muted) return;
    const ctx = this.ensureContext();
    const t = ctx.currentTime;
    // Ascending arpeggio C5-E5-G5-C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.playTone('square', freq, freq, 0.15, t + i * 0.12);
    });
  }

  ambientHum(): void {
    if (this._muted) return;
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 55;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    // Will play until context is suspended/destroyed
  }

  countdownBeep(): void {
    if (this._muted) return;
    this.playTone('square', 600, 600, 0.08);
  }

  countdownGo(): void {
    if (this._muted) return;
    this.playTone('square', 900, 900, 0.15);
  }

  buttonClick(): void {
    if (this._muted) return;
    this.playTone('square', 500, 700, 0.05);
  }
}
