export type GameMode = 'crew' | 'impostor';

export type CellState = 'normal' | 'highlighted' | 'consumed' | 'broken' | 'sus' | 'correct_flash' | 'error_flash';

export interface CellValue {
  display: string;
  numeric: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  topic: string;
  ruleText: string;
  briefingText: string;
  ksYears: number[];
  difficulty: 1 | 2 | 3;
  parTime: number;
  generateGrid(seed?: number): CellValue[];
  isCorrect(value: CellValue): boolean;
}

export interface StageDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  scenarios: string[];
}

export interface Scene {
  enter(params?: Record<string, unknown>): void;
  exit(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export type SceneName = 'TITLE' | 'SELECT' | 'BRIEFING' | 'GAME' | 'COMPLETE' | 'GAME_OVER';
