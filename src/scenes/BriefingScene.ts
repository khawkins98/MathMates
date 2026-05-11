import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import type { RoughRenderer } from '@/rendering/RoughRenderer';
import { SCENARIO_REGISTRY } from '@/scenarios';
import { STAGES } from '@/stages';
import type { GameMode, ScenarioDefinition } from '@/types';
import type { MissionParams } from './sceneParams';

function isMissionParams(value: unknown): value is MissionParams {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<MissionParams>;
  return typeof candidate.stageId === 'string'
    && typeof candidate.stageIndex === 'number'
    && typeof candidate.scenarioIndex === 'number'
    && (candidate.mode === 'crew' || candidate.mode === 'impostor');
}

export class BriefingScene implements Scene {
  private manager: SceneManager;
  private rr: RoughRenderer;
  private mission: MissionParams | null = null;
  private scenario: ScenarioDefinition | null = null;
  private countdownMs = 3000;
  private started = false;

  constructor(manager: SceneManager, rr: RoughRenderer) {
    this.manager = manager;
    this.rr = rr;
  }

  enter(params?: Record<string, unknown>): void {
    if (!isMissionParams(params)) {
      this.manager.goto('SELECT');
      return;
    }
    const stage = STAGES[params.stageIndex];
    const scenarioId = stage?.scenarios[params.scenarioIndex];
    const scenario = scenarioId ? SCENARIO_REGISTRY.get(scenarioId) : undefined;
    if (!stage || !scenario) {
      this.manager.goto('SELECT');
      return;
    }
    this.mission = { ...params };
    this.scenario = scenario;
    this.countdownMs = 3000;
    this.started = false;
    this.manager.input.setEnabled(true);
  }

  exit(): void {}

  update(dt: number): void {
    if (!this.mission || !this.scenario || this.started) {
      return;
    }

    let action = this.manager.input.shift();
    while (action) {
      if (action === 'back' || action === 'pause') {
        this.manager.goto('SELECT');
        return;
      }
      if (action === 'eat' || action === 'confirm') {
        this.startMission();
        return;
      }
      action = this.manager.input.shift();
    }

    this.countdownMs -= dt;
    if (this.countdownMs <= 0) {
      this.startMission();
    }
  }

  private startMission(): void {
    if (!this.mission || this.started) {
      return;
    }
    this.started = true;
    this.manager.goto('GAME', this.mission as unknown as Record<string, unknown>);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const mission = this.mission;
    const scenario = this.scenario;
    const stage = mission ? STAGES[mission.stageIndex] : null;
    const mode: GameMode = mission?.mode ?? 'crew';
    const accent = mode === 'crew' ? COLOURS.SUCCESS : COLOURS.DANGER;
    const panelFill = mode === 'crew' ? '#133148' : '#431726';

    ctx.fillStyle = COLOURS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.rr.cell(38, 52, 524, 296, panelFill, accent, 91);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accent;
    ctx.font = `bold 20px 'Nunito', sans-serif`;
    ctx.fillText(mode === 'crew' ? '🚀 Crew briefing' : '👾 Impostor briefing', CANVAS_WIDTH / 2, 86);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 38px 'Caveat', cursive`;
    ctx.fillText(stage ? `${stage.icon} ${stage.title}` : 'Mission', CANVAS_WIDTH / 2, 128);

    ctx.font = `bold 26px 'Nunito', sans-serif`;
    ctx.fillText(scenario?.title ?? '', CANVAS_WIDTH / 2, 168);

    ctx.fillStyle = '#dbe6ff';
    ctx.font = `bold 18px 'Nunito', sans-serif`;
    ctx.fillText(scenario?.ruleText ?? '', CANVAS_WIDTH / 2, 208);

    ctx.font = `18px 'Nunito', sans-serif`;
    const briefing = scenario?.briefingText ?? '';
    this.drawWrappedText(ctx, briefing, CANVAS_WIDTH / 2, 258, 420, 28);

    ctx.font = `14px 'Nunito', sans-serif`;
    ctx.fillStyle = '#cbd6eb';
    ctx.fillText('Space starts early • Backspace returns to stage select', CANVAS_WIDTH / 2, 320);

    const seconds = Math.max(0, Math.ceil(this.countdownMs / 1000));
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, 370, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (this.countdownMs / 3000));
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 24px 'Nunito', sans-serif`;
    ctx.fillText(`${seconds}`, CANVAS_WIDTH / 2, 370);
    ctx.restore();
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
  ): void {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      lines.push(line);
    }
    lines.forEach((entry, index) => {
      ctx.fillText(entry, centerX, startY + index * lineHeight);
    });
  }
}
