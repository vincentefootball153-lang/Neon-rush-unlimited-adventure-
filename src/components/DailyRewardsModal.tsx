import React from 'react';
import { Check, Coins, Gem, Gift, X } from 'lucide-react';
import { DAILY_REWARDS, SaveData } from '../types/game';
import { canClaimDailyReward, getEffectiveStreakIndex } from '../utils/storage';

interface DailyRewardsModalProps {
  save: SaveData;
  onClaim: () => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  save,
  onClaim,
  onClose,
}) => {
  const claimable = canClaimDailyReward(save);
  const currentIdx = getEffectiveStreakIndex(save);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0A0F24] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">Daily Rewards</h2>
              <p className="text-xs text-slate-400">
                Log in daily to build your 7-day neon streak
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close daily rewards"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-4">
          {DAILY_REWARDS.map((item, idx) => {
            const isClaimed = claimable ? idx < currentIdx : idx < currentIdx;
            const isTodayTarget = claimable && idx === currentIdx;
            const isLast = idx === DAILY_REWARDS.length - 1;

            return (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-between rounded-2xl border p-3.5 text-center ${
                  isLast ? 'col-span-2 sm:col-span-2' : ''
                } ${
                  isTodayTarget
                    ? 'border-pink-400 bg-pink-500/15 shadow-[0_0_24px_rgba(255,46,147,0.25)]'
                    : isClaimed
                    ? 'border-emerald-400/40 bg-emerald-950/25'
                    : 'border-white/10 bg-[#0F1633]/80'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Day {item.day}
                </span>

                <div className="my-2.5 flex flex-col items-center gap-1">
                  {item.coins > 0 && (
                    <span className="flex items-center gap-1 font-mono-num text-sm font-bold text-amber-300">
                      <Coins className="h-4 w-4" />
                      +{item.coins}
                    </span>
                  )}
                  {item.diamonds > 0 && (
                    <span className="flex items-center gap-1 font-mono-num text-sm font-bold text-pink-400">
                      <Gem className="h-4 w-4" />
                      +{item.diamonds}
                    </span>
                  )}
                </div>

                {isClaimed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    Claimed
                  </span>
                ) : isTodayTarget ? (
                  <span className="text-xs font-bold text-pink-300">Ready Today</span>
                ) : (
                  <span className="text-xs text-slate-500">Upcoming</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-white/10 p-4 sm:px-5">
          {claimable ? (
            <button
              type="button"
              onClick={onClaim}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-display text-base font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Gift className="h-5 w-5" />
              <span>Claim Day {currentIdx + 1} Reward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span>Come Back Tomorrow</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
