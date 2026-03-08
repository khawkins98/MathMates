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
      const parsed = JSON.parse(raw);
      if (!this.isValidSave(parsed)) return defaultSave();
      if (parsed.version !== CURRENT_VERSION) {
        return this.migrate(parsed);
      }
      return parsed;
    } catch {
      return defaultSave();
    }
  }

  private isValidSave(data: unknown): data is SaveData {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.version === 'number' &&
      typeof d.completedMissions === 'object' && d.completedMissions !== null &&
      typeof d.highScores === 'object' && d.highScores !== null &&
      typeof d.settings === 'object' && d.settings !== null
    );
  }

  private migrate(_old: SaveData): SaveData {
    // v1 is the only version, so just reset
    return defaultSave();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // QuotaExceededError or SecurityError — silently ignore
    }
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
