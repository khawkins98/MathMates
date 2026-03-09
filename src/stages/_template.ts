/**
 * Stage Template
 * ==============
 * Copy this file and modify it to create a new stage for MathMates.
 *
 * A stage defines:
 *  - Metadata (id, name, description, difficulty)
 *  - How many missions it contains
 *  - Whether impostors appear
 *  - A par time for the time bonus
 *  - A grid generator function
 *  - A rule text generator function
 *
 * After creating your stage, register it in `src/stages/index.ts`.
 */

import type { StageDefinition, GridData } from '../types';
import { shuffle, randomInt } from '../utils';

export const myStage: StageDefinition = {
  /** Unique identifier for this stage. Use kebab-case. */
  id: 'my-stage',

  /** Display name shown in stage select. */
  name: 'My Stage',

  /** Short description shown under the name. */
  description: 'A brief explanation of what the player must do.',

  /** Difficulty from 1 (easiest) to 5 (hardest). Affects sort order. */
  difficulty: 1,

  /** Number of missions (rounds) in this stage. */
  missionCount: 5,

  /** Whether the impostor enemy spawns during this stage. */
  impostorEnabled: false,

  /** Par time in ms. Completing under this earns a time bonus. */
  parTime: 30000,

  /**
   * Generate the grid data for a specific mission.
   *
   * @param missionIndex - Zero-based index of the current mission (0 to missionCount-1).
   *                       Use this to scale difficulty progressively.
   * @param cols - Number of grid columns (typically GRID_COLS = 6).
   * @param rows - Number of grid rows (typically GRID_ROWS = 5).
   * @returns GridData with cells array and correctIndices set.
   *
   * Guidelines:
   *  - Target ~40% correct cells: Math.round(cols * rows * 0.4)
   *  - Avoid duplicate cell values when possible
   *  - Scale difficulty with missionIndex (larger numbers, harder problems)
   *  - cells can contain numbers or strings (e.g. "3+4", "5×2")
   */
  generateGrid(missionIndex: number, cols: number, rows: number): GridData {
    const totalCells = cols * rows;
    const correctCount = Math.round(totalCells * 0.4);
    const incorrectCount = totalCells - correctCount;

    // --- Replace this with your own logic ---
    const target = (missionIndex + 1) * 5;

    const correctValues: number[] = [];
    for (let i = 0; i < correctCount; i++) {
      correctValues.push(target); // All correct cells have the target value
    }

    const incorrectValues: number[] = [];
    let attempts = 0;
    while (incorrectValues.length < incorrectCount && attempts < 1000) {
      const val = randomInt(1, target * 2);
      if (val !== target) {
        incorrectValues.push(val);
      }
      attempts++;
    }
    // --- End of custom logic ---

    // Combine, shuffle, and build GridData
    const entries = [
      ...correctValues.map((v) => ({ value: v as number | string, correct: true })),
      ...incorrectValues.map((v) => ({ value: v as number | string, correct: false })),
    ];

    const shuffled = shuffle(entries);
    const cells: (number | string)[] = [];
    const correctIndices = new Set<number>();

    for (let i = 0; i < shuffled.length; i++) {
      cells.push(shuffled[i].value);
      if (shuffled[i].correct) {
        correctIndices.add(i);
      }
    }

    return { cells, correctIndices };
  },

  /**
   * Return the rule text displayed during the briefing and HUD.
   *
   * @param missionIndex - Zero-based mission index.
   * @returns A short instructional string, e.g. "Eat all multiples of 3!"
   */
  getRuleText(missionIndex: number): string {
    const target = (missionIndex + 1) * 5;
    return `Find all cells equal to ${target}!`;
  },
};
