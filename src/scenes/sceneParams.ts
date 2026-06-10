import type { GameMode } from '@/types';

export interface MissionParams {
  stageId: string;
  stageIndex: number;
  scenarioIndex: number;
  mode: GameMode;
  seed?: number;
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
