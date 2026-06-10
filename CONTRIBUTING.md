# Contributing to MathMates

---

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<optional scope>): <short description>
```

| Type | Use for |
|---|---|
| `feat` | New feature or behaviour |
| `fix` | Bug fix |
| `refactor` | Code change with no behaviour change |
| `style` | Visual/CSS changes (not code formatting) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, dependency bumps |
| `docs` | Documentation only |
| `ci` | CI/CD changes |

**Examples:**
```
feat(scenarios): add doubles scenario for KS1
fix(game-scene): prevent freeze when crewmate is eliminated mid-dwell
refactor(grid): extract cell state machine into Cell class
chore: bump rough.js to 4.6.0
```

---

## Branches and PRs

- All work goes on a feature branch, never directly to `main`.
- Branch naming: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- PR title becomes the squash-merge commit message — write it as a Conventional Commit.
- Keep PRs focused. One logical change per PR.

---

## Adding a New Scenario

This is the most common contribution. The steps are:

1. **Create** `src/scenarios/<your-scenario>.ts` implementing `ScenarioDefinition` (see [`docs/PRD.md §5`](docs/PRD.md)).
2. **Register** it in `src/scenarios/index.ts`.
3. **Add** it to a stage in `src/stages/index.ts`, or create a new `StageDefinition` if it's a new topic area.
4. **Test** it manually: play through crew mode and impostor mode. Verify the grid always has at least 3 correct cells and 3 wrong cells so both modes are completable.

No changes to game-engine code are needed for a new scenario.

---

## Visual Style

All in-game graphics (characters, cells, UI elements) are drawn with **Rough.js** on Canvas 2D. Do not add bitmap sprites or pixel-art assets for game elements. Exception: full-screen background art (e.g. the title screen's `public/bg-title.jpg`) may be a bitmap.

When drawing new UI elements:
- Use the palette constants from `src/rendering/colours.ts`.
- Use the helpers in `src/rendering/RoughRenderer.ts` rather than calling `rough.canvas()` directly — this keeps fill style and roughness settings consistent.
- Character shapes (crewmate, impostor) are defined in `src/entities/` as draw functions, not image files.

---

## Code Style

- TypeScript strict mode. No `any`.
- Prefer explicit types on public function signatures.
- Pure functions for all scenario logic (`isCorrect`, `generateGrid`).
- No side effects in scenario files — they are data, not controllers.
- Comments only where intent is non-obvious. Don't restate the code.

---

## Educational Review

Before merging a new stage or scenario, consider asking someone familiar with KS1–2 curriculum to verify:
- The maths is correct and age-appropriate.
- The difficulty progression within the stage makes sense.
- The `briefingText` is clear to a child.
