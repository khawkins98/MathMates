import type { StageDefinition, GridData } from '../types';
import { shuffle, randomInt } from '../utils';

interface TimesTableOpts {
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  missionCount: number;
  impostorEnabled: boolean;
  parTime: number;
}

export function createTimesTableStage(
  n: number,
  opts: TimesTableOpts,
): StageDefinition {
  return {
    id: `times-${n}`,
    name: opts.name,
    description: opts.description,
    difficulty: opts.difficulty,
    missionCount: opts.missionCount,
    impostorEnabled: opts.impostorEnabled,
    parTime: opts.parTime,

    generateGrid(missionIndex: number, cols: number, rows: number): GridData {
      const totalCells = cols * rows;
      const correctCount = Math.round(totalCells * 0.4);
      const incorrectCount = totalCells - correctCount;

      // The target multiplier increases with mission index
      const m = missionIndex + 2; // starts at 2, increases each mission
      const targetProduct = n * m;

      // Enumerate ALL valid factor pairs for targetProduct (both orderings)
      const uniqueExprs: string[] = [];
      for (let a = 1; a <= Math.min(12, targetProduct); a++) {
        if (targetProduct % a === 0) {
          const b = targetProduct / a;
          if (b >= 1 && b <= 12) {
            uniqueExprs.push(`${a}\u00d7${b}`);
          }
        }
      }

      // Fill correct list by cycling through available expressions
      const correctList: string[] = [];
      for (let i = 0; i < correctCount; i++) {
        correctList.push(uniqueExprs[i % uniqueExprs.length]);
      }
      const actualCorrectCount = correctCount;
      const actualIncorrectCount = incorrectCount;

      // Generate incorrect expressions that do NOT equal targetProduct
      const incorrectList: string[] = [];
      let attempts = 0;
      while (incorrectList.length < actualIncorrectCount && attempts < 1000) {
        const a = randomInt(1, 12);
        const b = randomInt(1, 12);
        const product = a * b;
        if (product !== targetProduct) {
          incorrectList.push(`${a}\u00d7${b}`);
        }
        attempts++;
      }

      // Combine and shuffle
      const entries: Array<{ value: string; correct: boolean }> = [
        ...correctList.slice(0, actualCorrectCount).map((v) => ({ value: v, correct: true })),
        ...incorrectList.slice(0, actualIncorrectCount).map((v) => ({ value: v, correct: false })),
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
      const m = missionIndex + 2;
      return `Which equal ${n} \u00d7 ${m}?`;
    },
  };
}

export const times2 = createTimesTableStage(2, {
  name: 'Times Table: 2',
  description: 'Find products equal to 2 times a number.',
  difficulty: 2,
  missionCount: 5,
  impostorEnabled: false,
  parTime: 35000,
});

export const times5 = createTimesTableStage(5, {
  name: 'Times Table: 5',
  description: 'Find products equal to 5 times a number.',
  difficulty: 3,
  missionCount: 5,
  impostorEnabled: true,
  parTime: 40000,
});

export const times10 = createTimesTableStage(10, {
  name: 'Times Table: 10',
  description: 'Find products equal to 10 times a number.',
  // 10× table is the easiest — difficulty 2, no impostor
  difficulty: 2,
  missionCount: 5,
  impostorEnabled: false,
  parTime: 35000,
});
