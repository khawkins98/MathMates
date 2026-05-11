import type { StageDefinition } from '@/types';

export const STAGES: StageDefinition[] = [
  {
    id: 'adding',
    title: 'Counting On',
    description: 'Addition sums — find the right totals!',
    icon: '➕',
    scenarios: ['addition-1', 'addition-2'],
  },
  {
    id: 'subtracting',
    title: 'Taking Away',
    description: 'Subtraction — find the right differences!',
    icon: '➖',
    scenarios: ['subtraction-1', 'subtraction-2'],
  },
  {
    id: 'twos',
    title: 'Twos & Evens',
    description: 'Multiples of 2 — even numbers everywhere!',
    icon: '2️⃣',
    scenarios: ['multiples-2'],
  },
  {
    id: 'fives-tens',
    title: 'Fives and Tens',
    description: 'Multiples of 5 and 10 — spot the pattern!',
    icon: '5️⃣',
    scenarios: ['multiples-5', 'multiples-10'],
  },
  {
    id: 'threes-fours',
    title: 'Threes and Fours',
    description: 'Multiples of 3 and 4 — the trickier times tables!',
    icon: '3️⃣',
    scenarios: ['multiples-3', 'multiples-4'],
  },
];
