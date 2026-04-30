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

## Design Decisions

### Rendering pipeline

The game renders to a PixiJS v8 WebGL/WebGPU canvas at a fixed logical resolution of **520×380** pixels. A few options work together to keep the pixel-art aesthetic crisp across devices:

| Setting | Value | Why |
|---|---|---|
| `resolution` | `window.devicePixelRatio` | On retina/HiDPI screens the canvas bitmap doubles (e.g. 1040×760 on 2× displays) so text is generated at native screen density rather than upscaled from a low-density buffer. Without this, "Press Start 2P" text at small font sizes blurs noticeably on Retina Macs. |
| `roundPixels` | `true` | Rounds all display-object positions to the nearest integer before draw, preventing sub-pixel jitter on sprites and text. |
| `antialias` | `false` | Disables WebGL MSAA on the framebuffer. The pixel font looks better without edge smoothing. |
| `image-rendering: pixelated` | CSS on `<canvas>` | Nearest-neighbour interpolation when the browser scales the canvas element up — preserves hard pixel edges. |
| `integerScaling` | `true` | CSS width/height is snapped to an integer multiple of 520×380 (e.g. 1040×760 at 2×) so every logical pixel maps to an identical N×N block of screen pixels with no fractional scaling artefacts. |

### 8-bit colour filter

`EightBitFilter` (see `src/filters/EightBitFilter.ts`) is a custom GLSL/WGSL post-process filter that quantises each RGB channel to N discrete levels (default 6 → 216 colours, like classic 8-bit palettes) with a light saturation boost. It runs as a PixiJS filter on the game container and is implemented for both WebGL2 and WebGPU so it works regardless of which renderer PixiJS selects.

### Title screen concept

The title screen follows the concept art: a deep-space background with a star field (70 random 1–2 px dots) and a wispy blue nebula in the upper portion (layered low-alpha ellipses). Nine crewmates drift in from screen edges — the core 6 game colours plus cyan, purple, and lime defined as `TITLE_EXTRA_COLORS` in `TitleScene.ts` so the extra colours don't affect gameplay palettes. The START button uses `pixelBorder: true` on `ButtonSprite`, which draws a dark outer ring, a 2 px inset coloured fill, and a top highlight strip. The button is wrapped in a parent `Container` so the breathing pulse (`±3 %`, `2.5 rad/s`) scales from the button's centre without interfering with `ButtonSprite`'s own press/hover scale feedback.



`PixelDisplay` supports a `pixelScale` option that renders the game to a half-size RenderTexture then upscales via nearest-neighbour — a classic "true low-res" effect. This was tried and disabled because "Press Start 2P" at `fontSize ≤ 12` becomes illegible after the half-res round-trip (the font renders at ~5–6px in the texture). The `image-rendering: pixelated` + `integerScaling` + `EightBitFilter` combination achieves the retro look without sacrificing readability.

### Click / hit-testing with PixelDisplay

PixiJS v8's `EventBoundary` skips hit-testing on any container where `renderable = false` (source: `EventBoundary.mjs` line ~306). When `pixelScale > 1` the game container is added to `app.stage` **before** the upscaled `displaySprite` so it sits in the display tree (events work), but the opaque sprite on top means the double-render is invisible. Never set `renderable = false` on a container that needs to receive pointer events or whose children do.

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
