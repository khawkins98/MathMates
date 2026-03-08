import { Container, Graphics } from 'pixi.js';
import { COLORS } from '@/constants';

const DEFAULT_SIZE = 16;
const TOOTH_COUNT = 8;

/**
 * Creates a gear/cog icon drawn in Hull Grey with light alpha.
 * Central circle with rectangular teeth around the perimeter and a hole in the center.
 */
export function createGear(size: number = DEFAULT_SIZE): Container {
  const container = new Container();
  const gfx = new Graphics();

  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.6;
  const holeRadius = outerRadius * 0.22;
  const toothWidth = (2 * Math.PI) / (TOOTH_COUNT * 2);
  const toothDepth = outerRadius - innerRadius;

  // Build gear outline as a polygon path
  const points: number[] = [];

  for (let i = 0; i < TOOTH_COUNT; i++) {
    const baseAngle = (i / TOOTH_COUNT) * Math.PI * 2 - Math.PI / 2;

    // Inner start
    const a0 = baseAngle - toothWidth;
    points.push(cx + Math.cos(a0) * innerRadius, cy + Math.sin(a0) * innerRadius);

    // Outer start (tooth rise)
    const a1 = baseAngle - toothWidth * 0.6;
    points.push(cx + Math.cos(a1) * (innerRadius + toothDepth), cy + Math.sin(a1) * (innerRadius + toothDepth));

    // Outer end (tooth top)
    const a2 = baseAngle + toothWidth * 0.6;
    points.push(cx + Math.cos(a2) * (innerRadius + toothDepth), cy + Math.sin(a2) * (innerRadius + toothDepth));

    // Inner end (tooth fall)
    const a3 = baseAngle + toothWidth;
    points.push(cx + Math.cos(a3) * innerRadius, cy + Math.sin(a3) * innerRadius);
  }

  gfx.poly(points);
  gfx.fill(COLORS.HULL_GREY);

  // Central hole
  gfx.circle(cx, cy, holeRadius).fill(COLORS.DEEP_SPACE);

  container.addChild(gfx);
  container.alpha = 0.7;
  return container;
}
