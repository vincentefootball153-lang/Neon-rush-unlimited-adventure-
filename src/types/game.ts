export type GameScreen = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type PowerUpType = 'magnet' | 'shield' | 'boost';

export type ObstacleKind = 'low_barrier' | 'high_laser' | 'tall_block' | 'hover_drone';

export type CollectibleKind = 'coin' | 'diamond' | 'magnet' | 'shield' | 'boost';

export interface CharacterSkin {
  id: string;
  name: string;
  title: string;
  description: string;
  currency: 'free' | 'coins' | 'diamonds';
  price: number;
  primaryColor: string;
  secondaryColor: string;
  visorColor: string;
  trailColor: string;
  suitDark: string;
  perkLabel: string;
  coinBonus: number; // e.g. 0.1 = +10% coins
  powerDurationBonus: number; // extra seconds on power-ups
}

export interface LevelZone {
  level: number;
  name: string;
  minDistance: number;
  baseSpeed: number;
  maxSpeed: number;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  gridColor: string;
  laneGlow: string;
  buildingSilhouette: string;
  buildingAccent: string;
  sunTop: string;
  sunBottom: string;
  spawnInterval: number;
  droneChance: number;
}

export interface DailyRewardDay {
  day: number;
  coins: number;
  diamonds: number;
  label: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  distance: number;
  level: number;
  characterId: string;
  isPlayer: boolean;
  date: string;
}

export interface SaveData {
  playerName: string;
  coins: number;
  diamonds: number;
  highScore: number;
  bestDistance: number;
  totalRuns: number;
  unlockedCharacters: string[];
  equippedCharacter: string;
  muted: boolean;
  showTouchControls: boolean;
  dailyStreak: number; // 0..7 claimed
  lastDailyClaimDate: string | null; // YYYY-MM-DD local date
  leaderboard: LeaderboardEntry[];
}

export interface HudSnapshot {
  score: number;
  distance: number;
  coins: number;
  diamonds: number;
  level: number;
  levelName: string;
  multiplier: number;
  comboCount: number;
  magnetTime: number;
  magnetMax: number;
  boostTime: number;
  boostMax: number;
  hasShield: boolean;
  speedKmh: number;
  levelBannerText: string | null;
}

export interface RunSummary {
  score: number;
  distance: number;
  coinsEarned: number;
  diamondsEarned: number;
  levelReached: number;
  levelName: string;
  isNewRecord: boolean;
  revivedOnce: boolean;
}

export const CHARACTERS: CharacterSkin[] = [
  {
    id: 'kai',
    name: 'Kai-01',
    title: 'Neon Striker',
    description: 'Balanced cyber-runner built for high-speed skyline dashes.',
    currency: 'free',
    price: 0,
    primaryColor: '#00E5FF',
    secondaryColor: '#3B82F6',
    visorColor: '#7DF9FF',
    trailColor: '#00E5FF',
    suitDark: '#0F172A',
    perkLabel: 'Standard Rig',
    coinBonus: 0,
    powerDurationBonus: 0,
  },
  {
    id: 'nova',
    name: 'Nova',
    title: 'Pulse Sprinter',
    description: 'Vibrant magenta overdrive suit tuned for coin magnets.',
    currency: 'coins',
    price: 150,
    primaryColor: '#FF2E93',
    secondaryColor: '#A855F7',
    visorColor: '#FFC2E2',
    trailColor: '#FF2E93',
    suitDark: '#1E102E',
    perkLabel: '+15% Coin Value',
    coinBonus: 0.15,
    powerDurationBonus: 0.5,
  },
  {
    id: 'phantom',
    name: 'Phantom',
    title: 'Violet Wraith',
    description: 'Stealth phase chassis that stretches power-up duration.',
    currency: 'coins',
    price: 350,
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    visorColor: '#DDD6FE',
    trailColor: '#A78BFA',
    suitDark: '#130D26',
    perkLabel: '+2s Power-Ups',
    coinBonus: 0.1,
    powerDurationBonus: 2,
  },
  {
    id: 'solaris',
    name: 'Solaris',
    title: 'Plasma Ace',
    description: 'Supercharged amber armor engineered for long sector runs.',
    currency: 'coins',
    price: 600,
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    visorColor: '#FEF08A',
    trailColor: '#FB923C',
    suitDark: '#1F140B',
    perkLabel: '+25% Coin Value',
    coinBonus: 0.25,
    powerDurationBonus: 1,
  },
  {
    id: 'valkyrie',
    name: 'Valkyrie',
    title: 'Prism Wing',
    description: 'Aerodynamic emerald-cyan exo-frame with extended energy cells.',
    currency: 'diamonds',
    price: 15,
    primaryColor: '#10B981',
    secondaryColor: '#06B6D4',
    visorColor: '#A7F3D0',
    trailColor: '#34D399',
    suitDark: '#091E1C',
    perkLabel: '+3s Power-Ups',
    coinBonus: 0.2,
    powerDurationBonus: 3,
  },
  {
    id: 'chronos',
    name: 'Chronos',
    title: 'Quantum Apex',
    description: 'Elite hyper-violet flagship runner with dual-core efficiency.',
    currency: 'diamonds',
    price: 35,
    primaryColor: '#E879F9',
    secondaryColor: '#00E5FF',
    visorColor: '#FFFFFF',
    trailColor: '#F0ABFC',
    suitDark: '#120824',
    perkLabel: '+35% Coins & +3s Boost',
    coinBonus: 0.35,
    powerDurationBonus: 3,
  },
];

export const LEVEL_ZONES: LevelZone[] = [
  {
    level: 1,
    name: 'Cyber Downtown',
    minDistance: 0,
    baseSpeed: 24,
    maxSpeed: 31,
    skyTop: '#050816',
    skyMid: '#121038',
    skyHorizon: '#2D1458',
    gridColor: 'rgba(0, 229, 255, 0.32)',
    laneGlow: '#00E5FF',
    buildingSilhouette: '#0B1026',
    buildingAccent: '#00E5FF',
    sunTop: '#FF2E93',
    sunBottom: '#7C3AED',
    spawnInterval: 1.08,
    droneChance: 0,
  },
  {
    level: 2,
    name: 'Plasma Highway',
    minDistance: 350,
    baseSpeed: 31,
    maxSpeed: 37,
    skyTop: '#07061C',
    skyMid: '#1E1148',
    skyHorizon: '#5B1869',
    gridColor: 'rgba(168, 85, 247, 0.35)',
    laneGlow: '#A855F7',
    buildingSilhouette: '#120B2B',
    buildingAccent: '#FF2E93',
    sunTop: '#FF6B00',
    sunBottom: '#FF2E93',
    spawnInterval: 0.92,
    droneChance: 0.14,
  },
  {
    level: 3,
    name: 'Violet Spire',
    minDistance: 800,
    baseSpeed: 37,
    maxSpeed: 43,
    skyTop: '#090418',
    skyMid: '#2B0D4C',
    skyHorizon: '#831843',
    gridColor: 'rgba(255, 46, 147, 0.36)',
    laneGlow: '#FF2E93',
    buildingSilhouette: '#170826',
    buildingAccent: '#38BDF8',
    sunTop: '#FDE047',
    sunBottom: '#EC4899',
    spawnInterval: 0.78,
    droneChance: 0.24,
  },
  {
    level: 4,
    name: 'Hyperion Core',
    minDistance: 1400,
    baseSpeed: 43,
    maxSpeed: 49,
    skyTop: '#030B1A',
    skyMid: '#0A2540',
    skyHorizon: '#0E7490',
    gridColor: 'rgba(56, 189, 248, 0.38)',
    laneGlow: '#38BDF8',
    buildingSilhouette: '#071528',
    buildingAccent: '#A855F7',
    sunTop: '#38BDF8',
    sunBottom: '#818CF8',
    spawnInterval: 0.68,
    droneChance: 0.32,
  },
  {
    level: 5,
    name: 'Quantum Rift',
    minDistance: 2200,
    baseSpeed: 49,
    maxSpeed: 58,
    skyTop: '#0D0318',
    skyMid: '#3B0764',
    skyHorizon: '#BE185D',
    gridColor: 'rgba(244, 114, 182, 0.42)',
    laneGlow: '#F472B6',
    buildingSilhouette: '#180629',
    buildingAccent: '#00E5FF',
    sunTop: '#00E5FF',
    sunBottom: '#FF2E93',
    spawnInterval: 0.58,
    droneChance: 0.4,
  },
];

export const DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, coins: 75, diamonds: 0, label: '75 Coins' },
  { day: 2, coins: 120, diamonds: 2, label: '120 Coins + 2 Gems' },
  { day: 3, coins: 0, diamonds: 6, label: '6 Diamonds' },
  { day: 4, coins: 220, diamonds: 2, label: '220 Coins + 2 Gems' },
  { day: 5, coins: 100, diamonds: 10, label: '100 Coins + 10 Gems' },
  { day: 6, coins: 400, diamonds: 5, label: '400 Coins + 5 Gems' },
  { day: 7, coins: 600, diamonds: 20, label: '600 Coins + 20 Gems' },
];
