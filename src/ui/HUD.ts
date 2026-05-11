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

  draw(ctx: CanvasRenderingContext2D, _rr: RoughRenderer): void {
    const hudHeight = GRID_OFFSET_Y - 4;
    ctx.save();
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, hudHeight);

    ctx.fillStyle = COLOURS.TEXT_HUD;
    ctx.font = `bold 14px 'Caveat', cursive`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const modeLabel = this.impostorMode ? '👾 IMPOSTOR' : '🚀 CREW';
    ctx.fillText(`${modeLabel} — ${this.ruleText}`, 10, hudHeight / 2 - 10);

    ctx.textAlign = 'right';
    ctx.font = `bold 20px 'Caveat', cursive`;
    ctx.fillStyle = COLOURS.GOLD;
    ctx.fillText(`${this.score}`, CANVAS_WIDTH - 10, hudHeight / 2 - 10);
    if (this.multiplier > 1) {
      ctx.font = `14px 'Caveat', cursive`;
      ctx.fillStyle = COLOURS.AI_CREW_1;
      ctx.fillText(`×${this.multiplier.toFixed(this.multiplier % 1 === 0 ? 0 : 1)}`, CANVAS_WIDTH - 10, hudHeight / 2 + 10);
    }

    const barWidth = 180;
    const barHeight = 10;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = hudHeight / 2 + 8;
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const fill = this.progressTotal > 0 ? this.progressCurrent / this.progressTotal : 0;
    ctx.fillStyle = this.progressColour;
    ctx.fillRect(barX, barY, barWidth * fill, barHeight);
    ctx.strokeStyle = '#445';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = COLOURS.TEXT_HUD;
    ctx.font = `12px 'Nunito', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.progressCurrent}/${this.progressTotal}`, CANVAS_WIDTH / 2, barY - 6);

    for (let i = 0; i < this.maxLives; i += 1) {
      const cx = 10 + i * 22;
      const cy = hudHeight / 2 + 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = i < this.lives ? COLOURS.PLAYER_CREW : '#1a2a3a';
      ctx.fill();
      ctx.strokeStyle = i < this.lives ? '#aaa' : '#334';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}
