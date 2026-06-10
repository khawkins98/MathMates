import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { drawSpaceBackground, makeStars, type Star } from '@/rendering/drawHelpers';

const DURATION_MS = 1900;

/**
 * The classic ejection beat: a little body tumbling across the starfield with
 * the verdict text. Used when the impostor ejects a crewmate and when the
 * player loses their last life. Freezes gameplay while it runs.
 */
export class EjectionCutscene {
  private elapsed = 0;
  private stars: Star[] = makeStars(60);
  readonly text: string;
  private colour: string;
  private onDone: () => void;
  private fired = false;

  constructor(text: string, colour: string, onDone: () => void) {
    this.text = text;
    this.colour = colour;
    this.onDone = onDone;
  }

  get active(): boolean {
    return !this.fired;
  }

  update(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed >= DURATION_MS && !this.fired) {
      this.fired = true;
      this.onDone();
    }
  }

  draw(ctx: CanvasRenderingContext2D, rr: RoughRenderer): void {
    const t = Math.min(1, this.elapsed / DURATION_MS);
    drawSpaceBackground(ctx, this.elapsed, this.stars);

    // Body tumbles across the screen on a slight diagonal
    const x = -40 + t * (CANVAS_WIDTH + 80);
    const y = CANVAS_HEIGHT * 0.42 + Math.sin(t * Math.PI) * -26;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * Math.PI * 3.2);
    rr.crewmate(0, 0, this.colour, Math.floor(this.elapsed / 200), 1.15);
    ctx.restore();

    // Verdict text types on, letter by letter
    const visible = Math.floor((this.text.length + 4) * Math.min(1, t * 1.6));
    ctx.save();
    ctx.font = "15px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(this.text.slice(0, visible), CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.68);
    ctx.restore();
  }
}
