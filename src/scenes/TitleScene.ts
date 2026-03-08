import { Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { createCrewmateSprite, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { createGear } from '@/sprites/GearIcon';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/constants';
import type { Container } from 'pixi.js';

interface FloatingCrewmate {
  sprite: Container;
  baseX: number;
  baseY: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmplitude: number;
  driftSpeed: number;
}

export class TitleScene extends Scene {
  private manager: SceneManager;
  private crewmates: FloatingCrewmate[] = [];
  private startButton: ButtonSprite | null = null;
  private elapsed = 0;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(): void {
    this.elapsed = 0;
    this.crewmates = [];

    // Title text
    const titleStyle = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 40,
      fontWeight: 'bold',
      fill: COLORS.STAR_WHITE,
      align: 'center',
    });
    const title = new Text({ text: 'MATHMATES', style: titleStyle });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = 60;
    this.root.addChild(title);

    // Floating crewmates
    const crewColors = [CREW_COLORS[0], CREW_COLORS[1], CREW_COLORS[2], CREW_COLORS[3]];
    const startPositions = [
      { x: 80, y: 160 },
      { x: 200, y: 200 },
      { x: 320, y: 170 },
      { x: 440, y: 190 },
    ];

    for (let i = 0; i < 4; i++) {
      const sprite = createCrewmateSprite(crewColors[i]);
      sprite.x = startPositions[i].x;
      sprite.y = startPositions[i].y;
      this.root.addChild(sprite);

      this.crewmates.push({
        sprite,
        baseX: startPositions[i].x,
        baseY: startPositions[i].y,
        bobPhase: (i / 4) * Math.PI * 2,
        bobSpeed: 1.5 + Math.random() * 0.5,
        bobAmplitude: 8 + Math.random() * 6,
        driftSpeed: 10 + Math.random() * 10,
      });
    }

    // START button
    this.startButton = new ButtonSprite('START', 140, 42, COLORS.VISOR_CYAN);
    this.startButton.x = GAME_WIDTH / 2 - 70;
    this.startButton.y = GAME_HEIGHT - 100;
    this.startButton.pivot.set(0, 0);
    this.startButton.onClick = () => {
      this.manager.sound.buttonClick();
      this.manager.goto('SELECT');
    };
    this.root.addChild(this.startButton);

    // Gear icon (bottom-right)
    const gear = createGear(24);
    gear.x = GAME_WIDTH - 40;
    gear.y = GAME_HEIGHT - 40;
    gear.eventMode = 'static';
    gear.cursor = 'pointer';
    gear.on('pointerdown', () => {
      this.manager.sound.buttonClick();
      this.manager.goto('SETTINGS');
    });
    this.root.addChild(gear);

    // Play ambient hum
    this.manager.sound.ambientHum();
  }

  update(dt: number): void {
    this.elapsed += dt;
    const t = this.elapsed / 1000; // seconds

    // Animate crewmate bob and drift
    for (const cm of this.crewmates) {
      cm.sprite.y = cm.baseY + Math.sin(t * cm.bobSpeed + cm.bobPhase) * cm.bobAmplitude;
      cm.sprite.x = cm.baseX + Math.sin(t * 0.3 + cm.bobPhase) * cm.driftSpeed;
    }

    // Pulsing start button (scale oscillates 1.0 to 1.05)
    if (this.startButton) {
      const pulse = 1.0 + 0.05 * Math.sin(t * 3);
      this.startButton.scale.set(pulse);
    }
  }

  exit(): void {
    this.manager.sound.stopAmbientHum();
    this.destroyChildren();
    this.crewmates = [];
    this.startButton = null;
  }
}
