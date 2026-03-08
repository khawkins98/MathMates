import { Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { ToggleSwitch } from '@/ui/ToggleSwitch';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/constants';

export class SettingsScene extends Scene {
  private manager: SceneManager;
  private soundToggle: ToggleSwitch | null = null;
  private impostorToggle: ToggleSwitch | null = null;
  private unlockToggle: ToggleSwitch | null = null;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(): void {
    const settings = this.manager.save.settings;

    // Semi-transparent dark overlay background
    const overlay = new Graphics();
    overlay.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.8 });
    this.root.addChild(overlay);

    // Panel background
    const panelW = 320;
    const panelH = 260;
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = (GAME_HEIGHT - panelH) / 2;

    const panel = new Graphics();
    panel.roundRect(panelX, panelY, panelW, panelH, 8).fill(0x2a2f55);
    panel.roundRect(panelX, panelY, panelW, panelH, 8).stroke({
      width: 1,
      color: COLORS.HULL_GREY,
    });
    this.root.addChild(panel);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 20,
      fontWeight: 'bold',
      fill: COLORS.STAR_WHITE,
    });
    const titleText = new Text({ text: 'SETTINGS', style: titleStyle });
    titleText.anchor.set(0.5, 0);
    titleText.x = GAME_WIDTH / 2;
    titleText.y = panelY + 16;
    this.root.addChild(titleText);

    // Label style
    const labelStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 13,
      fill: COLORS.STAR_WHITE,
    });

    const rowStartX = panelX + 30;
    const toggleX = panelX + panelW - 80;
    let rowY = panelY + 60;
    const rowSpacing = 50;

    // Sound toggle
    const soundLabel = new Text({ text: 'Sound', style: labelStyle });
    soundLabel.x = rowStartX;
    soundLabel.y = rowY;
    this.root.addChild(soundLabel);

    this.soundToggle = new ToggleSwitch(settings.soundEnabled);
    this.soundToggle.x = toggleX;
    this.soundToggle.y = rowY - 2;
    this.soundToggle.onChange = (value: boolean) => {
      this.manager.sound.setMuted(!value);
      this.manager.save.updateSettings({ soundEnabled: value });
    };
    this.root.addChild(this.soundToggle);

    rowY += rowSpacing;

    // Impostor Wanderer toggle
    const impostorLabel = new Text({ text: 'Impostor Wanderer', style: labelStyle });
    impostorLabel.x = rowStartX;
    impostorLabel.y = rowY;
    this.root.addChild(impostorLabel);

    this.impostorToggle = new ToggleSwitch(settings.impostorEnabled);
    this.impostorToggle.x = toggleX;
    this.impostorToggle.y = rowY - 2;
    this.impostorToggle.onChange = (value: boolean) => {
      this.manager.save.updateSettings({ impostorEnabled: value });
    };
    this.root.addChild(this.impostorToggle);

    rowY += rowSpacing;

    // Unlock All Stages toggle
    const unlockLabel = new Text({ text: 'Unlock All Stages', style: labelStyle });
    unlockLabel.x = rowStartX;
    unlockLabel.y = rowY;
    this.root.addChild(unlockLabel);

    this.unlockToggle = new ToggleSwitch(settings.unlockAll);
    this.unlockToggle.x = toggleX;
    this.unlockToggle.y = rowY - 2;
    this.unlockToggle.onChange = (value: boolean) => {
      this.manager.save.updateSettings({ unlockAll: value });
    };
    this.root.addChild(this.unlockToggle);

    // Back button
    const backButton = new ButtonSprite('Back', 100, 34, COLORS.HULL_GREY);
    backButton.x = GAME_WIDTH / 2 - 50;
    backButton.y = panelY + panelH - 50;
    backButton.onClick = () => {
      this.manager.sound.buttonClick();
      this.manager.goto('TITLE');
    };
    this.root.addChild(backButton);
  }

  update(_dt: number): void {
    // No continuous animation needed
  }

  exit(): void {
    this.root.removeChildren();
    this.soundToggle = null;
    this.impostorToggle = null;
    this.unlockToggle = null;
  }
}
