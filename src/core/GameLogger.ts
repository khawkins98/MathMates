/// <reference types="vite/client" />
/**
 * Game event logger for debugging.
 *
 * Enabled by default in local development (import.meta.env.DEV).
 * Toggle at runtime in any environment:
 *   window.__GAME_DEBUG = true   // enable
 *   window.__GAME_DEBUG = false  // disable
 */

declare global {
  interface Window {
    __GAME_DEBUG: boolean;
  }
}

// Auto-enable in dev; leave unset (off) in production builds.
if (typeof window !== 'undefined' && window.__GAME_DEBUG === undefined) {
  window.__GAME_DEBUG = import.meta.env.DEV;
}

let sessionStart = Date.now();

function ts(): string {
  const ms = Date.now() - sessionStart;
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const millis = ms % 1000;
  return `+${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

const STYLE_GOOD = 'color:#44ff88;font-family:monospace';
const STYLE_BAD  = 'color:#ff5555;font-family:monospace';
const STYLE_AI   = 'color:#ffaa44;font-family:monospace';
const STYLE_ELIM = 'color:#cc88ff;font-family:monospace';

export const gameLog = {
  /** Call at the start of each game session to reset the relative clock. */
  resetSession(): void {
    sessionStart = Date.now();
  },

  /**
   * Player ate a grid cell.
   * Crew mode:    correct cell = good; wrong cell = life lost.
   * Impostor mode: wrong cell = good (sabotage); correct cell = mistake (voted out).
   */
  playerAte(opts: {
    mode: 'crew' | 'impostor';
    value: number | string;
    rule: string;
    isCorrectCell: boolean;
    scoreAfter: number;
    multiplier: number;
    livesAfter: number | null; // null = no life was lost
  }): void {
    if (!window.__GAME_DEBUG) return;
    const { mode, value, rule, isCorrectCell, scoreAfter, multiplier, livesAfter } = opts;

    const isSuccess = mode === 'crew' ? isCorrectCell : !isCorrectCell;
    const actor = mode === 'crew' ? 'CREW  ' : 'IMPOST';

    let outcome: string;
    if (mode === 'crew') {
      outcome = isCorrectCell
        ? '✓ CORRECT'
        : '✗ WRONG  → life lost';
    } else {
      outcome = !isCorrectCell
        ? '✓ CORRECT (wrong answer sabotaged)'
        : '✗ MISTAKE (correct answer eaten → voted out)';
    }

    const scoreStr = `score: ${scoreAfter}${multiplier > 1 ? ` (×${multiplier})` : ''}`;
    const livesStr = livesAfter !== null ? `  lives: ${livesAfter} remaining` : '';

    console.log(
      `%c[${ts()}] ${actor}  ate [${value}]  rule: "${rule}"  → ${outcome}  ${scoreStr}${livesStr}`,
      isSuccess ? STYLE_GOOD : STYLE_BAD,
    );
  },

  /** An AI crewmate consumed a correct cell on the grid. */
  aiConsumedCell(opts: {
    aiIndex: number;
    value: number | string;
    rule: string;
    correctEaten: number;
    totalCorrect: number;
  }): void {
    if (!window.__GAME_DEBUG) return;
    const { aiIndex, value, rule, correctEaten, totalCorrect } = opts;
    console.log(
      `%c[${ts()}] AI[${aiIndex}]  consumed [${value}]  rule: "${rule}"  threat: ${correctEaten}/${totalCorrect} correct cleared`,
      STYLE_AI,
    );
  },

  /** An AI crewmate collided with and caught the impostor player. */
  aiCaughtPlayer(opts: { aiIndex: number; livesAfter: number }): void {
    if (!window.__GAME_DEBUG) return;
    console.log(
      `%c[${ts()}] AI[${opts.aiIndex}]  caught player  → life lost  lives: ${opts.livesAfter} remaining`,
      STYLE_BAD,
    );
  },

  /** Impostor player eliminated an AI crewmate by eating their cell. */
  impostorEliminatedCrew(opts: { aiIndex: number; scoreAfter: number }): void {
    if (!window.__GAME_DEBUG) return;
    console.log(
      `%c[${ts()}] IMPOST  eliminated AI[${opts.aiIndex}]  → bonus  score: ${opts.scoreAfter}`,
      STYLE_ELIM,
    );
  },
};
