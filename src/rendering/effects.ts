import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  colour: string;
  ageMs: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  colour: string;
  shape: 'star' | 'plus' | 'puff';
  ageMs: number;
  lifeMs: number;
}

interface Stamp {
  text: string;
  colour: string;
  ageMs: number;
}

const POPUP_LIFE = 800;
const STAMP_LIFE = 750;

/**
 * Lightweight celebration/feedback effects: floating score popups, particle
 * bursts, full-screen stamps, screen shake and a red damage flash. Plain
 * canvas paths (not rough.js) — these respawn every eat and need to be cheap.
 */
export class Effects {
  private popups: ScorePopup[] = [];
  private particles: Particle[] = [];
  private stamp: Stamp | null = null;
  private shakeMs = 0;
  private shakeMag = 0;
  private flashMs = 0;

  scorePop(x: number, y: number, text: string, colour: string): void {
    this.popups.push({ x, y, text, colour, ageMs: 0 });
  }

  burst(x: number, y: number, colours: string[], count = 8): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const speed = 0.06 + Math.random() * 0.08;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.04,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.01,
        size: 4 + Math.random() * 4,
        colour: colours[i % colours.length],
        shape: i % 2 === 0 ? 'star' : 'plus',
        ageMs: 0,
        lifeMs: 500 + Math.random() * 250,
      });
    }
  }

  /** A quiet grey puff — failure stays small, success stays loud. */
  sadPuff(x: number, y: number): void {
    for (let i = 0; i < 4; i += 1) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -0.02 - Math.random() * 0.02,
        rot: 0,
        vrot: 0,
        size: 5 + Math.random() * 3,
        colour: 'rgba(150,160,160,0.5)',
        shape: 'puff',
        ageMs: 0,
        lifeMs: 600,
      });
    }
  }

  showStamp(text: string, colour: string): void {
    this.stamp = { text, colour, ageMs: 0 };
  }

  shake(magnitude = 5, durationMs = 280): void {
    this.shakeMag = magnitude;
    this.shakeMs = durationMs;
  }

  damageFlash(durationMs = 320): void {
    this.flashMs = durationMs;
  }

  update(dt: number): void {
    for (const p of this.popups) {
      p.ageMs += dt;
      p.y -= dt * 0.045;
    }
    this.popups = this.popups.filter((p) => p.ageMs < POPUP_LIFE);

    for (const p of this.particles) {
      p.ageMs += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.0002 * dt;
      p.rot += p.vrot * dt;
    }
    this.particles = this.particles.filter((p) => p.ageMs < p.lifeMs);

    if (this.stamp) {
      this.stamp.ageMs += dt;
      if (this.stamp.ageMs > STAMP_LIFE) {
        this.stamp = null;
      }
    }
    this.shakeMs = Math.max(0, this.shakeMs - dt);
    this.flashMs = Math.max(0, this.flashMs - dt);
  }

  /** Random per-frame offset while a shake is active — apply via ctx.translate. */
  shakeOffset(): { x: number; y: number } {
    if (this.shakeMs <= 0) {
      return { x: 0, y: 0 };
    }
    const fade = Math.min(1, this.shakeMs / 200);
    return {
      x: (Math.random() - 0.5) * 2 * this.shakeMag * fade,
      y: (Math.random() - 0.5) * 2 * this.shakeMag * fade,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const p of this.particles) {
      const fade = 1 - p.ageMs / p.lifeMs;
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'puff') {
        ctx.fillStyle = p.colour;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 + p.ageMs / p.lifeMs), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        ctx.fillStyle = p.colour;
        ctx.beginPath();
        for (let i = 0; i < 8; i += 1) {
          const r = i % 2 === 0 ? p.size : p.size * 0.45;
          const a = (Math.PI * i) / 4;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = p.colour;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.lineTo(p.size, 0);
        ctx.moveTo(0, -p.size);
        ctx.lineTo(0, p.size);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.popups) {
      const t = p.ageMs / POPUP_LIFE;
      ctx.save();
      ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.font = "bold 16px 'Fredoka One', sans-serif";
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.colour;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }

    if (this.stamp) {
      const t = this.stamp.ageMs / STAMP_LIFE;
      // Punch in, hold, fade out
      const scale = t < 0.15 ? 0.6 + (t / 0.15) * 0.4 : 1;
      ctx.save();
      ctx.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.scale(scale, scale);
      ctx.font = "26px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#080c0c';
      ctx.lineWidth = 7;
      ctx.strokeText(this.stamp.text, 0, 0);
      ctx.fillStyle = this.stamp.colour;
      ctx.fillText(this.stamp.text, 0, 0);
      ctx.restore();
    }

    if (this.flashMs > 0) {
      ctx.fillStyle = `rgba(232, 48, 48, ${0.22 * (this.flashMs / 320)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  }
}
