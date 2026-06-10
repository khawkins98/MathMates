import { CANVAS_WIDTH, GRID_OFFSET_Y } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import { fitText } from '@/rendering/drawHelpers';
import type { RoughRenderer } from '@/rendering/RoughRenderer';

export class HUD {
  private score = 0;
  private multiplier = 1;
  private lives = 5;
  private maxLives = 5;
  private progressCurrent = 0;
  private progressTotal = 1;
  private progressColour = COLOURS.SUCCESS;
  private ruleText = '';
  private impostorMode = false;
  private elapsed = 0;
  private o2 = 1;
  private suspicion = -1;
  private suspicionMax = 5;

  setScore(score: number): void {
    this.score = score;
  }

  setMultiplier(multiplier: number): void {
    this.multiplier = multiplier;
  }

  setLives(lives: number, max: number): void {
    this.lives = lives;
    this.maxLives = max;
  }

  setProgress(current: number, total: number, colour: string): void {
    this.progressCurrent = current;
    this.progressTotal = total;
    this.progressColour = colour;
  }

  setRule(text: string): void {
    this.ruleText = text;
  }

  setImpostorMode(on: boolean): void {
    this.impostorMode = on;
  }

  /** 0..1 oxygen remaining (the visible par timer). */
  setO2(fraction: number): void {
    this.o2 = Math.max(0, Math.min(1, fraction));
  }

  /** Current suspicion notches; pass -1 to hide (crew mode). */
  setSuspicion(level: number, max: number): void {
    this.suspicion = level;
    this.suspicionMax = max;
  }

  update(dt: number): void {
    this.elapsed += dt;
  }

  draw(ctx: CanvasRenderingContext2D, rr: RoughRenderer): void {
    const hudHeight = GRID_OFFSET_Y - 4;
    ctx.save();

    // HUD background panel
    ctx.fillStyle = '#0d1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, hudHeight);
    ctx.strokeStyle = '#2a4040';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, hudHeight);
    ctx.lineTo(CANVAS_WIDTH, hudHeight);
    ctx.stroke();

    // Row 1: mode badge (mini crewmate + label). Rule lives on row 2 so it
    // can never run underneath the centred progress bar.
    const modeColour = this.impostorMode ? COLOURS.DANGER : COLOURS.PLAYER_CREW;
    const modeLabel = this.impostorMode ? 'IMPOSTOR' : 'CREW';
    rr.crewmate(18, 14, modeColour, 1, 0.38);
    ctx.fillStyle = modeColour;
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeLabel, 32, 16);

    // Row 2: the rule — the single most important line for the player
    ctx.fillStyle = COLOURS.TEXT_HUD;
    ctx.textAlign = 'left';
    fitText(ctx, this.ruleText, 132, 56, CANVAS_WIDTH - 132 - 60, 14, "'Fredoka One', sans-serif", 11);

    // Score (right side) — cockpit-console orange, echoing the title art
    ctx.textAlign = 'right';
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = COLOURS.ORANGE;
    ctx.fillText(`${this.score}`, CANVAS_WIDTH - 10, 16);
    if (this.multiplier > 1) {
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.fillStyle = COLOURS.AI_CREW_1;
      ctx.fillText(`x${this.multiplier.toFixed(this.multiplier % 1 === 0 ? 0 : 1)}`, CANVAS_WIDTH - 10, 34);
    }

    // Progress bar (centre)
    const barWidth = 160;
    const barHeight = 8;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = 8;
    ctx.fillStyle = '#1a3030';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const fill = this.progressTotal > 0 ? this.progressCurrent / this.progressTotal : 0;
    ctx.fillStyle = this.progressColour;
    ctx.fillRect(barX, barY, barWidth * fill, barHeight);
    ctx.strokeStyle = '#2a5050';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.font = "10px 'Fredoka One', sans-serif";
    ctx.fillStyle = COLOURS.TEXT_HUD;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.progressCurrent}/${this.progressTotal}`, CANVAS_WIDTH / 2, barY + barHeight + 10);

    // O2 bar (visible par timer): bonus air, never lethal. Pulses when low.
    const o2W = 90;
    const o2X = CANVAS_WIDTH - 10 - o2W;
    const o2Y = 44;
    ctx.font = "10px 'Fredoka One', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9ab8b8';
    ctx.fillText('AIR', o2X - 5, o2Y + 4);
    ctx.fillStyle = '#1a3030';
    ctx.fillRect(o2X, o2Y, o2W, 7);
    const lowPulse = this.o2 > 0 && this.o2 < 0.25 ? 0.6 + 0.4 * Math.sin(this.elapsed * 0.01) : 1;
    ctx.globalAlpha = lowPulse;
    ctx.fillStyle = this.o2 < 0.25 ? COLOURS.ORANGE : COLOURS.CYAN;
    ctx.fillRect(o2X, o2Y, o2W * this.o2, 7);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#2a5050';
    ctx.lineWidth = 1;
    ctx.strokeRect(o2X, o2Y, o2W, 7);

    // Suspicion pips (impostor mode): how close the crew is to calling a meeting
    if (this.suspicion >= 0) {
      const pipY = 60;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#9ab8b8';
      ctx.fillText('SUS', o2X - 5, pipY + 4);
      for (let i = 0; i < this.suspicionMax; i += 1) {
        const px = o2X + i * 15 + 5;
        ctx.beginPath();
        ctx.arc(px, pipY + 3, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = i < this.suspicion ? COLOURS.DANGER : '#2a3c3c';
        ctx.fill();
        ctx.strokeStyle = '#4a6060';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Lives — small crewmate icons
    const lifeScale = 0.42;
    const lifeSpacing = 22;
    const lifeStartX = 14;
    const lifeCY = 52;
    for (let i = 0; i < this.maxLives; i += 1) {
      const cx = lifeStartX + i * lifeSpacing;
      if (i < this.lives) {
        rr.crewmate(cx, lifeCY, COLOURS.PLAYER_CREW, i + 1, lifeScale);
      } else {
        // Lost life: dim silhouette
        ctx.save();
        ctx.globalAlpha = 0.25;
        rr.crewmate(cx, lifeCY, '#4a6060', i + 1, lifeScale);
        ctx.restore();
      }
    }

    ctx.restore();
  }
}
