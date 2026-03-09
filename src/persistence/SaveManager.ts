import type { SaveData } from '@/types';

const STORAGE_KEY = 'mathmates_save';
const CURRENT_VERSION = 2;

function defaultSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    completedMissions: {},
    highScores: {},
    impostorCompletedMissions: {},
    impostorHighScores: {},
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

  private migrate(old: SaveData): SaveData {
    if (old.version === 1) {
      // v1 -> v2: add impostor mode save slots
      return {
        ...old,
        version: 2,
        impostorCompletedMissions: {},
        impostorHighScores: {},
      } as SaveData;
    }
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
    this.recordMission(this.data.completedMissions, this.data.highScores, stageId, missionIndex, score);
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

  completeImpostorMission(stageId: string, missionIndex: number, score: number): void {
    this.recordMission(this.data.impostorCompletedMissions, this.data.impostorHighScores, stageId, missionIndex, score);
  }

  private recordMission(
    missions: Record<string, number[]>,
    scores: Record<string, number>,
    stageId: string,
    missionIndex: number,
    score: number,
  ): void {
    if (!missions[stageId]) {
      missions[stageId] = [];
    }
    if (!missions[stageId].includes(missionIndex)) {
      missions[stageId].push(missionIndex);
    }
    const prev = scores[stageId] ?? 0;
    if (score > prev) {
      scores[stageId] = score;
    }
    this.persist();
  }

  getImpostorCompletedMissions(stageId: string): number[] {
    return this.data.impostorCompletedMissions[stageId] ?? [];
  }

  getImpostorHighScore(stageId: string): number {
    return this.data.impostorHighScores[stageId] ?? 0;
  }

  /** Returns true if at least one crew-mode mission has been completed for this stage. */
  hasCrewProgress(stageId: string): boolean {
    const missions = this.data.completedMissions[stageId];
    return !!missions && missions.length > 0;
  }
}
