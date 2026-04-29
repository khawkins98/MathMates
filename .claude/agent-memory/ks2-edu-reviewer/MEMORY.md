# KS2 Educational Reviewer Memory

## Review Status
- Full review completed 2026-03-08. Verdict: NEEDS REVISION.
- See `review-findings.md` for detailed stage-by-stage findings.

## Key Calibration Issues Found
- mult-10: code has difficulty 2 + impostor ON; should be difficulty 1, impostor OFF (PRD agrees)
- times-10: code has difficulty 3 + impostor ON; should be difficulty 2, impostor OFF (10x table is easiest)
- add-1d TARGETS [5,7,8,9,10] missing bonds to 3 and 4; recommend [3,4,5,7,10]
- Par times too aggressive: 30s for add-1d means <3.75s/cell including navigation; recommend 45-60s

## Problem Generation Bugs
- times-n: small products (e.g. 4) have too few factor pairs; padding loop creates duplicate cells
- sub-1d: target 6 has only 3 possible expressions (7-1, 8-2, 9-3); duplicates inevitable
- add-1d and sub-1d: no uniqueness enforcement on generated expressions
- Wrong cells return to 'normal' state after error flash -- can be re-eaten, losing 2 lives for same mistake

## Feedback/Motivation Issues
- Impostor collision resets maths streak (unfair -- not a maths error)
- Elimination overlay 1.5s too long for struggling learners; recommend 800-1000ms
- Game Over screen uses red pulsing text + ghost animation; too intense for age 5
- No positive reinforcement text on correct answers
- No progress counter in HUD (e.g. "4/8 found")

## Architecture Notes
- parTime stored in milliseconds in code; PRD Appendix A says seconds (inconsistency)
- Template comments reference 6x5 grid; actual grid is 5x4
- Correct answer ratio is 40% (8 of 20 cells) -- at lower end of acceptable range
- Stage unlock requires completing ALL missions in a stage at previous difficulty tier

## File Paths
- Stage defs: `src/stages/` (mult-n.ts, times-n.ts, add-1d.ts, add-2d.ts, sub-1d.ts)
- Systems: `src/systems/ScoringSystem.ts`, `src/systems/LivesSystem.ts`
- Constants: `src/constants.ts` (par times, scoring values, lives count)
- Game loop: `src/scenes/GameScene.ts` (eat logic, impostor collision)
- Grid/Cell: `src/entities/Grid.ts`, `src/entities/Cell.ts`
