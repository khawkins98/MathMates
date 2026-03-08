import type { StageDefinition, GridData } from '../types';
import { shuffle, randomInt } from '../utils';

const TARGETS = [5, 7, 8, 9, 10];

export const add1d: StageDefinition = {
  id: 'add-1d',
  name: 'Single-Digit Addition',
  description: 'Find sums that equal the target number.',
  icon: '+1d',
  difficulty: 1,
  missionCount: TARGETS.length,
  impostorEnabled: false,
  parTime: 30000,

  generateGrid(missionIndex: number, cols: number, rows: number): GridData {
    const totalCells = cols * rows;
    const correctCount = Math.round(totalCells * 0.4);
    const incorrectCount = totalCells - correctCount;

    const target = TARGETS[missionIndex % TARGETS.length];

    // Enumerate all valid pairs a+b = target where a,b in [1,9]
    const uniqueCorrect: string[] = [];
    for (let a = 1; a <= Math.min(9, target - 1); a++) {
      const b = target - a;
      if (b >= 1 && b <= 9) {
        uniqueCorrect.push(`${a}+${b}`);
      }
    }

    // Fill by cycling through unique expressions
    const correctList: string[] = [];
    for (let i = 0; i < correctCount; i++) {
      correctList.push(uniqueCorrect[i % uniqueCorrect.length]);
    }

    // Generate incorrect expressions: a+b where a,b in [1,9] and a+b !== target
    const incorrectList: string[] = [];
    let attempts = 0;
    while (incorrectList.length < incorrectCount && attempts < 1000) {
      const a = randomInt(1, 9);
      const b = randomInt(1, 9);
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
