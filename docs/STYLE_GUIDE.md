# MathMates — Visual Style Guide

**Version:** 2.0  
**Inspiration:** *Among Us* UI — chunky outlines, flat colour, pixel/block fonts, spaceship terminal panels  
**Renderer:** Canvas 2D (plain `CanvasRenderingContext2D`). Rough.js is used only for game grid cells and crewmate sprites — all HUD/UI uses plain canvas for a cleaner terminal look.

---

## 1. Design Principles

| Principle | Expression |
|-----------|-----------|
| **Heavy outline first** | Every shape — button, cell, crewmate body, panel — has a 2–4 px near-black or teal-gray stroke. Outlines give the world weight at small sizes. |
| **Flat + one shadow** | Fills are solid (no gradients on interactive elements). A hard 3–5 px offset drop-shadow (no blur) adds depth. |
| **Chunky block type** | Typography is large, wide, uppercase-friendly. No thin weights anywhere. |
| **Space-terminal palette** | Background is near-black or dark-teal. UI panels are dark `#0d1e1e`. Accent elements are bright mint/cyan `#40d8c0` and `#10d8f0`. Red is reserved for danger/impostor. |
| **Rough but not sloppy** | Rough.js `roughness` stays at **0.6–0.9** for game grid outlines (wobbly but crisp). `strokeWidth` at **2.5–3.5**. Fill style is `solid` for characters, `hachure` (light) for grid cells only. |

---

## 2. Colour Palette

All hex values are canvas-draw colours (exact); use `COLOURS.*` constants from `src/rendering/colours.ts`.

> **Naming note:** the tables below use spec-level role names. The code's
> palette constants live in `src/rendering/colours.ts` and use shorter names
> (e.g. `BG_SPACE` → `COLOURS.BG`, `CELL_DEFAULT` → `COLOURS.CELL_NORMAL`,
> `OUTLINE` → the `'#080c0c'` stroke passed to RoughRenderer). When adding
> colours, add a constant to `colours.ts` — do not hardcode hex in scenes.

### 2.1 Background & Surfaces

| Role | Hex | Usage |
|------|-----|-------|
| `BG_SPACE` | `#0a0e10` | Main canvas background — deep space black |
| `BG_PANEL` | `#2e5050` | Scene panels |
| `BG_TERMINAL` | `#0d1e1e` | Terminal frame interior, title banners |
| `STAR_DOT` | `#c8e8f0` | Tiny 1–2 px star particles |

### 2.2 Text

| Role | Hex | Usage |
|------|-----|-------|
| `TEXT_PRIMARY` | `#f0fafa` | Main labels, body text |
| `TEXT_TITLE` | `#8ee8f0` | Display headings |
| `TEXT_ACCENT` | `#ffe458` / `#f0d060` | Score, numbers, key-name labels in controls bar |
| `TEXT_DANGER` | `#e83030` | Mistakes, impostor labels |
| `TEXT_MUTED` | `#7aa8a8` | Hints, secondary info |
| `TEAL_ACCENT` | `#40d8c0` | Banner borders, teal accent text |

### 2.3 UI Elements

| Role | Hex | Usage |
|------|-----|-------|
| `TILE_NORMAL` | `#c8dcdc` | Default stage/mode tile fill |
| `TILE_SELECTED` | `#10d8f0` | Selected tile fill (bright cyan) |
| `TILE_GLOW` | `#00f0ff` | `shadowColor` on selected tiles |
| `TILE_BORDER` | `#8aacac` | Unselected tile stroke |
| `BADGE_BG` | `#2a3c3c` | Dark icon badge background on tiles |
| `FRAME_BORDER` | `#4a7070` | Terminal frame outer stroke |
| `BTN_KEY_GOLD` | `#f0d060` | Key-name text in controls hints bar |
| `OUTLINE` | `#080c0c` | Universal near-black stroke |
| `SHADOW` | `rgba(0,0,0,0.5)` | Hard drop-shadow offset `(3,4)` |

### 2.4 Game Elements

| Role | Hex | Usage |
|------|-----|-------|
| `CELL_DEFAULT` | `#1e3838` | Idle grid cell fill |
| `CELL_CORRECT` | `#2a5c2a` | Correct-answer cell |
| `CELL_BROKEN` | `#5c2020` | Impostor-broken cell |
| `CELL_CONSUMED` | `#111e1e` | Eaten/cleared cell |
| `CELL_SUS` | `#ffe458` | Sus-marker indicator |
| `CELL_FLASH_OK` | `#50e858` | Correct-eat flash |
| `CELL_FLASH_ERR` | `#e83030` | Wrong-eat flash |

### 2.5 Crewmate Body Colours

| Name | Hex |
|------|-----|
| Crew (player) | `#40d8c0` (PLAYER_CREW) |
| Impostor | `#e83030` (PLAYER_IMPOSTOR) |
| AI crew 1 | `#f0c83c` (AI_CREW_1) |
| AI crew 2 | `#3da858` (AI_CREW_2) |
| Purple | `#8a3cc8` |

---

## 3. Typography

### 3.1 Recommended Fonts

Load both from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Press+Start+2P&display=swap" rel="stylesheet">
```

| Role | Family | Usage |
|------|--------|-------|
| **Game title / Scene banners** | `'Press Start 2P'` | All-caps, always |
| **UI labels / Buttons / Tile text** | `'Fredoka One'` | Sentence case or Title Case |
| **Body / hint text** | `'Fredoka One'` | Sentence case |
| **Score / numbers** | `'Press Start 2P'` | Right-aligned, accent colour |

### 3.2 Title Treatment (outlined display text)

```ts
// Use drawOutlinedText() from src/rendering/drawHelpers.ts
drawOutlinedText(ctx, 'MATHMATES', cx, y, 48, '#ffffff', '#061010', 9);
//                                         size  fill     stroke   strokeW
```

- Large game title: **48 px**, white fill, 9 px near-black stroke.
- Subtitle (teal): **14 px**, `#40d8c0` fill, 5 px stroke.
- Prompt text: **16 px**, `#f0fafa` fill, 5 px stroke.
- Always `ctx.lineJoin = 'round'` — prevents spiky joints on blocky letters.

### 3.3 Size Scale (canvas units, 600 × 440 viewport)

| Name | Size | Usage |
|------|------|-------|
| `xs` | 9–10 px | Badge labels, swatch names |
| `sm` | 12–13 px | Tile descriptions, progress labels |
| `md` | 14–16 px | Tile titles, banner headings (Press Start 2P banner = **16 px**) |
| `lg` | 16 px | Mode labels (Press Start 2P), tile mode headers |
| `xl` | 48 px | Game title MATHMATES |

### 3.4 Text Rendering Rules

- **Always set** `ctx.textBaseline = 'middle'` and `ctx.textAlign` explicitly before drawing.
- **Never** draw text at less than 10 px on a 600 px canvas.
- Use `drawOutlinedText()` for anything in Press Start 2P — the outline is essential for legibility on dark backgrounds.

---

## 4. Stroke & Rough.js Rules

### 4.1 Global rough options

```ts
export const ROUGH_OPTIONS = {
  roughness: 0.8,
  strokeWidth: 3,
};
```

### 4.2 Per-element overrides

| Element | roughness | strokeWidth | fillStyle |
|---------|-----------|-------------|-----------|
| Grid cell (idle) | 0.7 | 3 | `'hachure'` (gap 6, angle 45) |
| Grid cell (broken/flash) | 1.2 | 3 | `'solid'` |
| Crewmate body | 0.5 | 3 | `'solid'` |
| Crewmate visor | 0.3 | 2 | `'solid'` |

> **Note:** HUD/UI buttons and tiles do NOT use Rough.js. They are drawn with plain canvas for the cleaner terminal computer look.

### 4.3 Outline colour

Always `OUTLINE (#080c0c)` — **not** `'black'`. The near-black with a hint of teal matches the Among Us feel.

---

## 5. UI Component Patterns

All shared drawing primitives live in **`src/rendering/drawHelpers.ts`**. Import and use them — never duplicate the logic inline.

### 5.1 Shared helpers

```ts
import {
  rrect,                 // rounded-rect path helper (with fallback)
  drawOutlinedText,      // Press Start 2P with stroke
  drawControlsHintsBar,  // bottom-anchored controls bar
  drawButton,            // cyan-selected button
  drawPanel,             // dark teal panel card
  drawSpaceBackground,   // star field + vignette
  makeStars,             // deterministic star positions
} from '@/rendering/drawHelpers';
```

### 5.2 Stage / Mode Tile

```
┌─────────────────────────────────────────┐  ← rounded rect r=8, #c8dcdc (normal) / #10d8f0 (selected)
│ ┌──────┐  Title text (Fredoka One 14px)  │  ← #8aacac 1.5px border (normal)
│ │ ICON │  Description (Fredoka One 12px) │  ← #00f0ff glow + 3px border (selected)
│ └──────┘  ✓ Crew  ✓ Impostor            │
└─────────────────────────────────────────┘
```

- Icon badge: `#2a3c3c` dark rounded square (46×46 px for full tiles), r=6, `#4a6060` stroke
- **Selected**: fill `#10d8f0`, `ctx.shadowColor = '#00f0ff'`, `ctx.shadowBlur = 14`, stroke `#00f0ff` 3 px
- **Normal**: fill `#c8dcdc`, stroke `#8aacac` 1.5 px
- Drop shadow: `rgba(0,0,0,0.55)` offset `(3, 4)` no blur

### 5.3 Terminal Frame (SelectScene)

```
╔═══════════════════╗  ← #4a7070, 3px, r=12
║  ┌─────────────┐  ║  ← inner highlight ring #2a4848, 1px, r=10
║  │  BANNER     │  ║  ← teal bordered title banner
║  └─────────────┘  ║
║  ...content...    ║
╚═══════════════════╝
   ●  bolt corners  ●  ← filled circles #3a5858 with cross screw detail
```

Use `drawTerminalFrame()` on SelectScene (currently private — could be extracted to drawHelpers if reused elsewhere).

### 5.4 Title Banner

```
┌──────────────────────────────────┐  ← #40d8c0 border, 2px, r=6
│  CHOOSE YOUR MISSION             │  ← Press Start 2P 16px, #40d8c0 text
└──────────────────────────────────┘  ← fill #0d1e1e
```

Width: `min(420, CANVAS_WIDTH - 80)`, height: 36 px, top margin: 13 px.

### 5.5 Controls Hints Bar

```
┌──────────────────────────────────────────────────┐
│  ARROWS  move    SPACE  eat    S  mark sus        │
└──────────────────────────────────────────────────┘
```

- Key names: `#f0d060` (gold)
- Descriptions: `#40d8c0` (teal)
- Background: `rgba(0,10,14,0.82)`, `#2a5050` border
- Call: `drawControlsHintsBar(ctx, [['KEY', 'desc'], ...])`

### 5.6 `drawButton()` (generic button)

- Normal: fill `#243838`, stroke `#4a7070` 2px, r=8, Fredoka One 16px `#f0fafa` text
- Selected: same fill, `#00ffff` stroke 2.5px + `shadowColor='#00ffff'` shadowBlur=14, text `#00ffff`
- Drop shadow: `rgba(0,0,0,0.5)` offset `(3,4)` no blur

### 5.7 Grid Cell

- Idle: `CELL_DEFAULT` fill with hachure. Stroke `OUTLINE` 3 px.
- Number text: centred, `'Press Start 2P'` sm, `TEXT_PRIMARY`.
- Sus marker: amber `✗` at top-right corner, `CELL_SUS` colour.
- Selected (cursor): pulsing outer glow, 4 px, `#7ee8fa`.

### 5.8 HUD Bar

- Thin panel across top: `GRID_BG` fill, `OUTLINE` 2.5 px stroke.
- Lives: crewmate icons, missing = grey silhouettes.
- Score / timer: `'Press Start 2P'` xs, `TEXT_ACCENT`, right-aligned.

---

## 6. Background & Scene Dressing

### 6.1 Space background (non-title scenes)

```ts
drawSpaceBackground(ctx, elapsedMs, stars);  // from drawHelpers
```

1. Fill canvas `BG_SPACE`.
2. Twinkle stars: `sin(elapsed * 0.0012 + phase) * 0.35 + 0.65` alpha.
3. Radial vignette: inner transparent teal → outer `rgba(0,0,0,0.55)`.

### 6.2 Title screen background

Uses a real JPEG background image (`public/bg-title.jpg` — spaceship cockpit illustration):
- `ctx.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)`
- Dark linear gradient overlays top (0.45 height) and bottom (0.28 height) for text legibility.

### 6.3 Terminal frame (SelectScene)

SelectScene wraps its content in a terminal frame overlay (§5.3) instead of the plain star background.

---

## 7. Character Drawing (Crewmate)

Crewmates are drawn by `src/rendering/RoughRenderer.ts` using Rough.js. See sprite anatomy:

```
     ╭──────╮
    ╭┤ VISOR├╮
    │╰──────╯│   ← body (rounded rect, 24×32 units)
    │        │
    ╰────────╯
    ╎        ╎   ← legs (short thick lines)
```

Draw order: body → visor → visor highlight → legs → body shadow.

| Context | Width |
|---------|-------|
| HUD life icon | 16 px |
| Game entity (player) | 32 px |
| Game entity (AI crewmate) | 28 px |
| UIKit preview / title decoration | 48–64 px |

---

## 8. Animation Conventions

| Effect | Approach |
|--------|----------|
| Tile/button selected pulse | `sin(elapsed * 0.006) * amplitude` → shadow blur or border alpha |
| "Press to start" prompt | `abs(sin(elapsed * 0.0028)) * 0.45 + 0.55` → globalAlpha |
| Cell flash (correct/wrong) | Linear fade 1 → 0 over `FLASH_DURATION` (350 ms) |
| Crewmate walk/bob | Vertical sin offset; wobble seed changes on interval |
| Star twinkle | Per-star phase: `sin(elapsed * 0.0012 + phase) * 0.35 + 0.65` |

---

## 9. Developer UI Kit

A dev-only scene showing all UI primitives in one view:

- **Access:** press `` ` `` (backtick) on the title screen
- **Exit:** `Esc` / `Z` / `Backspace`
- **Scene name:** `'UIKIT'` — registered in `main.ts` only when `import.meta.env.DEV` is true, so it is excluded from production builds

The UIKit shows: typography scale, colour swatches, tile variants (normal/selected), drawButton states, drawPanel, animated crewmate sprites, and the controls hints bar.

---

## 10. What to Avoid

| ❌ Don't | ✅ Do instead |
|----------|--------------|
| Gradient fills on buttons/tiles | Solid fill + selected-state cyan swap |
| Thin fonts or light weights | Fredoka One / Press Start 2P only |
| Roughness > 1.2 on any UI element | Keep ≤ 0.9; ≤ 0.5 for characters |
| Rough.js for UI buttons/panels | Plain canvas only for UI; Rough.js only for game cells + crewmates |
| More than 3 colours in one component | Primary fill + shadow + outline |
| Sans-serif fallback without loading fonts | Always preload Google Fonts in `main.ts` |
| Pixel-perfect box shadows | Hard 3–5 px offset shadows, `rgba(0,0,0,0.5)`, no blur |
| White backgrounds | Only `BG_SPACE`, `BG_TERMINAL`, `BG_PANEL` |
| Duplicating drawing helpers inline | Import from `src/rendering/drawHelpers.ts` |

