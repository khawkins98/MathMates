import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';

export class TitleScene implements Scene {
  private manager: SceneManager;
  private rr: RoughRenderer;
  private elapsed = 0;
  private crewmates: Array<{ x: number; y: number; colour: string; seed: number }> = [];

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
  }

  enter(_params?: Record<string, unknown>): void {
    this.elapsed = 0;
    this.crewmates = [
      { x: 80, y: 200, colour: COLOURS.PLAYER_CREW, seed: 1 },
      { x: 520, y: 150, colour: COLOURS.AI_CREW_1, seed: 5 },
      { x: 300, y: 380, colour: COLOURS.AI_CREW_2, seed: 9 },
      { x: 150, y: 350, colour: '#c77dff', seed: 13 },
    ];
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    this.elapsed += dt;
    let action = this.manager.input.shift();
    while (action) {
      if (action === 'eat' || action === 'confirm') {
        this.manager.goto('SELECT');
        return;
      }
      action = this.manager.input.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLOURS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 60; i += 1) {
      const sx = (i * 137 + 50) % CANVAS_WIDTH;
      const sy = (i * 97 + 30) % CANVAS_HEIGHT;
      ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }

    for (const crewmate of this.crewmates) {
      const bob = Math.sin(this.elapsed * 0.002 + crewmate.seed) * 8;
      const seed = Math.floor(this.elapsed / 400) + crewmate.seed;
      this.rr.crewmate(crewmate.x, crewmate.y + bob, crewmate.colour, seed, 0.9);
    }

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 72px 'Caveat', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MathMates', CANVAS_WIDTH / 2, 150);

    ctx.font = `28px 'Caveat', cursive`;
    ctx.fillStyle = COLOURS.AI_CREW_1;
    ctx.fillText('A maths adventure in space', CANVAS_WIDTH / 2, 200);

    ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(this.elapsed * 0.003));
    ctx.fillStyle = '#ffffff';
    ctx.font = `32px 'Caveat', cursive`;
    ctx.fillText('Press SPACE or ENTER to start', CANVAS_WIDTH / 2, 300);
    ctx.globalAlpha = 1;

    ctx.font = `18px 'Nunito', sans-serif`;
    ctx.fillStyle = '#d9e2f2';
    ctx.fillText('Arrow keys to move • Space to eat • S to mark cells as sus', CANVAS_WIDTH / 2, 350);
    ctx.restore();
  }
}
