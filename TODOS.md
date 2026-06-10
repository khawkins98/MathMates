# MathMates — Idea Backlog

Sourced from the design-panel reviews (game designer / art director / learning designer,
June 2026). Costs: S = hours, M = a day or two, L = bigger. Ranked within each section.

## Next up (recommended order)

- [ ] **Topic tracks + Warp Gates** (S) — restructure the single stage ladder into three
      tracks (Adding ×2, Taking Away ×2, Times Tables ×4); first Adding and Twos & Evens
      stages open from the start. Fixes the difficulty inversion (Subtract-to-17 currently
      gates difficulty-1 Twos & Evens). Any padlocked stage offers a "Warp Gate": a
      60-second board over the prerequisite's facts; ≥80% accuracy unlocks — mastery-based
      placement so a strong subtractor isn't walled behind addition.
- [ ] **WANTED posters** (S) — briefing shows torn WANTED posters for recently-missed facts
      ("WANTED: 7−4"); nailing one in-mission slams a BOUNTY +20 stamp. Makes the existing
      miss pipeline loud; revenge is the most kid-legible motivation there is.
- [ ] **Hull framing** (M) — procedural rough.js ship frame around the gameplay grid (panel
      seams, rivets, vent grille, LED strip, porthole corner). The grid stops floating in
      black; the strongest remaining "place" fix that needs no commissioned art.
- [ ] **Real multiplication expressions** (S) — the game currently contains zero `3 × 5`
      style expressions; multiples boards show bare numbers, so the ends-in-0-or-5 trick
      substitutes for fact recall. Add a recall scenario per tables stage:
      pattern-spotting board → fact-recall board.
- [ ] **Missing-number boards** (S) — `3 + ? = 5` scenario type ("decode the corrupted
      console readouts"). KS1 algebra precursor, attacks the `=`-means-"makes"
      misconception, and gives orphaned misses (e.g. a missed 3+4=7 with no 7-target
      board) a home where eating them is the right move.

## Gameplay / modes

- [ ] **The Cloak** (S/M) — impostor mode: every 3-streak charges a cloak (max 2); activate
      for 3s of invisibility to danger zones. Converts "good at math" into "sneaky".
- [ ] **Captain's Daily Orders** (S/M) — one date-seeded daily mission with a named modifier
      ("the wanderer is EXTRA hungry"); calendar stamps, 5-a-week special badge. Siblings
      get the same board — kitchen-table comparison.
- [ ] **Ghost Race** (M) — record best-run positions per scenario; replay as a translucent
      grey crewmate to race. Self-matched difficulty, "that was ME, I can beat me".
- [ ] **Lights Out** (M) — once per mission (stage 3+): board goes dark except a glow around
      the player for ~10s; eat what you remember. Drama-shaped retrieval practice.
- [ ] **Pet Snacker** (M) — spend badge stars at a Hatchery on a pet with one passive
      (blocks one theft / auto-marks one sus / slows AIR drain). Closes the badge-spend
      loop; pets double as invisible difficulty assists.
- [ ] **Captain's Inspection** (L) — per-stage boss: a big Captain sweeps a predictable
      flashlight cone; touch the beam → dramatic ejection. Proving ground for cone vision.

## Learning layer

- [ ] **Per-fact mastery model** (M, foundation) — record correct AND wrong encounters per
      fact (`new → wobbly → mastered`); Captain's Log shows "missed 3×, now solid"; seeding
      prioritizes wobbly facts and retires mastered ones. Prerequisite for Daily Orbit.
- [ ] **Elaborated error freeze** (S) — add the gap line: "0 + 2 makes 2 — that's 3 less
      than 5"; multiples version models counting up ("3, 6, 9, 12 … 14 isn't on the list").
      Wire into the existing speechSynthesis path for pre-readers.
- [ ] **Daily Orbit** (M, needs mastery model) — ninth select tile: 90-second mixed review
      board of wobbly facts at spaced intervals (1d / 3d / 7d), padded with easy wins.
- [ ] **Doubles & Halves stage** (S) — "Find the doubles!" (`4 + 4` vs `6 + 3`); bridge
      stage between addition and tables; cheapest new stage available.
- [ ] **Fluency star** (M) — log response latency; celebrate fast-and-right facts with a
      comet trail; Captain's Log separates "knows it" from "knows it fast". Never a gate,
      never a countdown — reward-only to avoid timed-pressure anxiety.
- [ ] **Number-line hint lens** (M, deferred from round 1) — hold-to-peek 0–20 number line
      with hop animation for the highlighted cell; 3 free uses per mission.

## Art & identity

- [ ] **Mission Deck painting** (L, the one art commission) — painted nav-room background
      for stage select; the eight tiles become screens mounted on the console.
- [ ] **Lighting states module** (M) — cyan pool under the cursor cell; ambient dim + red
      emergency strips when AIR < 25%; light as the game's signal channel.
- [ ] **Crewmate acting verbs** (M for the set) — blink, wind-up squash before eating, chew
      bulge, startle on SEEN!, strut after a 3-streak. Sin/scale transforms only.
- [ ] **Comic-panel stamps** (M) — letterbox bars + 3× character pose + starburst behind
      SEEN!/elimination moments; ejection text for game-over ("… 3 + 4 was not 5 …").
- [ ] **Locked stages as sealed doors** (M) — bolted hatch / glowing-keypad-next-up /
      open-doorway-completed instead of padlock-on-grey-card; power cable routes from the
      last completed stage.
- [ ] **Mission Report postcard** (S/M) — composited share card on the Complete screen
      (stars, accuracy, best streak, strutting crewmate) via canvas.toBlob + Web Share.
      The fridge-door artifact; markets the game outside the game.
- [ ] **Seasonal theme tokens** (S each after S setup) — palette + prop swaps (October
      pumpkin visors, December snow caps); two per year.

## Deferred / needs human

- [ ] **Playtest with an actual child (5–9)** — verify: audio feel, reading speed on
      briefings/freezes, danger-zone legibility, whether "S" reads as "5" in Fredoka One,
      difficulty curve. Nothing on this list matters more.
- [ ] **Sticker locker** (M) — collectible wall rewarding learning behaviours ("Fixed a
      Tricky One", "Comeback"); partially covered by badges, revisit after pets.
- [ ] **Vents** (M) — two vent cells per board, step in one pop out the other; second-most
      iconic Among Us mechanic, teaches wrap-around spatial thinking.
- [ ] **Lives → oxygen experiment** (M) — replace terminal failure with a depleting/refilling
      O2 bar for crew mode (failure = slower, never game over). Playtest first; big swing.
- [ ] **Distractor overshoot** — add-to-20 distractors are all undershoots (sums capped at
      20); kids may learn "feels-just-under = skip". Decide knowingly or widen to 24.
