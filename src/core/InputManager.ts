import type { InputAction } from '@/types';

const KEY_MAP: Record<string, InputAction> = {
  ArrowUp: 'move_up',
  ArrowDown: 'move_down',
  ArrowLeft: 'move_left',
  ArrowRight: 'move_right',
  KeyW: 'move_up',
  KeyS: 'move_down',
  KeyA: 'move_left',
  KeyD: 'move_right',
  Space: 'eat',
  Enter: 'eat',
  KeyX: 'sus',
  Escape: 'pause',
};

export class InputManager {
  private queue: InputAction[] = [];
  private enabled = true;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (!this.enabled) return;
      const action = KEY_MAP[e.code];
      if (action) {
        e.preventDefault();
        this.queue.push(action);
      }
    });
  }

  /** Remove and return the first queued action, or undefined if empty. */
  shift(): InputAction | undefined {
    return this.queue.shift();
  }

  drain(): InputAction[] {
    const actions = this.queue.slice();
    this.queue.length = 0;
    return actions;
  }

  clear(): void {
    this.queue.length = 0;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) this.queue.length = 0;
  }
}
