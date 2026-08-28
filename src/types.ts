// ─── Sweeble v2 Types ─────────────────────────────────────

export type SquadColor = 'green' | 'red' | 'yellow' | 'purple' | 'blue';

export interface PastelTheme {
  base: string;
  accent: string;
  glow: string;
  tint: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export interface TrackDefinition {
  index: number;
  roleName: string;
  shortName: string;
  icon: string;
  squadColor: SquadColor;
  theme: PastelTheme;
}

export const PASTEL_TRACKS: TrackDefinition[] = [
  {
    index: 0,
    roleName: 'Flower',
    shortName: 'Flower',
    icon: '',
    squadColor: 'green',
    theme: {
      base: '#6EE7B7',       // Pastel Mint
      accent: '#059669',     // Deep Emerald
      glow: '#A7F3D0',
      tint: '#ECFDF5',       // Soft Sage Tint
      border: '#A7F3D0',
      badgeBg: '#D1FAE5',
      badgeText: '#065F46',
    },
  },
  {
    index: 1,
    roleName: 'Lil Peach',
    shortName: 'Peach',
    icon: '',
    squadColor: 'red',
    theme: {
      base: '#FDA4AF',       // Pastel Peach / Coral
      accent: '#E11D48',     // Deep Rose
      glow: '#FECDD3',
      tint: '#FFF1F2',       // Blush Tint
      border: '#FECDD3',
      badgeBg: '#FFE4E6',
      badgeText: '#9F1239',
    },
  },
  {
    index: 2,
    roleName: 'Pal',
    shortName: 'Pal',
    icon: '',
    squadColor: 'yellow',
    theme: {
      base: '#FDE047',       // Pastel Buttercup
      accent: '#D97706',     // Golden Amber
      glow: '#FEF08A',
      tint: '#FEFCE8',       // Warm Custard Tint
      border: '#FEF08A',
      badgeBg: '#FEF9C3',
      badgeText: '#854D0E',
    },
  },
  {
    index: 3,
    roleName: 'Acorn',
    shortName: 'Acorn',
    icon: '',
    squadColor: 'purple',
    theme: {
      base: '#C4B5FD',       // Pastel Lavender
      accent: '#7C3AED',     // Deep Violet
      glow: '#DDD6FE',
      tint: '#F5F3FF',       // Lilac Tint
      border: '#DDD6FE',
      badgeBg: '#EDE9FE',
      badgeText: '#5B21B6',
    },
  },
  {
    index: 4,
    roleName: 'Sprout',
    shortName: 'Sprout',
    icon: '',
    squadColor: 'blue',
    theme: {
      base: '#7DD3FC',       // Pastel Sky Blue
      accent: '#0284C7',     // Deep Azure
      glow: '#BAE6FD',
      tint: '#F0F9FF',       // Soft Ice Tint
      border: '#BAE6FD',
      badgeBg: '#E0F2FE',
      badgeText: '#075985',
    },
  },
];

// ─── Agent State ────────────────────────────────────────

export interface AgentState {
  id: string;
  trackIndex: number;
  roleName: string;
  icon: string;
  squadColor: SquadColor;
  theme: PastelTheme;
  alive: boolean;

  /** Tokens battery / life (0 = death) */
  tokens: number;
  maxTokens: number;

  /** Jump Elevation Physics */
  isJumping: boolean;
  jumpTimer: number;
  jumpDuration: number;
  jumpHeightZ: number; // 0 to 1 elevation
  jumpPeakHeightPx: number;

  /** Visual Animation State */
  sizeMultiplier: number;
  targetSizeMultiplier: number;
  computeAuraTimer: number;
  pulsePhase: number;
  invulnerableTimer: number;

  /** Stats */
  tokensMaxxedTotal: number;
  powerUpsCollected: number;
  obstaclesCleared: number;
  obstaclesHit: number;
}

// ─── Items & Obstacles ──────────────────────────────────

export enum ItemType {
  ColorBlock = 'color_block',       // Solid color block to recruit/rehire
  ComputeToken = 'compute_token',   // White/golden token giving compute
  EnergySnack = 'energy_snack',     // Speed boost + tokens
  DreadObstacle = 'dread_obstacle', // Jumpable hazard (AI Fatigue, Doom, Dread)
  TarObstacle = 'tar_obstacle',     // Jumpable black tar puddle
  BugObstacle = 'bug_obstacle',     // Jumpable software bugs & crashes
  MeetingObstacle = 'meeting_obstacle', // Jumpable unscheduled sync meeting speed bumps
  GlitchObstacle = 'glitch_obstacle',   // Jumpable electrified CI/CD glitches
}

export interface TrackItem {
  id: string;
  trackIndex: number;
  type: ItemType;
  positionY: number; // y coordinate in world units
  lengthPx: number;
  title: string;
  icon: string;
  color: string;
  accentColor: string;
  isObstacle: boolean;
  isRecruiter: boolean;
  squadColor?: SquadColor;
  collected: boolean;
  clearedByJump: boolean;
}

// ─── Track State (Independent Speeds & 7-Day Timeline) ─

export interface TrackState {
  index: number;
  definition: TrackDefinition;
  isUnlocked: boolean;

  /** Independent track progress & timeline */
  dayNumber: number; // 1 to 7
  sleepCount: number; // 0 to 7
  dayProgress: number; // 0 to 1 for current day
  isNightSleeping: boolean;
  sleepTimer: number;

  /** Track speed & distance */
  currentSpeed: number;
  baseSpeed: number;
  distanceTraveledPx: number;
  isComplete: boolean;

  /** Active agent in this track (null if empty) */
  agent: AgentState | null;

  /** Independent item stream for this track */
  items: TrackItem[];
  nextSpawnY: number;

  /** Productivity score locked for this track (0 to 100) */
  productivityScore: number;
}

// ─── Global Game State ──────────────────────────────────

export enum GamePhase {
  Menu = 'menu',
  Playing = 'playing',
  Paused = 'paused',
  WeekComplete = 'week_complete',
  GameOver = 'gameover',
}

export interface DevModeSettings {
  allowSleeps: boolean;           // Default: false
  allowBlackObstacles: boolean;   // Default: true (Tar & Dread synchronized waves)
  allowBugObstacles: boolean;     // Default: false (Software bugs, memory leaks)
  allowMeetingObstacles: boolean; // Default: false (Pop-up meetings, syncs)
  allowGlitchObstacles: boolean;  // Default: false (CI/CD glitches, outages)
}

export interface KeyBindingsConfig {
  jumpTrack1: string; // e.g. "Digit1" or "1"
  jumpTrack2: string; // e.g. "Digit2" or "2"
  jumpTrack3: string; // e.g. "Digit3" or "3"
  jumpTrack4: string; // e.g. "Digit4" or "4"
  jumpTrack5: string; // e.g. "Digit5" or "5"
  jumpAll: string;    // e.g. "Space"
  pause: string;      // e.g. "KeyP" or "Escape"
  quit: string;       // e.g. "KeyQ"
}

export const DEFAULT_KEY_BINDINGS: KeyBindingsConfig = {
  jumpTrack1: '1',
  jumpTrack2: '2',
  jumpTrack3: '3',
  jumpTrack4: '4',
  jumpTrack5: '5',
  jumpAll: 'Space',
  pause: 'p',
  quit: 'q',
};

export interface VFXParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  text?: string;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
}

export const V2_CONSTANTS = {
  CANVAS_WIDTH: 960,
  TOTAL_DAYS: 5,
  MAX_TRACKS: 5,
  DAY_DURATION_SECONDS: 20,
  SLEEP_DURATION_SECONDS: 2.2,

  DEFAULT_AGENT_TOKENS: 100,
  TOKEN_BURN_RATE_PER_SEC: 4.5,

  AGENT_BASE_SPEED: 240,
  SPEED_BOOST_MULTIPLIER: 1.5,
  OBSTACLE_HIT_SLOWDOWN: 0.5,

  JUMP_DURATION: 0.52,
  JUMP_PEAK_HEIGHT_PX: 55,
  JUMP_CLEARANCE_THRESHOLD: 0.32,

  COMPUTE_TOKEN_VALUE: 25,
  ENERGY_SNACK_VALUE: 40,
  OBSTACLE_TOKEN_PENALTY: 30,
} as const;
