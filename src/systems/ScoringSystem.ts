import {
  POINTS_PER_CORRECT,
  STREAK_INCREMENT,
  STREAK_THRESHOLD,
  STREAK_MAX,
  TIME_BONUS,
} from '../constants';

export class ScoringSystem {
  private _score = 0;
  private _streak = 0;
  private _multiplier = 1;
  private _consecutiveCorrect = 0;

  get score(): number {
    return this._score;
  }

  get streak(): number {
    return this._streak;
  }

  get multiplier(): number {
    return this._multiplier;
  }

  recordCorrect(): void {
    this._score += Math.round(POINTS_PER_CORRECT * this._multiplier);
    this._consecutiveCorrect++;

    if (this._consecutiveCorrect >= STREAK_THRESHOLD) {
      this._streak++;
      this._consecutiveCorrect = 0;
      this._multiplier = Math.min(
        1 + this._streak * STREAK_INCREMENT,
        STREAK_MAX,
      );
    }
  }

  recordWrong(): void {
    this._streak = 0;
    this._consecutiveCorrect = 0;
    this._multiplier = 1;
  }

  applyTimeBonus(elapsed: number, parTime: number): void {
    if (elapsed < parTime) {
      this._score += TIME_BONUS;
    }
  }

  reset(): void {
    this._score = 0;
    this._streak = 0;
    this._multiplier = 1;
    this._consecutiveCorrect = 0;
  }
}
