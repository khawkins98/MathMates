import { COLOURS } from '@/rendering/colours';
import type { StageDefinition } from '@/types';

export const STAGES: StageDefinition[] = [
  {
    id: 'adding',
    title: 'Counting On',
    description: 'Find the right totals!',
    icon: '+',
    iconColour: COLOURS.SUCCESS,
    scenarios: ['addition-1', 'addition-2'],
  },
  {
    id: 'adding-20',
    title: 'Adding to 20',
    description: 'Bigger sums — all the way to 20!',
    icon: '+20',
    iconColour: COLOURS.SUCCESS,
    scenarios: ['addition-3', 'addition-4'],
  },
  {
    id: 'subtracting',
    title: 'Taking Away',
    description: 'Find the right differences!',
    icon: '−',
    iconColour: COLOURS.ORANGE,
    scenarios: ['subtraction-1', 'subtraction-2'],
  },
  {
    id: 'subtracting-20',
    title: 'Taking from 20',
    description: 'Bigger differences — up to 20!',
    icon: '−20',
    iconColour: COLOURS.ORANGE,
    scenarios: ['subtraction-3', 'subtraction-4'],
  },
  {
    id: 'twos',
    title: 'Twos & Evens',
    description: 'Spot the even numbers!',
    icon: 'x2',
    iconColour: COLOURS.GOLD,
    scenarios: ['multiples-2'],
  },
  {
    id: 'fives-tens',
    title: 'Fives and Tens',
    description: 'Count in fives and tens!',
    icon: 'x5',
    iconColour: COLOURS.GOLD,
    scenarios: ['multiples-5', 'multiples-10'],
  },
  {
    id: 'threes-fours',
    title: 'Threes and Fours',
    description: 'The trickier times tables!',
    icon: 'x3',
    iconColour: COLOURS.GOLD,
    scenarios: ['multiples-3', 'multiples-4'],
  },
  {
    id: 'mixed-tables',
    title: 'Mixed Tables',
    description: 'All mixed up — stay sharp!',
    icon: 'x?',
    iconColour: COLOURS.CYAN,
    scenarios: ['mixed-tables-1', 'mixed-tables-2', 'mixed-tables-3'],
  },
];
