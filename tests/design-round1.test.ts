import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();

vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  },
});

const { recordMiss, getRecentMisses, getTopMisses } = await import('@/core/misses');
const { getModeProgress, recordStageResult } = await import('@/core/progress');
const { STAGES } = await import('@/stages');
const { SCENARIO_REGISTRY } = await import('@/scenarios');
const { Grid } = await import('@/entities/Grid');
const { FLASH_DURATION } = await import('@/constants');

beforeEach(() => {
  store.clear();
});

describe('miss log', () => {
  it('records and surfaces recent misses, deduplicated', () => {
    recordMiss('3 + 4', 7, 'addition-1');
    recordMiss('3 + 4', 7, 'addition-1');
    recordMiss('9 − 2', 7, 'subtraction-1');
    const recent = getRecentMisses(5);
    expect(recent.map((m) => m.display)).toEqual(['9 − 2', '3 + 4']);
  });

  it('ranks top misses by frequency', () => {
    recordMiss('3 + 4', 7, 'addition-1');
    recordMiss('3 + 4', 7, 'addition-1');
    recordMiss('6 + 8', 14, 'addition-2');
    const top = getTopMisses(2);
    expect(top[0]).toMatchObject({ display: '3 + 4', count: 2 });
  });

  it('survives corrupt storage', () => {
    store.set('mathmates-v2-misses', '{nope');
    expect(getRecentMisses(3)).toEqual([]);
    expect(() => recordMiss('1 + 1', 2, 'addition-1')).not.toThrow();
  });
});

describe('badges', () => {
  const stage = STAGES[0];

  it('stores the best badge rating per scenario', () => {
    recordStageResult(stage.id, 'crew', 0, 100, 60000, 2);
    recordStageResult(stage.id, 'crew', 0, 80, 50000, 1);
    expect(getModeProgress(stage.id, 'crew').badges[0]).toBe(2);
    recordStageResult(stage.id, 'crew', 0, 120, 40000, 3);
    expect(getModeProgress(stage.id, 'crew').badges[0]).toBe(3);
  });

  it('clamps badge values from corrupt storage', () => {
    store.set('mathmates-v2-progress', JSON.stringify({
      stages: { [stage.id]: { crew: { badges: [99, -1, 'x'] } } },
    }));
    expect(getModeProgress(stage.id, 'crew').badges).toEqual([3, 0, 0]);
  });
});

describe('honest distractors', () => {
  it('addition grids contain no operands outside the correct range (no ">10 = correct" tell)', () => {
    for (const id of ['addition-3', 'addition-4']) {
      const scenario = SCENARIO_REGISTRY.get(id)!;
      for (const seed of [1, 99, 4242]) {
        const grid = scenario.generateGrid(seed);
        const wrongWithBigOperand = grid.filter((v) => {
          if (scenario.isCorrect(v)) {
            return false;
          }
          const parts = v.display.split('+').map((p) => parseInt(p.trim(), 10));
          return parts.some((n) => n > 10);
        });
        expect(wrongWithBigOperand.length, `${id} seed ${seed}: wrong answers must also use operands > 10`).toBeGreaterThan(0);
      }
    }
  });

  it('every wrong addition answer is a near-miss (within 4 of the target)', () => {
    const scenario = SCENARIO_REGISTRY.get('addition-1')!;
    const target = 5;
    for (const seed of [7, 1234]) {
      for (const v of scenario.generateGrid(seed)) {
        if (!scenario.isCorrect(v)) {
          expect(Math.abs(v.numeric - target)).toBeLessThanOrEqual(4);
          expect(Math.abs(v.numeric - target)).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('difficulty-1 subtraction never asks about numbers beyond 10', () => {
    const scenario = SCENARIO_REGISTRY.get('subtraction-1')!;
    for (const seed of [3, 555]) {
      for (const v of scenario.generateGrid(seed)) {
        const minuend = parseInt(v.display.split('−')[0].trim(), 10);
        expect(minuend).toBeLessThanOrEqual(10);
      }
    }
  });

  it('high-target subtraction shrinks the quota instead of duplicating cells', () => {
    const scenario = SCENARIO_REGISTRY.get('subtraction-4')!;
    const grid = scenario.generateGrid(42);
    const correct = grid.filter((v) => scenario.isCorrect(v));
    const unique = new Set(correct.map((v) => v.display));
    expect(unique.size).toBe(correct.length);
    expect(correct.length).toBeGreaterThanOrEqual(3);
  });
});

describe('hungry impostor grid support', () => {
  function makeGrid() {
    const values = Array.from({ length: 20 }, (_, i) => ({
      display: i < 8 ? `C${i}` : `W${i}`,
      numeric: i < 8 ? 1 : 0,
    }));
    return new Grid(values, (v) => v.numeric === 1);
  }

  it('stealCorrectCell removes the answer from board AND quota', () => {
    const grid = makeGrid();
    expect(grid.totalCorrect).toBe(8);
    expect(grid.stealCorrectCell(0, 0)).toBe(true);
    expect(grid.totalCorrect).toBe(7);
    expect(grid.isCorrectCell(0, 0)).toBe(false);
    // Mission still completable: eat the remaining 7
    for (let i = 1; i < 8; i += 1) {
      grid.consumeCell(i % 5, Math.floor(i / 5));
      grid.update(FLASH_DURATION + 1);
    }
    expect(grid.isCleared()).toBe(true);
  });

  it('cannot steal wrong or already-consumed cells', () => {
    const grid = makeGrid();
    expect(grid.stealCorrectCell(4, 3)).toBe(false); // wrong cell
    grid.consumeCell(0, 0);
    grid.update(FLASH_DURATION + 1);
    expect(grid.stealCorrectCell(0, 0)).toBe(false); // already eaten
  });

  it('wrong eats leave the cell on the board', () => {
    const grid = makeGrid();
    expect(grid.consumeCell(4, 3)).toBe(false);
    grid.update(FLASH_DURATION + 1);
    expect(grid.getCellAt(4, 3)?.state).toBe('normal');
  });

  it('getCorrectAvailablePositions tracks remaining targets', () => {
    const grid = makeGrid();
    expect(grid.getCorrectAvailablePositions()).toHaveLength(8);
    grid.consumeCell(0, 0);
    grid.update(FLASH_DURATION + 1);
    expect(grid.getCorrectAvailablePositions()).toHaveLength(7);
  });
});
