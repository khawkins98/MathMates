# MathMates

A Number Munchers-inspired maths game with a space-crew theme, built with TypeScript and PixiJS.

Navigate a 5x4 grid, eating correct answers to complete missions across 10 stages covering multiplication, times tables, addition, and subtraction — all aligned to the UK Key Stage 1-2 curriculum for ages 5-9.

## Game Modes

**Crew Mode** — You're the crewmate. Eat all the correct answers on the grid while avoiding the impostor who roams the ship. Wrong answers cost a life.

**Impostor Mode** — You *are* the impostor. Eat all the WRONG answers to sabotage the grid before the AI crewmate clears the correct ones. Unlocks for each stage after completing a crew-mode mission.

## Controls

- **Arrow keys** — Move around the grid
- **Space** — Eat the current cell
- **S** — Mark a cell as "sus" (bookmark)
- **Escape** — Pause

## Play

[Play MathMates](https://khawkins98.github.io/MathMates/)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview  # preview the production build locally
```

## Deployment

The game is automatically deployed to GitHub Pages on every push to `main` via GitHub Actions.

To enable deployments, go to your repo **Settings > Pages** and set the source to **GitHub Actions**.
