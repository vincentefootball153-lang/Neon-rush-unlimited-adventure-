import {
  CHARACTERS,
  CharacterSkin,
  CollectibleKind,
  HudSnapshot,
  LEVEL_ZONES,
  LevelZone,
  ObstacleKind,
} from '../types/game';
import { soundEngine } from '../utils/audio';

export const PLAYER_Z = 3.5;
export const CAMERA_DIST = 16;
export const LANE_WIDTH = 2.6;
export const MAX_Z = 140;

export interface ObstacleEntity {
  id: number;
  kind: ObstacleKind;
  lane: number; // -1, 0, 1
  x: number;
  baseX: number;
  z: number;
  yMin: number;
  yMax: number;
  patrolPhase: number;
  patrolAmp: number;
  passed: boolean;
  smashed: boolean;
}

export interface CollectibleEntity {
  id: number;
  kind: CollectibleKind;
  lane: number;
  x: number;
  y: number;
  z: number;
  bobPhase: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface SideBuilding {
  side: -1 | 1;
  z: number;
  width: number;
  height: number;
  depth: number;
  colorVariant: number;
  hasBeacon: boolean;
}

export interface GameEngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onGameOver: (result: {
    score: number;
    distance: number;
    coinsEarned: number;
    diamondsEarned: number;
    levelReached: number;
    levelName: string;
  }) => void;
}

export class NeonRushEngine {
  public skin: CharacterSkin = CHARACTERS[0];

  // Player state
  public targetLane = 0; // -1, 0, 1
  public playerX = 0;
  public playerY = 0;
  public playerVy = 0;
  public slideTimer = 0;
  public queuedSlide = false;
  public runAnimPhase = 0;
  public laneTilt = 0;
  public invulnTimer = 0;
  public crashTimer = 0;
  public isCrashed = false;

  // Power-ups
  public magnetTimer = 0;
  public magnetMax = 8;
  public boostTimer = 0;
  public boostMax = 5;
  public hasShield = false;

  // Progression & score
  public distance = 0;
  public score = 0;
  public runCoins = 0;
  public runDiamonds = 0;
  public comboCount = 0;
  public comboTimer = 0;
  public multiplier = 1;
  public currentZone: LevelZone = LEVEL_ZONES[0];
  public speed = LEVEL_ZONES[0].baseSpeed;
  public levelBannerText: string | null = null;
  public levelBannerTimer = 0;

  // Screen FX
  public shakeTimer = 0;
  public shakeIntensity = 0;
  public flashAlpha = 0;
  public flashColor = '#00E5FF';
  public worldTime = 0;

  // Entities
  public obstacles: ObstacleEntity[] = [];
  public collectibles: CollectibleEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public buildings: SideBuilding[] = [];

  private nextId = 1;
  private spawnCooldown = 0.8;
  private hudSyncTimer = 0;
  private callbacks: GameEngineCallbacks;
  private isDemoMode = false;

  constructor(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
    this.initScenery();
  }

  private initScenery(): void {
    this.buildings = [];
    for (let i = 0; i < 32; i++) {
      const z = 8 + i * 4.4;
      this.buildings.push(this.createBuilding(-1, z));
      this.buildings.push(this.createBuilding(1, z));
    }
  }

  private createBuilding(side: -1 | 1, z: number): SideBuilding {
    return {
      side,
      z,
      width: 2.2 + Math.random() * 2.4,
      height: 5 + Math.random() * 14,
      depth: 2.4 + Math.random() * 1.8,
      colorVariant: Math.floor(Math.random() * 3),
      hasBeacon: Math.random() > 0.55,
    };
  }

  public setSkin(skinId: string): void {
    const found = CHARACTERS.find((c) => c.id === skinId);
    this.skin = found ?? CHARACTERS[0];
  }

  public startDemo(): void {
    this.reset(this.skin.id);
    this.isDemoMode = true;
    this.obstacles = [];
    this.collectibles = [];
  }

  public reset(skinId: string): void {
    this.setSkin(skinId);
    this.isDemoMode = false;
    this.targetLane = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerVy = 0;
    this.slideTimer = 0;
    this.queuedSlide = false;
    this.runAnimPhase = 0;
    this.laneTilt = 0;
    this.invulnTimer = 0;
    this.crashTimer = 0;
    this.isCrashed = false;

    this.magnetMax = 8 + this.skin.powerDurationBonus;
    this.boostMax = 5 + this.skin.powerDurationBonus * 0.6;
    this.magnetTimer = 0;
    this.boostTimer = 0;
    this.hasShield = false;

    this.distance = 0;
    this.score = 0;
    this.runCoins = 0;
    this.runDiamonds = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.multiplier = 1;

    this.currentZone = LEVEL_ZONES[0];
    this.speed = this.currentZone.baseSpeed;
    this.levelBannerText = `Sector 1 · ${this.currentZone.name}`;
    this.levelBannerTimer = 2.2;

    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.spawnCooldown = 0.7;
    this.hudSyncTimer = 0;
    this.initScenery();
    this.emitHud();
  }

  public revive(): void {
    this.isCrashed = false;
    this.crashTimer = 0;
    this.invulnTimer = 2.6;
    this.playerY = 0;
    this.playerVy = 0;
    this.slideTimer = 0;
    this.flashAlpha = 0.55;
    this.flashColor = '#00E5FF';
    // Clear nearby obstacles so player doesn't immediately die again
    this.obstacles = this.obstacles.filter((o) => o.z > PLAYER_Z + 22);
    this.spawnBurst(this.playerX, 1.0, PLAYER_Z, '#00E5FF', 26);
    soundEngine.playPowerUp();
    this.emitHud();
  }

  public moveLeft(): void {
    if (this.isCrashed || this.isDemoMode) return;
    if (this.targetLane > -1) {
      this.targetLane -= 1;
      this.laneTilt = -0.35;
      soundEngine.playLaneSwitch();
    }
  }

  public moveRight(): void {
    if (this.isCrashed || this.isDemoMode) return;
    if (this.targetLane < 1) {
      this.targetLane += 1;
      this.laneTilt = 0.35;
      soundEngine.playLaneSwitch();
    }
  }

  public jump(): void {
    if (this.isCrashed || this.isDemoMode) return;
    if (this.playerY <= 0.08) {
      this.playerVy = 17.8;
      this.playerY = 0.09;
      this.slideTimer = 0;
      this.queuedSlide = false;
      soundEngine.playJump();
      this.spawnBurst(this.playerX, 0.1, PLAYER_Z, this.skin.primaryColor, 10);
    }
  }

  public slide(): void {
    if (this.isCrashed || this.isDemoMode) return;
    if (this.playerY > 0.12) {
      // Fast-fall to ground and immediately slide
      this.playerVy = Math.min(this.playerVy, -26);
      this.queuedSlide = true;
    } else if (this.slideTimer <= 0.1) {
      this.slideTimer = 0.64;
      soundEngine.playSlide();
      this.spawnBurst(this.playerX, 0.1, PLAYER_Z, this.skin.secondaryColor, 8);
    }
  }

  public update(rawDt: number): void {
    const dt = Math.min(rawDt, 0.05);
    this.worldTime += dt;

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.8);
    }

    if (this.isDemoMode) {
      this.speed = 20;
      this.runAnimPhase += dt * 11;
      this.updateScenery(dt);
      this.updateParticles(dt);
      return;
    }

    if (this.isCrashed) {
      this.crashTimer += dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      return;
    }

    // Level progression
    let nextZone = LEVEL_ZONES[0];
    for (const z of LEVEL_ZONES) {
      if (this.distance >= z.minDistance) {
        nextZone = z;
      }
    }
    if (nextZone.level > this.currentZone.level) {
      this.currentZone = nextZone;
      this.levelBannerText = `Sector ${nextZone.level} · ${nextZone.name}`;
      this.levelBannerTimer = 2.6;
      this.flashAlpha = 0.32;
      this.flashColor = nextZone.laneGlow;
      soundEngine.playLevelUp();
    }

    if (this.levelBannerTimer > 0) {
      this.levelBannerTimer = Math.max(0, this.levelBannerTimer - dt);
      if (this.levelBannerTimer === 0) {
        this.levelBannerText = null;
      }
    }

    // Smooth speed scaling inside current sector
    const zoneProgress = Math.min(1, (this.distance - this.currentZone.minDistance) / 450);
    const targetBaseSpeed =
      this.currentZone.baseSpeed +
      (this.currentZone.maxSpeed - this.currentZone.baseSpeed) * zoneProgress;
    const boostAdd = this.boostTimer > 0 ? 18 : 0;
    const desiredSpeed = targetBaseSpeed + boostAdd;
    this.speed += (desiredSpeed - this.speed) * Math.min(1, dt * 5);

    // Distance & score
    const distDelta = this.speed * dt * 0.55;
    this.distance += distDelta;
    this.score += distDelta * 10 * this.multiplier;

    // Power-up timers
    if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.boostTimer > 0) this.boostTimer = Math.max(0, this.boostTimer - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.multiplier = 1;
      }
    }

    // Player horizontal interpolation & tilt
    const targetX = this.targetLane * LANE_WIDTH;
    this.playerX += (targetX - this.playerX) * (1 - Math.exp(-18 * dt));
    this.laneTilt *= Math.exp(-12 * dt);

    // Player vertical physics
    if (this.playerY > 0 || this.playerVy > 0) {
      this.playerY += this.playerVy * dt;
      this.playerVy -= 46 * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.spawnBurst(this.playerX, 0.05, PLAYER_Z, this.skin.trailColor, 6);
        if (this.queuedSlide) {
          this.queuedSlide = false;
          this.slideTimer = 0.64;
          soundEngine.playSlide();
        }
      }
    }

    if (this.slideTimer > 0) {
      this.slideTimer = Math.max(0, this.slideTimer - dt);
      if (Math.random() < 0.55) {
        this.particles.push({
          x: this.playerX + (Math.random() - 0.5) * 0.6,
          y: 0.1,
          z: PLAYER_Z - 0.2,
          vx: (Math.random() - 0.5) * 1.6,
          vy: 0.8 + Math.random() * 1.4,
          vz: -4,
          color: this.skin.primaryColor,
          size: 2.5,
          life: 0.25,
          maxLife: 0.25,
        });
      }
    }

    // Running limb animation & boost trail particles
    this.runAnimPhase += dt * (this.speed * 0.42);
    if (this.boostTimer > 0 && Math.random() < 0.7) {
      this.particles.push({
        x: this.playerX + (Math.random() - 0.5) * 0.8,
        y: this.playerY + 0.4 + Math.random() * 1.1,
        z: PLAYER_Z - 0.3,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: -8,
        color: Math.random() > 0.5 ? '#00E5FF' : '#FF2E93',
        size: 3.5,
        life: 0.35,
        maxLife: 0.35,
      });
    }

    // Scenery & wave spawning
    this.updateScenery(dt);
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0) {
      this.spawnWave();
      const speedRatio = 26 / Math.max(22, this.speed);
      this.spawnCooldown = this.currentZone.spawnInterval * (0.88 + Math.random() * 0.28) * Math.max(0.68, speedRatio);
    }

    this.updateObstacles(dt);
    this.updateCollectibles(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // Throttle React HUD updates (~15Hz) so React doesn't re-render every frame unnecessarily
    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.065) {
      this.hudSyncTimer = 0;
      this.emitHud();
    }
  }

  private updateScenery(dt: number): void {
    for (const b of this.buildings) {
      b.z -= this.speed * dt;
      if (b.z < -2) {
        b.z += 32 * 4.4;
        b.width = 2.2 + Math.random() * 2.4;
        b.height = 5 + Math.random() * 14;
        b.colorVariant = Math.floor(Math.random() * 3);
        b.hasBeacon = Math.random() > 0.55;
      }
    }
  }

  private spawnWave(): void {
    const lanes = [-1, 0, 1];
    // Shuffle lanes
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }

    const spawnZ = MAX_Z - 6;
    const roll = Math.random();

    // Determine obstacle count (1 or 2 lanes occupied, NEVER 3 tall blocks)
    const twoLaneChance = Math.min(0.65, 0.25 + (this.currentZone.level - 1) * 0.1);
    const numObstacles = roll < twoLaneChance ? 2 : 1;

    const occupiedLanes = new Set<number>();

    for (let i = 0; i < numObstacles; i++) {
      const lane = lanes[i];
      occupiedLanes.add(lane);
      const kind = this.pickObstacleKind();
      this.addObstacle(kind, lane, spawnZ + i * 2.5);

      // Put a coin arc over low barriers or underneath high lasers for rewarding skill plays
      if (kind === 'low_barrier' && Math.random() < 0.55) {
        for (let c = -1; c <= 1; c++) {
          this.addCollectible('coin', lane, 2.2 - Math.abs(c) * 0.45, spawnZ + i * 2.5 + c * 3.0);
        }
      } else if (kind === 'high_laser' && Math.random() < 0.55) {
        for (let c = 0; c < 3; c++) {
          this.addCollectible('coin', lane, 0.5, spawnZ + i * 2.5 + (c - 1) * 3.0);
        }
      }
    }

    // Free lane gets coin trail, diamond, or power-up
    const freeLane = lanes[numObstacles];
    const pickupRoll = Math.random();
    if (pickupRoll < 0.085) {
      const powers: CollectibleKind[] = ['magnet', 'shield', 'boost'];
      const chosen = powers[Math.floor(Math.random() * powers.length)];
      this.addCollectible(chosen, freeLane, 0.9, spawnZ + 2);
    } else if (pickupRoll < 0.19) {
      this.addCollectible('diamond', freeLane, 0.95, spawnZ + 2);
      this.addCollectible('coin', freeLane, 0.65, spawnZ + 6);
    } else if (pickupRoll < 0.85) {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let c = 0; c < count; c++) {
        this.addCollectible('coin', freeLane, 0.65, spawnZ + c * 3.2);
      }
    }
  }

  private pickObstacleKind(): ObstacleKind {
    if (Math.random() < this.currentZone.droneChance) {
      return 'hover_drone';
    }
    const r = Math.random();
    if (r < 0.36) return 'low_barrier';
    if (r < 0.68) return 'high_laser';
    return 'tall_block';
  }

  private addObstacle(kind: ObstacleKind, lane: number, z: number): void {
    let yMin = 0;
    let yMax = 1.3;
    let patrolAmp = 0;

    if (kind === 'high_laser') {
      yMin = 1.18;
      yMax = 3.5;
    } else if (kind === 'tall_block') {
      yMin = 0;
      yMax = 3.8;
    } else if (kind === 'hover_drone') {
      yMin = 0.25;
      yMax = 1.75;
      patrolAmp = lane === 0 ? 1.4 : 0.95;
    }

    this.obstacles.push({
      id: this.nextId++,
      kind,
      lane,
      x: lane * LANE_WIDTH,
      baseX: lane * LANE_WIDTH,
      z,
      yMin,
      yMax,
      patrolPhase: Math.random() * Math.PI * 2,
      patrolAmp,
      passed: false,
      smashed: false,
    });
  }

  private addCollectible(kind: CollectibleKind, lane: number, y: number, z: number): void {
    this.collectibles.push({
      id: this.nextId++,
      kind,
      lane,
      x: lane * LANE_WIDTH,
      y,
      z,
      bobPhase: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  private updateObstacles(dt: number): void {
    const playerBottom = this.playerY;
    const playerTop = this.playerY + (this.slideTimer > 0 ? 0.85 : 1.95);

    for (const obs of this.obstacles) {
      obs.z -= this.speed * dt;
      if (obs.kind === 'hover_drone') {
        obs.patrolPhase += dt * 2.6;
        obs.x = obs.baseX + Math.sin(obs.patrolPhase) * obs.patrolAmp;
        obs.x = Math.max(-LANE_WIDTH, Math.min(LANE_WIDTH, obs.x));
      }

      if (obs.smashed) continue;

      // Dodged bonus check
      if (!obs.passed && obs.z < PLAYER_Z - 1.2) {
        obs.passed = true;
      }

      // Collision check
      if (Math.abs(obs.z - PLAYER_Z) < 1.02) {
        if (Math.abs(this.playerX - obs.x) < 1.02) {
          if (playerBottom < obs.yMax && playerTop > obs.yMin) {
            if (this.boostTimer > 0) {
              obs.smashed = true;
              this.score += 150 * this.multiplier;
              this.shakeTimer = 0.16;
              this.shakeIntensity = 6;
              this.spawnBurst(obs.x, (obs.yMin + obs.yMax) * 0.5, obs.z, '#00E5FF', 20);
              this.addFloatingText(obs.x, 2.2, obs.z, '+150 SMASH', '#00E5FF');
              soundEngine.playShieldBreak();
            } else if (this.hasShield) {
              this.hasShield = false;
              obs.smashed = true;
              this.invulnTimer = 1.3;
              this.shakeTimer = 0.25;
              this.shakeIntensity = 9;
              this.flashAlpha = 0.45;
              this.flashColor = '#38BDF8';
              this.spawnBurst(obs.x, 1.2, obs.z, '#38BDF8', 26);
              this.addFloatingText(this.playerX, 2.5, PLAYER_Z, 'SHIELD SAVED!', '#38BDF8');
              soundEngine.playShieldBreak();
              this.emitHud();
            } else if (this.invulnTimer <= 0) {
              this.triggerCrash();
              return;
            }
          }
        }
      }
    }

    this.obstacles = this.obstacles.filter((o) => o.z > -4 && !o.smashed);
  }

  private updateCollectibles(dt: number): void {
    const playerCenterY = this.playerY + (this.slideTimer > 0 ? 0.45 : 1.0);

    for (const item of this.collectibles) {
      item.z -= this.speed * dt;
      item.bobPhase += dt * 4.5;

      if (item.collected) continue;

      // Magnet pulls coins & diamonds within 28 units ahead
      if (
        this.magnetTimer > 0 &&
        (item.kind === 'coin' || item.kind === 'diamond') &&
        item.z < PLAYER_Z + 26 &&
        item.z > PLAYER_Z - 2
      ) {
        const dx = this.playerX - item.x;
        const dy = playerCenterY - item.y;
        const dz = PLAYER_Z - item.z;
        const pull = 1 - Math.exp(-11 * dt);
        item.x += dx * pull;
        item.y += dy * pull;
        item.z += dz * (pull * 0.65);
      }

      // Pickup check
      const dz = Math.abs(item.z - PLAYER_Z);
      const dx = Math.abs(item.x - this.playerX);
      const dy = Math.abs(item.y - playerCenterY);
      const radius = item.kind === 'coin' ? 1.25 : 1.4;

      if (dz < 1.3 && dx < radius && dy < 1.35) {
        item.collected = true;
        this.handleCollect(item);
      }
    }

    this.collectibles = this.collectibles.filter((c) => !c.collected && c.z > -3);
  }

  private handleCollect(item: CollectibleEntity): void {
    if (item.kind === 'coin') {
      const coinGain = Math.max(1, Math.round(1 * (1 + this.skin.coinBonus)));
      this.runCoins += coinGain;
      this.comboCount += 1;
      this.comboTimer = 2.4;
      this.multiplier = Math.min(5, 1 + Math.floor(this.comboCount / 6));
      this.score += 25 * this.multiplier;
      this.spawnBurst(item.x, item.y, item.z, '#FACC15', 8);
      soundEngine.playCoin();
    } else if (item.kind === 'diamond') {
      this.runDiamonds += 1;
      this.score += 120 * this.multiplier;
      this.spawnBurst(item.x, item.y, item.z, '#FF2E93', 16);
      this.addFloatingText(item.x, item.y + 0.8, item.z, '+1 GEM', '#FF2E93');
      soundEngine.playDiamond();
    } else if (item.kind === 'magnet') {
      this.magnetTimer = this.magnetMax;
      this.score += 80;
      this.spawnBurst(item.x, item.y, item.z, '#A855F7', 18);
      this.addFloatingText(item.x, item.y + 0.9, item.z, 'MAGNET!', '#C084FC');
      soundEngine.playPowerUp();
    } else if (item.kind === 'shield') {
      this.hasShield = true;
      this.score += 80;
      this.spawnBurst(item.x, item.y, item.z, '#38BDF8', 18);
      this.addFloatingText(item.x, item.y + 0.9, item.z, 'SHIELD!', '#38BDF8');
      soundEngine.playPowerUp();
    } else if (item.kind === 'boost') {
      this.boostTimer = this.boostMax;
      this.score += 100;
      this.flashAlpha = 0.25;
      this.flashColor = '#00E5FF';
      this.spawnBurst(item.x, item.y, item.z, '#00E5FF', 22);
      this.addFloatingText(item.x, item.y + 0.9, item.z, 'HYPER BOOST!', '#00E5FF');
      soundEngine.playPowerUp();
    }
    this.emitHud();
  }

  private triggerCrash(): void {
    this.isCrashed = true;
    this.crashTimer = 0;
    this.shakeTimer = 0.45;
    this.shakeIntensity = 14;
    this.flashAlpha = 0.65;
    this.flashColor = '#FF2E93';
    this.spawnBurst(this.playerX, this.playerY + 1, PLAYER_Z, '#FF2E93', 32);
    this.spawnBurst(this.playerX, this.playerY + 1, PLAYER_Z, this.skin.primaryColor, 20);
    soundEngine.playCrash();
    this.emitHud();

    window.setTimeout(() => {
      if (!this.isCrashed) return;
      this.callbacks.onGameOver({
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        coinsEarned: this.runCoins,
        diamondsEarned: this.runDiamonds,
        levelReached: this.currentZone.level,
        levelName: this.currentZone.name,
      });
    }, 520);
  }

  private spawnBurst(x: number, y: number, z: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 7 + 1,
        vz: (Math.random() - 0.5) * 8,
        color,
        size: 2.5 + Math.random() * 3.5,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
      });
    }
  }

  private addFloatingText(x: number, y: number, z: number, text: string, color: string): void {
    this.floatingTexts.push({
      x,
      y,
      z,
      text,
      color,
      life: 0.95,
      maxLife: 0.95,
    });
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 14 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private updateFloatingTexts(dt: number): void {
    for (const ft of this.floatingTexts) {
      ft.y += 1.8 * dt;
      ft.life -= dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  public emitHud(): void {
    this.callbacks.onHudUpdate({
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      coins: this.runCoins,
      diamonds: this.runDiamonds,
      level: this.currentZone.level,
      levelName: this.currentZone.name,
      multiplier: this.multiplier,
      comboCount: this.comboCount,
      magnetTime: this.magnetTimer,
      magnetMax: this.magnetMax,
      boostTime: this.boostTimer,
      boostMax: this.boostMax,
      hasShield: this.hasShield,
      speedKmh: Math.round(this.speed * 4.2),
      levelBannerText: this.levelBannerText,
    });
  }
}
