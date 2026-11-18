import React from 'react';
import { Gamepad2, Home, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  muted: boolean;
  showTouchControls: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onToggleTouchControls: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  muted,
  showTouchControls,
  onResume,
  onRestart,
  onToggleMute,
  onToggleTouchControls,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#0A0F24] p-6 shadow-2xl">
        <h2 className="font-display text-center text-2xl font-extrabold text-white">
          Game Paused
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Take a breather before diving back into the grid
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 font-display text-base font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Resume Run</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="h-4 w-4 text-pink-400" /> : <Volume2 className="h-4 w-4 text-cyan-300" />}
              <span>{muted ? 'Muted' : 'Sound On'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleTouchControls}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Gamepad2 className="h-4 w-4 text-purple-300" />
              <span>Pad: {showTouchControls ? 'On' : 'Off'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onMainMenu}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
