import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CELL_SIZE } from '@/constants';

const CORNER_RADIUS = 6;
const BORDER_WIDTH = 2;

const cellTextStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 16,
  fontWeight: 'bold',
  fill: 0xffffff,
  align: 'center',
});

/**
 * Creates a standalone cell sprite with a value, fill, and border.
 * 64x64 rounded rect with centered text.
 */
export function createCellSprite(
  value: string | number,
  fillColor: number,
  borderColor: number,
): Container {
  const container = new Container();

  const bg = new Graphics();

  // Border (full-size rect)
  bg.roundRect(0, 0, CELL_SIZE, CELL_SIZE, CORNER_RADIUS).fill(borderColor);

  // Inner fill
  bg.roundRect(
    BORDER_WIDTH,
    BORDER_WIDTH,
    CELL_SIZE - BORDER_WIDTH * 2,
    CELL_SIZE - BORDER_WIDTH * 2,
    CORNER_RADIUS - 1,
  ).fill(fillColor);

  container.addChild(bg);

  const label = new Text({ text: String(value), style: cellTextStyle });
  label.anchor.set(0.5);
  label.x = CELL_SIZE / 2;
  label.y = CELL_SIZE / 2;
  container.addChild(label);

  return container;
}
