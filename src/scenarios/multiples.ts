import type { ScenarioDefinition } from '@/types';
import { buildGrid } from './helpers';

function makeMultiplesScenario(
  id: string,
  multiple: number,
  maxVal: number,
  difficulty: 1 | 2 | 3,
  brief: string,
): ScenarioDefinition {
  return {
    id,
    title: `Multiples of ${multiple}`,
    topic: 'multiplication',
    ruleText: `Find multiples of ${multiple}`,
    briefingText: brief,
    ksYears: difficulty <= 2 ? [1, 2] : [2],
    difficulty,
    parTime: 75,
    generateGrid(seed) {
      const correct = [];
      const wrong = [];
      for (let n = multiple; n <= maxVal; n += multiple) {
        correct.push({ display: `${n}`, numeric: n });
      }
      for (let n = 1; n <= maxVal; n += 1) {
        if (n % multiple !== 0) {
          wrong.push({ display: `${n}`, numeric: n });
        }
      }
      return buildGrid(correct, wrong, 7, seed);
    },
    isCorrect(value) {
      return value.numeric % multiple === 0;
    },
  };
}

export const multiples2 = makeMultiplesScenario(
  'multiples-2',
  2,
  20,
  1,
  'Find every even number — they can all be shared into 2 equal groups!',
);
export const multiples5 = makeMultiplesScenario(
  'multiples-5',
  5,
  50,
  1,
  'Find every multiple of 5 — they always end in 0 or 5!',
);
export const multiples10 = makeMultiplesScenario(
  'multiples-10',
  10,
  100,
  1,
  'Find every multiple of 10 — they always end in zero!',
);
export const multiples3 = makeMultiplesScenario(
  'multiples-3',
  3,
  30,
  2,
  'Find every multiple of 3. Add the digits — if they sum to 3, 6, or 9, it works!',
);
export const multiples4 = makeMultiplesScenario(
  'multiples-4',
  4,
  40,
  2,
  'Find every multiple of 4. Tricky — take your time and think it through!',
);
