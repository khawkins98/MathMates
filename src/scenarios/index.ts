import type { ScenarioDefinition } from '@/types';
import { addition1, addition2, addition3, addition4 } from './addition';
import { multiples2, multiples3, multiples4, multiples5, multiples10, mixedTables1, mixedTables2, mixedTables3 } from './multiples';
import { subtraction1, subtraction2, subtraction3, subtraction4 } from './subtraction';

export const SCENARIO_REGISTRY = new Map<string, ScenarioDefinition>([
  ['addition-1', addition1],
  ['addition-2', addition2],
  ['addition-3', addition3],
  ['addition-4', addition4],
  ['subtraction-1', subtraction1],
  ['subtraction-2', subtraction2],
  ['subtraction-3', subtraction3],
  ['subtraction-4', subtraction4],
  ['multiples-2', multiples2],
  ['multiples-5', multiples5],
  ['multiples-10', multiples10],
  ['multiples-3', multiples3],
  ['multiples-4', multiples4],
  ['mixed-tables-1', mixedTables1],
  ['mixed-tables-2', mixedTables2],
  ['mixed-tables-3', mixedTables3],
]);
