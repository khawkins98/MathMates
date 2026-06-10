const STORAGE_KEY = 'mathmates-v2-misses';
const MAX_ENTRIES = 120;

export interface MissEntry {
  display: string;
  numeric: number;
  scenarioId: string;
  ts: number;
}

function load(): MissEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (e): e is MissEntry =>
        !!e && typeof e.display === 'string' && typeof e.numeric === 'number' && Number.isFinite(e.numeric),
    );
  } catch {
    return [];
  }
}

function save(entries: MissEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Storage unavailable — miss history is a nice-to-have, never blocking.
  }
}

/** Record a wrong eat so the fact can resurface later (briefing warm-up, Captain's Log). */
export function recordMiss(display: string, numeric: number, scenarioId: string): void {
  const entries = load();
  entries.push({ display, numeric, scenarioId, ts: Date.now() });
  save(entries);
}

/** Most recently missed facts, deduplicated by expression, newest first. */
export function getRecentMisses(limit: number, scenarioId?: string): MissEntry[] {
  const entries = load().reverse();
  const seen = new Set<string>();
  const out: MissEntry[] = [];
  for (const entry of entries) {
    if (scenarioId && entry.scenarioId !== scenarioId) {
      continue;
    }
    if (seen.has(entry.display)) {
      continue;
    }
    seen.add(entry.display);
    out.push(entry);
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}

/** Most frequently missed facts of all time, for the grown-up Captain's Log. */
export function getTopMisses(limit: number): Array<{ display: string; numeric: number; count: number }> {
  const counts = new Map<string, { display: string; numeric: number; count: number }>();
  for (const entry of load()) {
    const existing = counts.get(entry.display);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(entry.display, { display: entry.display, numeric: entry.numeric, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
