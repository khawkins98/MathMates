import { Text, TextStyle } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { ButtonSprite } from '@/sprites/ButtonSprite';
import { createCrewmateSprite, CREW_COLORS } from '@/sprites/CrewmateSprite';
import { createGear } from '@/sprites/GearIcon';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, PIXEL_FONT } from '@/constants';
import type { Container } from 'pixi.js';

const SPAWN_MARGIN = 60;
// px/ms — slow zero-gravity drift
const SPEED_MIN = 0.016;
const SPEED_MAX = 0.044;

interface DriftingCrewmate {
  sprite: Container;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0 = far/tiny/invisible, 1 = close/large/opaque */
  depth: number;
  /** how fast depth changes per ms — negative = receding (big→small), positive = approaching (small→big) */
  depthRate: number;
  rotSpeed: number; // rad/ms
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

    // One crewmate per colour, each drifting at a different depth
    for (let i = 0; i < CREW_COLORS.length; i++) {
      const sprite = createCrewmateSprite(CREW_COLORS[i]);
      this.root.addChild(sprite);

      const cm: DriftingCrewmate = {
        sprite,
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vx: 0,
        vy: 0,
        depth: Math.random(), // stagger initial depths so they don't all arrive together
        depthRate: 0,
        rotSpeed: (Math.random() - 0.5) * 0.0008,
      };
      this._setDriftDirection(cm);
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
      cm.depth += cm.depthRate * dt;
      cm.sprite.rotation += cm.rotSpeed * dt;

      // Scale 0.2→1.3, alpha 0.1→0.95 — all driven by depth linearly
      const d = Math.max(0, Math.min(1, cm.depth));
      cm.sprite.scale.set(0.2 + d * 1.1);
      cm.sprite.alpha = 0.1 + d * 0.85;
      cm.sprite.x = cm.x;
      cm.sprite.y = cm.y;

      // Fully receded (faded to nothing) or drifted off-screen → respawn
      const offScreen =
        cm.x < -SPAWN_MARGIN || cm.x > GAME_WIDTH + SPAWN_MARGIN ||
        cm.y < -SPAWN_MARGIN || cm.y > GAME_HEIGHT + SPAWN_MARGIN;

      if (cm.depth <= 0 || offScreen) {
        this._respawn(cm);
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

  /** Assign a random drift velocity and depth-change direction to a crewmate. */
  private _setDriftDirection(cm: DriftingCrewmate): void {
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    const angle = Math.random() * Math.PI * 2;
    cm.vx = Math.cos(angle) * speed;
    cm.vy = Math.sin(angle) * speed;
    // depth changes at ~0.3–0.7 per second — randomly approaching or receding
    const rate = (0.0003 + Math.random() * 0.0004);
    cm.depthRate = Math.random() < 0.5 ? rate : -rate;
  }

  /** Respawn a crewmate from a random screen edge, approaching from afar. */
  private _respawn(cm: DriftingCrewmate): void {
    const edge = Math.floor(Math.random() * 4);
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);

    switch (edge) {
      case 0:
        cm.x = Math.random() * GAME_WIDTH; cm.y = -SPAWN_MARGIN;
        cm.vx = (Math.random() - 0.5) * speed; cm.vy = speed; break;
      case 1:
        cm.x = Math.random() * GAME_WIDTH; cm.y = GAME_HEIGHT + SPAWN_MARGIN;
        cm.vx = (Math.random() - 0.5) * speed; cm.vy = -speed; break;
      case 2:
        cm.x = -SPAWN_MARGIN; cm.y = Math.random() * GAME_HEIGHT;
        cm.vx = speed; cm.vy = (Math.random() - 0.5) * speed; break;
      default:
        cm.x = GAME_WIDTH + SPAWN_MARGIN; cm.y = Math.random() * GAME_HEIGHT;
        cm.vx = -speed; cm.vy = (Math.random() - 0.5) * speed;
    }

    // Always start far away (depth=0) and drift closer
    cm.depth = 0;
    cm.depthRate = 0.0003 + Math.random() * 0.0004;
    cm.rotSpeed = (Math.random() - 0.5) * 0.0008;
  }
}
