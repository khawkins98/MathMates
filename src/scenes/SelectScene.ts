import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { createStar } from '@/sprites/StarIcon';
import { createPadlock } from '@/sprites/PadlockIcon';
import { getSortedStages } from '@/stages/index';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, PIXEL_FONT } from '@/constants';
import type { StageDefinition, GameMode } from '@/types';

const CARD_WIDTH = 160;
const CARD_HEIGHT = 54;
const CARD_GAP_X = 8;
const CARD_GAP_Y = 4;
const GRID_COLS = 3;
const GRID_START_X = Math.round((GAME_WIDTH - CARD_WIDTH * GRID_COLS - CARD_GAP_X * (GRID_COLS - 1)) / 2);
const GRID_START_Y = 36;

// Bottom detail panel
const PANEL_H = 110;
// Layout rows within the panel (relative to panelY):
const DESC_Y   = 8;   // description text
const MISS_Y   = 56;  // mission count (reserves 3 lines × 16px = 48px for description)
const MODE_Y   = 74;  // crew/impostor mode buttons (22px tall → bottom at 96)
const LAUNCH_Y = 33;  // launch button top (height=44 → centred in 110px panel)

export class SelectScene extends Scene {
  private manager: SceneManager;
  private cards: Container[] = [];
  private detailPanel: Container | null = null;
  private launchButton: ButtonSprite | null = null;
  private selectedStage: StageDefinition | null = null;
  private selectedMode: GameMode = 'crew';
  private panelBorder: Graphics | null = null;
  private crewBtn: ButtonSprite | null = null;
  private impostorBtn: ButtonSprite | null = null;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(): void {
    this.cards = [];
    this.selectedStage = null;

    // Title
    const titleStyle = new TextStyle({
      fontFamily: PIXEL_FONT,
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
      fontFamily: PIXEL_FONT,
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
      const col = index % GRID_COLS;
      const row = Math.floor(index / GRID_COLS);
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

    // Stage name — wrap text so long titles stay within the card
    const nameWrapWidth = unlocked ? CARD_WIDTH - 16 : CARD_WIDTH - 36;
    const nameStyle = new TextStyle({
      fontFamily: PIXEL_FONT,
      fontSize: 10,
      fontWeight: 'bold',
      fill: unlocked ? COLORS.STAR_WHITE : COLORS.HULL_GREY,
      wordWrap: true,
      wordWrapWidth: nameWrapWidth,
    });
    const nameText = new Text({ text: stage.name, style: nameStyle });
    nameText.x = 8;
    nameText.y = 6;
    card.addChild(nameText);

    // Difficulty stars — fixed row near the bottom of the card
    for (let i = 0; i < 5; i++) {
      const star = createStar(i < stage.difficulty, 7);
      star.x = 8 + i * 14;
      star.y = CARD_HEIGHT - 16;
      card.addChild(star);
    }

    // Lock icon top-right (reserved column keeps text from flowing beneath it)
    if (!unlocked) {
      const padlock = createPadlock(14);
      padlock.x = CARD_WIDTH - 22;
      padlock.y = 6;
      card.addChild(padlock);
      card.alpha = 0.5;
    }

    return card;
  }

  private selectStage(stage: StageDefinition): void {
    this.selectedStage = stage;
    this.selectedMode = 'crew';

    if (!this.detailPanel) return;

    this.detailPanel.removeChildren();
    this.detailPanel.visible = true;

    const panelY = GAME_HEIGHT - PANEL_H;

    this.panelBorder = new Graphics();
    this.drawPanelBorder(panelY, COLORS.VISOR_CYAN);
    this.detailPanel.addChild(this.panelBorder);

    // Description — reserved area for up to 3 lines (DESC_Y to MISS_Y)
    const descStyle = new TextStyle({
      fontFamily: PIXEL_FONT,
      fontSize: 10,
      fill: COLORS.STAR_WHITE,
      wordWrap: true,
      wordWrapWidth: 310,
    });
    const descText = new Text({ text: stage.description, style: descStyle });
    descText.x = 20;
    descText.y = panelY + DESC_Y;
    this.detailPanel.addChild(descText);

    // Mission count
    const missionStyle = new TextStyle({
      fontFamily: PIXEL_FONT,
      fontSize: 8,
      fill: COLORS.HULL_GREY,
    });
    const missionText = new Text({
      text: `${stage.missionCount} missions`,
      style: missionStyle,
    });
    missionText.x = 20;
    missionText.y = panelY + MISS_Y;
    this.detailPanel.addChild(missionText);

    // Mode toggle buttons — short labels fit the low-res cards
    const hasCrewProgress = this.manager.save.hasCrewProgress(stage.id);

    this.crewBtn = new ButtonSprite('CREW', 60, 22, COLORS.VISOR_CYAN, 10);
    this.crewBtn.x = 20;
    this.crewBtn.y = panelY + MODE_Y;
    this.crewBtn.onClick = () => this.setMode('crew');
    this.detailPanel.addChild(this.crewBtn);

    const impostorColor = hasCrewProgress ? COLORS.HULL_GREY : 0x333355;
    this.impostorBtn = new ButtonSprite('IMPOSTOR', 96, 22, impostorColor, 10);
    this.impostorBtn.x = 88;
    this.impostorBtn.y = panelY + MODE_Y;
    if (hasCrewProgress) {
      this.impostorBtn.onClick = () => this.setMode('impostor');
    } else {
      this.impostorBtn.alpha = 0.4;
    }
    this.detailPanel.addChild(this.impostorBtn);

    // Launch button — right side, vertically centred in panel
    this.launchButton = new ButtonSprite('LAUNCH', 145, 44, COLORS.SUCCESS_GREEN);
    this.launchButton.x = GAME_WIDTH - 158;
    this.launchButton.y = panelY + LAUNCH_Y;
    this.launchButton.onClick = () => {
      if (!this.selectedStage) return;
      this.manager.sound.buttonClick();
      this.manager.goto('BRIEFING', {
        stage: this.selectedStage,
        missionIndex: 0,
        mode: this.selectedMode,
      });
    };
    this.detailPanel.addChild(this.launchButton);
  }

  private setMode(mode: GameMode): void {
    if (this.selectedMode === mode) return;
    this.selectedMode = mode;
    this.manager.sound.buttonClick();

    const panelY = GAME_HEIGHT - PANEL_H;
    const borderColor = mode === 'impostor' ? COLORS.CREW_RED : COLORS.VISOR_CYAN;
    if (this.panelBorder) {
      this.panelBorder.clear();
      this.drawPanelBorder(panelY, borderColor);
    }
  }

  private drawPanelBorder(panelY: number, borderColor: number): void {
    if (!this.panelBorder) return;
    this.panelBorder.roundRect(10, panelY, GAME_WIDTH - 20, PANEL_H, 6).fill(0x2a2f55);
    this.panelBorder.roundRect(10, panelY, GAME_WIDTH - 20, PANEL_H, 6).stroke({
      width: 1,
      color: borderColor,
    });
  }

  update(_dt: number): void {
    // No continuous animation needed
  }

  exit(): void {
    this.destroyChildren();
    this.cards = [];
    this.detailPanel = null;
    this.launchButton = null;
    this.selectedStage = null;
    this.selectedMode = 'crew';
    this.panelBorder = null;
    this.crewBtn = null;
    this.impostorBtn = null;
  }
}
