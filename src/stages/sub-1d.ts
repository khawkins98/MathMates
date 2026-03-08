import type { StageDefinition, GridData } from '../types';
import { shuffle, randomInt } from '../utils';

const TARGETS = [2, 3, 4, 5, 6];

export const sub1d: StageDefinition = {
  id: 'sub-1d',
  name: 'Single-Digit Subtraction',
  description: 'Find differences that equal the target number.',
  icon: '-1d',
  difficulty: 2,
  missionCount: TARGETS.length,
  impostorEnabled: false,
  parTime: 35000,

  generateGrid(missionIndex: number, cols: number, rows: number): GridData {
    const totalCells = cols * rows;
    const correctCount = Math.round(totalCells * 0.4);
    const incorrectCount = totalCells - correctCount;

    const target = TARGETS[missionIndex % TARGETS.length];

    // Generate correct expressions: a-b where a,b in [1,9], a-b === target, a >= b
    const correctList: string[] = [];
    let attempts = 0;
    while (correctList.length < correctCount && attempts < 1000) {
      const b = randomInt(1, 9 - target);
      const a = target + b;
      if (a >= 1 && a <= 9 && b >= 1 && b <= 9 && a >= b) {
        correctList.push(`${a}-${b}`);
      }
      attempts++;
    }

    // Generate incorrect expressions: a-b where a >= b, a,b in [1,9], a-b !== target
    const incorrectList: string[] = [];
    attempts = 0;
    while (incorrectList.length < incorrectCount && attempts < 1000) {
      const a = randomInt(2, 9);
      const b = randomInt(1, a);
      if (a - b !== target) {
        incorrectList.push(`${a}-${b}`);
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
