import { STAGES } from '@/stages';
import type { GameMode } from '@/types';

const STORAGE_KEY = 'mathmates-v2-progress';

export interface ModeProgress {
  completedScenarios: number;
  completed: boolean;
  bestScore: number;
  bestTimeMs: number | null;
}

interface StageProgress {
  crew: ModeProgress;
  impostor: ModeProgress;
}

export interface ProgressData {
  stages: Record<string, StageProgress>;
}

function makeModeProgress(): ModeProgress {
  return {
    completedScenarios: 0,
    completed: false,
    bestScore: 0,
    bestTimeMs: null,
  };
}

function makeDefaultProgress(): ProgressData {
  const stages: Record<string, StageProgress> = {};
  for (const stage of STAGES) {
    stages[stage.id] = {
      crew: makeModeProgress(),
      impostor: makeModeProgress(),
    };
  }
  return { stages };
}

function sanitizeModeProgress(value: Partial<ModeProgress> | undefined): ModeProgress {
  return {
    completedScenarios: Math.max(0, Math.floor(value?.completedScenarios ?? 0)),
    completed: Boolean(value?.completed),
    bestScore: Math.max(0, Math.floor(value?.bestScore ?? 0)),
    bestTimeMs: typeof value?.bestTimeMs === 'number' ? value.bestTimeMs : null,
  };
}

export function getProgress(): ProgressData {
  const fallback = makeDefaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<ProgressData>;
    const merged = makeDefaultProgress();
    for (const stage of STAGES) {
      const stored = parsed.stages?.[stage.id];
      merged.stages[stage.id] = {
        crew: sanitizeModeProgress(stored?.crew),
        impostor: sanitizeModeProgress(stored?.impostor),
      };
      const scenarioCount = stage.scenarios.length;
      merged.stages[stage.id].crew.completedScenarios = Math.min(merged.stages[stage.id].crew.completedScenarios, scenarioCount);
      merged.stages[stage.id].impostor.completedScenarios = Math.min(merged.stages[stage.id].impostor.completedScenarios, scenarioCount);
      merged.stages[stage.id].crew.completed = merged.stages[stage.id].crew.completed || merged.stages[stage.id].crew.completedScenarios >= scenarioCount;
      merged.stages[stage.id].impostor.completed = merged.stages[stage.id].impostor.completed || merged.stages[stage.id].impostor.completedScenarios >= scenarioCount;
    }
    return merged;
  } catch {
    return fallback;
  }
}

function saveProgress(progress: ProgressData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getModeProgress(stageId: string, mode: GameMode, progress = getProgress()): ModeProgress {
  return progress.stages[stageId]?.[mode] ?? makeModeProgress();
}


export function getNextScenarioIndex(stageId: string, mode: GameMode, progress = getProgress()): number {
  const stage = STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) {
    return 0;
  }
  const completed = getModeProgress(stageId, mode, progress).completedScenarios;
  return completed < stage.scenarios.length ? completed : 0;
}

export function recordStageResult(
  stageId: string,
  mode: GameMode,
  scenarioIndex: number,
  score: number,
  timeMs: number,
): { stageJustCompleted: boolean } {
  const progress = getProgress();
  const stageIndex = STAGES.findIndex((stage) => stage.id === stageId);
  if (stageIndex === -1) {
    return { stageJustCompleted: false };
  }

  const stage = STAGES[stageIndex];
  const modeProgress = progress.stages[stageId][mode];
  const wasCompleted = modeProgress.completed;

  modeProgress.completedScenarios = Math.max(modeProgress.completedScenarios, scenarioIndex + 1);
  modeProgress.completed = modeProgress.completedScenarios >= stage.scenarios.length;
  modeProgress.bestScore = Math.max(modeProgress.bestScore, score);
  modeProgress.bestTimeMs = modeProgress.bestTimeMs === null ? timeMs : Math.min(modeProgress.bestTimeMs, timeMs);

  saveProgress(progress);

  const stageJustCompleted = !wasCompleted && modeProgress.completed;

  return { stageJustCompleted };
}
