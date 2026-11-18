import React from 'react';
import { Coins, Gem, Home, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { RunSummary } from '../types/game';

interface GameOverModalProps {
  summary: RunSummary;
  highScore: number;
  totalDiamonds: number;
  onRevive: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  highScore,
  totalDiamonds,
  onRevive,
  onPlayAgain,
  onMainMenu,
}) => {
  const canRevive = !summary.revivedOnce && totalDiamonds >= 5;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0A0F24] p-6 shadow-2xl">
        <div className="text-center">
          {summary.isNewRecord ? (
            <div className="mx-auto mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-4 w-4" />
              <span>New High Score</span>
            </div>
          ) : null}

          <h2 className="font-display text-3xl font-black text-white">Run Complete</h2>
          <p className="mt-1 text-xs text-slate-400">
            Reached Sector {summary.levelReached} · {summary.levelName}
          </p>
        </div>

        {/* Main Score Box */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0F1633] p-4 text-center">
          <span className="text-xs font-medium text-slate-400">Final Score</span>
          <div className="font-mono-num mt-0.5 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-400">
            {summary.score.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 text-amber-300" />
              Best: <strong className="font-mono-num text-white">{highScore.toLocaleString()}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Distance: <strong className="font-mono-num text-cyan-300">{summary.distance}m</strong>
            </span>
          </div>
        </div>

        {/* Currencies Collected */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0F1633]/75 py-3">
            <Coins className="h-4 w-4 text-amber-300" />
            <span className="font-mono-num text-base font-bold text-amber-300">
              +{summary.coinsEarned}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0F1633]/75 py-3">
            <Gem className="h-4 w-4 text-pink-400" />
            <span className="font-mono-num text-base font-bold text-pink-400">
              +{summary.diamondsEarned}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2.5">
          {canRevive && (
            <button
              type="button"
              onClick={onRevive}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-pink-400/60 bg-pink-500/20 font-display text-sm font-bold text-pink-200 hover:bg-pink-500/30 transition-colors cursor-pointer"
            >
              <Gem className="h-4 w-4 text-pink-400" />
              <span>Revive &amp; Continue (5 Gems)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPlayAgain}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 font-display text-base font-extrabold text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
