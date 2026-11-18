import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { NeonRushEngine } from '../game/engine';
import { renderNeonRush } from '../game/renderer';
import { GameScreen, HudSnapshot } from '../types/game';
import { soundEngine } from '../utils/audio';

interface GameCanvasProps {
  screen: GameScreen;
  equippedCharacter: string;
  showTouchControls: boolean;
  engineRef: React.MutableRefObject<NeonRushEngine | null>;
  onHudUpdate: (hud: HudSnapshot) => void;
  onGameOver: (result: {
    score: number;
    distance: number;
    coinsEarned: number;
    diamondsEarned: number;
    levelReached: number;
    levelName: string;
  }) => void;
  onTogglePause: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  screen,
  equippedCharacter,
  showTouchControls,
  engineRef,
  onHudUpdate,
  onGameOver,
  onTogglePause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenRef = useRef<GameScreen>(screen);
  screenRef.current = screen;

  const touchStartRef = useRef<{ x: number; y: number; fired: boolean } | null>(null);

  // Initialize engine once
  useEffect(() => {
    const engine = new NeonRushEngine({
      onHudUpdate,
      onGameOver,
    });
    engine.setSkin(equippedCharacter);
    engine.startDemo();
    engineRef.current = engine;

    return () => {
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update character skin immediately when changed in Hangar
  useEffect(() => {
    engineRef.current?.setSkin(equippedCharacter);
  }, [equippedCharacter, engineRef]);

  // Animation loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (canvas && engine) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        const targetW = Math.max(1, Math.floor(rect.width * dpr));
        const targetH = Math.max(1, Math.floor(rect.height * dpr));

        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        if (screenRef.current === 'PLAYING' || screenRef.current === 'MENU') {
          engine.update(dt);
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          renderNeonRush(ctx, engine, rect.width, rect.height);
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [engineRef]);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (screenRef.current === 'PLAYING' || screenRef.current === 'PAUSED') {
          e.preventDefault();
          onTogglePause();
        }
        return;
      }
      if (screenRef.current !== 'PLAYING' || !engineRef.current) return;

      soundEngine.unlock();

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          engineRef.current.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          engineRef.current.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault();
          engineRef.current.jump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          engineRef.current.slide();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [engineRef, onTogglePause]);

  // Unified pointer swipe gestures on gameplay canvas (supports touch + mouse drag)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screenRef.current !== 'PLAYING') return;
    soundEngine.unlock();
    touchStartRef.current = { x: e.clientX, y: e.clientY, fired: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screenRef.current !== 'PLAYING' || !touchStartRef.current || !engineRef.current) return;
    if (touchStartRef.current.fired) return;

    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const threshold = 24;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) engineRef.current.moveLeft();
      else engineRef.current.moveRight();
    } else {
      if (dy < 0) engineRef.current.jump();
      else engineRef.current.slide();
    }

    touchStartRef.current.fired = true;
  };

  const handlePointerUp = () => {
    touchStartRef.current = null;
  };

  return (
    <div className="relative w-full h-full overflow-hidden touch-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block w-full h-full touch-none"
      />

      {/* Optional Mobile On-Screen Thumb Buttons during active gameplay */}
      {screen === 'PLAYING' && showTouchControls && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex items-end justify-between px-4 sm:px-8 pb-[env(safe-area-inset-bottom)]">
          {/* Left / Right D-Pad */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Move Left"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                engineRef.current?.moveLeft();
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/40 bg-[#0A0F24]/75 text-cyan-300 backdrop-blur-md active:scale-90 active:bg-cyan-500/30 transition-transform"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Move Right"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                engineRef.current?.moveRight();
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/40 bg-[#0A0F24]/75 text-cyan-300 backdrop-blur-md active:scale-90 active:bg-cyan-500/30 transition-transform"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>

          {/* Jump / Slide Action Pad */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              aria-label="Slide"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                engineRef.current?.slide();
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pink-400/40 bg-[#0A0F24]/75 text-pink-300 backdrop-blur-md active:scale-90 active:bg-pink-500/30 transition-transform"
            >
              <ArrowDown className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Jump"
              onPointerDown={(e) => {
                e.preventDefault();
                soundEngine.unlock();
                engineRef.current?.jump();
              }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/45 bg-[#0A0F24]/75 text-purple-200 backdrop-blur-md active:scale-90 active:bg-purple-500/30 transition-transform"
            >
              <ArrowUp className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
