import { STARTING_LIVES } from '../constants';

export class LivesSystem {
  private _lives: number = STARTING_LIVES;

  get remaining(): number {
    return this._lives;
  }

  get lives(): number {
    return this._lives;
  }

  loseLife(): void {
    if (this._lives > 0) {
      this._lives--;
    }
  }

  isGameOver(): boolean {
    return this._lives <= 0;
  }

  reset(): void {
    this._lives = STARTING_LIVES;
  }
}
