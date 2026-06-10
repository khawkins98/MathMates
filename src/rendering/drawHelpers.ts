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
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const s of stars) {
    ctx.globalAlpha = Math.sin(elapsedMs * 0.0012 + s.phase) * 0.35 + 0.65;
    ctx.fillStyle = '#c8e8f0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const vg = ctx.createRadialGradient(cx, cy + 40, 0, cx, cy, CANVAS_HEIGHT * 0.85);
  vg.addColorStop(0, 'rgba(13,40,40,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/** Adds a rounded-rect path to ctx without stroking or filling. Falls back to plain rect. */
export function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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

/**
 * Draws a bottom-anchored controls hint bar.
 * segments: array of [keyName, actionDescription] — key rendered in gold, desc in teal.
 * offsetFromBottom: pixels above the canvas bottom edge (default 8).
 */
export function drawControlsHintsBar(
  ctx: CanvasRenderingContext2D,
  segments: Array<[string, string]>,
  offsetFromBottom = 8,
): void {
  const barH = 36;
  const barX = 14;
  const barY = CANVAS_HEIGHT - barH - offsetFromBottom;
  const barW = CANVAS_WIDTH - 28;

  ctx.save();
  rrect(ctx, barX, barY, barW, barH, 8);
  ctx.fillStyle = 'rgba(0,10,14,0.82)';
  ctx.fill();
  ctx.strokeStyle = '#2a5050';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "12px 'Fredoka One', sans-serif";
  ctx.textBaseline = 'middle';
  const cy = barY + barH / 2;
  const segW = barW / segments.length;

  for (let i = 0; i < segments.length; i += 1) {
    const [key, desc] = segments[i];
    const sx = barX + segW * i + segW / 2;
    const keyW = ctx.measureText(key).width;
    const gap = 6;
    const descW = ctx.measureText(desc).width;
    const totalW = keyW + gap + descW;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0d060'; // gold key names
    ctx.fillText(key, sx - totalW / 2, cy);
    ctx.fillStyle = '#40d8c0'; // teal descriptions
    ctx.fillText(desc, sx - totalW / 2 + keyW + gap, cy);
  }
  ctx.restore();
}

/**
 * Draws single-line text constrained to maxWidth: shrinks the font down to
 * minSize first, then ellipsizes if it still does not fit.
 * ctx.font must be set before calling; size/family are passed explicitly so
 * the font string can be rebuilt while shrinking.
 */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  family: string,
  minSize = size - 2,
): void {
  let fontSize = size;
  ctx.font = `${fontSize}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && fontSize > minSize) {
    fontSize -= 0.5;
    ctx.font = `${fontSize}px ${family}`;
  }
  let out = text;
  if (ctx.measureText(out).width > maxWidth) {
    while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
      out = out.slice(0, -1).trimEnd();
    }
    out = `${out}…`;
  }
  ctx.fillText(out, x, y);
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
  rrect(ctx, x + 3, y + 4, w, h, 8);
  ctx.fill();

  // Fill — dark for both states; selected is identical fill so the border/glow carries the state
  ctx.fillStyle = '#243838';
  rrect(ctx, x, y, w, h, 8);
  ctx.fill();

  // Border
  if (selected) {
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2.5;
    rrect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = '#4a7070';
    ctx.lineWidth = 2;
    rrect(ctx, x, y, w, h, 8);
    ctx.stroke();
  }

  // Label — cyan when selected, off-white when normal
  ctx.fillStyle = selected ? '#00ffff' : '#f0fafa';
  ctx.font = "16px 'Fredoka One', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);

  ctx.restore();
  void elapsed; // unused but kept for API stability
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
  rrect(ctx, x + 4, y + 5, w, h, 10);
  ctx.fill();

  // Fill
  ctx.fillStyle = fill;
  rrect(ctx, x, y, w, h, 10);
  ctx.fill();

  // Stroke
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeW;
  rrect(ctx, x, y, w, h, 10);
  ctx.stroke();

  ctx.restore();
}

