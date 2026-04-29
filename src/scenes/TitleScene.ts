import { Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { createCrewmateSprite, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { createGear } from '@/sprites/GearIcon';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, PIXEL_FONT } from '@/constants';
import type { Container } from 'pixi.js';

const SPAWN_MARGIN = 60;
const CREW_COUNT = 8;
// px/ms — slow enough to feel like zero-gravity drift
const SPEED_MIN = 0.018;
const SPEED_MAX = 0.048;

interface DriftingCrewmate {
  sprite: Container;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseScale: number;
  scalePhase: number;
  scaleSpeed: number; // oscillations/ms
  rotSpeed: number;   // radians/ms
}

export class TitleScene extends Scene {
  private manager: SceneManager;
  private crewmates: DriftingCrewmate[] = [];
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
      fontFamily: PIXEL_FONT,
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

    // Drifting crewmates — spawn distributed across the screen initially
    for (let i = 0; i < CREW_COUNT; i++) {
      const color = CREW_COLORS[i % CREW_COLORS.length];
      const sprite = createCrewmateSprite(color);
      this.root.addChild(sprite);

      const cm: DriftingCrewmate = {
        sprite,
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vx: 0,
        vy: 0,
        baseScale: 0.4 + Math.random() * 0.8,   // 0.4–1.2× depth variety
        scalePhase: Math.random() * Math.PI * 2,
        scaleSpeed: 0.0004 + Math.random() * 0.0006,
        rotSpeed: (Math.random() - 0.5) * 0.001,
      };
      this._setRandomVelocity(cm);
      this.crewmates.push(cm);
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
    const gear = createGear(32);
    gear.x = GAME_WIDTH - 48;
    gear.y = GAME_HEIGHT - 48;
    gear.eventMode = 'static';
    gear.cursor = 'pointer';
    gear.on('pointerdown', () => {
      this.manager.sound.buttonClick();
      this.manager.goto('SETTINGS');
    });
    this.root.addChild(gear);

    this.manager.sound.ambientHum();
  }

  update(dt: number): void {
    this.elapsed += dt;

    for (const cm of this.crewmates) {
      cm.x += cm.vx * dt;
      cm.y += cm.vy * dt;
      cm.sprite.rotation += cm.rotSpeed * dt;

      // Scale oscillates with abs(sin) — simulates tumbling in 3D (face-on → edge-on)
      const tumble = 0.35 + 0.65 * Math.abs(Math.sin(cm.scalePhase + this.elapsed * cm.scaleSpeed));
      const s = cm.baseScale * tumble;
      cm.sprite.scale.set(s);
      // Dimmer when turned away (small) — reinforces depth illusion
      cm.sprite.alpha = 0.4 + 0.6 * (tumble);

      cm.sprite.x = cm.x;
      cm.sprite.y = cm.y;

      // Respawn from a random edge once fully off-screen
      if (
        cm.x < -SPAWN_MARGIN || cm.x > GAME_WIDTH + SPAWN_MARGIN ||
        cm.y < -SPAWN_MARGIN || cm.y > GAME_HEIGHT + SPAWN_MARGIN
      ) {
        this._respawnFromEdge(cm);
      }
    }

    // Pulsing start button
    if (this.startButton) {
      const t = this.elapsed / 1000;
      const pulse = 1.0 + 0.04 * Math.sin(t * 3);
      this.startButton.scale.set(pulse);
    }
  }

  exit(): void {
    this.manager.sound.stopAmbientHum();
    this.destroyChildren();
    this.crewmates = [];
    this.startButton = null;
  }

  private _setRandomVelocity(cm: DriftingCrewmate): void {
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    const angle = Math.random() * Math.PI * 2;
    cm.vx = Math.cos(angle) * speed;
    cm.vy = Math.sin(angle) * speed;
  }

  private _respawnFromEdge(cm: DriftingCrewmate): void {
    const edge = Math.floor(Math.random() * 4);
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);

    switch (edge) {
      case 0: // top → drift downward
        cm.x = Math.random() * GAME_WIDTH;
        cm.y = -SPAWN_MARGIN;
        cm.vx = (Math.random() - 0.5) * speed;
        cm.vy = speed;
        break;
      case 1: // bottom → drift upward
        cm.x = Math.random() * GAME_WIDTH;
        cm.y = GAME_HEIGHT + SPAWN_MARGIN;
        cm.vx = (Math.random() - 0.5) * speed;
        cm.vy = -speed;
        break;
      case 2: // left → drift right
        cm.x = -SPAWN_MARGIN;
        cm.y = Math.random() * GAME_HEIGHT;
        cm.vx = speed;
        cm.vy = (Math.random() - 0.5) * speed;
        break;
      default: // right → drift left
        cm.x = GAME_WIDTH + SPAWN_MARGIN;
        cm.y = Math.random() * GAME_HEIGHT;
        cm.vx = -speed;
        cm.vy = (Math.random() - 0.5) * speed;
    }

    cm.baseScale = 0.4 + Math.random() * 0.8;
    cm.scalePhase = Math.random() * Math.PI * 2;
    cm.rotSpeed = (Math.random() - 0.5) * 0.001;
  }
}
