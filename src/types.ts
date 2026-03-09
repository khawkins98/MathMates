export type InputAction = 'move_up' | 'move_down' | 'move_left' | 'move_right' | 'eat' | 'sus' | 'pause';

export type GameMode = 'crew' | 'impostor';

export type LoseReason = 'lives' | 'ai_cleared';

export type GameStateKey =
  | 'TITLE'
  | 'SELECT'
  | 'BRIEFING'
  | 'PLAYING'
  | 'COMPLETE'
  | 'GAME_OVER'
  | 'SETTINGS';

export type CellState = 'normal' | 'highlighted' | 'consumed' | 'correct_flash' | 'error_flash';

export interface GridData {
  cells: (number | string)[];
  correctIndices: Set<number>;
}

export interface StageDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  missionCount: number;
  impostorEnabled: boolean;
  parTime: number;
  generateGrid(missionIndex: number, cols: number, rows: number): GridData;
  getRuleText(missionIndex: number): string;
}

export interface SaveData {
  version: number;
  completedMissions: Record<string, number[]>; // stageId -> completed mission indices
  highScores: Record<string, number>; // stageId -> best score
  impostorCompletedMissions: Record<string, number[]>; // stageId -> completed impostor mission indices
  impostorHighScores: Record<string, number>; // stageId -> best impostor score
  settings: {
    soundEnabled: boolean;
    impostorEnabled: boolean;
    unlockAll: boolean;
  };
}
