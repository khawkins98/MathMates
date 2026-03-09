// Grid
export const GRID_COLS = 5;
export const GRID_ROWS = 4;
export const CELL_SIZE = 64;
export const GUTTER = 2;
export const GRID_WIDTH = GRID_COLS * (CELL_SIZE + GUTTER) - GUTTER;
export const GRID_HEIGHT = GRID_ROWS * (CELL_SIZE + GUTTER) - GUTTER;

// Viewport
export const GAME_WIDTH = 520;
export const GAME_HEIGHT = 380;
export const HUD_HEIGHT = 32;

// Colours (PixiJS hex)
export const COLORS = {
  DEEP_SPACE: 0x1b1f3b,
  VISOR_CYAN: 0x00d9ff,
  CREW_RED: 0xc51111,
  HULL_GREY: 0x4a4e69,
  STAR_WHITE: 0xffffff,
  SUCCESS_GREEN: 0x17c964,
} as const;

// Scoring
export const POINTS_PER_CORRECT = 10;
export const STREAK_INCREMENT = 0.5;
export const STREAK_THRESHOLD = 3; // correct answers needed to increment
export const STREAK_MAX = 3;
export const TIME_BONUS = 50;

// Lives
export const STARTING_LIVES = 5;

// Timing (ms)
export const TRANSITION_DURATION = 500;
export const ELIMINATION_DURATION = 1500;
export const COUNTDOWN_STEP_MS = 1000;

// Impostor
export const IMPOSTOR_MOVE_INTERVAL = 1500; // ms between moves
export const IMPOSTOR_LIFESPAN = 10000; // ms before despawn
export const IMPOSTOR_SPAWN_INTERVAL = 15000; // ms between spawns

// AI Crewmate (Impostor Mode)
export const AI_MOVE_INTERVAL_BASE = 2000; // ms between moves at difficulty 1
export const AI_MOVE_INTERVAL_MIN = 1200; // ms between moves at difficulty 5
export const AI_CHASE_DISTANCE = 2; // Manhattan distance to trigger chase behavior
export const AI_CREWMATE_COUNT = 3;
export const POINTS_PER_ELIMINATION = 25;
export const AI_DWELL_DURATION = 1; // multiplier of moveInterval before consuming
export const AI_EJECT_DURATION = 400; // ms
