import React from 'react';
import { Coins, Gem, Magnet, Pause, Shield, Volume2, VolumeX, Zap } from 'lucide-react';
import { HudSnapshot } from '../types/game';

interface HUDProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ hud, muted, onToggleMute, onPause }) => {
  const magnetPct = hud.magnetMax > 0 ? Math.min(100, (hud.magnetTime / hud.magnetMax) * 100) : 0;
  const boostPct = hud.boostMax > 0 ? Math.min(100, (hud.boostTime / hud.boostMax) * 100) : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-2">
        {/* Left: Score & Distance */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#080B1A]/75 px-3.5 py-2 backdrop-blur-md">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono-num text-xl sm:text-2xl font-bold tracking-tight text-white">
              {hud.score.toLocaleString()}
            </span>
            {hud.multiplier > 1 && (
              <span className="font-mono-num text-xs font-bold text-cyan-300">
                {hud.multiplier}x
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-mono-num">{hud.distance}m</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[140px] sm:max-w-none text-purple-300 font-medium">
              S{hud.level} {hud.levelName}
            </span>
          </div>
        </div>

        {/* Center/Right: Currencies & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080B1A]/75 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Coins className="h-4 w-4 shrink-0" />
              <span className="font-mono-num text-sm font-bold">{hud.coins}</span>
            </div>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-1.5 text-pink-400">
              <Gem className="h-4 w-4 shrink-0" />
              <span className="font-mono-num text-sm font-bold">{hud.diamonds}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#080B1A]/80 text-slate-200 backdrop-blur-md hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#080B1A]/80 text-white backdrop-blur-md hover:border-pink-400/60 hover:text-pink-300 transition-colors"
          >
            <Pause className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Active Power-Up Meters */}
      {(hud.hasShield || hud.magnetTime > 0 || hud.boostTime > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {hud.hasShield && (
            <div className="flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-950/75 px-2.5 py-1.5 text-xs font-semibold text-sky-200 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-sky-400" />
              <span>Shield Ready</span>
            </div>
          )}

          {hud.magnetTime > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-950/75 px-2.5 py-1.5 text-xs font-semibold text-purple-200 backdrop-blur-sm">
              <Magnet className="h-3.5 w-3.5 text-purple-300" />
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-purple-400 transition-all duration-75"
                  style={{ width: `${magnetPct}%` }}
                />
              </div>
              <span className="font-mono-num">{hud.magnetTime.toFixed(1)}s</span>
            </div>
          )}

          {hud.boostTime > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-950/75 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-cyan-300" />
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${boostPct}%` }}
                />
              </div>
              <span className="font-mono-num">{hud.boostTime.toFixed(1)}s</span>
            </div>
          )}
        </div>
      )}

      {/* Sector Level Banner */}
      {hud.levelBannerText && (
        <div className="mx-auto mt-3 rounded-2xl border border-cyan-400/40 bg-[#0A0F24]/85 px-5 py-2 text-center shadow-lg shadow-cyan-500/20 backdrop-blur-md">
          <p className="font-display text-sm sm:text-base font-extrabold tracking-wide text-cyan-300">
            {hud.levelBannerText}
          </p>
        </div>
      )}
    </div>
  );
};
