import type { ScenarioDefinition } from '@/types';
import { buildGrid } from './helpers';

function makeAdditionScenario(
  id: string,
  target: number,
  difficulty: 1 | 2 | 3,
  brief: string,
): ScenarioDefinition {
  return {
    id,
    title: `Add to ${target}`,
    topic: 'addition',
    ruleText: `Find sums equal to ${target}`,
    impostorRuleText: `Break sums that do NOT equal ${target}`,
    briefingText: brief,
    ksYears: difficulty === 1 ? [1] : [1, 2],
    difficulty,
    parTime: 90,
    generateGrid(seed) {
      const correct = [];
      const wrong = [];
      for (let a = 0; a <= target; a += 1) {
        const b = target - a;
        correct.push({ display: `${a} + ${b}`, numeric: target });
      }
      // Distractors are near-misses (within ±1..4 of the target) drawn from the
      // SAME operand range as the correct answers. Two rules this enforces:
      // no "9 + 9" noise on an add-to-5 board, and no "operands over 10 are
      // always correct" tell on the add-to-15/20 boards.
      const maxOperand = target;
      for (let a = 0; a <= maxOperand; a += 1) {
        for (let b = 0; b <= maxOperand; b += 1) {
          const sum = a + b;
          const distance = Math.abs(sum - target);
          if (distance >= 1 && distance <= 4 && sum >= 0 && sum <= 20) {
            wrong.push({ display: `${a} + ${b}`, numeric: sum });
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

export const addition1 = makeAdditionScenario(
  'addition-1',
  5,
  1,
  'Find every sum that equals 5! Use your fingers if you need to!',
);
export const addition2 = makeAdditionScenario(
  'addition-2',
  10,
  2,
  'Great work! Now find every sum that equals 10 — the magic number!',
);
export const addition3 = makeAdditionScenario(
  'addition-3',
  15,
  2,
  'Now we go bigger — find every sum that equals 15! Keep counting on!',
);
export const addition4 = makeAdditionScenario(
  'addition-4',
  20,
  3,
  'The biggest challenge — find every sum that equals 20. You can do it!',
);
