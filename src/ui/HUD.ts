import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, GAME_WIDTH, HUD_HEIGHT } from '@/constants';
import { createMiniCrewmate, CREW_COLORS } from '@/sprites/CrewmateSprite';
import type { GameMode } from '@/types';

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
const PROGRESS_BAR_WIDTH = 80;
const PROGRESS_BAR_HEIGHT = 6;

export interface CrewmateStatus {
  color: number;
  alive: boolean;
}

export class HUD extends Container {
  private bg: Graphics;
  private ruleText: Text;
  private scoreText: Text;
  private multiplierText: Text;
  private livesContainer: Container;
  private warningText: Text;
  private warningVisible = false;
  private warningElapsed = 0;
  private modeLabel: Text;
  private progressBarContainer: Container;
  private progressBarBg: Graphics;
  private progressBarFill: Graphics;
  private progressLabel: Text;
  private crewmateStatusContainer: Container;

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

    // Mode indicator label (shown in impostor mode)
    const modeStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 8,
      fontWeight: 'bold',
      fill: COLORS.CREW_RED,
    });
    this.modeLabel = new Text({ text: 'IMPOSTOR', style: modeStyle });
    this.modeLabel.anchor.set(0.5, 0);
    this.modeLabel.x = GAME_WIDTH / 2;
    this.modeLabel.y = 24;
    this.modeLabel.visible = false;
    this.addChild(this.modeLabel);

    // Progress bar (works for both modes)
    this.progressBarContainer = new Container();
    this.progressBarContainer.visible = false;
    this.progressBarContainer.x = GAME_WIDTH / 2 - PROGRESS_BAR_WIDTH / 2;
    this.progressBarContainer.y = 20;
    this.addChild(this.progressBarContainer);

    // Bar background (dark track)
    this.progressBarBg = new Graphics();
    this.progressBarBg.roundRect(0, 0, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, 3).fill(0x222244);
    this.progressBarContainer.addChild(this.progressBarBg);

    // Bar fill (colored portion)
    this.progressBarFill = new Graphics();
    this.progressBarContainer.addChild(this.progressBarFill);

    // Label (e.g. "8/12")
    const progressLabelStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 8,
      fill: COLORS.HULL_GREY,
    });
    this.progressLabel = new Text({ text: '', style: progressLabelStyle });
    this.progressLabel.anchor.set(0, 0.5);
    this.progressLabel.x = PROGRESS_BAR_WIDTH + 4;
    this.progressLabel.y = PROGRESS_BAR_HEIGHT / 2;
    this.progressBarContainer.addChild(this.progressLabel);

    // Crewmate status icons (shown in impostor mode, below lives)
    this.crewmateStatusContainer = new Container();
    this.crewmateStatusContainer.visible = false;
    this.addChild(this.crewmateStatusContainer);
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
    const startX = GAME_WIDTH - 62 - totalWidth;

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

  setModeIndicator(mode: GameMode): void {
    this.modeLabel.visible = mode === 'impostor';
  }

  /**
   * Update the objective progress bar.
   * @param eaten - cells consumed toward the objective
   * @param total - total cells needed for the objective
   * @param color - fill color (green for crew, red for impostor sabotage)
   */
  setProgress(eaten: number, total: number, color: number = COLORS.SUCCESS_GREEN): void {
    this.progressBarContainer.visible = true;
    this.progressLabel.text = `${eaten}/${total}`;

    const fraction = total > 0 ? Math.min(eaten / total, 1) : 0;
    const fillWidth = Math.round(PROGRESS_BAR_WIDTH * fraction);

    this.progressBarFill.clear();
    if (fillWidth > 0) {
      this.progressBarFill.roundRect(0, 0, fillWidth, PROGRESS_BAR_HEIGHT, 3).fill(color);
    }
  }

  setCrewmateStatus(statuses: CrewmateStatus[]): void {
    this.crewmateStatusContainer.removeChildren();
    if (statuses.length === 0) {
      this.crewmateStatusContainer.visible = false;
      return;
    }

    this.crewmateStatusContainer.visible = true;
    const iconSpacing = 14;
    const totalWidth = statuses.length * iconSpacing;
    const startX = GAME_WIDTH - 62 - totalWidth;

    for (let i = 0; i < statuses.length; i++) {
      const mini = createMiniCrewmate(statuses[i].color);
      mini.x = startX + i * iconSpacing;
      mini.alpha = statuses[i].alive ? 1 : 0.2;
      this.crewmateStatusContainer.addChild(mini);
    }

    // Position below lives row
    this.crewmateStatusContainer.y = 20;
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
