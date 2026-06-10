export type InputAction = 'up' | 'down' | 'left' | 'right' | 'eat' | 'sus' | 'pause' | 'back';

export class InputManager {
  private queue: InputAction[] = [];
  private enabled = true;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKey(e));
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

  clear(): void {
    this.queue = [];
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.queue = [];
    }
  }
}
