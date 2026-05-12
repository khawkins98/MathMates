import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';

export interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
}

export function makeStars(count = 55): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    x: (i * 137 + 50) % CANVAS_WIDTH,
    y: (i * 97 + 30) % CANVAS_HEIGHT,
    r: i % 4 === 0 ? 2 : 1,
    phase: (i * 0.37) % (Math.PI * 2),
  }));
}

export function drawSpaceBackground(
  ctx: CanvasRenderingContext2D,
  elapsedMs: number,
  stars: Star[],
): void {
  ctx.fillStyle = '#0a0e10';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const s of stars) {
    ctx.globalAlpha = Math.sin(elapsedMs * 0.0012 + s.phase) * 0.35 + 0.65;
    ctx.fillStyle = '#c8e8f0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const cx = ctx.canvas.width / 2;
  const cy = ctx.canvas.height / 2;
  const vg = ctx.createRadialGradient(cx, cy + 40, 0, cx, cy, ctx.canvas.height * 0.85);
  vg.addColorStop(0, 'rgba(13,40,40,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fillColour = '#f0fafa',
  strokeColour = '#080c0c',
  strokeW = 6,
  family = "'Press Start 2P', monospace",
): void {
  ctx.save();
  ctx.font = `${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = strokeColour;
  ctx.lineWidth = strokeW;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColour;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  selected: boolean,
  elapsed = 0,
): void {
  ctx.save();

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  rr(ctx, x + 3, y + 4, w, h, 8);
  ctx.fill();

  // Fill
  ctx.fillStyle = selected ? '#ffffff' : '#ddf4f0';
  ctx.beginPath();
  rr(ctx, x, y, w, h, 8);
  ctx.fill();

  // Border
  if (selected) {
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(elapsed * 0.004));
    ctx.strokeStyle = '#40d8c0';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6 + 0.4 * pulse;
  } else {
    ctx.strokeStyle = '#080c0c';
    ctx.lineWidth = 3;
  }
  ctx.beginPath();
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Label
  ctx.fillStyle = '#080c0c';
  ctx.font = "18px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);

  ctx.restore();
}

export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = '#2e5050',
  stroke = '#080c0c',
  strokeW = 3,
): void {
  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  rr(ctx, x + 4, y + 5, w, h, 10);
  ctx.fill();

  // Fill
  ctx.fillStyle = fill;
  ctx.beginPath();
  rr(ctx, x, y, w, h, 10);
  ctx.fill();

  // Stroke
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeW;
  ctx.beginPath();
  rr(ctx, x, y, w, h, 10);
  ctx.stroke();

  ctx.restore();
}
