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
      // Difficulty 1 stays within numbers a Year 1 child can hold (≤ 10);
      // later difficulties open up to 20.
      const maxMinuend = difficulty === 1 ? Math.max(10, target + 2) : 20;
      const correct = [];
      const wrong = [];
      for (let a = target; a <= maxMinuend; a += 1) {
        correct.push({ display: `${a} − ${a - target}`, numeric: target });
      }
      const minDistance = difficulty === 1 ? 2 : 1;
      for (let a = 1; a <= maxMinuend; a += 1) {
        for (let b = 0; b < a; b += 1) {
          const diff = a - b;
          const distance = Math.abs(diff - target);
          if (distance >= minDistance && distance <= 4) {
            wrong.push({ display: `${a} − ${b}`, numeric: diff });
          }
        }
      }
      // High targets have few unique correct expressions — shrink the quota
      // instead of filling the board with duplicates.
      const correctCount = Math.min(8, correct.length);
      return buildGrid(correct, wrong, correctCount, seed);
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
