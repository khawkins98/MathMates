import { Container, Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { createStar } from '@/sprites/StarIcon';
import { createMiniCrewmate, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { AnimationSystem } from '@/core/AnimationSystem';
import { Easing } from '@/core/Easing';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, TIME_BONUS } from '@/constants';
import type { StageDefinition } from '@/types';

interface CompleteData {
  stage: StageDefinition;
  missionIndex: number;
  score: number;
  accuracy: number;
  livesRemaining: number;
  maxLives: number;
  elapsed: number;
  parTime: number;
}

export class CompleteScene extends Scene {
  private manager: SceneManager;
  private data: CompleteData | null = null;
  private animations: AnimationSystem;
  private stars: Container[] = [];

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
    this.animations = new AnimationSystem();
  }

  enter(data?: unknown): void {
    this.data = data as CompleteData;
    if (!this.data) return;

    this.animations.clear();
    this.stars = [];

    // Save progress
    this.manager.save.completeMission(
      this.data.stage.id,
      this.data.missionIndex,
      this.data.score,
    );

    // Play complete sound
    this.manager.sound.missionComplete();

    // "MISSION COMPLETE!" title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 28,
      fontWeight: 'bold',
      fill: COLORS.SUCCESS_GREEN,
      align: 'center',
    });
    const titleText = new Text({ text: 'MISSION COMPLETE!', style: titleStyle });
    titleText.anchor.set(0.5);
    titleText.x = GAME_WIDTH / 2;
    titleText.y = 40;
    this.root.addChild(titleText);

    // Score
    const scoreStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fontWeight: 'bold',
      fill: COLORS.STAR_WHITE,
    });
    const scoreText = new Text({
      text: `Score: ${this.data.score}`,
      style: scoreStyle,
    });
    scoreText.anchor.set(0.5);
    scoreText.x = GAME_WIDTH / 2;
    scoreText.y = 90;
    this.root.addChild(scoreText);

    // Accuracy
    const accuracyPercent = Math.round(this.data.accuracy * 100);
    const accStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fill: COLORS.STAR_WHITE,
    });
    const accText = new Text({
      text: `Accuracy: ${accuracyPercent}%`,
      style: accStyle,
    });
    accText.anchor.set(0.5);
    accText.x = GAME_WIDTH / 2;
    accText.y = 120;
    this.root.addChild(accText);

    // Crewmates remaining
    const crewRow = new Container();
    const crewSpacing = 16;
    const totalCrewWidth = this.data.maxLives * crewSpacing;
    for (let i = 0; i < this.data.maxLives; i++) {
      const mini = createMiniCrewmate(CREW_COLORS[i % CREW_COLORS.length]);
      mini.x = i * crewSpacing;
      mini.y = 0;
      if (i >= this.data.livesRemaining) {
        mini.alpha = 0.2; // Lost crewmates greyed out
      }
      crewRow.addChild(mini);
    }
    crewRow.x = GAME_WIDTH / 2 - totalCrewWidth / 2;
    crewRow.y = 150;
    this.root.addChild(crewRow);

    const remainStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: COLORS.HULL_GREY,
    });
    const remainText = new Text({
      text: `${this.data.livesRemaining}/${this.data.maxLives} crewmates`,
      style: remainStyle,
    });
    remainText.anchor.set(0.5);
    remainText.x = GAME_WIDTH / 2;
    remainText.y = 170;
    this.root.addChild(remainText);

    // Time bonus indicator
    const earnedTimeBonus = this.data.elapsed <= this.data.parTime;
    if (earnedTimeBonus) {
      const bonusStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: 'bold',
        fill: COLORS.VISOR_CYAN,
      });
      const bonusText = new Text({
        text: `TIME BONUS +${TIME_BONUS}`,
        style: bonusStyle,
      });
      bonusText.anchor.set(0.5);
      bonusText.x = GAME_WIDTH / 2;
      bonusText.y = 195;
      this.root.addChild(bonusText);
    }

    // Star rating
    const starCount = accuracyPercent >= 90 ? 3 : accuracyPercent >= 70 ? 2 : 1;
    const starSize = 20;
    const starSpacing = 50;
    const starsY = earnedTimeBonus ? 230 : 210;
    const starStartX = GAME_WIDTH / 2 - ((starCount - 1) * starSpacing) / 2;

    for (let i = 0; i < starCount; i++) {
      const star = createStar(true, starSize);
      star.x = starStartX + i * starSpacing - starSize;
      star.y = starsY - starSize;
      star.scale.set(0);
      this.root.addChild(star);
      this.stars.push(star);

      // Animate each star with staggered delay using the animation system
      const delay = i * 300;
      setTimeout(() => {
        this.animations.animate(
          star.scale as unknown as Record<string, number>,
          'x',
          0,
          1,
          400,
          Easing.bounce,
        );
        this.animations.animate(
          star.scale as unknown as Record<string, number>,
          'y',
          0,
          1,
          400,
          Easing.bounce,
        );
      }, delay);
    }

    // Buttons
    const buttonsY = starsY + 60;

    // Next Mission button
    const isLastMission = this.data.missionIndex >= this.data.stage.missionCount - 1;
    const nextLabel = isLastMission ? 'Back to Select' : 'Next Mission';
    const nextButton = new ButtonSprite(nextLabel, 150, 36, COLORS.SUCCESS_GREEN);
    nextButton.x = GAME_WIDTH / 2 - 160;
    nextButton.y = buttonsY;
    nextButton.onClick = () => {
      this.manager.sound.buttonClick();
      if (isLastMission || !this.data) {
        this.manager.goto('SELECT');
      } else {
        this.manager.goto('BRIEFING', {
          stage: this.data.stage,
          missionIndex: this.data.missionIndex + 1,
        });
      }
    };
    this.root.addChild(nextButton);

    // Back to Select button (only show if not last mission, since next already goes to select)
    if (!isLastMission) {
      const backButton = new ButtonSprite('Back to Select', 150, 36, COLORS.HULL_GREY);
      backButton.x = GAME_WIDTH / 2 + 10;
      backButton.y = buttonsY;
      backButton.onClick = () => {
        this.manager.sound.buttonClick();
        this.manager.goto('SELECT');
      };
      this.root.addChild(backButton);
    }
  }

  update(dt: number): void {
    this.animations.update(dt);
  }

  exit(): void {
    this.root.removeChildren();
    this.animations.clear();
    this.stars = [];
    this.data = null;
  }
}
