# MathMates

**Product Requirements Document**

*A Number Munchers-inspired maths game with a space-crew theme*

Version 1.0 · March 2026 · Status: Draft · Author: Ken

---

## 1. Overview

MathMates is a browser-based maths game for children in the UK Key Stage 1-2 range (roughly ages 5-9). It takes the grid-based gameplay of Number Munchers and wraps it in a space-crew theme borrowed from social-deduction games like Among Us. Players move a crewmate around a grid, eating numbers that match a rule. Get it wrong and an impostor eliminates one of your crewmates. Lose all five and the mission fails.

The whole thing is a lightweight PixiJS project with a pixel-art look. No external assets, no back-end, just a static bundle you can host anywhere or open from a local file.

### 1.1 Goals

- Give kids repeated, low-pressure arithmetic practice that doesn't feel like homework.
- Make stages modular so new maths topics can be dropped in without touching core code.
- Keep the technical footprint small: one HTML page or small bundle, zero server dependencies.
- Make it look and feel fun enough that the child actually wants to come back.

### 1.2 Non-goals (v1)

- Multiplayer or online features.
- Persistent leaderboards or accounts (local high-score only).
- Mobile-first layout (desktop is the target; tablet is a nice-to-have).
- Accessibility beyond basic keyboard navigation (future iteration).

---

## 2. Theme and narrative wrapper

The game takes place aboard a spaceship. Each "mission" is a maths skill category. Completing a mission means clearing a grid by eating all correct numbers before the impostor eliminates too many crewmates.

### 2.1 Narrative elements

**Mission briefing:** Before each round, a briefing screen tells the player what to do in kid-friendly language (e.g. "Crewmate! We need to find all the multiples of 3 before the impostor gets us!").

**Crewmates as lives:** The player starts each mission with a squad of crewmates (default: 5). Each wrong answer triggers an impostor-elimination animation and removes one crewmate. Lose all five and the mission fails.

**Mission complete:** Clearing all correct numbers from the grid triggers a victory animation. If the stage has more rounds, the next grid loads with a harder variant.

**Impostor encounters:** At configurable intervals, an impostor character wanders onto the grid. If the player's crewmate shares a cell with it, one crewmate is lost. This is optional and off by default on easier stages so younger kids can focus on the maths.

---

## 3. Core gameplay mechanics

### 3.1 The grid

The playing field is a **5x4 grid** (5 columns, 4 rows, 20 cells). Each cell displays a number or simple expression. These dimensions are fixed for v1 but configurable in code.

| Property | Value | Notes |
|---|---|---|
| Grid size | 5 columns x 4 rows | Configurable in code |
| Cell size | 64x64 px | Pixel-art friendly |
| Gutter / border | 2 px | Visible grid lines |
| Number font size | 16-20 px | Bitmap font preferred |

### 3.2 Player movement

The crewmate occupies one cell at a time and moves in four directions with arrow keys or WASD. Movement wraps at edges -- moving right from the last column puts you in the first column of the same row. The sprite bobs slightly while idle.

### 3.3 Eating / selecting a number

Space or Enter on the current cell "eats" the number. If it satisfies the rule, the cell is consumed (goes blank with a particle effect) and the player scores points. If not, the cell is also consumed (greyed out so it can't be selected again), the elimination sequence plays, and one crewmate is lost.

### 3.3a Marking cells as "sus"

Pressing X toggles a "sus" marker on the current cell: a small red thumbs-down icon in the corner. Kids can use it to flag cells they think are wrong before committing. No effect on scoring. The marker clears when the cell is consumed.

### 3.3b Quitting a mission

Escape or the "Quit" button (top-right of the HUD) returns to stage select immediately. No progress is saved for abandoned missions.

### 3.4 Scoring

- Correct answer: +10 points, multiplied by the current streak multiplier.
- Streak multiplier: starts at 1x, goes up by 0.5 for every 3 consecutive correct answers (max 3x). Resets on a wrong answer.
- Time bonus: clearing the grid under par time (configurable per stage) awards a flat +50 bonus.
- Mission summary shows: total score, accuracy percentage, time taken, crewmates remaining.

### 3.5 Impostor wanderer (optional hazard)

At configurable intervals, an impostor sprite enters from a random edge and follows a random walk. If it lands on the player's cell, one crewmate is lost, but the player's scoring streak is not reset (impostor encounters are a game hazard, not a maths mistake). The player can't eat the impostor. It despawns after a set number of moves or a timer. This is toggled per-stage and off by default on the easiest stages.

---

## 4. Stage and mission system

Stages are the top-level grouping. Each one covers a maths skill. Within a stage there are multiple missions (individual grid rounds) that get progressively harder.

### 4.1 Stage registry architecture

Each stage is a JavaScript object (or ES module) conforming to a `StageDefinition` interface. To add a new stage: create a file, implement the interface, register it. No changes to core code.

The `StageDefinition` fields:

- `id` (string): unique identifier, e.g. `"add-1digit"`.
- `name` (string): display name, e.g. `"Single-Digit Addition"`.
- `description` (string): kid-friendly description for the briefing screen.
- `icon` (string): small sprite or emoji for the mission-select screen.
- `difficulty` (number, 1-5): controls sort order and unlock gating.
- `missionCount` (number): how many grids in this stage (default 5).
- `generateGrid(missionIndex, gridCols, gridRows)`: returns a Grid object with cell values and the set of correct cell indices.
- `getRuleText(missionIndex)`: returns a human-readable rule string for the HUD (e.g. "Multiples of 4").
- `impostorEnabled` (boolean): whether the wandering impostor is active.
- `parTime` (number, seconds): target clear time for the time bonus.

### 4.2 Initial stage roster

Ten stages ship with v1:

| Stage ID | Name | Domain | Example rules | Diff. | Impostor? |
|---|---|---|---|---|---|
| add-1d | Easy Add | Addition | "Which equal 5?" with sums like 2+3, 4+4, 1+4 | 1 | No |
| add-2d | Big Add | Addition | "Which equal 25?" with 12+13, 20+5, 18+6 | 2 | No |
| mult-2 | Twos | Multiples | "Eat all multiples of 2" | 1 | No |
| mult-3 | Threes | Multiples | "Eat all multiples of 3" | 2 | Optional |
| mult-5 | Fives | Multiples | "Eat all multiples of 5" | 2 | Optional |
| mult-10 | Tens | Multiples | "Eat all multiples of 10" | 1 | No |
| times-2 | 2x Table | Multiply | "Which equal 2x4?" with products | 2 | Optional |
| times-5 | 5x Table | Multiply | "Which equal 5x6?" with products | 3 | Yes |
| times-10 | 10x Table | Multiply | "Which equal 10x7?" with products | 2 | No |
| sub-1d | Easy Sub | Subtraction | "Which equal 3?" with 7-4, 9-6 | 2 | Optional |

### 4.3 Adding a new stage (developer guide)

Create a new file (e.g. `stages/divide-2.js`) that exports an object matching `StageDefinition`. The main thing to implement is `generateGrid()`, which returns an array of cell values and a `Set` of indices for the correct answers. Import it in the stage registry (`stages/index.js`) and push it onto the stages array. The select screen, HUD, and scoring all consume stage data generically, so nothing else needs to change.

A template file with inline docs is at `stages/_template.js`.

### 4.4 Difficulty progression and unlocks

Stages are sorted by difficulty on the select screen. Anything above difficulty 1 is locked until the player completes all missions in at least one stage from the previous tier. Completion state lives in localStorage. There's a parent/developer override to unlock everything (a toggle in settings).

---

## 5. UI screens and flow

### 5.1 Screen map

- **Title screen:** Game logo, floating crewmate sprites, "Start" button, settings gear icon.
- **Mission select:** Stage cards in a grid. Locked stages are greyed out with a padlock. Selecting one shows its description and a "Launch Mission" button.
- **Mission briefing:** Overlay with the rule text, crewmate count, and a 3-2-1-Go countdown.
- **Game screen:** The grid, player crewmate, HUD bar at top (rule text, score, lives, "Quit" button), optional timer.
- **Elimination animation:** Overlay on wrong answer -- impostor appears, screen flashes red, one crewmate icon is struck through.
- **Mission complete:** Score summary, accuracy, crewmates remaining, 1-3 star rating, "Next Mission" / "Back to Select" buttons.
- **Game over:** Shown when all crewmates are lost. "Retry" and "Back to Select" buttons.
- **Settings:** Sound toggle, impostor-wanderer toggle, unlock-all override.

### 5.2 HUD layout (game screen)

A 32px top bar spanning full width. Left to right: rule text (e.g. "Multiples of 3"), score, streak multiplier, crewmate-lives icons, "Quit" button. The grid sits centred below. If the impostor wanderer is active, a pulsing warning indicator appears near the top-right.

### 5.3 Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move crewmate |
| Space / Enter | Eat current cell |
| X | Toggle "sus" marker on current cell |
| Escape | Quit mission, return to stage select |

---

## 6. Art direction and visual design

### 6.1 Pixel-art style

All sprites are drawn at low native resolution (16x16 or 32x32) and scaled up with nearest-neighbour interpolation for crisp pixels. The game canvas is 520x380 logical pixels, scaled to fit the browser viewport.

### 6.2 Crewmate character

A squat, bean-shaped figure with a large visor, short legs, and a small backpack. Recognisable as the space-crew archetype without copying any trademarked design. Six colour palettes are available. The character has four directional walk frames (2 per direction) and an idle bob animation.

### 6.3 Impostor character

Same body shape as a crewmate but darker. Has a "mouth-open" frame for the elimination animation. The wanderer version flickers in and out of visibility to look threatening.

### 6.4 Colour palette

| Element | Colour | Usage |
|---|---|---|
| Deep Space | `#1B1F3B` | Background, UI panels |
| Visor Cyan | `#00D9FF` | Highlights, correct-answer effects |
| Crew Red | `#C51111` | Impostor, wrong-answer flash |
| Hull Grey | `#4A4E69` | Grid lines, secondary text |
| Star White | `#FFFFFF` | Numbers, primary text |
| Success Green | `#17C964` | Correct feedback, star fill |

### 6.5 Audio

Minimal and togglable. Required effects: cell-eat (correct), error buzz (incorrect), elimination sting, mission-complete jingle, low ambient hum during gameplay. Everything should sound retro -- short 8-bit bleeps and bloops. No background music in v1; that's a v2 candidate.

---

## 7. Technical architecture

### 7.1 Stack

| Layer | Technology |
|---|---|
| Rendering | PixiJS v8 (WebGL with Canvas fallback) |
| Language | TypeScript |
| Build | Vite (dev server + production bundle) |
| Audio | Web Audio API (procedural synthesis) |
| State | In-memory state machine, no framework |
| Persistence | localStorage for scores + unlock state |
| Hosting | Static files; any host or local `file://` |

### 7.2 Project structure

```
mathmates/
├── src/
│   ├── main.ts              -- Entry point, PixiJS app init and scene manager
│   ├── types.ts             -- Shared interfaces and type definitions
│   ├── constants.ts         -- Grid dimensions, colours, scoring values, timing
│   ├── utils.ts             -- shuffle, randomInt, etc.
│   ├── core/
│   │   ├── Scene.ts         -- Abstract base class
│   │   ├── SceneManager.ts  -- Scene mounting/unmounting, ticker loop
│   │   ├── InputManager.ts  -- Keyboard abstraction, queue-drain pattern
│   │   ├── AnimationSystem.ts
│   │   ├── Easing.ts
│   │   └── TransitionOverlay.ts
│   ├── scenes/
│   │   ├── TitleScene.ts
│   │   ├── SelectScene.ts
│   │   ├── BriefingScene.ts
│   │   ├── GameScene.ts
│   │   ├── CompleteScene.ts
│   │   ├── GameOverScene.ts
│   │   └── SettingsScene.ts
│   ├── stages/
│   │   ├── index.ts         -- Stage registry
│   │   ├── _template.ts     -- Annotated template for new stages
│   │   ├── add-1d.ts
│   │   ├── add-2d.ts
│   │   ├── mult-n.ts        -- Factory for multiples-of-N stages
│   │   ├── times-n.ts       -- Factory for Nx table stages
│   │   └── sub-1d.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Impostor.ts
│   │   ├── Grid.ts
│   │   └── Cell.ts
│   ├── systems/
│   │   ├── ScoringSystem.ts
│   │   └── LivesSystem.ts
│   ├── sprites/
│   │   ├── CrewmateSprite.ts
│   │   ├── ImpostorSprite.ts
│   │   ├── CellSprite.ts
│   │   ├── ButtonSprite.ts
│   │   ├── StarIcon.ts
│   │   ├── PadlockIcon.ts
│   │   └── GearIcon.ts
│   ├── ui/
│   │   ├── HUD.ts
│   │   ├── EliminationOverlay.ts
│   │   └── ToggleSwitch.ts
│   ├── audio/
│   │   └── SoundManager.ts
│   └── persistence/
│       └── SaveManager.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 7.3 State machine

The top-level game state is a simple FSM with these states: `TITLE`, `SELECT`, `BRIEFING`, `PLAYING`, `ELIMINATION`, `COMPLETE`, `GAME_OVER`, `SETTINGS`. Each state maps to a scene object with `enter()`, `update(dt)`, and `exit()` lifecycle methods. Transitions are event-driven (e.g. player presses Start: TITLE -> SELECT; player eats wrong number: PLAYING -> ELIMINATION -> PLAYING).

### 7.4 Grid generation contract

`generateGrid()` in each stage definition returns:

- `cells`: an array of length `gridCols x gridRows`. Each element is a number or string (for expressions like `"3+4"`).
- `correctIndices`: a `Set<number>` of which cell indices satisfy the rule.

About 40-60% of cells should be correct to keep rounds balanced. The generator must ensure there's always at least one correct answer and ideally no duplicate values.

---

## 8. Future roadmap (post-v1)

These are out of scope for v1 but the architecture shouldn't make them hard to add later.

- New stage types: division, fractions, greater-than/less-than, place value, negative numbers, simple algebra.
- Adaptive difficulty: track per-stage accuracy and adjust number ranges or time pressure.
- Crewmate customisation: let the kid pick a colour and hat/accessory.
- Background music and richer sound design.
- Mobile/touch support: tap-to-move and on-screen D-pad.
- Parent dashboard: stats on which stages the child has played, accuracy trends, time spent.
- Multiple save slots (for siblings).
- Tablet-optimised layout.

---

## 9. Acceptance criteria (v1 MVP)

The game is shippable when:

- All screens from section 5 work and you can navigate between them.
- At least 6 of the 10 stages are playable with correct grid generation.
- Crewmate movement is fluid, keyboard-driven, and wraps at grid edges.
- Visual and audio feedback for correct/incorrect answers is immediate.
- Wrong answers cost a crewmate. Zero crewmates triggers Game Over.
- Score, streak multiplier, and mission summary all display correctly.
- A new stage can be added with one file and a registry import, no core code changes.
- 60 fps in Chrome and Firefox on a mid-range laptop.
- All sprites are original pixel art. No copyrighted assets.
- Runs from a static file server, no back-end needed.

---

## Appendix A: Stage definition interface (TypeScript)

This is the contract for all stage modules:

```typescript
interface StageDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  missionCount: number;
  impostorEnabled: boolean;
  parTime: number; // seconds

  generateGrid(
    missionIndex: number,
    cols: number,
    rows: number
  ): {
    cells: (number | string)[];
    correctIndices: Set<number>;
  };

  getRuleText(missionIndex: number): string;
}
```

## Appendix B: Example stage implementation

A simplified "Multiples of N" stage factory:

```javascript
export function createMultiplesStage(n, opts = {}) {
  return {
    id: `mult-${n}`,
    name: `Multiples of ${n}`,
    description: `Find every number that divides evenly by ${n}!`,
    icon: 'icons/multiply.png',
    difficulty: opts.difficulty ?? 2,
    missionCount: opts.missions ?? 5,
    impostorEnabled: opts.impostor ?? false,
    parTime: opts.parTime ?? 45,

    generateGrid(mission, cols, rows) {
      const total = cols * rows;
      const targetCorrect = Math.floor(total * 0.4);
      const cells = [];
      const correctIndices = new Set();
      const range = (mission + 1) * n * 3;

      // fill correct cells
      while (correctIndices.size < targetCorrect) {
        const idx = Math.floor(Math.random() * total);
        if (!correctIndices.has(idx)) {
          correctIndices.add(idx);
          const k = Math.ceil(Math.random() * range / n);
          cells[idx] = k * n;
        }
      }

      // fill remaining with non-multiples
      for (let i = 0; i < total; i++) {
        if (cells[i] === undefined) {
          let v;
          do {
            v = Math.ceil(Math.random() * range);
          } while (v % n === 0);
          cells[i] = v;
        }
      }

      return { cells, correctIndices };
    },

    getRuleText() {
      return `Eat all multiples of ${n}!`;
    },
  };
}
```
