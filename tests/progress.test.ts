import { beforeEach, describe, expect, it, vi } from 'vitest';

// progress.ts touches window.localStorage at call time — stub a minimal
// implementation before importing the module.
const store = new Map<string, string>();
let throwOnSet = false;

vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (throwOnSet) {
        throw new DOMException('QuotaExceededError');
      }
      store.set(key, value);
    },
  },
});

const { getProgress, getModeProgress, getNextScenarioIndex, recordStageResult } = await import('@/core/progress');
const { STAGES } = await import('@/stages');

const KEY = 'mathmates-v2-progress';
const firstStage = STAGES[0];

beforeEach(() => {
  store.clear();
  throwOnSet = false;
});

describe('getProgress', () => {
  it('returns defaults when storage is empty', () => {
    const progress = getProgress();
    for (const stage of STAGES) {
      expect(progress.stages[stage.id].crew.completedScenarios).toBe(0);
      expect(progress.stages[stage.id].crew.completed).toBe(false);
    }
  });

  it('survives corrupt JSON', () => {
    store.set(KEY, '{not json');
    expect(() => getProgress()).not.toThrow();
    expect(getProgress().stages[firstStage.id].crew.completedScenarios).toBe(0);
  });

  it('rejects non-finite and junk numeric values', () => {
    store.set(KEY, JSON.stringify({
      stages: {
        [firstStage.id]: {
          crew: { completedScenarios: 'abc', completed: 'yes', bestScore: NaN, bestTimeMs: 'fast' },
          impostor: { completedScenarios: Infinity, bestScore: -5 },
        },
      },
    }));
    const mode = getModeProgress(firstStage.id, 'crew');
    expect(mode.completedScenarios).toBe(0);
    expect(mode.bestScore).toBe(0);
    expect(mode.bestTimeMs).toBeNull();
    const impostor = getModeProgress(firstStage.id, 'impostor');
    expect(impostor.completedScenarios).toBe(0);
    expect(impostor.bestScore).toBe(0);
  });

  it('clamps completedScenarios to the stage scenario count', () => {
    store.set(KEY, JSON.stringify({
      stages: { [firstStage.id]: { crew: { completedScenarios: 99 } } },
    }));
    const mode = getModeProgress(firstStage.id, 'crew');
    expect(mode.completedScenarios).toBe(firstStage.scenarios.length);
    expect(mode.completed).toBe(true);
  });
});

describe('recordStageResult', () => {
  it('round-trips through storage', () => {
    recordStageResult(firstStage.id, 'crew', 0, 120, 45000);
    const mode = getModeProgress(firstStage.id, 'crew');
    expect(mode.completedScenarios).toBe(1);
    expect(mode.bestScore).toBe(120);
    expect(mode.bestTimeMs).toBe(45000);
  });

  it('keeps the best score and time across results', () => {
    recordStageResult(firstStage.id, 'crew', 0, 120, 45000);
    recordStageResult(firstStage.id, 'crew', 0, 80, 30000);
    const mode = getModeProgress(firstStage.id, 'crew');
    expect(mode.bestScore).toBe(120);
    expect(mode.bestTimeMs).toBe(30000);
  });

  it('reports stageJustCompleted exactly once', () => {
    const results = firstStage.scenarios.map((_, i) =>
      recordStageResult(firstStage.id, 'crew', i, 100, 60000));
    expect(results[results.length - 1].stageJustCompleted).toBe(true);
    const again = recordStageResult(firstStage.id, 'crew', 0, 100, 60000);
    expect(again.stageJustCompleted).toBe(false);
  });

  it('does not throw when storage writes fail (private browsing / quota)', () => {
    throwOnSet = true;
    expect(() => recordStageResult(firstStage.id, 'crew', 0, 100, 60000)).not.toThrow();
  });

  it('returns a safe result for an unknown stage', () => {
    expect(recordStageResult('no-such-stage', 'crew', 0, 1, 1)).toEqual({ stageJustCompleted: false });
  });
});

describe('getNextScenarioIndex', () => {
  it('advances through scenarios then wraps to 0 when complete', () => {
    expect(getNextScenarioIndex(firstStage.id, 'crew')).toBe(0);
    recordStageResult(firstStage.id, 'crew', 0, 100, 60000);
    expect(getNextScenarioIndex(firstStage.id, 'crew')).toBe(1);
    for (let i = 1; i < firstStage.scenarios.length; i += 1) {
      recordStageResult(firstStage.id, 'crew', i, 100, 60000);
    }
    expect(getNextScenarioIndex(firstStage.id, 'crew')).toBe(0);
  });
});
