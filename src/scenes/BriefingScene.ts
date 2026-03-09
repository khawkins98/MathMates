import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { createMiniCrewmate, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { Easing } from '@/core/Easing';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, COUNTDOWN_STEP_MS, STARTING_LIVES } from '@/constants';
import type { StageDefinition, GameMode } from '@/types';

interface BriefingData {
  stage: StageDefinition;
  missionIndex: number;
  mode?: GameMode;
}

const enum CountdownPhase {
  Rule,
  Three,
  Two,
  One,
  Go,
  Done,
}

export class BriefingScene extends Scene {
  private manager: SceneManager;
  private data: BriefingData | null = null;
  private phase: CountdownPhase = CountdownPhase.Rule;
  private phaseElapsed = 0;
  private countdownText: Text | null = null;
  private ruleContainer: Container | null = null;
  private ruleDisplayTime = 2500; // ms to show rule before countdown starts

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(data?: unknown): void {
    this.data = data as BriefingData;
    if (!this.data) return;

    this.phase = CountdownPhase.Rule;
    this.phaseElapsed = 0;

    // Semi-transparent dark overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.75 });
    this.root.addChild(overlay);

    // Rule container (shown during Rule phase)
    this.ruleContainer = new Container();
    this.root.addChild(this.ruleContainer);

    const mode = this.data.mode ?? 'crew';
    const isImpostor = mode === 'impostor';
    const accentColor = isImpostor ? COLORS.CREW_RED : COLORS.VISOR_CYAN;

    // Stage name
    const nameStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 18,
      fontWeight: 'bold',
      fill: accentColor,
      align: 'center',
    });
    const nameText = new Text({
      text: `${this.data.stage.name} - Mission ${this.data.missionIndex + 1}`,
      style: nameStyle,
    });
    nameText.anchor.set(0.5);
    nameText.x = GAME_WIDTH / 2;
    nameText.y = GAME_HEIGHT / 2 - 80;
    this.ruleContainer.addChild(nameText);

    // Rule text — invert for impostor mode
    const baseRule = this.data.stage.getRuleText(this.data.missionIndex);
    const ruleDisplay = isImpostor
      ? `Sabotage! Eat everything that ISN'T:\n${baseRule}`
      : baseRule;
    const ruleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: isImpostor ? 18 : 22,
      fontWeight: 'bold',
      fill: COLORS.STAR_WHITE,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: GAME_WIDTH - 80,
    });
    const ruleText = new Text({
      text: ruleDisplay,
      style: ruleStyle,
    });
    ruleText.anchor.set(0.5);
    ruleText.x = GAME_WIDTH / 2;
    ruleText.y = GAME_HEIGHT / 2 - 20;
    this.ruleContainer.addChild(ruleText);

    // Flavor text for impostor mode
    if (isImpostor) {
      const flavorStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 11,
        fill: COLORS.CREW_RED,
        align: 'center',
      });
      const flavorText = new Text({
        text: 'You are the impostor. Eat WRONG answers to sabotage!',
        style: flavorStyle,
      });
      flavorText.anchor.set(0.5);
      flavorText.x = GAME_WIDTH / 2;
      flavorText.y = GAME_HEIGHT / 2 + 20;
      this.ruleContainer.addChild(flavorText);
    }

    // Mini crewmate row (showing life count)
    const crewRow = new Container();
    const crewSpacing = 16;
    const totalWidth = STARTING_LIVES * crewSpacing;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    for (let i = 0; i < STARTING_LIVES; i++) {
      const mini = createMiniCrewmate(CREW_COLORS[i % CREW_COLORS.length]);
      mini.x = startX + i * crewSpacing;
      mini.y = 0;
      crewRow.addChild(mini);
    }
    crewRow.x = 0;
    crewRow.y = GAME_HEIGHT / 2 + 40;
    this.ruleContainer.addChild(crewRow);

    // Countdown text (hidden initially)
    const countdownStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 72,
      fontWeight: 'bold',
      fill: COLORS.STAR_WHITE,
      align: 'center',
    });
    this.countdownText = new Text({ text: '', style: countdownStyle });
    this.countdownText.anchor.set(0.5);
    this.countdownText.x = GAME_WIDTH / 2;
    this.countdownText.y = GAME_HEIGHT / 2;
    this.countdownText.visible = false;
    this.root.addChild(this.countdownText);
  }

  update(dt: number): void {
    if (!this.data || !this.countdownText) return;

    this.phaseElapsed += dt;

    switch (this.phase) {
      case CountdownPhase.Rule:
        if (this.phaseElapsed >= this.ruleDisplayTime) {
          this.advancePhase();
        }
        break;

      case CountdownPhase.Three:
      case CountdownPhase.Two:
      case CountdownPhase.One:
        this.animateCountdownNumber(dt);
        if (this.phaseElapsed >= COUNTDOWN_STEP_MS) {
          this.advancePhase();
        }
        break;

      case CountdownPhase.Go:
        this.animateCountdownNumber(dt);
        if (this.phaseElapsed >= COUNTDOWN_STEP_MS) {
          this.advancePhase();
        }
        break;

      case CountdownPhase.Done:
        // Transition has been triggered
        break;
    }
  }

  private animateCountdownNumber(_dt: number): void {
    if (!this.countdownText) return;

    // Scale in from 2x to 1x with easing
    const progress = Math.min(this.phaseElapsed / COUNTDOWN_STEP_MS, 1);
    const eased = Easing.easeOutQuad(progress);
    const scale = 2 - eased; // 2x -> 1x
    this.countdownText.scale.set(scale);

    // Fade in at start
    this.countdownText.alpha = Math.min(progress * 4, 1);
  }

  private advancePhase(): void {
    this.phaseElapsed = 0;

    switch (this.phase) {
      case CountdownPhase.Rule:
        this.phase = CountdownPhase.Three;
        if (this.ruleContainer) this.ruleContainer.visible = false;
        if (this.countdownText) {
          this.countdownText.visible = true;
          this.countdownText.text = '3';
          this.countdownText.scale.set(2);
        }
        this.manager.sound.countdownBeep();
        break;

      case CountdownPhase.Three:
        this.phase = CountdownPhase.Two;
        if (this.countdownText) {
          this.countdownText.text = '2';
          this.countdownText.scale.set(2);
        }
        this.manager.sound.countdownBeep();
        break;

      case CountdownPhase.Two:
        this.phase = CountdownPhase.One;
        if (this.countdownText) {
          this.countdownText.text = '1';
          this.countdownText.scale.set(2);
        }
        this.manager.sound.countdownBeep();
        break;

      case CountdownPhase.One:
        this.phase = CountdownPhase.Go;
        if (this.countdownText) {
          this.countdownText.text = 'GO!';
          this.countdownText.style.fill = COLORS.SUCCESS_GREEN;
          this.countdownText.scale.set(2);
        }
        this.manager.sound.countdownGo();
        break;

      case CountdownPhase.Go:
        this.phase = CountdownPhase.Done;
        if (this.data) {
          this.manager.goto('PLAYING', {
            stage: this.data.stage,
            missionIndex: this.data.missionIndex,
            mode: this.data.mode ?? 'crew',
          });
        }
        break;
    }
  }

  exit(): void {
    this.destroyChildren();
    this.countdownText = null;
    this.ruleContainer = null;
    this.data = null;
    this.phase = CountdownPhase.Rule;
    this.phaseElapsed = 0;
  }
}
