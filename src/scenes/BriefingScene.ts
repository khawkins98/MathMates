import type { Scene } from '@/types';
import type { SceneManager } from '@/core/SceneManager';
import { CANVAS_WIDTH } from '@/constants';
import { getRecentMisses, type MissEntry } from '@/core/misses';
import { COLOURS } from '@/rendering/colours';
import { drawSpaceBackground, drawButton, drawOutlinedText, drawPanel, makeStars, type Star } from '@/rendering/drawHelpers';
import { SCENARIO_REGISTRY } from '@/scenarios';
import { STAGES } from '@/stages';
import type { GameMode, ScenarioDefinition } from '@/types';
import { isMissionParams, type MissionParams } from './sceneParams';

// Layout
const GO_X = (CANVAS_WIDTH - 200) / 2;
const GO_Y = 368;
const GO_W = 200;
const GO_H = 48;
const SPEAKER_X = 516;
const SPEAKER_Y = 58;
const SPEAKER_SIZE = 34;
const CARD_W = 168;
const CARD_H = 46;
const CARD_Y = 286;

const IMPOSTOR_BODY = 'You are the impostor! Break every wrong answer, but stay out of the red glow — that is where crewmates can SEE you. Eat the cell a crewmate stands on to eject them!';

/**
 * Mission briefing. No countdown — emergent readers take the time they need,
 * a speaker button reads the briefing aloud, and recently-missed facts come
 * back as warm-up cards (tap to reveal the answer) before the round starts.
 */
export class BriefingScene implements Scene {
  private manager: SceneManager;
  private mission: MissionParams | null = null;
  private scenario: ScenarioDefinition | null = null;
  private started = false;
  private stars: Star[] = makeStars(50);
  private elapsed = 0;
  private trickyFacts: MissEntry[] = [];
  private revealed: boolean[] = [];

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
    this.started = false;
    this.elapsed = 0;
    this.trickyFacts = getRecentMisses(2);
    this.revealed = this.trickyFacts.map(() => false);
    this.manager.input.setEnabled(true);
  }

  exit(): void {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Speech is best-effort everywhere.
    }
  }

  update(dt: number): void {
    this.elapsed += dt;
    if (!this.mission || !this.scenario || this.started) {
      return;
    }

    let tap = this.manager.input.shiftTap();
    while (tap) {
      this.handleTap(tap.x, tap.y);
      if (this.started) {
        return;
      }
      tap = this.manager.input.shiftTap();
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
  }

  private handleTap(x: number, y: number): void {
    // Speaker: read the briefing aloud
    if (x >= SPEAKER_X && x <= SPEAKER_X + SPEAKER_SIZE && y >= SPEAKER_Y && y <= SPEAKER_Y + SPEAKER_SIZE) {
      this.speak();
      return;
    }
    // Tricky-fact cards: tap to reveal the answer
    for (let i = 0; i < this.trickyFacts.length; i += 1) {
      const cardX = this.cardX(i);
      if (x >= cardX && x <= cardX + CARD_W && y >= CARD_Y && y <= CARD_Y + CARD_H) {
        this.revealed[i] = true;
        return;
      }
    }
    this.startMission();
  }

  private cardX(index: number): number {
    const total = this.trickyFacts.length * CARD_W + (this.trickyFacts.length - 1) * 16;
    return (CANVAS_WIDTH - total) / 2 + index * (CARD_W + 16);
  }

  private speak(): void {
    if (!this.scenario || !this.mission) {
      return;
    }
    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        return;
      }
      synth.cancel();
      const body = this.mission.mode === 'impostor' ? IMPOSTOR_BODY : this.scenario.briefingText;
      const utterance = new SpeechSynthesisUtterance(`${this.scenario.title}. ${body}`);
      utterance.rate = 0.9;
      synth.speak(utterance);
    } catch {
      // Speech is best-effort everywhere.
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

    drawSpaceBackground(ctx, this.elapsed, this.stars);
    drawPanel(ctx, 38, 44, 524, 300, panelFill, accent, 3);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Mode badge
    ctx.font = "13px 'Fredoka One', sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(mode === 'crew' ? 'CREW BRIEFING' : 'IMPOSTOR BRIEFING', CANVAS_WIDTH / 2, 76);

    // Stage title
    drawOutlinedText(ctx, stage ? stage.title : 'Mission', CANVAS_WIDTH / 2, 116, 24, '#f0fafa', '#080c0c', 5, "'Fredoka One', sans-serif");

    // Scenario title
    ctx.font = "20px 'Fredoka One', sans-serif";
    ctx.fillStyle = '#f0fafa';
    ctx.fillText(scenario?.title ?? '', CANVAS_WIDTH / 2, 150);

    // Briefing text (wrapped) — the impostor variant carries its inverted rule
    ctx.font = "16px 'Fredoka One', sans-serif";
    ctx.fillStyle = mode === 'impostor' ? '#ffd0d8' : '#c8e0e0';
    const body = mode === 'impostor'
      ? `${scenario?.impostorRuleText ?? ''}! ${IMPOSTOR_BODY}`
      : scenario?.briefingText ?? '';
    this.drawWrappedText(ctx, body, CANVAS_WIDTH / 2, 196, 440, 26);

    // Tricky-ones warm-up cards
    if (this.trickyFacts.length > 0) {
      ctx.font = "12px 'Fredoka One', sans-serif";
      ctx.fillStyle = '#9ab8b8';
      ctx.fillText('Tricky ones from last time — tap to check:', CANVAS_WIDTH / 2, CARD_Y - 14);
      for (let i = 0; i < this.trickyFacts.length; i += 1) {
        const fact = this.trickyFacts[i];
        const cardX = this.cardX(i);
        ctx.fillStyle = 'rgba(0, 10, 14, 0.6)';
        ctx.fillRect(cardX, CARD_Y, CARD_W, CARD_H);
        ctx.strokeStyle = COLOURS.GOLD;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cardX, CARD_Y, CARD_W, CARD_H);
        ctx.font = "16px 'Fredoka One', sans-serif";
        ctx.fillStyle = this.revealed[i] ? COLOURS.GOLD : '#f0fafa';
        const isBare = !fact.display.includes('+') && !fact.display.includes('−');
        const text = this.revealed[i]
          ? (isBare ? `${fact.display} ✓` : `${fact.display} = ${fact.numeric}`)
          : (isBare ? `${fact.display} ?` : `${fact.display} = ?`);
        ctx.fillText(text, cardX + CARD_W / 2, CARD_Y + CARD_H / 2);
      }
    }

    // Speaker button — reads the briefing aloud
    ctx.strokeStyle = '#7aa8a8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(SPEAKER_X, SPEAKER_Y, SPEAKER_SIZE, SPEAKER_SIZE);
    ctx.fillStyle = '#c8e0e0';
    ctx.beginPath();
    ctx.moveTo(SPEAKER_X + 9, SPEAKER_Y + 14);
    ctx.lineTo(SPEAKER_X + 14, SPEAKER_Y + 14);
    ctx.lineTo(SPEAKER_X + 20, SPEAKER_Y + 8);
    ctx.lineTo(SPEAKER_X + 20, SPEAKER_Y + 26);
    ctx.lineTo(SPEAKER_X + 14, SPEAKER_Y + 20);
    ctx.lineTo(SPEAKER_X + 9, SPEAKER_Y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c8e0e0';
    ctx.beginPath();
    ctx.arc(SPEAKER_X + 22, SPEAKER_Y + 17, 6, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    ctx.restore();

    // GO — the child starts when they're ready, not when a timer says so
    drawButton(ctx, GO_X, GO_Y, GO_W, GO_H, 'GO!', true);
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
