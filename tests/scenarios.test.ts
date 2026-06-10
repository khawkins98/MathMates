import { describe, expect, it } from 'vitest';
import { GRID_COLS, GRID_ROWS } from '@/constants';
import { SCENARIO_REGISTRY } from '@/scenarios';
import { buildGrid, seededRng, shuffle } from '@/scenarios/helpers';

const CELL_COUNT = GRID_COLS * GRID_ROWS;
const SEEDS = [1, 42, 999, 123456, 654321];

describe('scenario registry', () => {
  it('contains every scenario referenced by a stage', async () => {
    const { STAGES } = await import('@/stages');
    for (const stage of STAGES) {
      for (const id of stage.scenarios) {
        expect(SCENARIO_REGISTRY.get(id), `stage ${stage.id} references missing scenario ${id}`).toBeDefined();
      }
    }
  });
});

describe.each([...SCENARIO_REGISTRY.entries()])('scenario %s', (id, scenario) => {
  it.each(SEEDS)('seed %i: generates a full, playable grid', (seed) => {
    const grid = scenario.generateGrid(seed);

    expect(grid).toHaveLength(CELL_COUNT);

    const correct = grid.filter((v) => scenario.isCorrect(v));
    const wrong = grid.filter((v) => !scenario.isCorrect(v));

    // CONTRIBUTING: every grid needs >=3 correct and >=3 wrong cells so both
    // crew mode and impostor mode are completable.
    expect(correct.length, `${id} must be winnable in crew mode`).toBeGreaterThanOrEqual(3);
    expect(wrong.length, `${id} must be winnable in impostor mode`).toBeGreaterThanOrEqual(3);

    for (const value of grid) {
      expect(value.display).toBeTruthy();
      expect(Number.isFinite(value.numeric)).toBe(true);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = scenario.generateGrid(7777);
    const b = scenario.generateGrid(7777);
    expect(a).toEqual(b);
  });

  it('has rule text for both modes', () => {
    expect(scenario.ruleText).toBeTruthy();
    expect(scenario.impostorRuleText).toBeTruthy();
    expect(scenario.briefingText).toBeTruthy();
  });
});

describe('helpers', () => {
  it('seededRng is deterministic and in [0, 1)', () => {
    const a = seededRng(123);
    const b = seededRng(123);
    for (let i = 0; i < 100; i += 1) {
      const va = a();
      expect(va).toBe(b());
      expect(va).toBeGreaterThanOrEqual(0);
      expect(va).toBeLessThan(1);
    }
  });

  it('shuffle preserves elements', () => {
    const rng = seededRng(5);
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffle(input, rng);
    expect([...out].sort()).toEqual([...input].sort());
    expect(input).toEqual([1, 2, 3, 4, 5, 6]); // input not mutated
  });

  it('buildGrid honours the requested correct count', () => {
    const correct = [{ display: 'C', numeric: 1 }];
    const wrong = [{ display: 'W', numeric: 0 }];
    const grid = buildGrid(correct, wrong, 8, 1);
    expect(grid).toHaveLength(CELL_COUNT);
    expect(grid.filter((v) => v.numeric === 1)).toHaveLength(8);
    expect(grid.filter((v) => v.numeric === 0)).toHaveLength(CELL_COUNT - 8);
  });
});
