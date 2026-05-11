# MathMates

A grid-based maths game for KS1–2 children (ages 5–9). Navigate a space-crew grid, eating correct answers to complete missions. Built with TypeScript, Canvas 2D, and [Rough.js](https://roughjs.com) for a sketchy, hand-drawn look.

Inspired by *Number Munchers*. Space-crew theme.

---

## Game Modes

**Crew Mode** — You're the crewmate. Eat every correct answer on the grid before the impostor catches up with you.

**Impostor Mode** — You *are* the impostor. Eat all the wrong answers to sabotage the grid before the AI crewmates repair your damage. Unlocks for each stage after completing crew mode.

## Controls

| Key | Action |
|---|---|
| Arrow keys | Move |
| Space / Enter | Eat the current cell |
| S | Mark cell as "sus" |
| Escape | Pause |

## Play

[Play MathMates](https://khawkins98.github.io/MathMates/) *(link will be updated when v2 deploys)*

---

## Development

```bash
npm install
npm run dev    # Vite dev server with HMR
npm run build  # Production bundle → dist/
```

Requires Node 18+.

---

## Adding a New Scenario

A scenario is one small TypeScript file implementing `ScenarioDefinition`. It contains:

- The **display rule** (what the HUD and briefing say)
- A **grid generator** (produces 20 cell values)
- An **`isCorrect` function** (pure, no side effects)

```typescript
// src/scenarios/doubles.ts
import type { ScenarioDefinition } from '@/types';

const doubles: ScenarioDefinition = {
  id: 'doubles-1',
  title: 'Doubles',
  topic: 'addition',
  ruleText: 'Find the doubles',
  briefingText: 'Find every number that is a double!',
  ksYears: [1],
  difficulty: 1,
  generateGrid(seed) { /* return 20 CellValues */ },
  isCorrect(value) { return value.numeric % 2 === 0; },
};

export default doubles;
```

Then register it in `src/scenarios/index.ts`. No other files need changing.

See [`docs/PRD.md`](docs/PRD.md) for the full `ScenarioDefinition` spec and architectural overview.

---

## Project structure

```
src/
  core/        # Game loop, scene manager, input
  scenes/      # Title, select, briefing, game, complete, game-over
  entities/    # Grid, cell, player, AI characters
  scenarios/   # All scenario definitions (one file per topic group)
  rendering/   # Rough.js wrappers, palette
  audio/       # Audio manager
  ui/          # HUD, buttons, overlays
  types.ts
  constants.ts
docs/
  PRD.md       # Full product requirements and architecture spec
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
