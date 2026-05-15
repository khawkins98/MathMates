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
    id: 'adding-20',
    title: 'Adding to 20',
    description: 'Bigger additions — sums all the way to 20!',
    icon: '🔢',
    scenarios: ['addition-3', 'addition-4'],
  },
  {
    id: 'subtracting',
    title: 'Taking Away',
    description: 'Subtraction — find the right differences!',
    icon: '➖',
    scenarios: ['subtraction-1', 'subtraction-2'],
  },
  {
    id: 'subtracting-20',
    title: 'Taking from 20',
    description: 'Bigger subtractions — differences up to 20!',
    icon: '🔻',
    scenarios: ['subtraction-3', 'subtraction-4'],
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
  {
    id: 'mixed-tables',
    title: 'Mixed Tables',
    description: 'Multiples of 2, 5 and 10 all mixed up — stay sharp!',
    icon: '🔀',
    scenarios: ['mixed-tables-1', 'mixed-tables-2', 'mixed-tables-3'],
  },
];
