# PixiJS Game Dev — Persistent Memory

## Key files
- `src/core/SceneManager.ts` — preloads all PNG assets in `_bootstrap()` before scenes boot
- `src/sprites/CrewmateSprite.ts` — procedural + PNG variants; `CREWMATE_TEXTURE_URL` constant
- `src/sprites/SpriteButton.ts` — texture-swapping button (idle/hover/pressed); `onClick` callback
- `src/sprites/ButtonSprite.ts` — legacy procedural button; DO NOT change — used everywhere except TitleScene
- `src/constants.ts` — `COLORS.VISOR_CYAN = 0x00d9ff`; `GAME_WIDTH=520`, `GAME_HEIGHT=380`

## Asset conventions
- All PNG sprites live in `public/sprites/` and are served at `/sprites/<name>.png`
- Preload list lives in `SPRITE_ASSETS` const at top of `SceneManager.ts`
- After preloading: `Assets.get('/sprites/foo.png') as Texture` is synchronous and safe in constructors
- Crewmate base is desaturated (max-channel greyscale) → set `sprite.tint = color` to colorize
- Visor must be overlaid as a cyan Graphics ellipse (~x=20,y=10 r=5,7 in 28×37px sprite)

## Procedural drawing
- Do NOT use `any` — always cast: `Assets.get(url) as Texture`
- `Graphics.ellipse(cx,cy,rx,ry).fill(color)` — PixiJS v8 fluent API
- `Graphics.roundRect(x,y,w,h,r).fill({color, alpha})` — for highlights/overlays

## Scene lifecycle
- `enter(root: Container)` — build and add children to `root`
- `update(dt: number)` — dt is milliseconds (ticker.deltaMS)
- `exit()` — called before `root` is destroyed; clean up timers/listeners

## Build
- `npm run build` → `tsc && vite build` (strict TS + Vite)
- Build must pass with zero errors before shipping

## Details
- See `patterns.md` for sprite extraction ImageMagick notes
