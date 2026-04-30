# Contributing to MathMates

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

### Format

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | Use for |
|------|---------|
| `feat` | A new feature or behaviour |
| `fix` | A bug fix |
| `refactor` | Code restructure with no behaviour change |
| `style` | Visual/CSS-only changes (not code style) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, dependency updates |
| `docs` | Documentation only |
| `ci` | CI/CD workflow changes |

### Examples

```
feat(select-scene): add difficulty selector to stage screen
fix(crewmate): correct visor clipping on mobile
refactor(game-scene): extract answer-check logic into helper
chore: bump pixi.js to 8.1.0
```

### Rules

- Use the **imperative, present tense**: "add feature" not "added feature"
- Keep the subject line under **72 characters**
- Reference issues in the footer when relevant: `Closes #12`
- Breaking changes must include `BREAKING CHANGE:` in the footer

---

## Branching & Pull Requests

### When to work directly on `main`

- Tiny, self-contained fixes (typos, one-line config tweaks)
- Changes that pose no risk to the deployed site

### When to use a feature branch + PR

Use a branch for anything that:
- Adds a new feature or scene
- Changes game logic or scoring
- Modifies shared utilities or types
- Touches CI / deployment config

### Branch naming

```
<type>/<short-slug>
```

Examples: `feat/times-tables-stage`, `fix/mobile-tap-regression`, `chore/update-deps`

### PR checklist

Before opening a pull request:

- [ ] Commits follow Conventional Commits
- [ ] `npm run build` passes locally
- [ ] The change has been manually tested in-browser (`npm run dev`)
- [ ] PR title follows Conventional Commits format (it becomes the squash-merge commit message)

### Merging

Prefer **squash merge** to keep `main` history clean. The PR title becomes the final commit message, so make it count.

---

## CI

Two workflows run automatically:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Build check** | Every push & PR | Runs `tsc && vite build` to catch type errors and build failures before merge |
| **Deploy** | Push to `main` | Builds and publishes to GitHub Pages |

The build check must pass before merging a PR. It runs the same `npm run build` command as the deploy workflow, so a green check here means the deploy will succeed.
