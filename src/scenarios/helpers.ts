import { GRID_COLS, GRID_ROWS } from '@/constants';
import type { CellValue } from '@/types';

export function seededRng(seed: number): () => number {
  let s = seed;
  return function rng() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueValues(values: CellValue[]): CellValue[] {
  const seen = new Set<string>();
  const result: CellValue[] = [];
  for (const value of values) {
    const key = `${value.display}|${value.numeric}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

function pickAmount(values: CellValue[], amount: number, rng: () => number): CellValue[] {
  const unique = uniqueValues(values);
  if (unique.length === 0 && amount > 0) {
    throw new Error('pickAmount: scenario generated an empty value pool — the grid would be unplayable');
  }
  const shuffled = shuffle(unique, rng);
  if (shuffled.length >= amount) {
    return shuffled.slice(0, amount);
  }
  const picked = [...shuffled];
  while (picked.length < amount) {
    const source = unique[Math.floor(rng() * unique.length)];
    picked.push({ ...source });
  }
  return picked;
}

export function buildGrid(
  correctValues: CellValue[],
  wrongValues: CellValue[],
  correctCount: number,
  seed?: number,
): CellValue[] {
  const rng = seededRng(seed ?? Math.floor(Math.random() * 9999));
  const correct = pickAmount(correctValues, correctCount, rng);
  const wrong = pickAmount(wrongValues, GRID_COLS * GRID_ROWS - correctCount, rng);
  return shuffle([...correct, ...wrong], rng);
}
