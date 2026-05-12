# MathMates — Visual Style Guide

**Version:** 1.0  
**Inspiration:** *Among Us* UI — chunky outlines, flat colour, pixel/block fonts, spaceship interior panels  
**Renderer:** Canvas 2D + [Rough.js](https://roughjs.com) (hand-drawn strokes, low roughness for clean-but-not-sterile shapes)

---

## 1. Design Principles

| Principle | Expression |
|-----------|-----------|
| **Heavy outline first** | Every shape — button, cell, crewmate body, panel — has a 3–4 px near-black stroke. Outlines make the world readable at small sizes and give the hand-drawn look weight. |
| **Flat + one shadow** | Fills are solid (no gradients on interactive elements). A slightly darker tone on the lower ~25 % of a shape gives depth without complexity. |
| **Chunky block type** | Typography is large, wide, uppercase-friendly. No thin weights anywhere. |
| **Space-station palette** | Background is near-black or dark-teal. UI panels are medium teal. Accent elements are bright mint/cyan. Red is reserved for danger/impostor. |
| **Rough but not sloppy** | Rough.js `roughness` stays at **0.6–0.9** for outlines (wobbly but crisp), `strokeWidth` at **2.5–3.5**. Fill style is `solid` for characters and `hachure` (light) for grid cells only. |

---

## 2. Colour Palette

All hex values are canvas-draw colours (exact); use the role names in code.

### 2.1 Background & Surfaces

| Role | Hex | Usage |
|------|-----|-------|
| `BG_SPACE` | `#0a0e10` | Main canvas background — deep space black |
| `BG_PANEL` | `#2e5050` | Scene panels, selection boxes |
| `BG_PANEL_LIGHT` | `#3d6868` | Hover / secondary panels |
| `BG_VIGNETTE_GLOW` | `#0d2828` | Radial teal glow at canvas centre-bottom |
| `STAR_DOT` | `#c8e8f0` | Tiny 1–2 px star particles |

### 2.2 Text

| Role | Hex | Usage |
|------|-----|-------|
| `TEXT_PRIMARY` | `#f0fafa` | Main labels, body text |
| `TEXT_TITLE` | `#8ee8f0` | Display headings ("MATHMATES", scene titles) |
| `TEXT_ACCENT` | `#ffe458` | Score, numbers, highlights |
| `TEXT_DANGER` | `#e83030` | Mistakes, impostor labels, error messages |
| `TEXT_MUTED` | `#7aa8a8` | Hints, secondary info |

### 2.3 UI Elements

| Role | Hex | Usage |
|------|-----|-------|
| `BTN_PRIMARY` | `#40d8c0` | Primary CTA buttons (PLAY, START, etc.) |
| `BTN_PRIMARY_STRIPE` | `#60ecd8` | Diagonal highlight stripe on primary buttons |
| `BTN_SECONDARY` | `#3a6868` | Secondary/nav buttons |
| `BTN_DISABLED` | `#2a4040` | Locked/inactive buttons |
| `OUTLINE` | `#080c0c` | Universal stroke colour |
| `SHADOW` | `rgba(0,0,0,0.45)` | Drop-shadow on panels and buttons |

### 2.4 Game Elements

| Role | Hex | Usage |
|------|-----|-------|
| `CELL_DEFAULT` | `#1e3838` | Idle grid cell fill |
| `CELL_CORRECT` | `#2a5c2a` | Correct-answer cell |
| `CELL_BROKEN` | `#5c2020` | Impostor-broken cell |
| `CELL_CONSUMED` | `#111e1e` | Eaten/cleared cell |
| `CELL_SUS` | `#5c4a10` | Sus-marked cell |
| `CELL_FLASH_OK` | `#50e858` | Correct-eat flash |
| `CELL_FLASH_ERR` | `#e83030` | Wrong-eat flash |
| `VISOR` | `#7ee8fa` | Crewmate visor fill |
| `VISOR_HIGHLIGHT` | `#d0f8ff` | Visor specular dot |

### 2.5 Crewmate Body Colours

These map directly to the Among Us colour names for cultural familiarity:

| Name | Body | Body-shadow |
|------|------|-------------|
| Red | `#c8312a` | `#8c1a18` |
| Cyan | `#40d8d8` | `#209898` |
| Purple | `#8a3cc8` | `#5c2080` |
| Yellow | `#f0c83c` | `#b89020` |
| Green | `#3da858` | `#226030` |
| Orange | `#e07828` | `#a04810` |

---

## 3. Typography

### 3.1 Recommended Fonts

Load both from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Press+Start+2P&display=swap" rel="stylesheet">
```

| Role | Family | Weight | Style |
|------|--------|--------|-------|
| **Display / Scene title** | `'Press Start 2P'` | 400 (only weight) | All-caps, letter-spacing +2px |
| **UI labels / Buttons** | `'Fredoka One'` | 400 (only weight) | Sentence case (see §5.1a) |
| **Body / hint text** | `'Fredoka One'` | 400 | Sentence case |
| **Score / numbers** | `'Press Start 2P'` | 400 | Right-aligned, accent colour |

### 3.2 Title Treatment (outlined display text)

The iconic *Among Us* main-menu title uses **white fill + heavy black stroke** — NOT coloured text. Reproduce this with:

```ts
ctx.font = "400 48px 'Press Start 2P', monospace";
ctx.strokeStyle = '#080c0c';
ctx.lineWidth = 7;          // stroke first — thick black outline
ctx.lineJoin = 'round';     // prevents spiky joins on blocky letters
ctx.strokeText(title, x, y);
ctx.fillStyle = '#f0fafa';  // white fill on top
ctx.fillText(title, x, y);
```

- Use this technique for **any large heading** (TitleScene, role-reveal, scene names).  
- For sub-headings (`lg` and below), reduce `lineWidth` to 4 and switch fill to `TEXT_TITLE` (`#8ee8f0`).

### 3.2 Size Scale (canvas units, 600 × 440 viewport)

| Name | Size | Usage |
|------|------|-------|
| `xs` | 10 px | HUD sub-labels, hints |
| `sm` | 13 px | Button text, cell labels |
| `md` | 18 px | Section headings, status text |
| `lg` | 28 px | Scene titles |
| `xl` | 48 px | Main title (MATHMATES) |

### 3.3 Text Rendering Rules

- **Always set** `ctx.textBaseline = 'middle'` and `ctx.textAlign` explicitly before drawing.
- **White text on dark**: use `TEXT_PRIMARY` with no shadow.
- **Coloured text**: add a 2 px `OUTLINE` shadow: `ctx.shadowColor = OUTLINE; ctx.shadowBlur = 4;` then reset after.
- **Never** draw text at less than 10 px on a 600 px canvas.

---

## 4. Stroke & Rough.js Rules

### 4.1 Global stroke style

```ts
// In constants.ts
export const ROUGH_OPTIONS = {
  roughness: 0.8,      // was 1.4 — slightly less wobbly
  strokeWidth: 3,      // was 2 — heavier outline
};
```

### 4.2 Per-element overrides

| Element | roughness | strokeWidth | fillStyle |
|---------|-----------|-------------|-----------|
| Grid cell (idle) | 0.7 | 3 | `'hachure'` (gap 6, angle 45) |
| Grid cell (broken/flash) | 1.2 | 3 | `'solid'` |
| Crewmate body | 0.5 | 3 | `'solid'` |
| Crewmate visor | 0.3 | 2 | `'solid'` |
| Button / panel | 0.4 | 3.5 | `'solid'` |
| HUD border | 0.6 | 2.5 | `'solid'` |

### 4.3 Outline colour

Always `OUTLINE (#080c0c)` — **not** `'black'`. The near-black with a hint of teal matches the Among Us stroke feel.

---

## 5. UI Component Patterns

### 5.1 Classic CTA Button *(preferred — original Among Us style)*

```
┌──────────────────────────────────────┐  ← 3.5px OUTLINE stroke
│         Label text                   │  ← Fredoka One, md, dark text
└──────────────────────────────────────┘
```

- Fill: `#e8f8f8` (near-white, very slight teal tint)
- Stroke: `OUTLINE`, `strokeWidth 3.5`
- Corner radius: 8 px
- Text: `OUTLINE` colour (`#080c0c`), sentence case, `'Fredoka One'` md — **dark on light** for maximum readability
- Hard drop shadow: `rgba(0,0,0,0.5)`, offset `(3, 4)`, no blur
- Selected/active: brighten fill to pure `#ffffff`, add a 2 px `TEXT_ACCENT` inner border

This is the original, most readable button form. Use it for the main menu navigation stack.

### 5.2 Accent CTA Button *(newer Among Us style — use sparingly)*

```
┌──────────────────────────────────────┐  ← 3.5px OUTLINE stroke
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← diagonal stripe overlay (BTN_PRIMARY_STRIPE)
│         LABEL TEXT                   │  ← Fredoka One, md, TEXT_PRIMARY
└──────────────────────────────────────┘
```

- Fill: `BTN_PRIMARY` (`#40d8c0`)
- Stroke: `OUTLINE`, `strokeWidth 3.5`
- Corner radius: 8 px
- **Diagonal stripe**: lines at 30°, spacing 18 px, colour `BTN_PRIMARY_STRIPE`, `globalAlpha 0.35`
- Text: `TEXT_PRIMARY` (`#f0fafa`), sentence case or all-caps
- Drop shadow: `SHADOW`, offset `(3, 4)`, blur 0

Use for high-emphasis single actions (e.g. in-game "Start" or confirmation dialogs).

### 5.3 Secondary Button

Same shape as 5.1 (classic); fill `BTN_SECONDARY`, no stripe, text `TEXT_MUTED`.

### 5.4 Disabled / Locked Button

Fill `BTN_DISABLED`, stroke `#1a2828`, text `TEXT_MUTED`, lock icon (🔒) left-aligned.

### 5.4 Panel / Card

```
╔══════════════════════════════════════╗  ← 3px OUTLINE, corner radius 10
║  (optional header stripe)            ║
║  content                             ║
╚══════════════════════════════════════╝
```

- Fill: `BG_PANEL`
- 4 px hard drop shadow at offset `(4, 5)`, colour `SHADOW`
- Inner top highlight line: 1 px `BG_PANEL_LIGHT`, inset 3 px

### 5.5 Grid Cell

- Idle: `CELL_DEFAULT` fill with hachure. Stroke `OUTLINE` 3 px.
- Number text: centred, `'Press Start 2P'` sm, `TEXT_PRIMARY`.
- Sus marker: amber `✗` drawn at top-right corner, `TEXT_ACCENT` colour.
- Selected (cursor): pulsing outer border — sin-wave alpha, 4 px, `BTN_PRIMARY`.

### 5.6 HUD Bar

- Thin panel across top: `BG_PANEL` fill, `OUTLINE` 2.5 px stroke.
- Lives: crewmate icons, missing lives shown as grey silhouettes.
- Score / timer: `'Press Start 2P'` xs, `TEXT_ACCENT`, right-aligned.
- Objective pill: `BTN_PRIMARY` background, `TEXT_PRIMARY`, centre-top.

---

## 6. Background & Scene Dressing

### 6.1 Space background

Every scene starts with the same base layer:

1. Fill canvas `BG_SPACE`.
2. Draw 40–60 star dots: random positions, radius 1–2 px, `STAR_DOT`, `globalAlpha 0.5–0.9`.
3. Radial vignette: `createRadialGradient(cx, cy + 50, 0, cx, cy, canvasHeight)`:
   - inner stop `0`: `rgba(13,40,40,0)` (transparent teal hint)
   - outer stop `1`: `rgba(0,0,0,0.6)` (darkens edges)

### 6.2 Panel layout

Scenes use a **centred content panel** (`BG_PANEL`, width ~560, height ~380, corner-radius 10) against the star background.

### 6.3 Scene-edge character decoration

Place 2–4 crewmate illustrations at screen corners/edges as passive scene dressing (not interactive). Rules:
- Always partially clipped by the canvas edge (crop ~30–40% off).
- Scale: 64–80 px wide.
- Scattered at corners or mid-edges, never symmetrical.
- Each uses a distinct body colour from §2.5.
- Draw them **after** the star background, **before** any UI panels.

### 6.4 Role-reveal splash

Matches *Among Us* role card:
- Full-bleed `BG_SPACE` + radial glow.
- Role title (`'Press Start 2P'` xl, `TEXT_TITLE`) centred upper third.
- Tagline (`'Fredoka One'` md, `TEXT_PRIMARY`) centred mid.
- 1–3 crewmate illustrations centred lower third.

---

## 7. Character Drawing (Crewmate)

Among Us crewmates are **rounded-bean** shapes, not rectangular. Aim for this structure:

```
     ╭──────╮
    ╭┤ VISOR├╮
    │╰──────╯│   ← body (rounded rect, 24×32 units)
    │        │
    ╰────────╯
    ╎        ╎   ← legs (short thick lines)
```

### 7.1 Draw order

1. **Body**: Rough.js `roundedRect` or `rectangle` with `cornerRadius 6`, fill `bodyColour`, stroke `OUTLINE` 3 px, `roughness 0.5`, `fillStyle 'solid'`.
2. **Visor**: Rough.js `ellipse`, fill `VISOR`, stroke `OUTLINE` 2 px, `roughness 0.3`.
3. **Visor highlight**: plain `ctx.fillStyle = VISOR_HIGHLIGHT; ctx.arc(...)` tiny circle, `globalAlpha 0.85` — no Rough (highlights should be crisp).
4. **Legs**: Two Rough.js `line`s from bottom corners, slightly outward, `strokeWidth 4`, colour `bodyColour` with `OUTLINE` 3 px (draw outline line first, then body-colour line on top).
5. **Body shadow**: overlay a darker half-ellipse (`bodyColour` darkened 25%) on the lower 30% of the body, `globalAlpha 0.4`.

### 7.2 Scale reference

| Context | Width |
|---------|-------|
| HUD life icon | 16 px |
| Game entity (player) | 32 px |
| Game entity (AI crewmate) | 28 px |
| Title/splash illustration | 64–96 px |

---

## 8. Animation Conventions

| Effect | Approach |
|--------|----------|
| Button pulse (selected) | `sin(elapsed * 3) * 0.4 + 0.6` → border alpha |
| Cell flash (correct/wrong) | Linear fade from 1 → 0 over `FLASH_DURATION` (350 ms), colour `CELL_FLASH_OK` / `CELL_FLASH_ERR` |
| Crewmate walk | Wobble body ±2 px on x-axis, legs alternate stroke length, 8 fps |
| Scene transition | Fade: fill canvas black, `globalAlpha` 0 → 1 over 200 ms, then new scene draws; reverse on exit |
| Star twinkle | Each star has random `phase`; `sin(elapsed * speed + phase) * 0.4 + 0.6` → alpha |

---

## 9. Rough.js Code Snippets

### Draw a primary button

```ts
function drawPrimaryButton(
  rc: RoughCanvas, ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string
) {
  // Hard drop-shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.roundRect(x + 4, y + 5, w, h, 8); ctx.fill();

  // Button body
  rc.rectangle(x, y, w, h, {
    fill: '#40d8c0', fillStyle: 'solid',
    stroke: '#080c0c', strokeWidth: 3.5,
    roughness: 0.4, cornerRadius: 8,
  });

  // Diagonal stripes (clipped)
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.clip();
  ctx.strokeStyle = '#60ecd8'; ctx.globalAlpha = 0.35; ctx.lineWidth = 8;
  for (let i = -h; i < w + h; i += 18) {
    ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke();
  }
  ctx.restore();

  // Label
  ctx.globalAlpha = 1;
  ctx.font = "bold 14px 'Fredoka One', sans-serif";
  ctx.fillStyle = '#f0fafa';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), x + w / 2, y + h / 2);
}
```

### Draw the space background

```ts
function drawSpaceBackground(ctx: CanvasRenderingContext2D, stars: {x:number,y:number,r:number,phase:number}[], elapsed: number) {
  ctx.fillStyle = '#0a0e10';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  stars.forEach(s => {
    ctx.globalAlpha = Math.sin(elapsed * 1.2 + s.phase) * 0.4 + 0.6;
    ctx.fillStyle = '#c8e8f0';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Vignette
  const cx = ctx.canvas.width / 2, cy = ctx.canvas.height / 2;
  const vg = ctx.createRadialGradient(cx, cy + 50, 0, cx, cy, ctx.canvas.height);
  vg.addColorStop(0, 'rgba(13,40,40,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
```

---

## 10. What to Avoid

| ❌ Don't | ✅ Do instead |
|----------|--------------|
| Gradient fills on buttons | Solid fill + diagonal stripe overlay |
| Thin fonts or light weights | Fredoka One / Press Start 2P only |
| Roughness > 1.2 on any UI element | Keep ≤ 0.9; ≤ 0.5 for characters |
| More than 3 colours in one component | Pick primary + shadow + outline only |
| Sans-serif fallback text | Always load Google Fonts; add readable fallback `sans-serif` only as last resort |
| Pixel-perfect shadows | Hard 3–5 px offset shadows (comic book style) |
| White backgrounds | Only `BG_SPACE`, `BG_PANEL`, or `BG_PANEL_LIGHT` |
