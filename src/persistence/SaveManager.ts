import type { SaveData } from '@/types';

const STORAGE_KEY = 'mathmates_save';
const CURRENT_VERSION = 1;

function defaultSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    completedMissions: {},
    highScores: {},
    settings: {
      soundEnabled: true,
      impostorEnabled: true,
      unlockAll: false,
    },
  };
}

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as SaveData;
      if (parsed.version !== CURRENT_VERSION) {
        return this.migrate(parsed);
      }
      return parsed;
    } catch {
      return defaultSave();
    }
  }

  private migrate(old: SaveData): SaveData {
    // v1 is the only version, so just reset
    return defaultSave();
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  completeMission(stageId: string, missionIndex: number, score: number): void {
    if (!this.data.completedMissions[stageId]) {
      this.data.completedMissions[stageId] = [];
    }
    if (!this.data.completedMissions[stageId].includes(missionIndex)) {
      this.data.completedMissions[stageId].push(missionIndex);
    }
    const prev = this.data.highScores[stageId] ?? 0;
    if (score > prev) {
      this.data.highScores[stageId] = score;
    }
    this.persist();
  }

  getCompletedMissions(stageId: string): number[] {
    return this.data.completedMissions[stageId] ?? [];
  }

  isStageComplete(stageId: string, missionCount: number): boolean {
    const completed = this.getCompletedMissions(stageId);
    return completed.length >= missionCount;
  }

  getHighScore(stageId: string): number {
    return this.data.highScores[stageId] ?? 0;
  }

  isUnlocked(difficulty: number): boolean {
    if (this.data.settings.unlockAll) return true;
    if (difficulty <= 1) return true;
    // Check if any stage of the previous difficulty tier is complete
    // This is checked by the caller with stage data
    return true; // Default true, actual gating handled by SelectScene
  }

  get settings() {
    return this.data.settings;
  }

  updateSettings(partial: Partial<SaveData['settings']>): void {
    Object.assign(this.data.settings, partial);
    this.persist();
  }

  hasCompletedAnyStageAtDifficulty(
    stages: Array<{ id: string; difficulty: number; missionCount: number }>,
    difficulty: number,
  ): boolean {
    return stages
      .filter((s) => s.difficulty === difficulty)
      .some((s) => this.isStageComplete(s.id, s.missionCount));
  }

  isDifficultyUnlocked(
    stages: Array<{ id: string; difficulty: number; missionCount: number }>,
    difficulty: number,
  ): boolean {
    if (this.data.settings.unlockAll) return true;
    if (difficulty <= 1) return true;
    return this.hasCompletedAnyStageAtDifficulty(stages, difficulty - 1);
  }
}
