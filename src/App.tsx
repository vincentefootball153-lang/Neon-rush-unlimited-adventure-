import { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterShop } from './components/CharacterShop';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { GameCanvas } from './components/GameCanvas';
import { GameOverModal } from './components/GameOverModal';
import { GuideModal } from './components/GuideModal';
import { HUD } from './components/HUD';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { NeonRushEngine } from './game/engine';
import {
  CharacterSkin,
  GameScreen,
  HudSnapshot,
  LEVEL_ZONES,
  RunSummary,
  SaveData,
} from './types/game';
import { soundEngine } from './utils/audio';
import {
  claimDailyReward,
  getTodayLocalDate,
  loadSaveData,
  saveGameData,
} from './utils/storage';

type ActiveModal = 'none' | 'characters' | 'daily' | 'leaderboard' | 'guide';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  distance: 0,
  coins: 0,
  diamonds: 0,
  level: 1,
  levelName: LEVEL_ZONES[0].name,
  multiplier: 1,
  comboCount: 0,
  magnetTime: 0,
  magnetMax: 8,
  boostTime: 0,
  boostMax: 5,
  hasShield: false,
  speedKmh: 100,
  levelBannerText: null,
};

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSaveData());
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [modal, setModal] = useState<ActiveModal>('none');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const engineRef = useRef<NeonRushEngine | null>(null);
  const saveRef = useRef<SaveData>(save);
  saveRef.current = save;

  const runTrackingRef = useRef({
    runId: '',
    revivedOnce: false,
    bankedCoins: 0,
    bankedDiamonds: 0,
    countedTotalRun: false,
  });

  // Sync mute state on mount
  useEffect(() => {
    soundEngine.setMuted(save.muted);
    return () => {
      soundEngine.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  const persistSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSave((prev) => {
      const next = updater(prev);
      saveGameData(next);
      return next;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    soundEngine.unlock();
    const nextMuted = !saveRef.current.muted;
    soundEngine.setMuted(nextMuted);
    persistSave((prev) => ({ ...prev, muted: nextMuted }));
  }, [persistSave]);

  const handleToggleTouchControls = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    persistSave((prev) => ({ ...prev, showTouchControls: !prev.showTouchControls }));
  }, [persistSave]);

  const handleStartGame = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    soundEngine.startMusic();

    runTrackingRef.current = {
      runId: `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      revivedOnce: false,
      bankedCoins: 0,
      bankedDiamonds: 0,
      countedTotalRun: false,
    };

    setRunSummary(null);
    setModal('none');
    engineRef.current?.reset(saveRef.current.equippedCharacter);
    setScreen('PLAYING');
  }, []);

  const handleTogglePause = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playClick();
    setScreen((prev) => {
      if (prev === 'PLAYING') {
        soundEngine.stopMusic();
        return 'PAUSED';
      }
      if (prev === 'PAUSED') {
        soundEngine.startMusic();
        return 'PLAYING';
      }
      return prev;
    });
  }, []);

  const handleMainMenu = useCallback(() => {
    soundEngine.playClick();
    soundEngine.stopMusic();
    setRunSummary(null);
    engineRef.current?.startDemo();
    setScreen('MENU');
  }, []);

  const handleGameOver = useCallback(
    (result: {
      score: number;
      distance: number;
      coinsEarned: number;
      diamondsEarned: number;
      levelReached: number;
      levelName: string;
    }) => {
      soundEngine.stopMusic();
      const tracking = runTrackingRef.current;
      const deltaCoins = Math.max(0, result.coinsEarned - tracking.bankedCoins);
      const deltaDiamonds = Math.max(0, result.diamondsEarned - tracking.bankedDiamonds);
      tracking.bankedCoins = result.coinsEarned;
      tracking.bankedDiamonds = result.diamondsEarned;

      const prevHighScore = saveRef.current.highScore;
      const isNewRecord = result.score > prevHighScore;

      persistSave((prev) => {
        const filteredBoard = prev.leaderboard.filter((e) => e.id !== tracking.runId);
        const entry = {
          id: tracking.runId,
          playerName: prev.playerName.trim() || 'Runner',
          score: result.score,
          distance: result.distance,
          level: result.levelReached,
          characterId: prev.equippedCharacter,
          isPlayer: true,
          date: getTodayLocalDate(),
        };
        const updatedBoard = [...filteredBoard, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 12);

        const nextTotalRuns = tracking.countedTotalRun ? prev.totalRuns : prev.totalRuns + 1;
        tracking.countedTotalRun = true;

        return {
          ...prev,
          coins: prev.coins + deltaCoins,
          diamonds: prev.diamonds + deltaDiamonds,
          highScore: Math.max(prev.highScore, result.score),
          bestDistance: Math.max(prev.bestDistance, result.distance),
          totalRuns: nextTotalRuns,
          leaderboard: updatedBoard,
        };
      });

      setRunSummary({
        ...result,
        isNewRecord,
        revivedOnce: tracking.revivedOnce,
      });
      setScreen('GAME_OVER');
    },
    [persistSave]
  );

  const handleRevive = useCallback(() => {
    if (runTrackingRef.current.revivedOnce || saveRef.current.diamonds < 5) return;
    soundEngine.unlock();
    runTrackingRef.current.revivedOnce = true;

    persistSave((prev) => ({
      ...prev,
      diamonds: Math.max(0, prev.diamonds - 5),
    }));

    setRunSummary(null);
    engineRef.current?.revive();
    soundEngine.startMusic();
    setScreen('PLAYING');
  }, [persistSave]);

  const handleUnlockCharacter = useCallback(
    (skin: CharacterSkin) => {
      soundEngine.unlock();
      if (saveRef.current.unlockedCharacters.includes(skin.id)) return;
      if (skin.currency === 'coins' && saveRef.current.coins < skin.price) return;
      if (skin.currency === 'diamonds' && saveRef.current.diamonds < skin.price) return;

      soundEngine.playPowerUp();
      persistSave((prev) => ({
        ...prev,
        coins: skin.currency === 'coins' ? prev.coins - skin.price : prev.coins,
        diamonds: skin.currency === 'diamonds' ? prev.diamonds - skin.price : prev.diamonds,
        unlockedCharacters: [...prev.unlockedCharacters, skin.id],
        equippedCharacter: skin.id,
      }));
      showToast(`Unlocked & equipped ${skin.name}`);
    },
    [persistSave, showToast]
  );

  const handleEquipCharacter = useCallback(
    (skinId: string) => {
      soundEngine.unlock();
      soundEngine.playClick();
      persistSave((prev) => ({
        ...prev,
        equippedCharacter: skinId,
      }));
    },
    [persistSave]
  );

  const handleClaimDaily = useCallback(() => {
    soundEngine.unlock();
    const res = claimDailyReward(saveRef.current);
    if (!res) return;
    soundEngine.playLevelUp();
    setSave(res.updated);
    showToast(`Claimed Day ${res.reward.day}: ${res.reward.label}`);
  }, [showToast]);

  const handleUpdatePlayerName = useCallback(
    (name: string) => {
      soundEngine.playClick();
      persistSave((prev) => ({ ...prev, playerName: name }));
    },
    [persistSave]
  );

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-[#070914] text-slate-100">
      {/* Full-viewport 3D-perspective Canvas */}
      <GameCanvas
        screen={screen}
        equippedCharacter={save.equippedCharacter}
        showTouchControls={save.showTouchControls}
        engineRef={engineRef}
        onHudUpdate={setHud}
        onGameOver={handleGameOver}
        onTogglePause={handleTogglePause}
      />

      {/* Main Menu Overlay */}
      {screen === 'MENU' && (
        <MainMenu
          save={save}
          onStartGame={handleStartGame}
          onOpenCharacters={() => {
            soundEngine.unlock();
            soundEngine.playClick();
            setModal('characters');
          }}
          onOpenDaily={() => {
            soundEngine.unlock();
            soundEngine.playClick();
            setModal('daily');
          }}
          onOpenLeaderboard={() => {
            soundEngine.unlock();
            soundEngine.playClick();
            setModal('leaderboard');
          }}
          onOpenGuide={() => {
            soundEngine.unlock();
            soundEngine.playClick();
            setModal('guide');
          }}
          onToggleMute={handleToggleMute}
          onToggleTouchControls={handleToggleTouchControls}
        />
      )}

      {/* Active Gameplay HUD */}
      {(screen === 'PLAYING' || screen === 'PAUSED') && (
        <HUD
          hud={hud}
          muted={save.muted}
          onToggleMute={handleToggleMute}
          onPause={handleTogglePause}
        />
      )}

      {/* Pause Overlay */}
      {screen === 'PAUSED' && (
        <PauseModal
          muted={save.muted}
          showTouchControls={save.showTouchControls}
          onResume={handleTogglePause}
          onRestart={handleStartGame}
          onToggleMute={handleToggleMute}
          onToggleTouchControls={handleToggleTouchControls}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over Overlay */}
      {screen === 'GAME_OVER' && runSummary && (
        <GameOverModal
          summary={runSummary}
          highScore={save.highScore}
          totalDiamonds={save.diamonds}
          onRevive={handleRevive}
          onPlayAgain={handleStartGame}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Secondary Modals */}
      {modal === 'characters' && (
        <CharacterShop
          save={save}
          onUnlock={handleUnlockCharacter}
          onEquip={handleEquipCharacter}
          onClose={() => {
            soundEngine.playClick();
            setModal('none');
          }}
        />
      )}

      {modal === 'daily' && (
        <DailyRewardsModal
          save={save}
          onClaim={handleClaimDaily}
          onClose={() => {
            soundEngine.playClick();
            setModal('none');
          }}
        />
      )}

      {modal === 'leaderboard' && (
        <LeaderboardModal
          save={save}
          onUpdatePlayerName={handleUpdatePlayerName}
          onClose={() => {
            soundEngine.playClick();
            setModal('none');
          }}
        />
      )}

      {modal === 'guide' && (
        <GuideModal
          onClose={() => {
            soundEngine.playClick();
            setModal('none');
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-cyan-400/50 bg-[#0A0F24]/95 px-5 py-2.5 text-sm font-semibold text-cyan-200 shadow-xl backdrop-blur-md">
          {toast}
        </div>
      )}
    </main>
  );
}
