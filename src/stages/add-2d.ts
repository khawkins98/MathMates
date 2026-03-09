import type { StageDefinition, GridData } from '../types';
import { shuffle, randomInt } from '../utils';

const TARGETS = [15, 20, 25, 30, 35];

export const add2d: StageDefinition = {
  id: 'add-2d',
  name: 'Two-Digit Addition',
  description: 'Find sums that equal the target. At least one number is two digits.',
  difficulty: 3,
  missionCount: TARGETS.length,
  impostorEnabled: true,
  parTime: 45000,

  generateGrid(missionIndex: number, cols: number, rows: number): GridData {
    const totalCells = cols * rows;
    const correctCount = Math.round(totalCells * 0.4);
    const incorrectCount = totalCells - correctCount;

    const target = TARGETS[missionIndex % TARGETS.length];

    // Generate correct expressions: a+b = target, at least one of a,b in [10,49]
    const correctList: string[] = [];
    let attempts = 0;
    while (correctList.length < correctCount && attempts < 1000) {
      // Ensure at least one operand is two-digit (10-49)
      const a = randomInt(10, Math.min(49, target - 1));
      const b = target - a;
      if (b >= 1 && b <= 49) {
        correctList.push(`${a}+${b}`);
      }
      attempts++;
    }

    // Generate incorrect expressions: at least one operand in [10,49], sum !== target
    const incorrectList: string[] = [];
    attempts = 0;
    while (incorrectList.length < incorrectCount && attempts < 1000) {
      const a = randomInt(10, 49);
      const b = randomInt(1, 49);
      if (a + b !== target) {
        incorrectList.push(`${a}+${b}`);
      }
      attempts++;
    }

    const entries: Array<{ value: string; correct: boolean }> = [
      ...correctList.map((v) => ({ value: v, correct: true })),
      ...incorrectList.map((v) => ({ value: v, correct: false })),
    ];

    const shuffled = shuffle(entries);
    const cells: string[] = [];
    const correctIndices = new Set<number>();

    for (let i = 0; i < shuffled.length; i++) {
      cells.push(shuffled[i].value);
      if (shuffled[i].correct) {
        correctIndices.add(i);
      }
    }

    return { cells, correctIndices };
  },

  getRuleText(missionIndex: number): string {
    const target = TARGETS[missionIndex % TARGETS.length];
    return `Which equal ${target}?`;
  },
};
