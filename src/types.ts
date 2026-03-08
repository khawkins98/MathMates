export type Direction = 'up' | 'down' | 'left' | 'right';
export type InputAction = 'move_up' | 'move_down' | 'move_left' | 'move_right' | 'eat' | 'sus' | 'pause';

export type GameStateKey =
  | 'TITLE'
  | 'SELECT'
  | 'BRIEFING'
  | 'PLAYING'
  | 'ELIMINATION'
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
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  missionCount: number;
  impostorEnabled: boolean;
  parTime: number;
  generateGrid(missionIndex: number, cols: number, rows: number): GridData;
  getRuleText(missionIndex: number): string;
}

export interface MissionState {
  stageId: string;
  missionIndex: number;
  score: number;
  streak: number;
  multiplier: number;
  livesRemaining: number;
  startTime: number;
  correctEaten: number;
  totalCorrect: number;
  wrongAnswers: number;
}

export interface SaveData {
  version: number;
  completedMissions: Record<string, number[]>; // stageId -> completed mission indices
  highScores: Record<string, number>; // stageId -> best score
  settings: {
    soundEnabled: boolean;
    impostorEnabled: boolean;
    unlockAll: boolean;
  };
}

export interface GameState {
  currentState: GameStateKey;
  selectedStage: StageDefinition | null;
  missionIndex: number;
  mission: MissionState | null;
}
