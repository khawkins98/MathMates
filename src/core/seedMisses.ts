import { SCENARIO_REGISTRY } from '@/scenarios';
import type { CellValue, ScenarioDefinition } from '@/types';
import { getRecentMisses } from './misses';

const MAX_SEEDED = 2;

/**
 * Spaced re-exposure where it counts: facts the child recently got wrong are
 * planted on the next compatible board as CORRECT cells — re-encountering
 * "7 + 8" where eating it is now the right move is where relearning sticks.
 *
 * A miss qualifies when its source scenario shares this scenario's topic
 * (so an addition expression never appears on a multiples board) and the
 * fact is genuinely correct under the current rule.
 */
export function seedMissedFacts(values: CellValue[], scenario: ScenarioDefinition): CellValue[] {
  const candidates = getRecentMisses(10).filter((miss) => {
    const source = SCENARIO_REGISTRY.get(miss.scenarioId);
    if (!source || source.topic !== scenario.topic) {
      return false;
    }
    if (!scenario.isCorrect({ display: miss.display, numeric: miss.numeric })) {
      return false;
    }
    return !values.some((v) => v.display === miss.display);
  });

  if (candidates.length === 0) {
    return values;
  }

  const out = [...values];
  let seeded = 0;
  for (const miss of candidates) {
    if (seeded >= MAX_SEEDED) {
      break;
    }
    // Replace an existing correct cell so the correct/wrong balance is untouched
    const slot = out.findIndex(
      (v, i) => scenario.isCorrect(v) && !candidates.some((c) => c.display === out[i].display),
    );
    if (slot === -1) {
      break;
    }
    out[slot] = { display: miss.display, numeric: miss.numeric };
    seeded += 1;
  }
  return out;
}
