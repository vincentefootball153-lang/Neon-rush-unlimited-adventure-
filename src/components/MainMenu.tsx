import React from 'react';
import {
  Coins,
  Gamepad2,
  Gem,
  Gift,
  HelpCircle,
  Play,
  Trophy,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CHARACTERS, SaveData } from '../types/game';
import { canClaimDailyReward } from '../utils/storage';

interface MainMenuProps {
  save: SaveData;
  onStartGame: () => void;
  onOpenCharacters: () => void;
  onOpenDaily: () => void;
  onOpenLeaderboard: () => void;
  onOpenGuide: () => void;
  onToggleMute: () => void;
  onToggleTouchControls: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  save,
  onStartGame,
  onOpenCharacters,
  onOpenDaily,
  onOpenLeaderboard,
  onOpenGuide,
  onToggleMute,
  onToggleTouchControls,
}) => {
  const equipped = CHARACTERS.find((c) => c.id === save.equippedCharacter) ?? CHARACTERS[0];
  const dailyAvailable = canClaimDailyReward(save);

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between bg-gradient-to-b from-[#060918]/75 via-[#060918]/35 to-[#060918]/90 p-4 sm:p-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Top Utility Row */}
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
        {/* Currencies */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#0B1024]/85 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Coins className="h-4 w-4 shrink-0" />
            <span className="font-mono-num text-sm font-bold">{save.coins.toLocaleString()}</span>
          </div>
          <div className="h-4 w-px bg-white/15" />
          <div className="flex items-center gap-1.5 text-pink-400">
            <Gem className="h-4 w-4 shrink-0" />
            <span className="font-mono-num text-sm font-bold">{save.diamonds.toLocaleString()}</span>
          </div>
        </div>

        {/* Settings Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTouchControls}
            aria-label="Toggle on-screen touch buttons"
            title={save.showTouchControls ? 'Touch Buttons: On' : 'Touch Buttons: Off'}
            className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold backdrop-blur-md transition-colors whitespace-nowrap shrink-0 ${
              save.showTouchControls
                ? 'border-cyan-400/50 bg-cyan-950/60 text-cyan-200'
                : 'border-white/15 bg-[#0B1024]/80 text-slate-300 hover:border-white/30'
            }`}
          >
            <Gamepad2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Pad: {save.showTouchControls ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            aria-label="How to Play"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#0B1024]/80 text-slate-200 backdrop-blur-md hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={save.muted ? 'Unmute audio' : 'Mute audio'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#0B1024]/80 text-slate-200 backdrop-blur-md hover:border-pink-400/50 hover:text-pink-300 transition-colors"
          >
            {save.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Center Hero Title & Active Runner */}
      <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center my-auto py-4">
        <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-400 drop-shadow-[0_4px_24px_rgba(0,229,255,0.35)]">
          NEON RUSH
        </h1>
        <p className="mt-1.5 font-display text-base sm:text-xl font-bold tracking-widest text-slate-200 uppercase">
          Ultimate Adventure
        </p>

        {/* Clean unboxed Best Score summary */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-sm text-slate-300">
          <span>
            Best Score:{' '}
            <strong className="font-mono-num text-white">{save.highScore.toLocaleString()}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span>
            Best Distance:{' '}
            <strong className="font-mono-num text-cyan-300">{save.bestDistance}m</strong>
          </span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span>
            Runner: <strong className="text-pink-300">{equipped.name}</strong>
          </span>
        </div>

        {/* Primary Play CTA */}
        <button
          type="button"
          onClick={onStartGame}
          className="mt-7 flex h-14 w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 px-8 font-display text-lg font-extrabold tracking-wide text-white shadow-[0_0_32px_rgba(168,85,247,0.5)] hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Play className="h-5 w-5 fill-current" />
          <span>Start Run</span>
        </button>

        <p className="mt-3 text-xs text-slate-400">
          Swipe or use Arrow / WASD keys to dodge, jump, and slide
        </p>
      </div>

      {/* Bottom Action Navigation */}
      <div className="mx-auto grid w-full max-w-2xl grid-cols-3 gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onOpenCharacters}
          className="flex min-h-[56px] flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 rounded-2xl border border-white/15 bg-[#0B1024]/85 px-3 py-3 text-xs sm:text-sm font-semibold text-slate-100 backdrop-blur-md hover:border-cyan-400/60 hover:text-cyan-300 active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserCheck className="h-5 w-5 text-cyan-400 shrink-0" />
          <span className="whitespace-nowrap">Characters</span>
        </button>

        <button
          type="button"
          onClick={onOpenDaily}
          className={`relative flex min-h-[56px] flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 rounded-2xl border px-3 py-3 text-xs sm:text-sm font-semibold backdrop-blur-md active:scale-[0.98] transition-all cursor-pointer ${
            dailyAvailable
              ? 'border-pink-400/70 bg-pink-950/50 text-pink-100 shadow-[0_0_20px_rgba(255,46,147,0.25)]'
              : 'border-white/15 bg-[#0B1024]/85 text-slate-100 hover:border-pink-400/50'
          }`}
        >
          <Gift className="h-5 w-5 text-pink-400 shrink-0" />
          <span className="whitespace-nowrap">
            {dailyAvailable ? 'Claim Reward' : 'Daily Rewards'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="flex min-h-[56px] flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 rounded-2xl border border-white/15 bg-[#0B1024]/85 px-3 py-3 text-xs sm:text-sm font-semibold text-slate-100 backdrop-blur-md hover:border-purple-400/60 hover:text-purple-300 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Trophy className="h-5 w-5 text-purple-400 shrink-0" />
          <span className="whitespace-nowrap">Leaderboard</span>
        </button>
      </div>
    </div>
  );
};
