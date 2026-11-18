import { DAILY_REWARDS, LeaderboardEntry, SaveData } from '../types/game';

const STORAGE_KEY = 'neon_rush_ultimate_save_v1';

const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'rival-1',
    playerName: 'AetherX',
    score: 18450,
    distance: 2150,
    level: 4,
    characterId: 'chronos',
    isPlayer: false,
    date: '2026-11-12',
  },
  {
    id: 'rival-2',
    playerName: 'VortexKira',
    score: 12900,
    distance: 1520,
    level: 4,
    characterId: 'valkyrie',
    isPlayer: false,
    date: '2026-11-14',
  },
  {
    id: 'rival-3',
    playerName: 'ZedPulse',
    score: 8600,
    distance: 1040,
    level: 3,
    characterId: 'phantom',
    isPlayer: false,
    date: '2026-11-15',
  },
  {
    id: 'rival-4',
    playerName: 'SoraNeon',
    score: 5200,
    distance: 640,
    level: 2,
    characterId: 'nova',
    isPlayer: false,
    date: '2026-11-16',
  },
  {
    id: 'rival-5',
    playerName: 'ByteRunner',
    score: 2650,
    distance: 330,
    level: 1,
    characterId: 'kai',
    isPlayer: false,
    date: '2026-11-16',
  },
];

export function getTodayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayLocalDate(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDefaultSaveData(): SaveData {
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    playerName: 'Runner',
    coins: 100,
    diamonds: 5,
    highScore: 0,
    bestDistance: 0,
    totalRuns: 0,
    unlockedCharacters: ['kai'],
    equippedCharacter: 'kai',
    muted: false,
    showTouchControls: isTouchDevice,
    dailyStreak: 0,
    lastDailyClaimDate: null,
    leaderboard: [...SEED_LEADERBOARD],
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = getDefaultSaveData();
      saveGameData(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const defaults = getDefaultSaveData();
    return {
      ...defaults,
      ...parsed,
      unlockedCharacters: Array.isArray(parsed.unlockedCharacters) && parsed.unlockedCharacters.length > 0
        ? parsed.unlockedCharacters
        : defaults.unlockedCharacters,
      leaderboard: Array.isArray(parsed.leaderboard) && parsed.leaderboard.length > 0
        ? parsed.leaderboard
        : defaults.leaderboard,
    };
  } catch {
    return getDefaultSaveData();
  }
}

export function saveGameData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function canClaimDailyReward(data: SaveData): boolean {
  const today = getTodayLocalDate();
  return data.lastDailyClaimDate !== today;
}

export function getEffectiveStreakIndex(data: SaveData): number {
  const today = getTodayLocalDate();
  const yesterday = getYesterdayLocalDate();
  if (data.lastDailyClaimDate === today) {
    return data.dailyStreak;
  }
  if (data.lastDailyClaimDate === yesterday || data.lastDailyClaimDate === null) {
    return data.dailyStreak >= DAILY_REWARDS.length ? 0 : data.dailyStreak;
  }
  // Streak expired if missed more than 1 day
  return 0;
}

export function claimDailyReward(data: SaveData): { updated: SaveData; reward: (typeof DAILY_REWARDS)[number] } | null {
  if (!canClaimDailyReward(data)) return null;
  const idx = getEffectiveStreakIndex(data);
  const reward = DAILY_REWARDS[idx];
  const nextStreak = idx + 1;

  const updated: SaveData = {
    ...data,
    coins: data.coins + reward.coins,
    diamonds: data.diamonds + reward.diamonds,
    dailyStreak: nextStreak,
    lastDailyClaimDate: getTodayLocalDate(),
  };
  saveGameData(updated);
  return { updated, reward };
}

export function recordRunToSave(
  data: SaveData,
  run: {
    score: number;
    distance: number;
    coinsEarned: number;
    diamondsEarned: number;
    levelReached: number;
    characterId: string;
  }
): { updated: SaveData; isNewRecord: boolean } {
  const isNewRecord = run.score > data.highScore;
  const entry: LeaderboardEntry = {
    id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    playerName: data.playerName.trim() || 'Runner',
    score: run.score,
    distance: run.distance,
    level: run.levelReached,
    characterId: run.characterId,
    isPlayer: true,
    date: getTodayLocalDate(),
  };

  const merged = [...data.leaderboard, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const updated: SaveData = {
    ...data,
    coins: data.coins + run.coinsEarned,
    diamonds: data.diamonds + run.diamondsEarned,
    highScore: Math.max(data.highScore, run.score),
    bestDistance: Math.max(data.bestDistance, run.distance),
    totalRuns: data.totalRuns + 1,
    leaderboard: merged,
  };

  saveGameData(updated);
  return { updated, isNewRecord };
}
