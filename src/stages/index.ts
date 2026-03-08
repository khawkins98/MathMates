import type { StageDefinition } from '../types';
import { mult2, mult3, mult5, mult10 } from './mult-n';
import { times2, times5, times10 } from './times-n';
import { add1d } from './add-1d';
import { add2d } from './add-2d';
import { sub1d } from './sub-1d';

const stages: StageDefinition[] = [
  add1d,
  sub1d,
  add2d,
  mult2,
  mult5,
  mult10,
  mult3,
  times2,
  times5,
  times10,
];

/** Returns all registered stages. */
export function getAllStages(): StageDefinition[] {
  return stages;
}

/** Returns the stage with the given id, or undefined if not found. */
export function getStageById(id: string): StageDefinition | undefined {
  return stages.find((s) => s.id === id);
}

/** Returns stages sorted by difficulty (ascending), then by name. */
export function getSortedStages(): StageDefinition[] {
  return [...stages].sort((a, b) => {
    if (a.difficulty !== b.difficulty) {
      return a.difficulty - b.difficulty;
    }
    return a.name.localeCompare(b.name);
  });
}
