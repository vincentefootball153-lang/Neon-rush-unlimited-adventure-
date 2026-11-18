import React from 'react';
import { Magnet, Shield, X, Zap } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0A0F24] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold text-white">How to Play</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5 text-sm text-slate-300">
          <div>
            <h3 className="font-display text-base font-bold text-cyan-300">Controls</h3>
            <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li>
                <strong className="text-white">Swipe Left / Right</strong> or{' '}
                <strong className="text-white">A / D / Arrow Keys</strong> — Switch lanes
              </li>
              <li>
                <strong className="text-white">Swipe Up</strong> or{' '}
                <strong className="text-white">W / Up / Space</strong> — Jump over barriers
              </li>
              <li>
                <strong className="text-white">Swipe Down</strong> or{' '}
                <strong className="text-white">S / Down</strong> — Slide under laser gates (or fast-fall mid-air)
              </li>
              <li>
                <strong className="text-white">Pad Toggle</strong> — Enable on-screen thumb buttons anytime
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-pink-300">Power-Ups</h3>
            <div className="mt-2.5 space-y-2.5">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0F1633] p-3">
                <Magnet className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
                <div>
                  <p className="font-semibold text-white">Coin Magnet</p>
                  <p className="text-xs text-slate-400">
                    Automatically pulls nearby Coins and Diamonds toward your runner.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0F1633] p-3">
                <Shield className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                <div>
                  <p className="font-semibold text-white">Energy Shield</p>
                  <p className="text-xs text-slate-400">
                    Absorbs one obstacle collision and shatters hazards safely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0F1633] p-3">
                <Zap className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">Hyper Boost</p>
                  <p className="text-xs text-slate-400">
                    Accelerates to overdrive speed and smashes obstacles for +150 bonus points.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-cyan-500 font-display text-sm font-bold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
