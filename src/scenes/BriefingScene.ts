import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import { CANVAS_WIDTH } from '@/constants';
import { COLOURS } from '@/rendering/colours';
import { drawSpaceBackground, drawOutlinedText, drawPanel, makeStars, type Star } from '@/rendering/drawHelpers';
import { SCENARIO_REGISTRY } from '@/scenarios';
import { STAGES } from '@/stages';
import type { GameMode, ScenarioDefinition } from '@/types';
import { isMissionParams, type MissionParams } from './sceneParams';

export class BriefingScene implements Scene {
  private manager: SceneManager;
  private mission: MissionParams | null = null;
  private scenario: ScenarioDefinition | null = null;
  private countdownMs = 3000;
  private started = false;
  private stars: Star[] = makeStars(50);

  constructor(manager: SceneManager) {
    this.manager = manager;
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
      if (action === 'eat') {
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
    const panelFill = mode === 'crew' ? '#1a3840' : '#3a1828';

    drawSpaceBackground(ctx, 3000 - this.countdownMs, this.stars);
    drawPanel(ctx, 38, 44, 524, 310, panelFill, accent, 3);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Mode badge
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(mode === 'crew' ? 'CREW BRIEFING' : 'IMPOSTOR BRIEFING', CANVAS_WIDTH / 2, 76);

    // Stage title
    drawOutlinedText(ctx, stage ? stage.title : 'Mission', CANVAS_WIDTH / 2, 118, 24, '#f0fafa', '#080c0c', 5, "'Fredoka One', sans-serif");

    // Scenario title
    ctx.font = "20px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(scenario?.title ?? '', CANVAS_WIDTH / 2, 155);

    // Rule text
    ctx.font = "17px 'Fredoka One', sans-serif";
    ctx.fillStyle = accent;
    const ruleLine = mode === 'impostor' ? scenario?.impostorRuleText : scenario?.ruleText;
    ctx.fillText(ruleLine ?? '', CANVAS_WIDTH / 2, 188);

    // Briefing text (wrapped)
    ctx.font = "16px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#c8e0e0';
    const body = mode === 'impostor'
      ? 'You are the impostor! Sneak around and break every wrong answer — but leave the correct ones alone!'
      : scenario?.briefingText ?? '';
    this.drawWrappedText(ctx, body, CANVAS_WIDTH / 2, 232, 440, 26);

    // Hint
    ctx.font = "12px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#7aa8a8';
    ctx.fillText('Space/Enter starts early  •  Backspace returns to stage select', CANVAS_WIDTH / 2, 322);

    // Countdown arc
    const seconds = Math.max(0, Math.ceil(this.countdownMs / 1000));
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, 373, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (this.countdownMs / 3000));
    ctx.stroke();
    ctx.font = "18px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(`${seconds}`, CANVAS_WIDTH / 2, 374);

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
