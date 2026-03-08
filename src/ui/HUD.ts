import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, GAME_WIDTH, HUD_HEIGHT } from '@/constants';
import { createMiniCrewmate, CREW_COLORS } from '@/sprites/CrewmateSprite';

const RULE_STYLE = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 10,
  fill: COLORS.STAR_WHITE,
  wordWrap: true,
  wordWrapWidth: 180,
});

const SCORE_STYLE = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
  fill: COLORS.STAR_WHITE,
  align: 'center',
});

const MULTIPLIER_STYLE = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 10,
  fontWeight: 'bold',
  fill: COLORS.SUCCESS_GREEN,
  align: 'center',
});

const WARNING_STYLE = new TextStyle({
  fontFamily: 'monospace',
  fontSize: 10,
  fontWeight: 'bold',
  fill: COLORS.CREW_RED,
});

/**
 * Top bar HUD during gameplay.
 * 32px tall, full width (520px).
 * Left: rule text. Center: score + streak multiplier. Right: lives + impostor warning.
 */
export class HUD extends Container {
  private bg: Graphics;
  private ruleText: Text;
  private scoreText: Text;
  private multiplierText: Text;
  private livesContainer: Container;
  private warningText: Text;
  private warningVisible = false;
  private warningElapsed = 0;

  constructor() {
    super();

    // Background bar
    this.bg = new Graphics();
    this.bg.rect(0, 0, GAME_WIDTH, HUD_HEIGHT).fill(0x111328);
    this.addChild(this.bg);

    // Rule text (left)
    this.ruleText = new Text({ text: '', style: RULE_STYLE });
    this.ruleText.x = 6;
    this.ruleText.y = 4;
    this.addChild(this.ruleText);

    // Score (center area)
    this.scoreText = new Text({ text: '0', style: SCORE_STYLE });
    this.scoreText.anchor.set(0.5, 0);
    this.scoreText.x = GAME_WIDTH / 2;
    this.scoreText.y = 3;
    this.addChild(this.scoreText);

    // Multiplier (center, below score)
    this.multiplierText = new Text({ text: '', style: MULTIPLIER_STYLE });
    this.multiplierText.anchor.set(0.5, 0);
    this.multiplierText.x = GAME_WIDTH / 2;
    this.multiplierText.y = 18;
    this.addChild(this.multiplierText);

    // Lives container (right side)
    this.livesContainer = new Container();
    this.livesContainer.y = 8;
    this.addChild(this.livesContainer);

    // Impostor warning indicator (right side, below lives)
    this.warningText = new Text({ text: '! IMPOSTOR', style: WARNING_STYLE });
    this.warningText.anchor.set(1, 0.5);
    this.warningText.x = GAME_WIDTH - 6;
    this.warningText.y = HUD_HEIGHT / 2;
    this.warningText.visible = false;
    this.addChild(this.warningText);
  }

  setRule(text: string): void {
    this.ruleText.text = text;
  }

  setScore(n: number): void {
    this.scoreText.text = String(n);
  }

  setMultiplier(n: number): void {
    if (n <= 1) {
      this.multiplierText.text = '';
    } else {
      this.multiplierText.text = `x${n}`;
    }
  }

  setLives(n: number, max: number): void {
    // Rebuild mini crewmate icons
    this.livesContainer.removeChildren();

    const iconSpacing = 14;
    const totalWidth = max * iconSpacing;
    const startX = GAME_WIDTH - 6 - totalWidth;

    for (let i = 0; i < max; i++) {
      const mini = createMiniCrewmate(CREW_COLORS[0]);
      mini.x = startX + i * iconSpacing;

      // Dim lost lives
      if (i >= n) {
        mini.alpha = 0.2;
      }

      this.livesContainer.addChild(mini);
    }
  }

  showImpostorWarning(show: boolean): void {
    this.warningVisible = show;
    this.warningText.visible = show;
    if (!show) {
      this.warningElapsed = 0;
      this.warningText.alpha = 1;
    }
  }

  /**
   * Updates time-based effects (impostor warning pulse).
   * @param dt - delta time in ms
   */
  update(dt: number): void {
    if (this.warningVisible) {
      this.warningElapsed += dt;
      // Pulse alpha between 0.3 and 1.0
      const cycle = (Math.sin(this.warningElapsed * 0.006) + 1) / 2;
      this.warningText.alpha = 0.3 + cycle * 0.7;
    }
  }
}
