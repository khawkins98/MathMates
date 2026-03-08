import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { createStar } from '@/sprites/StarIcon';
import { createPadlock } from '@/sprites/PadlockIcon';
import { getSortedStages } from '@/stages/index';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/constants';
import type { StageDefinition } from '@/types';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 70;
const CARD_GAP_X = 20;
const CARD_GAP_Y = 14;
const GRID_START_X = (GAME_WIDTH - CARD_WIDTH * 2 - CARD_GAP_X) / 2;
const GRID_START_Y = 50;

export class SelectScene extends Scene {
  private manager: SceneManager;
  private cards: Container[] = [];
  private detailPanel: Container | null = null;
  private launchButton: ButtonSprite | null = null;
  private selectedStage: StageDefinition | null = null;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(): void {
    this.cards = [];
    this.selectedStage = null;

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 20,
      fontWeight: 'bold',
      fill: COLORS.STAR_WHITE,
    });
    const title = new Text({ text: 'SELECT STAGE', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.x = GAME_WIDTH / 2;
    title.y = 10;
    this.root.addChild(title);

    // Back button (top-left)
    const backStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 14,
      fill: COLORS.VISOR_CYAN,
    });
    const backText = new Text({ text: '< Back', style: backStyle });
    backText.x = 10;
    backText.y = 12;
    backText.eventMode = 'static';
    backText.cursor = 'pointer';
    backText.on('pointerdown', () => {
      this.manager.sound.buttonClick();
      this.manager.goto('TITLE');
    });
    this.root.addChild(backText);

    // Build stage cards
    const stages = getSortedStages();
    const allStageInfo = stages.map((s) => ({
      id: s.id,
      difficulty: s.difficulty,
      missionCount: s.missionCount,
    }));

    stages.forEach((stage, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = GRID_START_X + col * (CARD_WIDTH + CARD_GAP_X);
      const y = GRID_START_Y + row * (CARD_HEIGHT + CARD_GAP_Y);

      const unlocked = this.manager.save.isDifficultyUnlocked(allStageInfo, stage.difficulty);
      const card = this.createCard(stage, unlocked);
      card.x = x;
      card.y = y;

      if (unlocked) {
        card.eventMode = 'static';
        card.cursor = 'pointer';
        card.on('pointerdown', () => {
          this.manager.sound.buttonClick();
          this.selectStage(stage);
        });
      }

      this.root.addChild(card);
      this.cards.push(card);
    });

    // Detail panel (shown when a stage is selected)
    this.detailPanel = new Container();
    this.detailPanel.visible = false;
    this.root.addChild(this.detailPanel);
  }

  private createCard(stage: StageDefinition, unlocked: boolean): Container {
    const card = new Container();

    // Background
    const bg = new Graphics();
    const bgColor = unlocked ? 0x2a2f55 : 0x22264a;
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 6).fill(bgColor);
    if (unlocked) {
      bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 6).stroke({ width: 1, color: COLORS.HULL_GREY });
    }
    card.addChild(bg);

    // Stage name
    const nameStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fontWeight: 'bold',
      fill: unlocked ? COLORS.STAR_WHITE : COLORS.HULL_GREY,
    });
    const nameText = new Text({ text: stage.name, style: nameStyle });
    nameText.x = 10;
    nameText.y = 10;
    card.addChild(nameText);

    // Difficulty stars
    for (let i = 0; i < 5; i++) {
      const star = createStar(i < stage.difficulty, 8);
      star.x = 10 + i * 18;
      star.y = 34;
      card.addChild(star);
    }

    // Lock icon or icon text
    if (!unlocked) {
      const padlock = createPadlock(18);
      padlock.x = CARD_WIDTH - 30;
      padlock.y = (CARD_HEIGHT - 18) / 2;
      card.addChild(padlock);
      card.alpha = 0.5;
    } else {
      // Stage icon (emoji-like text)
      const iconStyle = new TextStyle({
        fontFamily: 'monospace',
        fontSize: 20,
        fill: COLORS.STAR_WHITE,
      });
      const iconText = new Text({ text: stage.icon, style: iconStyle });
      iconText.x = CARD_WIDTH - 35;
      iconText.y = (CARD_HEIGHT - 24) / 2;
      card.addChild(iconText);
    }

    return card;
  }

  private selectStage(stage: StageDefinition): void {
    this.selectedStage = stage;

    if (!this.detailPanel) return;

    // Clear previous detail content
    this.detailPanel.removeChildren();
    this.detailPanel.visible = true;

    // Background panel at bottom
    const panelBg = new Graphics();
    const panelY = GAME_HEIGHT - 80;
    panelBg.roundRect(10, panelY, GAME_WIDTH - 20, 70, 6).fill(0x2a2f55);
    panelBg.roundRect(10, panelY, GAME_WIDTH - 20, 70, 6).stroke({
      width: 1,
      color: COLORS.VISOR_CYAN,
    });
    this.detailPanel.addChild(panelBg);

    // Description
    const descStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fill: COLORS.STAR_WHITE,
      wordWrap: true,
      wordWrapWidth: GAME_WIDTH - 200,
    });
    const descText = new Text({ text: stage.description, style: descStyle });
    descText.x = 20;
    descText.y = panelY + 10;
    this.detailPanel.addChild(descText);

    // Mission count
    const missionStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: COLORS.HULL_GREY,
    });
    const missionText = new Text({
      text: `${stage.missionCount} missions`,
      style: missionStyle,
    });
    missionText.x = 20;
    missionText.y = panelY + 45;
    this.detailPanel.addChild(missionText);

    // Launch Mission button
    this.launchButton = new ButtonSprite('Launch Mission', 130, 34, COLORS.SUCCESS_GREEN);
    this.launchButton.x = GAME_WIDTH - 155;
    this.launchButton.y = panelY + 18;
    this.launchButton.onClick = () => {
      if (!this.selectedStage) return;
      this.manager.sound.buttonClick();
      this.manager.goto('BRIEFING', { stage: this.selectedStage, missionIndex: 0 });
    };
    this.detailPanel.addChild(this.launchButton);
  }

  update(_dt: number): void {
    // No continuous animation needed
  }

  exit(): void {
    this.root.removeChildren();
    this.cards = [];
    this.detailPanel = null;
    this.launchButton = null;
    this.selectedStage = null;
  }
}
