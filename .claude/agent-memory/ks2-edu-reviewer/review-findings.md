# Detailed Review Findings (2026-03-08)

## Stage Difficulty Map (current vs recommended)

| Stage ID | Current Diff | Recommended | Current Impostor | Recommended | NC Year |
|----------|-------------|-------------|------------------|-------------|---------|
| add-1d   | 1           | 1           | No               | No          | Y1      |
| mult-2   | 1           | 1           | No               | No          | Y2      |
| mult-5   | 1           | 1           | No               | No          | Y1-2    |
| mult-10  | 2           | **1**       | **Yes**          | **No**      | Y1      |
| sub-1d   | 2           | 2           | No               | No          | Y1      |
| mult-3   | 2           | 2           | No               | No          | Y2-3    |
| times-2  | 2           | 2           | No               | No          | Y2      |
| add-2d   | 3           | **2**       | **Yes**          | **No**      | Y2-3    |
| times-5  | 3           | 3           | Yes              | Optional    | Y2      |
| times-10 | 3           | **2**       | **Yes**          | **No**      | Y2      |

## Par Time Recommendations (ms)

| Stage    | Current | Recommended | Reasoning                            |
|----------|---------|-------------|--------------------------------------|
| add-1d   | 30000   | 50000       | 5yo needs 5-6s/cell + navigation     |
| mult-2   | 30000   | 45000       | Even numbers accessible but grid scan |
| mult-5   | 30000   | 45000       | Same as mult-2                       |
| mult-10  | 35000   | 40000       | Very easy recognition (ends in 0)    |
| sub-1d   | 35000   | 45000       | Subtraction harder than addition     |
| mult-3   | 35000   | 45000       | 3x harder to spot than 2x/5x/10x    |
| times-2  | 35000   | 50000       | Expression evaluation takes longer   |
| add-2d   | 45000   | 60000       | Two-digit mental arithmetic is slow  |
| times-5  | 40000   | 55000       | As times-2 but harder products       |
| times-10 | 40000   | 50000       | Easy products but expression format  |

## Critical Bugs
1. Wrong cell can be re-eaten (Grid.consumeCell only marks correct as consumed)
2. Duplicate expressions generated when unique pool is small
3. Impostor collision calls recordWrong() resetting maths streak unfairly

## Distractor Quality Notes
- mult-n: distractors are non-multiples from same range -- good, plausible
- times-n: random AxB expressions -- good variety but no targeting of common errors
- add-1d: random a+b pairs -- no targeting of near-miss errors (e.g. off-by-one)
- sub-1d: random a-b pairs -- decent but could target common subtraction errors
- add-2d: random two-digit sums -- operand range [10,49] makes distractors plausible

## Recommendations for improved distractors
- Include "off-by-one" distractors (target +/- 1) deliberately
- For times-n: include expressions that equal target+/-1 or target+/-n
- For mult-n: include numbers near multiples (e.g., for mult-3, include 10, 14, 16)
