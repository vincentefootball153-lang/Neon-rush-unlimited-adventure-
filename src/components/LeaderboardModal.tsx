import React, { useState } from 'react';
import { Check, Trophy, X } from 'lucide-react';
import { CHARACTERS, SaveData } from '../types/game';

interface LeaderboardModalProps {
  save: SaveData;
  onUpdatePlayerName: (name: string) => void;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  save,
  onUpdatePlayerName,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(save.playerName);
  const [savedToast, setSavedToast] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim().slice(0, 16) || 'Runner';
    setNameInput(cleaned);
    onUpdatePlayerName(cleaned);
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 1600);
  };

  const sorted = [...save.leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0A0F24] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">Leaderboard</h2>
              <p className="text-xs text-slate-400">
                Top Cyber-City Runs · Personal Best:{' '}
                <span className="font-mono-num text-cyan-300">{save.highScore.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Player Callsign Editor */}
        <form
          onSubmit={handleSaveName}
          className="flex items-center gap-2 border-b border-white/10 bg-[#070A18] px-5 py-3"
        >
          <label htmlFor="player-callsign" className="text-xs font-medium text-slate-400 shrink-0">
            Your Name:
          </label>
          <input
            id="player-callsign"
            type="text"
            maxLength={16}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0F1633] px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            placeholder="Enter name"
          />
          <button
            type="submit"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {savedToast ? <Check className="h-4 w-4" /> : null}
            <span>{savedToast ? 'Saved' : 'Save'}</span>
          </button>
        </form>

        {/* Entries List */}
        <div className="divide-y divide-white/8 overflow-y-auto px-5 py-2">
          {sorted.map((entry, idx) => {
            const skin = CHARACTERS.find((c) => c.id === entry.characterId) ?? CHARACTERS[0];
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between gap-3 py-3 ${
                  entry.isPlayer ? 'text-cyan-200' : 'text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono-num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : idx === 1
                        ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                        : idx === 2
                        ? 'bg-orange-400/20 text-orange-300 border border-orange-400/30'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-sm">
                        {entry.playerName}
                      </span>
                      {entry.isPlayer && (
                        <span className="text-[11px] font-semibold text-cyan-400">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>{skin.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>Sector {entry.level}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{entry.distance}m</span>
                    </div>
                  </div>
                </div>

                <span className="font-mono-num text-base font-bold text-white shrink-0">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
