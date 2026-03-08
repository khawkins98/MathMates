import { Application } from 'pixi.js';
import { Scene } from './Scene';
import { InputManager } from './InputManager';
import { TransitionOverlay } from './TransitionOverlay';
import { SoundManager } from '@/audio/SoundManager';
import { SaveManager } from '@/persistence/SaveManager';
import type { GameStateKey } from '@/types';

export class SceneManager {
  public app: Application;
  public input: InputManager;
  public sound: SoundManager;
  public save: SaveManager;
  public transition: TransitionOverlay;

  private scenes = new Map<GameStateKey, Scene>();
  private activeScene: Scene | null = null;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager();
    this.sound = new SoundManager();
    this.save = new SaveManager();
    this.transition = new TransitionOverlay();
    app.stage.addChild(this.transition.root);
  }

  register(key: GameStateKey, scene: Scene): void {
    this.scenes.set(key, scene);
  }

  async goto(key: GameStateKey, data?: unknown): Promise<void> {
    if (this.transition.isActive) return;

    await this.transition.fadeOut();

    if (this.activeScene) {
      this.activeScene.exit();
      this.app.stage.removeChild(this.activeScene.root);
    }

    const scene = this.scenes.get(key);
    if (!scene) throw new Error(`Scene not found: ${key}`);

    this.activeScene = scene;
    this.app.stage.addChildAt(scene.root, 0);
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
    // Dynamically import all scenes to avoid circular deps
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
}
