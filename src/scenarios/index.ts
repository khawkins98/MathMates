import type { ScenarioDefinition } from '@/types';
import { addition1, addition2 } from './addition';
import { multiples2, multiples3, multiples4, multiples5, multiples10 } from './multiples';
import { subtraction1, subtraction2 } from './subtraction';

export const SCENARIO_REGISTRY = new Map<string, ScenarioDefinition>([
  ['addition-1', addition1],
  ['addition-2', addition2],
  ['subtraction-1', subtraction1],
  ['subtraction-2', subtraction2],
  ['multiples-2', multiples2],
  ['multiples-5', multiples5],
  ['multiples-10', multiples10],
  ['multiples-3', multiples3],
  ['multiples-4', multiples4],
]);
