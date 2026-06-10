import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { getTopMisses } from '@/core/misses';
import { getModeProgress, getProgress, type ProgressData } from '@/core/progress';
import { COLOURS } from '@/rendering/colours';
import { drawSpaceBackground, drawControlsHintsBar, drawOutlinedText, makeStars, rrect, type Star } from '@/rendering/drawHelpers';
import { STAGES } from '@/stages';

/**
 * Captain's Log — the grown-up screen. Per-stage progress and the child's
 * most-missed facts, rendered from data the game already collects. Reached
 * from the title screen; deliberately plain.
 */
export class LogScene implements Scene {
  private manager: SceneManager;
  private stars: Star[] = makeStars(40);
  private elapsed = 0;
  private progress: ProgressData = getProgress();
  private topMisses: Array<{ display: string; numeric: number; count: number }> = [];

  constructor(manager: SceneManager) {
    this.manager = manager;
  }

  enter(): void {
    this.progress = getProgress();
    this.topMisses = getTopMisses(5);
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    this.elapsed += dt;
    if (this.manager.input.shiftTap()) {
      this.manager.goto('TITLE');
      return;
    }
    let action = this.manager.input.shift();
    while (action) {
      if (action === 'back' || action === 'pause' || action === 'eat') {
        this.manager.goto('TITLE');
        return;
      }
      action = this.manager.input.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    drawSpaceBackground(ctx, this.elapsed, this.stars);

    ctx.save();
    ctx.fillStyle = 'rgba(6, 12, 12, 0.7)';
    rrect(ctx, 10, 8, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 60, 10);
    ctx.fill();
    ctx.strokeStyle = '#4a7070';
    ctx.lineWidth = 2;
    rrect(ctx, 10, 8, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 60, 10);
    ctx.stroke();

    drawOutlinedText(ctx, "CAPTAIN'S LOG", CANVAS_WIDTH / 2, 32, 16);

    // Per-stage progress table
    ctx.textBaseline = 'middle';
    ctx.font = "11px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#9ab8b8';
    ctx.textAlign = 'left';
    ctx.fillText('MISSION', 28, 58);
    ctx.fillText('CREW', 210, 58);
    ctx.fillText('IMPOSTOR', 300, 58);
    ctx.fillText('BEST SCORE', 410, 58);

    const star = (earned: number, max: number): string =>
      '★'.repeat(Math.min(earned, max)) + '☆'.repeat(Math.max(0, max - earned));

    STAGES.forEach((stage, i) => {
      const y = 78 + i * 21;
      const crew = getModeProgress(stage.id, 'crew', this.progress);
      const impostor = getModeProgress(stage.id, 'impostor', this.progress);
      const crewBadges = crew.badges.reduce((a, b) => a + b, 0);
      const impostorBadges = impostor.badges.reduce((a, b) => a + b, 0);
      const maxBadges = stage.scenarios.length * 3;

      ctx.font = "12px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#f0fafa';
      ctx.fillText(stage.title, 28, y);
      ctx.fillStyle = crew.completed ? COLOURS.SUCCESS : '#7aa8a8';
      ctx.fillText(`${star(Math.round((crewBadges / Math.max(1, maxBadges)) * 3), 3)}`, 210, y);
      ctx.fillStyle = impostor.completed ? COLOURS.DANGER : '#7aa8a8';
      ctx.fillText(`${star(Math.round((impostorBadges / Math.max(1, maxBadges)) * 3), 3)}`, 300, y);
      ctx.fillStyle = COLOURS.ORANGE;
      ctx.fillText(crew.bestScore > 0 || impostor.bestScore > 0 ? `${Math.max(crew.bestScore, impostor.bestScore)}` : '—', 410, y);
    });

    // Most-missed facts
    const missY = 78 + STAGES.length * 21 + 14;
    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#9ab8b8';
    ctx.fillText('TRICKIEST FACTS (most missed):', 28, missY);
    if (this.topMisses.length === 0) {
      ctx.fillStyle = '#7aa8a8';
      ctx.fillText('No misses recorded yet — nice flying, Captain.', 28, missY + 22);
    } else {
      this.topMisses.forEach((miss, i) => {
        ctx.fillStyle = COLOURS.GOLD;
        const isBare = !miss.display.includes('+') && !miss.display.includes('−');
        const label = isBare ? miss.display : `${miss.display} = ${miss.numeric}`;
        ctx.fillText(`${label}   (missed ${miss.count}×)`, 28 + (i % 2) * 280, missY + 22 + Math.floor(i / 2) * 20);
      });
    }
    ctx.restore();

    drawControlsHintsBar(ctx, [
      ['ESC / TAP', 'back to title'],
    ]);
  }
}
