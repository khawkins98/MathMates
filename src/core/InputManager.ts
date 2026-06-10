import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';

export type InputAction = 'up' | 'down' | 'left' | 'right' | 'eat' | 'sus' | 'pause' | 'back';

export interface TapPoint {
  x: number;
  y: number;
}

const LONG_PRESS_MS = 500;
const TAP_MAX_DRIFT = 24;

export class InputManager {
  private queue: InputAction[] = [];
  private taps: TapPoint[] = [];
  private longPresses: TapPoint[] = [];
  private enabled = true;

  constructor(canvas?: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => this.onKey(e));
    if (canvas) {
      this.bindPointer(canvas);
    }
  }

  /** Touch/mouse input: taps and long-presses, reported in logical canvas coordinates. */
  private bindPointer(canvas: HTMLCanvasElement): void {
    let downPos: TapPoint | null = null;
    let longFired = false;
    let timer: number | undefined;

    const toLogical = (e: PointerEvent): TapPoint => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
        y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height),
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.enabled) {
        return;
      }
      e.preventDefault();
      // Capture so pointerup/move still arrive when the finger drifts off the canvas
      canvas.setPointerCapture(e.pointerId);
      downPos = toLogical(e);
      longFired = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (downPos) {
          this.longPresses.push(downPos);
          longFired = true;
        }
      }, LONG_PRESS_MS);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!downPos) {
        return;
      }
      // A swipe is neither a tap nor a long-press — drifting past the tap
      // threshold cancels the pending long-press.
      const at = toLogical(e);
      if (Math.hypot(at.x - downPos.x, at.y - downPos.y) > TAP_MAX_DRIFT) {
        window.clearTimeout(timer);
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      window.clearTimeout(timer);
      if (!this.enabled || !downPos || longFired) {
        downPos = null;
        return;
      }
      const up = toLogical(e);
      if (Math.hypot(up.x - downPos.x, up.y - downPos.y) <= TAP_MAX_DRIFT) {
        this.taps.push(up);
      }
      downPos = null;
    });

    for (const event of ['pointercancel', 'lostpointercapture'] as const) {
      canvas.addEventListener(event, () => {
        window.clearTimeout(timer);
        downPos = null;
      });
    }

    // Long-press on touch devices opens the context menu by default
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.enabled || e.repeat) {
      return;
    }
    const action = this.keyToAction(e.code);
    if (action) {
      e.preventDefault();
      this.queue.push(action);
    }
  }

  private keyToAction(code: string): InputAction | null {
    switch (code) {
      case 'ArrowUp':
        return 'up';
      case 'ArrowDown':
        return 'down';
      case 'ArrowLeft':
        return 'left';
      case 'ArrowRight':
        return 'right';
      case 'Space':
      case 'Enter':
        return 'eat';
      case 'KeyS':
        return 'sus';
      case 'Escape':
        return 'pause';
      case 'KeyZ':
      case 'Backspace':
        return 'back';
      default:
        return null;
    }
  }

  shift(): InputAction | undefined {
    return this.queue.shift();
  }

  push(action: InputAction): void {
    this.queue.push(action);
  }

  shiftTap(): TapPoint | undefined {
    return this.taps.shift();
  }

  shiftLongPress(): TapPoint | undefined {
    return this.longPresses.shift();
  }

  clear(): void {
    this.queue = [];
    this.taps = [];
    this.longPresses = [];
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.clear();
    }
  }
}
