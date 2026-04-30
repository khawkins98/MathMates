import { Application, Assets, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Scene } from './Scene';
import { InputManager } from './InputManager';
import { TransitionOverlay } from './TransitionOverlay';
import { SoundManager } from '@/audio/SoundManager';
import { SaveManager } from '@/persistence/SaveManager';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, PIXEL_FONT } from '@/constants';
import type { GameStateKey } from '@/types';

/** All PNG sprite assets — preloaded once before scenes boot. */
const SPRITE_ASSETS = [
  '/sprites/logo-v2.png',
  '/sprites/start-idle.png',
  '/sprites/start-hover.png',
  '/sprites/start-pressed.png',
  '/sprites/start-disabled.png',
] as const;

export class SceneManager {
  public app: Application;
  public input: InputManager;
  public sound: SoundManager;
  public save: SaveManager;
  public transition: TransitionOverlay;

  private scenes = new Map<GameStateKey, Scene>();
  private activeScene: Scene | null = null;
  private _stage: Container;

  constructor(app: Application, stage?: Container) {
    this.app = app;
    this._stage = stage ?? app.stage;
    this.input = new InputManager();
    this.sound = new SoundManager();
    this.save = new SaveManager();
    this.transition = new TransitionOverlay();
    this._stage.addChild(this.transition.root);
  }

  register(key: GameStateKey, scene: Scene): void {
    this.scenes.set(key, scene);
  }

  async goto(key: GameStateKey, data?: unknown): Promise<void> {
    if (this.transition.isActive) return;

    await this.transition.fadeOut();

    if (this.activeScene) {
      this.activeScene.exit();
      this._stage.removeChild(this.activeScene.root);
    }

    const scene = this.scenes.get(key);
    if (!scene) throw new Error(`Scene not found: ${key}`);

    this.activeScene = scene;
    this._stage.addChildAt(scene.root, 0);
    scene.enter(data);

    await this.transition.fadeIn();
  }

  start(): void {
    // Import and register all scenes, then go to title
    this._bootstrap().catch((err) => {
      console.error('Failed to bootstrap scenes:', err);
    });
  }

  private async _bootstrap(): Promise<void> {
    // ── 0. Show a progress bar while assets load ──────────────────────────────
    const loadingUI = this._createLoadingScreen();
    this._stage.addChild(loadingUI.container);

    // ── 1. Preload PNG sprite assets so synchronous Texture lookups work later ──
    await Assets.load([...SPRITE_ASSETS], (progress: number) => {
      loadingUI.setProgress(progress);
    });

    this._stage.removeChild(loadingUI.container);
    loadingUI.container.destroy({ children: true });

    // ── 2. Dynamically import all scenes to avoid circular deps ──
    const [
      { TitleScene },
      { SelectScene },
      { BriefingScene },
      { GameScene },
      { CompleteScene },
      { GameOverScene },
      { SettingsScene },
    ] = await Promise.all([
      import('@/scenes/TitleScene'),
      import('@/scenes/SelectScene'),
      import('@/scenes/BriefingScene'),
      import('@/scenes/GameScene'),
      import('@/scenes/CompleteScene'),
      import('@/scenes/GameOverScene'),
      import('@/scenes/SettingsScene'),
    ]);

    this.register('TITLE', new TitleScene(this));
    this.register('SELECT', new SelectScene(this));
    this.register('BRIEFING', new BriefingScene(this));
    this.register('PLAYING', new GameScene(this));
    this.register('COMPLETE', new CompleteScene(this));
    this.register('GAME_OVER', new GameOverScene(this));
    this.register('SETTINGS', new SettingsScene(this));

    // Start ticker
    this.app.ticker.add((ticker) => {
      try {
        if (this.activeScene) {
          this.activeScene.update(ticker.deltaMS);
        }
        this.transition.update(ticker.deltaMS);
      } catch (err) {
        console.error('Tick error:', err);
      }
    });

    await this.goto('TITLE');
  }

  private _createLoadingScreen(): { container: Container; setProgress: (p: number) => void } {
    const BAR_W = 200;
    const BAR_H = 8;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const container = new Container();

    // Label
    const label = new Text({
      text: 'LOADING',
      style: new TextStyle({
        fontFamily: PIXEL_FONT,
        fontSize: 14,
        fill: COLORS.HULL_GREY,
      }),
    });
    label.anchor.set(0.5);
    label.x = cx;
    label.y = cy - 18;
    container.addChild(label);

    // Bar background
    const bg = new Graphics();
    bg.roundRect(cx - BAR_W / 2, cy - BAR_H / 2, BAR_W, BAR_H, 3).fill(0x222244);
    container.addChild(bg);

    // Bar fill (starts at 0 width)
    const fill = new Graphics();
    container.addChild(fill);

    const setProgress = (p: number): void => {
      const w = Math.max(6, Math.round(BAR_W * p));
      fill.clear();
      fill.roundRect(cx - BAR_W / 2, cy - BAR_H / 2, w, BAR_H, 3).fill(COLORS.VISOR_CYAN);
    };

    return { container, setProgress };
  }
}
