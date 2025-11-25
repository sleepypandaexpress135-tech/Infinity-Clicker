
export enum GamePhase {
  EARLY = 'EARLY',
  MID = 'MID',
  LATE = 'LATE',
  TRANSCENDENT = 'TRANSCENDENT'
}

export enum Tier {
  QUANTUM = 'Quantum',
  MACROCOSM = 'Macrocosm',
  COSMIC = 'Cosmic',
  MULTIVERSAL = 'Multiversal',
  OMNIPOTENT = 'Omnipotent'
}

export interface Building {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  baseProduction: number;
  count: number;
  costMultiplier: number;
  unlocked: boolean;
  flavorText?: string;
  tier: Tier;
  justUnlocked?: boolean;
}

export type HelperType = 'CLICK' | 'BUY' | 'RESEARCH';

export interface Helper {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  type: HelperType;
  unlocked: boolean;
  active: boolean;
  intervalMs: number;
  lastActionTime: number;
  bonusMultiplier?: number; // New field for research buffs
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string; // Lucide icon name identifier
  conditionType: 'RESOURCE_TOTAL' | 'BUILDING_COUNT' | 'CLICK_COUNT' | 'RESEARCH_COUNT' | 'PRESTIGE' | 'SPECIAL';
  threshold: number;
  flavorText?: string;
  hidden?: boolean; // New field for secret achievements
}

export interface GameState {
  galaxyName: string; // User customizable name
  resources: number;
  totalResourcesGenerated: number; // Lifetime of current run
  lifetimeTotalResources: number; // All runs combined (for achievements/metrics)
  totalClicks: number; // Track manual clicks
  clickPower: number;
  buildings: Building[];
  helpers: Helper[];
  achievements: Achievement[];
  achievementQueue: Achievement[]; // For toast notifications
  theme: string;
  resourceName: string;
  currentTier: Tier;
  prestigeCurrency: number; // Cosmic Shards
  prestigeMultiplier: number;
  logs: LogEntry[];
  lastSaveTime: number;
  generationCount: number;
}

export interface LogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'unlock' | 'story' | 'prestige' | 'achievement' | 'cheat';
}

export interface GeneratedBuildingData {
  name: string;
  description: string;
  baseCost: number;
  baseProduction: number;
  flavorText: string;
}

export const INITIAL_HELPERS: Helper[] = [
  {
    id: 'h_clicker',
    name: 'Nanobot Swarm',
    description: 'Auto-clicks once every second.',
    baseCost: 500,
    type: 'CLICK',
    unlocked: false,
    active: false,
    intervalMs: 1000,
    lastActionTime: 0,
    bonusMultiplier: 1
  },
  {
    id: 'h_builder',
    name: 'Auto-Fabricator',
    description: 'Buys the cheapest building every 5 seconds.',
    baseCost: 25000,
    type: 'BUY',
    unlocked: false,
    active: false,
    intervalMs: 5000,
    lastActionTime: 0,
    bonusMultiplier: 1
  },
  {
    id: 'h_researcher',
    name: 'AI Core',
    description: 'Auto-researches new tech when affordable.',
    baseCost: 100000,
    type: 'RESEARCH',
    unlocked: false,
    active: false,
    intervalMs: 10000,
    lastActionTime: 0,
    bonusMultiplier: 1
  }
];

export const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'b_cursor',
    name: 'Quantum Fluctuator',
    description: 'Generates small ripples in spacetime.',
    baseCost: 15,
    baseProduction: 0.5,
    count: 0,
    costMultiplier: 1.15,
    unlocked: true,
    flavorText: 'It just wiggles a bit.',
    tier: Tier.QUANTUM
  },
  {
    id: 'b_drone',
    name: 'Matter Weaver',
    description: 'Knits basic particles together.',
    baseCost: 100,
    baseProduction: 4,
    count: 0,
    costMultiplier: 1.15,
    unlocked: true,
    flavorText: 'Clickity clack, matter is back.',
    tier: Tier.QUANTUM
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a_start',
    name: 'The First Ripple',
    description: 'Generate 100 total resources.',
    unlocked: false,
    icon: 'Zap',
    conditionType: 'RESOURCE_TOTAL',
    threshold: 100,
    flavorText: 'Something out of nothing.'
  },
  {
    id: 'a_clicker',
    name: 'Manual Override',
    description: 'Click the core 100 times.',
    unlocked: false,
    icon: 'MousePointer',
    conditionType: 'CLICK_COUNT',
    threshold: 100,
    flavorText: 'Your finger is the god of this universe.'
  },
  {
    id: 'a_builder',
    name: 'Architect',
    description: 'Own 25 buildings total.',
    unlocked: false,
    icon: 'Hammer',
    conditionType: 'BUILDING_COUNT',
    threshold: 25,
    flavorText: 'A sturdy foundation.'
  },
  {
    id: 'a_industrial',
    name: 'Industrial Revolution',
    description: 'Own 100 buildings total.',
    unlocked: false,
    icon: 'Factory',
    conditionType: 'BUILDING_COUNT',
    threshold: 100,
    flavorText: 'Efficiency is key.'
  },
  {
    id: 'a_rich',
    name: 'Millionaire',
    description: 'Generate 1,000,000 total resources.',
    unlocked: false,
    icon: 'Coins',
    conditionType: 'RESOURCE_TOTAL',
    threshold: 1000000,
    flavorText: 'Too big to fail.'
  },
  {
    id: 'a_research',
    name: 'Pioneer',
    description: 'Research 5 new technologies.',
    unlocked: false,
    icon: 'Microscope',
    conditionType: 'RESEARCH_COUNT',
    threshold: 5 + INITIAL_BUILDINGS.length,
    flavorText: 'Knowledge is power.'
  },
  {
    id: 'a_clicker_master',
    name: 'Carpal God',
    description: 'Click the core 1,000 times.',
    unlocked: false,
    icon: 'HandMetal',
    conditionType: 'CLICK_COUNT',
    threshold: 1000,
    flavorText: 'Do you ever rest?'
  },
  {
    id: 'a_prestige',
    name: 'Transcendent',
    description: 'Perform a Prestige reset once.',
    unlocked: false,
    icon: 'Infinity',
    conditionType: 'PRESTIGE',
    threshold: 1,
    flavorText: 'The end is only the beginning.'
  },
  // --- NEW ACHIEVEMENTS (Total 16) ---
  {
    id: 'a_clicker_5k',
    name: 'Finger Breaker',
    description: 'Click the core 5,000 times.',
    unlocked: false,
    icon: 'Activity',
    conditionType: 'CLICK_COUNT',
    threshold: 5000,
    flavorText: 'Hardware warranty voided.'
  },
  {
    id: 'a_research_10',
    name: 'Mad Scientist',
    description: 'Research 10 new technologies.',
    unlocked: false,
    icon: 'Brain',
    conditionType: 'RESEARCH_COUNT',
    threshold: 10 + INITIAL_BUILDINGS.length,
    flavorText: 'They called me crazy!'
  },
  {
    id: 'a_buildings_200',
    name: 'City Planet',
    description: 'Own 200 buildings total.',
    unlocked: false,
    icon: 'Globe',
    conditionType: 'BUILDING_COUNT',
    threshold: 200,
    flavorText: 'Running out of parking space.'
  },
  {
    id: 'a_buildings_500',
    name: 'Dyson Swarm',
    description: 'Own 500 buildings total.',
    unlocked: false,
    icon: 'Rocket',
    conditionType: 'BUILDING_COUNT',
    threshold: 500,
    flavorText: 'Blocking out the sun.'
  },
  {
    id: 'a_rich_1b',
    name: 'Galactic GDP',
    description: 'Generate 1,000,000,000 total resources.',
    unlocked: false,
    icon: 'Coins',
    conditionType: 'RESOURCE_TOTAL',
    threshold: 1000000000,
    flavorText: 'Money prints money.'
  },
  {
    id: 'a_prestige_10',
    name: 'Star Child',
    description: 'Accumulate 10 Cosmic Shards.',
    unlocked: false,
    icon: 'Gem',
    conditionType: 'PRESTIGE',
    threshold: 10,
    flavorText: 'Full of stars.'
  },
  {
    id: 'a_research_25',
    name: 'Omniscience',
    description: 'Research 25 new technologies.',
    unlocked: false,
    icon: 'Brain',
    conditionType: 'RESEARCH_COUNT',
    threshold: 25 + INITIAL_BUILDINGS.length,
    flavorText: 'I see the code of the matrix.'
  },
  {
    id: 'a_rich_1t',
    name: 'Type III Civilization',
    description: 'Generate 1 Trillion total resources.',
    unlocked: false,
    icon: 'Crown',
    conditionType: 'RESOURCE_TOTAL',
    threshold: 1000000000000,
    flavorText: 'Energy is meaningless now.'
  },
  // --- SECRET ACHIEVEMENT ---
  {
    id: 'a_cheater',
    name: "The Architect's Backdoor",
    description: "You found the hidden developer console.",
    unlocked: false,
    icon: 'Terminal',
    conditionType: 'SPECIAL',
    threshold: 1,
    flavorText: "With great power comes zero responsibility.",
    hidden: true
  },
  {
    id: 'a_dirty_hacker',
    name: "Dirty Hacker",
    description: "You actually used a cheat command.",
    unlocked: false,
    icon: 'Skull',
    conditionType: 'SPECIAL',
    threshold: 1,
    flavorText: "Achievements earned this way taste like ash.",
    hidden: true
  }
];

export const INITIAL_STATE: GameState = {
  galaxyName: "Unknown Sector",
  resources: 0,
  totalResourcesGenerated: 0,
  lifetimeTotalResources: 0,
  totalClicks: 0,
  clickPower: 1,
  buildings: INITIAL_BUILDINGS,
  helpers: INITIAL_HELPERS,
  achievements: INITIAL_ACHIEVEMENTS,
  achievementQueue: [],
  theme: "Quantum Genesis",
  resourceName: "Entropy",
  currentTier: Tier.QUANTUM,
  prestigeCurrency: 0,
  prestigeMultiplier: 1,
  logs: [
    { id: 'init', message: 'The universe begins with a silent hum.', timestamp: Date.now(), type: 'story' }
  ],
  lastSaveTime: Date.now(),
  generationCount: 0
};
