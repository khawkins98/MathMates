import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { Scene } from '@/core/Scene';
import { SceneManager } from '@/core/SceneManager';
import { SpriteButton } from '@/sprites/SpriteButton';
import { CREW_COLORS } from '@/sprites/CrewmateSprite';
import { PixelCrewmate } from '@/sprites/PixelCrewmate';
import { createGear } from '@/sprites/GearIcon';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '@/constants';

const SPAWN_MARGIN = 60;
const SPEED_MIN = 0.016;
const SPEED_MAX = 0.044;

// Extra colors only for the title drifting crewmates — concept art shows
// more variety than the core 6 game colors. Not added to CREW_COLORS so
// gameplay palettes (AI colours, player selection etc.) are unaffected.
const TITLE_EXTRA_COLORS = [
  0x38fedc, // cyan
  0x6b31bc, // purple
  0x50ef39, // lime
] as const;

const TITLE_COLORS = [...CREW_COLORS, ...TITLE_EXTRA_COLORS];

interface DriftingCrewmate {
  sprite: PixelCrewmate;
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
  private startButton: SpriteButton | null = null;
  /** Wrapper container for pulsing the START button independently of its press/hover scale. */
  private startBtnWrapper: Container | null = null;
  private elapsed = 0;

  constructor(manager: SceneManager) {
    super();
    this.manager = manager;
  }

  enter(): void {
    this.elapsed = 0;
    this.crewmates = [];

    // --- Layer 0: stars + nebula (behind everything) ---
    this.root.addChild(this._createBackground());

    // --- Layer 1: drifting crewmates (behind title / UI) ---
    for (let i = 0; i < TITLE_COLORS.length; i++) {
      const sprite = new PixelCrewmate(TITLE_COLORS[i]);
      sprite.setWalking(true);
      this.root.addChild(sprite);

      const cm: DriftingCrewmate = {
        sprite,
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vx: 0,
        vy: 0,
        depth: Math.random(),
        depthRate: 0,
        rotSpeed: (Math.random() - 0.5) * 0.0008,
      };
      this._setDriftDirection(cm);
      this.crewmates.push(cm);
    }

    // --- Layer 2: title logo (PNG sprite) ---
    // Texture is 2× (600×98); pin to logical 300×49 so it renders at the
    // correct size on the 520-px-wide canvas regardless of source resolution.
    const logoTex = Assets.get('/sprites/logo-v2.png') as Texture;
    const title = new Sprite(logoTex);
    title.anchor.set(0.5);
    title.width  = 300;
    title.height = 49;
    title.x = GAME_WIDTH / 2;
    title.y = 80;
    this.root.addChild(title);

    // --- Layer 3: START button (PNG sprite-swap button, wrapped for centered pulse) ---
    const BTN_W = 160, BTN_H = 53;
    const texIdle     = Assets.get('/sprites/start-idle.png')     as Texture;
    const texHover    = Assets.get('/sprites/start-hover.png')    as Texture;
    const texPressed  = Assets.get('/sprites/start-pressed.png')  as Texture;
    this.startButton  = new SpriteButton(texIdle, texHover, texPressed, BTN_W, BTN_H);
    this.startButton.onClick = () => {
      this.manager.sound.buttonClick();
      this.manager.goto('SELECT');
    };

    const wrapper = new Container();
    wrapper.addChild(this.startButton);
    // Pivot at button centre so the pulse scales in place
    wrapper.pivot.set(BTN_W / 2, BTN_H / 2);
    wrapper.x = GAME_WIDTH / 2;
    wrapper.y = GAME_HEIGHT - 102 + BTN_H / 2;
    this.root.addChild(wrapper);
    this.startBtnWrapper = wrapper;

    // --- Layer 3: color indicator dots ---
    const dots = this._createColorDots();
    dots.x = GAME_WIDTH / 2;
    dots.y = GAME_HEIGHT - 44;
    this.root.addChild(dots);

    // --- Layer 3: settings gear (bottom-right) ---
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
      cm.sprite.update(dt);

      const d = Math.max(0, Math.min(1, cm.depth));
      cm.sprite.scale.set(0.8 + d * 4.4);
      cm.sprite.alpha = 0.1 + d * 0.85;
      cm.sprite.x = cm.x;
      cm.sprite.y = cm.y;

      const offScreen =
        cm.x < -SPAWN_MARGIN || cm.x > GAME_WIDTH + SPAWN_MARGIN ||
        cm.y < -SPAWN_MARGIN || cm.y > GAME_HEIGHT + SPAWN_MARGIN;

      if (cm.depth <= 0 || offScreen) {
        this._respawn(cm);
      }
    }

    // Gentle breathing pulse on the START button wrapper
    if (this.startBtnWrapper) {
      const pulse = 1.0 + 0.03 * Math.sin(this.elapsed / 1000 * 2.5);
      this.startBtnWrapper.scale.set(pulse);
    }
  }

  exit(): void {
    this.manager.sound.stopAmbientHum();
    this.destroyChildren();
    this.crewmates = [];
    this.startButton = null;
    this.startBtnWrapper = null;
  }

  /** Star field + nebula cloud for the title background. */
  private _createBackground(): Container {
    const bg = new Container();

    // Star field — random single/double pixel dots
    const stars = new Graphics();
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(Math.random() * GAME_WIDTH);
      const y = Math.floor(Math.random() * GAME_HEIGHT);
      const size = Math.random() < 0.75 ? 1 : 2;
      const a = 0.3 + Math.random() * 0.7;
      stars.rect(x, y, size, size).fill({ color: 0xffffff, alpha: a });
    }
    bg.addChild(stars);

    // Nebula — overlapping ellipses in the upper portion
    const nebula = new Graphics();
    nebula.ellipse(210, 80, 185, 58).fill({ color: 0x1e3599, alpha: 0.28 });
    nebula.ellipse(295, 65, 155, 48).fill({ color: 0x2845aa, alpha: 0.2 });
    nebula.ellipse(340, 95, 120, 42).fill({ color: 0x162e8c, alpha: 0.22 });
    nebula.ellipse(155, 72, 105, 38).fill({ color: 0x3555bb, alpha: 0.16 });
    nebula.ellipse(250, 72, 65, 28).fill({ color: 0x5070cc, alpha: 0.13 });
    bg.addChild(nebula);

    return bg;
  }

  /** Five colored dots below the START button — decorative palette indicator. */
  private _createColorDots(): Container {
    const container = new Container();
    const PALETTE = [0xc51111, 0xf5f557, 0x127f2c, 0x132ed1, 0xffffff];
    const R = 6;
    const GAP = 18;
    const offsetX = -((PALETTE.length - 1) * GAP) / 2;

    PALETTE.forEach((color, i) => {
      const g = new Graphics();
      const x = Math.round(offsetX + i * GAP);
      g.circle(x, 0, R).fill(color);
      g.circle(x, 0, R).stroke({ color: 0xffffff, width: 1, alpha: 0.35 });
      container.addChild(g);
    });

    return container;
  }

  private _setDriftDirection(cm: DriftingCrewmate): void {
    const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    const angle = Math.random() * Math.PI * 2;
    cm.vx = Math.cos(angle) * speed;
    cm.vy = Math.sin(angle) * speed;
    const rate = (0.0003 + Math.random() * 0.0004);
    cm.depthRate = Math.random() < 0.5 ? rate : -rate;
  }

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

    cm.depth = 0;
    cm.depthRate = 0.0003 + Math.random() * 0.0004;
    cm.rotSpeed = (Math.random() - 0.5) * 0.0008;
  }
}

