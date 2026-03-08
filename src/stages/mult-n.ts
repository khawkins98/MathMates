import type { StageDefinition, GridData } from '../types';
import { shuffle, randomInt } from '../utils';
import { GRID_COLS, GRID_ROWS } from '../constants';

interface MultiplesStageOpts {
  name: string;
  description: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  missionCount: number;
  impostorEnabled: boolean;
  parTime: number;
}

export function createMultiplesStage(
  n: number,
  opts: MultiplesStageOpts,
): StageDefinition {
  return {
    id: `mult-${n}`,
    name: opts.name,
    description: opts.description,
    icon: opts.icon,
    difficulty: opts.difficulty,
    missionCount: opts.missionCount,
    impostorEnabled: opts.impostorEnabled,
    parTime: opts.parTime,

    generateGrid(missionIndex: number, cols: number, rows: number): GridData {
      const totalCells = cols * rows;
      const correctCount = Math.round(totalCells * 0.4);
      const incorrectCount = totalCells - correctCount;

      // Scale range with mission index for progressive difficulty
      const rangeMax = (missionIndex + 2) * n * 3;
      const rangeMin = 1;

      // Generate unique correct values (multiples of n)
      const correctSet = new Set<number>();
      let attempts = 0;
      while (correctSet.size < correctCount && attempts < 1000) {
        const multiple = randomInt(1, Math.floor(rangeMax / n)) * n;
        correctSet.add(multiple);
        attempts++;
      }
      const correctValues = Array.from(correctSet);

      // Generate unique incorrect values (non-multiples of n)
      const incorrectSet = new Set<number>();
      attempts = 0;
      while (incorrectSet.size < incorrectCount && attempts < 1000) {
        const val = randomInt(rangeMin, rangeMax);
        if (val % n !== 0 && !correctSet.has(val)) {
          incorrectSet.add(val);
        }
        attempts++;
      }
      const incorrectValues = Array.from(incorrectSet);

      // Build cells array and track correct indices
      const entries: Array<{ value: number; correct: boolean }> = [
        ...correctValues.map((v) => ({ value: v, correct: true })),
        ...incorrectValues.map((v) => ({ value: v, correct: false })),
      ];

      const shuffled = shuffle(entries);
      const cells: number[] = [];
      const correctIndices = new Set<number>();

      for (let i = 0; i < shuffled.length; i++) {
        cells.push(shuffled[i].value);
        if (shuffled[i].correct) {
          correctIndices.add(i);
        }
      }

      return { cells, correctIndices };
    },

    getRuleText(_missionIndex: number): string {
      return `Eat all multiples of ${n}!`;
    },
  };
}

export const mult2 = createMultiplesStage(2, {
  name: 'Multiples of 2',
  description: 'Find all even numbers on the grid.',
  icon: '2x',
  difficulty: 1,
  missionCount: 5,
  impostorEnabled: false,
  parTime: 30000,
});

export const mult3 = createMultiplesStage(3, {
  name: 'Multiples of 3',
  description: 'Spot the multiples of 3.',
  icon: '3x',
  difficulty: 2,
  missionCount: 5,
  impostorEnabled: false,
  parTime: 35000,
});

export const mult5 = createMultiplesStage(5, {
  name: 'Multiples of 5',
  description: 'Find all multiples of 5.',
  icon: '5x',
  difficulty: 1,
  missionCount: 5,
  impostorEnabled: false,
  parTime: 30000,
});

export const mult10 = createMultiplesStage(10, {
  name: 'Multiples of 10',
  description: 'Find all multiples of 10.',
  icon: '10x',
  difficulty: 1,
  missionCount: 5,
  impostorEnabled: false,
  parTime: 30000,
});
