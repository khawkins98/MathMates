import { CANVAS_WIDTH, GRID_OFFSET_Y } from '@/constants';
import { COLOURS } from '@/rendering/colours';
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

    // Mode + rule text
    const modeLabel = this.impostorMode ? '👾 IMPOSTOR' : '🚀 CREW';
    ctx.fillStyle = this.impostorMode ? COLOURS.DANGER : COLOURS.PLAYER_CREW;
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeLabel, 10, 16);
    ctx.fillStyle = COLOURS.TEXT_HUD;
    ctx.fillText(` — ${this.ruleText}`, 10 + ctx.measureText(modeLabel).width, 16);

    // Score (right side)
    ctx.textAlign = 'right';
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = COLOURS.GOLD;
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
