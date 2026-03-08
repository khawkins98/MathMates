import { Container, Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { createCrewmateSprite, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/constants';
import type { StageDefinition } from '@/types';

interface GameOverData {
  stage: StageDefinition;
  missionIndex: number;
  score: number;
}

export class GameOverScene extends Scene {
  private manager: SceneManager;
  private data: GameOverData | null = null;
  private elapsed = 0;
  private gameOverText: Text | null = null;
  private ghostCrewmate: Container | null = null;
  private ghostBaseY = 0;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(data?: unknown): void {
    this.data = data as GameOverData;
    if (!this.data) return;

    this.elapsed = 0;

    // "GAME OVER" text
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 36,
      fontWeight: 'bold',
      fill: COLORS.CREW_RED,
      align: 'center',
    });
    this.gameOverText = new Text({ text: 'GAME OVER', style: titleStyle });
    this.gameOverText.anchor.set(0.5);
    this.gameOverText.x = GAME_WIDTH / 2;
    this.gameOverText.y = 80;
    this.root.addChild(this.gameOverText);

    // Ghost crewmate (low alpha, drifting upward)
    this.ghostCrewmate = createCrewmateSprite(CREW_COLORS[0]);
    this.ghostCrewmate.alpha = 0.25;
    this.ghostCrewmate.x = GAME_WIDTH / 2 - 10;
    this.ghostBaseY = GAME_HEIGHT / 2 - 20;
    this.ghostCrewmate.y = this.ghostBaseY;
    this.root.addChild(this.ghostCrewmate);

    // Score display
    const scoreStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fill: COLORS.STAR_WHITE,
    });
    const scoreText = new Text({
      text: `Score: ${this.data.score}`,
      style: scoreStyle,
    });
    scoreText.anchor.set(0.5);
    scoreText.x = GAME_WIDTH / 2;
    scoreText.y = GAME_HEIGHT / 2 + 40;
    this.root.addChild(scoreText);

    // Buttons
    const buttonsY = GAME_HEIGHT / 2 + 90;

    // Retry button
    const retryButton = new ButtonSprite('Retry', 130, 36, COLORS.VISOR_CYAN);
    retryButton.x = GAME_WIDTH / 2 - 145;
    retryButton.y = buttonsY;
    retryButton.onClick = () => {
      if (!this.data) return;
      this.manager.sound.buttonClick();
      this.manager.goto('BRIEFING', {
        stage: this.data.stage,
        missionIndex: this.data.missionIndex,
      });
    };
    this.root.addChild(retryButton);

    // Back to Select button
    const backButton = new ButtonSprite('Back to Select', 130, 36, COLORS.HULL_GREY);
    backButton.x = GAME_WIDTH / 2 + 15;
    backButton.y = buttonsY;
    backButton.onClick = () => {
      this.manager.sound.buttonClick();
      this.manager.goto('SELECT');
    };
    this.root.addChild(backButton);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const t = this.elapsed / 1000;

    // Pulsing "GAME OVER" text: scale oscillation + slight alpha
    if (this.gameOverText) {
      const pulse = 1.0 + 0.05 * Math.sin(t * 2.5);
      this.gameOverText.scale.set(pulse);
      this.gameOverText.alpha = 0.8 + 0.2 * Math.sin(t * 1.5);
    }

    // Ghost crewmate floating upward slowly
    if (this.ghostCrewmate) {
      this.ghostCrewmate.y = this.ghostBaseY - (t * 8); // Slow drift up
      this.ghostCrewmate.alpha = Math.max(0.05, 0.25 - t * 0.01); // Gradually fade
      // Slight horizontal sway
      this.ghostCrewmate.x = GAME_WIDTH / 2 - 10 + Math.sin(t * 0.7) * 15;
    }
  }

  exit(): void {
    this.root.removeChildren();
    this.gameOverText = null;
    this.ghostCrewmate = null;
    this.data = null;
    this.elapsed = 0;
  }
}
