import type { GameMode } from '@/types';

export interface MissionParams {
  stageId: string;
  stageIndex: number;
  scenarioIndex: number;
  mode: GameMode;
  seed?: number;
}

export function isMissionParams(value: unknown): value is MissionParams {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<MissionParams>;
  return typeof candidate.stageId === 'string'
    && typeof candidate.stageIndex === 'number'
    && typeof candidate.scenarioIndex === 'number'
    && (candidate.mode === 'crew' || candidate.mode === 'impostor');
}

/** Fresh per-mission RNG seed, kept small so it survives JSON round-trips cleanly. */
export function makeMissionSeed(): number {
  return Date.now() % 1000000;
}

export interface CompleteSceneParams extends MissionParams {
  stageTitle: string;
  scenarioTitle: string;
  score: number;
  accuracy: number;
  timeMs: number;
  lives: number;
  bonusAwarded: boolean;
  nextMission: MissionParams | null;
}

export interface GameOverSceneParams {
  retryMission: MissionParams;
  stageTitle: string;
  scenarioTitle: string;
  score: number;
  mode: GameMode;
  /** What drained the last life — drives the failure message. */
  reason: 'mistakes' | 'impostor';
}
