import type { ScenarioDefinition } from '@/types';
import { buildGrid } from './helpers';

function makeSubtractionScenario(
  id: string,
  target: number,
  difficulty: 1 | 2 | 3,
  brief: string,
): ScenarioDefinition {
  return {
    id,
    title: `Subtract to ${target}`,
    topic: 'subtraction',
    ruleText: `Find differences equal to ${target}`,
    impostorRuleText: `Break differences that do NOT equal ${target}`,
    briefingText: brief,
    ksYears: difficulty === 1 ? [1] : [1, 2],
    difficulty,
    parTime: 90,
    generateGrid(seed) {
      const correct = [];
      const wrong = [];
      for (let a = target; a <= 20; a += 1) {
        correct.push({ display: `${a} − ${a - target}`, numeric: target });
      }
      for (let a = 1; a <= 20; a += 1) {
        for (let b = 0; b < a; b += 1) {
          if (a - b !== target) {
            wrong.push({ display: `${a} − ${b}`, numeric: a - b });
          }
        }
      }
      return buildGrid(correct, wrong, 8, seed);
    },
    isCorrect(value) {
      return value.numeric === target;
    },
  };
}

export const subtraction1 = makeSubtractionScenario(
  'subtraction-1',
  3,
  1,
  'Find every subtraction that gives you 3! Take away the right number!',
);
export const subtraction2 = makeSubtractionScenario(
  'subtraction-2',
  7,
  2,
  'Now find every subtraction that gives you 7. Tricky — take your time!',
);
export const subtraction3 = makeSubtractionScenario(
  'subtraction-3',
  12,
  2,
  'Find every subtraction that gives you 12 — bigger numbers now!',
);
export const subtraction4 = makeSubtractionScenario(
  'subtraction-4',
  17,
  3,
  'The toughest yet — find every subtraction that gives you 17. Concentrate!',
);
