import React from 'react';
import { Check, Coins, Gem, Lock, X } from 'lucide-react';
import { CHARACTERS, CharacterSkin, SaveData } from '../types/game';

interface CharacterShopProps {
  save: SaveData;
  onUnlock: (skin: CharacterSkin) => void;
  onEquip: (skinId: string) => void;
  onClose: () => void;
}

export const CharacterShop: React.FC<CharacterShopProps> = ({
  save,
  onUnlock,
  onEquip,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0A0F24] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Runner Hangar
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Unlock skins with Coins or Diamonds for bonus perks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 rounded-xl border border-white/10 bg-[#070A18] px-3 py-1.5">
              <span className="flex items-center gap-1.5 font-mono-num text-xs font-bold text-amber-300">
                <Coins className="h-3.5 w-3.5" />
                {save.coins.toLocaleString()}
              </span>
              <span className="h-3 w-px bg-white/15" />
              <span className="flex items-center gap-1.5 font-mono-num text-xs font-bold text-pink-400">
                <Gem className="h-3.5 w-3.5" />
                {save.diamonds.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close character hangar"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile currency bar */}
        <div className="flex sm:hidden items-center justify-center gap-4 border-b border-white/10 bg-[#070A18] py-2">
          <span className="flex items-center gap-1.5 font-mono-num text-xs font-bold text-amber-300">
            <Coins className="h-3.5 w-3.5" />
            {save.coins.toLocaleString()} Coins
          </span>
          <span className="flex items-center gap-1.5 font-mono-num text-xs font-bold text-pink-400">
            <Gem className="h-3.5 w-3.5" />
            {save.diamonds.toLocaleString()} Gems
          </span>
        </div>

        {/* Character Cards Grid */}
        <div className="grid grid-cols-1 gap-3.5 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
          {CHARACTERS.map((skin) => {
            const unlocked = save.unlockedCharacters.includes(skin.id);
            const equipped = save.equippedCharacter === skin.id;
            const canAfford =
              skin.currency === 'free' ||
              (skin.currency === 'coins' && save.coins >= skin.price) ||
              (skin.currency === 'diamonds' && save.diamonds >= skin.price);

            return (
              <div
                key={skin.id}
                className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                  equipped
                    ? 'border-cyan-400/70 bg-cyan-950/25'
                    : 'border-white/10 bg-[#0F1633]/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Stylized Vector Helmet Emblem */}
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${skin.primaryColor}44, ${skin.suitDark})`,
                      boxShadow: `0 0 20px ${skin.primaryColor}33`,
                    }}
                  >
                    <svg viewBox="0 0 48 48" className="h-11 w-11">
                      <circle
                        cx="24"
                        cy="24"
                        r="16"
                        fill={skin.suitDark}
                        stroke={skin.primaryColor}
                        strokeWidth="2.8"
                      />
                      <rect
                        x="13"
                        y="19"
                        width="22"
                        height="7"
                        rx="3.5"
                        fill={skin.visorColor}
                      />
                      <path
                        d="M15 34 L24 30 L33 34"
                        stroke={skin.secondaryColor}
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-white truncate">
                        {skin.name}
                      </h3>
                      <span className="text-xs font-semibold text-cyan-300 whitespace-nowrap">
                        {skin.perkLabel}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-purple-300">{skin.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                      {skin.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {equipped ? (
                    <button
                      type="button"
                      disabled
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/20 text-sm font-bold text-cyan-200 whitespace-nowrap"
                    >
                      <Check className="h-4 w-4" />
                      <span>Equipped</span>
                    </button>
                  ) : unlocked ? (
                    <button
                      type="button"
                      onClick={() => onEquip(skin.id)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white hover:bg-cyan-500 hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>Equip Runner</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onUnlock(skin)}
                      className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 cursor-pointer'
                          : 'border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {!canAfford && <Lock className="h-4 w-4" />}
                      {skin.currency === 'coins' ? (
                        <Coins className="h-4 w-4 text-amber-300" />
                      ) : (
                        <Gem className="h-4 w-4 text-pink-300" />
                      )}
                      <span className="font-mono-num">Unlock · {skin.price}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
