import {
  CAMERA_DIST,
  CollectibleEntity,
  LANE_WIDTH,
  MAX_Z,
  NeonRushEngine,
  ObstacleEntity,
  PLAYER_Z,
} from './engine';

interface ProjectedPoint {
  sx: number;
  sy: number;
  scale: number;
}

function project(
  worldX: number,
  worldY: number,
  z: number,
  width: number,
  height: number,
  boostFovFactor = 1
): ProjectedPoint {
  const horizonY = height * 0.37;
  const groundBottomY = height * 0.91;
  const roadBaseScale = Math.min(width, height * 1.15) * 0.105 * boostFovFactor;
  const clampedZ = Math.max(-4, z);
  const k = CAMERA_DIST / (CAMERA_DIST + clampedZ);
  const sx = width * 0.5 + worldX * roadBaseScale * k;
  const sy = horizonY + (groundBottomY - horizonY) * k - worldY * roadBaseScale * k;
  return { sx, sy, scale: roadBaseScale * k };
}

export function renderNeonRush(
  ctx: CanvasRenderingContext2D,
  engine: NeonRushEngine,
  width: number,
  height: number
): void {
  const zone = engine.currentZone;
  const boostFactor = engine.boostTimer > 0 ? 1.07 : 1;

  ctx.save();

  // Screen shake
  if (engine.shakeTimer > 0) {
    const mag = engine.shakeIntensity * (engine.shakeTimer / 0.45);
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }

  // 1. Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.44);
  skyGrad.addColorStop(0, zone.skyTop);
  skyGrad.addColorStop(0.55, zone.skyMid);
  skyGrad.addColorStop(1, zone.skyHorizon);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Twinkling Starfield
  drawStars(ctx, width, height, engine.worldTime);

  // 3. Synthwave Sun + Horizon Glow
  const horizonY = height * 0.37;
  const sunRadius = Math.min(width, height) * 0.16;
  const sunX = width * 0.5;
  const sunY = horizonY - sunRadius * 0.18;

  const glowGrad = ctx.createRadialGradient(sunX, horizonY, sunRadius * 0.2, sunX, horizonY, sunRadius * 2.6);
  glowGrad.addColorStop(0, `${zone.laneGlow}44`);
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, width, height * 0.6);

  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
  sunGrad.addColorStop(0, zone.sunTop);
  sunGrad.addColorStop(1, zone.sunBottom);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

  // Horizontal synthwave sun scan-stripes
  ctx.fillStyle = zone.skyHorizon;
  for (let i = 0; i < 6; i++) {
    const bandY = sunY + sunRadius * (0.1 + i * 0.15);
    const bandH = 2 + i * 2.2;
    ctx.fillRect(sunX - sunRadius, bandY, sunRadius * 2, bandH);
  }
  ctx.restore();

  // 4. Distant City Skyline Silhouette
  drawDistantSkyline(ctx, width, horizonY, zone.buildingSilhouette, zone.buildingAccent);

  // 5. Ground Plane & 3D Perspective Neon Track
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  groundGrad.addColorStop(0, '#070816');
  groundGrad.addColorStop(1, '#04050D');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  drawRoadAndGrid(ctx, engine, width, height, horizonY, boostFactor);

  // 6. Side 3D Neon Buildings (sorted back-to-front)
  const sortedBuildings = [...engine.buildings].sort((a, b) => b.z - a.z);
  for (const b of sortedBuildings) {
    if (b.z > MAX_Z - 4 || b.z < 0.2) continue;
    drawSideBuilding(ctx, b, width, height, zone.buildingSilhouette, zone.buildingAccent, boostFactor);
  }

  // 7. Collectibles & Obstacles (painter's algorithm back-to-front)
  type Drawable =
    | { kind: 'obs'; z: number; entity: ObstacleEntity }
    | { kind: 'item'; z: number; entity: CollectibleEntity };

  const drawables: Drawable[] = [];
  for (const obs of engine.obstacles) {
    if (obs.z <= MAX_Z && obs.z > 0.2) {
      drawables.push({ kind: 'obs', z: obs.z, entity: obs });
    }
  }
  for (const item of engine.collectibles) {
    if (item.z <= MAX_Z && item.z > 0.2) {
      drawables.push({ kind: 'item', z: item.z, entity: item });
    }
  }
  drawables.sort((a, b) => b.z - a.z);

  // Draw items & obstacles behind player first, then player, then anything closer than player
  let playerDrawn = false;
  for (const d of drawables) {
    if (!playerDrawn && d.z < PLAYER_Z) {
      drawRunner(ctx, engine, width, height, boostFactor);
      playerDrawn = true;
    }
    if (d.kind === 'obs') {
      drawObstacle(ctx, d.entity, width, height, engine.worldTime, boostFactor);
    } else {
      drawCollectible(ctx, d.entity, width, height, engine.worldTime, boostFactor);
    }
  }
  if (!playerDrawn) {
    drawRunner(ctx, engine, width, height, boostFactor);
  }

  // 8. 3D Particles & Floating Score Popups
  for (const p of engine.particles) {
    const pt = project(p.x, p.y, p.z, width, height, boostFactor);
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(pt.sx, pt.sy, Math.max(1.5, p.size * (pt.scale / 38)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const ft of engine.floatingTexts) {
    const pt = project(ft.x, ft.y, ft.z, width, height, boostFactor);
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.globalAlpha = alpha;
    ctx.font = `800 ${Math.max(13, Math.round(width * 0.018))}px "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 10;
    ctx.fillText(ft.text, pt.sx, pt.sy);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // 9. Speed lines when boosting or at high sectors
  if (engine.boostTimer > 0 || engine.speed > 38) {
    drawSpeedLines(ctx, width, height, engine.worldTime, engine.boostTimer > 0 ? 0.55 : 0.22);
  }

  // 10. Screen flash overlay
  if (engine.flashAlpha > 0) {
    ctx.fillStyle = engine.flashColor;
    ctx.globalAlpha = engine.flashAlpha * 0.45;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
  const skyLimit = height * 0.36;
  for (let i = 0; i < 42; i++) {
    const x = ((i * 197.3) % 100) * 0.01 * width;
    const y = ((i * 83.7) % 100) * 0.01 * skyLimit;
    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * 1.4 + i));
    ctx.fillStyle = `rgba(226, 232, 240, ${twinkle * 0.7})`;
    ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1.5, i % 3 === 0 ? 2 : 1.5);
  }
}

function drawDistantSkyline(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  bodyColor: string,
  accentColor: string
): void {
  const count = 24;
  const segW = width / count;
  for (let i = 0; i < count; i++) {
    const h = 18 + ((i * 37) % 58);
    const x = i * segW;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x, horizonY - h, segW + 1, h + 2);
    if (i % 3 === 0) {
      ctx.fillStyle = `${accentColor}44`;
      ctx.fillRect(x + segW * 0.25, horizonY - h + 5, segW * 0.5, 2);
    }
  }
}

function drawRoadAndGrid(
  ctx: CanvasRenderingContext2D,
  engine: NeonRushEngine,
  width: number,
  height: number,
  horizonY: number,
  boostFactor: number
): void {
  const zone = engine.currentZone;
  const roadHalf = LANE_WIDTH * 1.62;
  const farLeft = project(-roadHalf, 0, MAX_Z, width, height, boostFactor);
  const farRight = project(roadHalf, 0, MAX_Z, width, height, boostFactor);
  const nearLeft = project(-roadHalf, 0, 0.1, width, height, boostFactor);
  const nearRight = project(roadHalf, 0, 0.1, width, height, boostFactor);

  // Road surface
  const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  roadGrad.addColorStop(0, '#0E0B24');
  roadGrad.addColorStop(1, '#090D1E');
  ctx.fillStyle = roadGrad;
  ctx.beginPath();
  ctx.moveTo(farLeft.sx, farLeft.sy);
  ctx.lineTo(farRight.sx, farRight.sy);
  ctx.lineTo(nearRight.sx, nearRight.sy);
  ctx.lineTo(nearLeft.sx, nearLeft.sy);
  ctx.closePath();
  ctx.fill();

  // Horizontal scrolling perspective ribs
  const spacing = 5.5;
  const scrollOffset = (engine.distance * 1.8) % spacing;
  ctx.strokeStyle = zone.gridColor;
  ctx.lineWidth = 1.5;

  for (let z = spacing - scrollOffset; z < MAX_Z; z += spacing) {
    if (z < 0.2) continue;
    const pL = project(-roadHalf, 0, z, width, height, boostFactor);
    const pR = project(roadHalf, 0, z, width, height, boostFactor);
    const alpha = Math.max(0.05, 1 - z / MAX_Z);
    ctx.globalAlpha = alpha * 0.55;
    ctx.beginPath();
    ctx.moveTo(pL.sx, pL.sy);
    ctx.lineTo(pR.sx, pR.sy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Lane divider dashed lines
  const dividers = [-LANE_WIDTH * 0.5, LANE_WIDTH * 0.5];
  for (const dx of dividers) {
    const pFar = project(dx, 0, MAX_Z, width, height, boostFactor);
    const pNear = project(dx, 0, 0.1, width, height, boostFactor);
    ctx.strokeStyle = `${zone.laneGlow}66`;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 14]);
    ctx.lineDashOffset = (engine.distance * 18) % 26;
    ctx.beginPath();
    ctx.moveTo(pFar.sx, pFar.sy);
    ctx.lineTo(pNear.sx, pNear.sy);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Outer glowing neon curb rails
  ctx.strokeStyle = zone.laneGlow;
  ctx.lineWidth = 3.5;
  ctx.shadowColor = zone.laneGlow;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(farLeft.sx, farLeft.sy);
  ctx.lineTo(nearLeft.sx, nearLeft.sy);
  ctx.moveTo(farRight.sx, farRight.sy);
  ctx.lineTo(nearRight.sx, nearRight.sy);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Active lane subtle highlight under player
  const laneCenter = engine.targetLane * LANE_WIDTH;
  const hFarL = project(laneCenter - LANE_WIDTH * 0.44, 0, 26, width, height, boostFactor);
  const hFarR = project(laneCenter + LANE_WIDTH * 0.44, 0, 26, width, height, boostFactor);
  const hNearL = project(laneCenter - LANE_WIDTH * 0.44, 0, 1.2, width, height, boostFactor);
  const hNearR = project(laneCenter + LANE_WIDTH * 0.44, 0, 1.2, width, height, boostFactor);
  const laneGrad = ctx.createLinearGradient(0, hFarL.sy, 0, hNearL.sy);
  laneGrad.addColorStop(0, 'rgba(0,0,0,0)');
  laneGrad.addColorStop(1, `${engine.skin.primaryColor}22`);
  ctx.fillStyle = laneGrad;
  ctx.beginPath();
  ctx.moveTo(hFarL.sx, hFarL.sy);
  ctx.lineTo(hFarR.sx, hFarR.sy);
  ctx.lineTo(hNearR.sx, hNearR.sy);
  ctx.lineTo(hNearL.sx, hNearL.sy);
  ctx.closePath();
  ctx.fill();
}

function drawSideBuilding(
  ctx: CanvasRenderingContext2D,
  b: { side: -1 | 1; z: number; width: number; height: number; depth: number; colorVariant: number; hasBeacon: boolean },
  width: number,
  height: number,
  bodyColor: string,
  accentColor: string,
  boostFactor: number
): void {
  const innerX = b.side * (LANE_WIDTH * 1.95);
  const outerX = b.side * (LANE_WIDTH * 1.95 + b.width);
  const pBaseInner = project(innerX, 0, b.z, width, height, boostFactor);
  const pTopInner = project(innerX, b.height, b.z, width, height, boostFactor);
  const pBaseOuter = project(outerX, 0, b.z, width, height, boostFactor);
  const pTopOuter = project(outerX, b.height, b.z, width, height, boostFactor);

  const depthShift = b.depth;
  const pBaseBack = project(innerX, 0, b.z + depthShift, width, height, boostFactor);
  const pTopBack = project(innerX, b.height, b.z + depthShift, width, height, boostFactor);

  const fade = Math.min(1, (MAX_Z - b.z) / 28);
  ctx.globalAlpha = fade;

  // Inner side face (lit)
  ctx.fillStyle = '#0F1633';
  ctx.beginPath();
  ctx.moveTo(pBaseInner.sx, pBaseInner.sy);
  ctx.lineTo(pTopInner.sx, pTopInner.sy);
  ctx.lineTo(pTopBack.sx, pTopBack.sy);
  ctx.lineTo(pBaseBack.sx, pBaseBack.sy);
  ctx.closePath();
  ctx.fill();

  // Front face
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(pBaseInner.sx, pBaseInner.sy);
  ctx.lineTo(pTopInner.sx, pTopInner.sy);
  ctx.lineTo(pTopOuter.sx, pTopOuter.sy);
  ctx.lineTo(pBaseOuter.sx, pBaseOuter.sy);
  ctx.closePath();
  ctx.fill();

  // Neon edge strip
  const stripColor = b.colorVariant === 0 ? accentColor : b.colorVariant === 1 ? '#FF2E93' : '#8B5CF6';
  ctx.strokeStyle = `${stripColor}AA`;
  ctx.lineWidth = Math.max(1, pBaseInner.scale * 0.045);
  ctx.beginPath();
  ctx.moveTo(pBaseInner.sx, pBaseInner.sy);
  ctx.lineTo(pTopInner.sx, pTopInner.sy);
  ctx.stroke();

  // Window glow bars
  if (b.hasBeacon && b.z < 90) {
    ctx.fillStyle = `${stripColor}66`;
    const floors = 4;
    for (let f = 1; f <= floors; f++) {
      const fy = (b.height / (floors + 1)) * f;
      const wL = project(innerX + b.side * 0.25, fy, b.z, width, height, boostFactor);
      const wR = project(innerX + b.side * (b.width * 0.7), fy, b.z, width, height, boostFactor);
      ctx.fillRect(Math.min(wL.sx, wR.sx), wL.sy, Math.abs(wR.sx - wL.sx), Math.max(2, wL.scale * 0.14));
    }
  }

  ctx.globalAlpha = 1;
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obs: ObstacleEntity,
  width: number,
  height: number,
  time: number,
  boostFactor: number
): void {
  const fade = Math.min(1, (MAX_Z - obs.z) / 18);
  ctx.globalAlpha = fade;

  if (obs.kind === 'low_barrier') {
    // 3D Neon Energy Hurdle (Jump Over)
    const halfW = 0.95;
    const pBL = project(obs.x - halfW, 0, obs.z, width, height, boostFactor);
    const pBR = project(obs.x + halfW, 0, obs.z, width, height, boostFactor);
    const pTL = project(obs.x - halfW, obs.yMax, obs.z, width, height, boostFactor);
    const pTR = project(obs.x + halfW, obs.yMax, obs.z, width, height, boostFactor);
    const pTopBackL = project(obs.x - halfW, obs.yMax, obs.z + 0.8, width, height, boostFactor);
    const pTopBackR = project(obs.x + halfW, obs.yMax, obs.z + 0.8, width, height, boostFactor);

    // Top 3D cap
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.moveTo(pTL.sx, pTL.sy);
    ctx.lineTo(pTR.sx, pTR.sy);
    ctx.lineTo(pTopBackR.sx, pTopBackR.sy);
    ctx.lineTo(pTopBackL.sx, pTopBackL.sy);
    ctx.closePath();
    ctx.fill();

    // Front face
    const grad = ctx.createLinearGradient(0, pTL.sy, 0, pBL.sy);
    grad.addColorStop(0, '#FF2E93');
    grad.addColorStop(1, '#4C0519');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pTL.sx, pTL.sy);
    ctx.lineTo(pTR.sx, pTR.sy);
    ctx.lineTo(pBR.sx, pBR.sy);
    ctx.lineTo(pBL.sx, pBL.sy);
    ctx.closePath();
    ctx.fill();

    // Warning chevron stripe
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = Math.max(1.5, pBL.scale * 0.07);
    ctx.strokeRect(pTL.sx, pTL.sy, pTR.sx - pTL.sx, pBL.sy - pTL.sy);

    // Jump hint arrow
    const mid = project(obs.x, obs.yMax * 0.55, obs.z, width, height, boostFactor);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${Math.max(9, Math.round(mid.scale * 0.36))}px "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('JUMP', mid.sx, mid.sy + mid.scale * 0.12);
  } else if (obs.kind === 'high_laser') {
    // Overhead Laser Gate (Slide Under)
    const halfW = 1.05;
    const pGateBL = project(obs.x - halfW, 0, obs.z, width, height, boostFactor);
    const pGateBR = project(obs.x + halfW, 0, obs.z, width, height, boostFactor);
    const pBarBotL = project(obs.x - halfW, obs.yMin, obs.z, width, height, boostFactor);
    const pBarBotR = project(obs.x + halfW, obs.yMin, obs.z, width, height, boostFactor);
    const pBarTopL = project(obs.x - halfW, obs.yMax, obs.z, width, height, boostFactor);
    const pBarTopR = project(obs.x + halfW, obs.yMax, obs.z, width, height, boostFactor);

    // Side pylons
    const pylonW = Math.max(4, pGateBL.scale * 0.16);
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(pGateBL.sx - pylonW * 0.5, pBarTopL.sy, pylonW, pGateBL.sy - pBarTopL.sy);
    ctx.fillRect(pGateBR.sx - pylonW * 0.5, pBarTopR.sy, pylonW, pGateBR.sy - pBarTopR.sy);

    // Glowing overhead laser beam panel
    const pulse = 0.78 + 0.22 * Math.sin(time * 12);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.75 * pulse})`;
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(pBarTopL.sx, pBarTopL.sy);
    ctx.lineTo(pBarTopR.sx, pBarTopR.sy);
    ctx.lineTo(pBarBotR.sx, pBarBotR.sy);
    ctx.lineTo(pBarBotL.sx, pBarBotL.sy);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bright laser bar at bottom edge
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = Math.max(2, pBarBotL.scale * 0.08);
    ctx.beginPath();
    ctx.moveTo(pBarBotL.sx, pBarBotL.sy);
    ctx.lineTo(pBarBotR.sx, pBarBotR.sy);
    ctx.stroke();

    const mid = project(obs.x, (obs.yMin + obs.yMax) * 0.5, obs.z, width, height, boostFactor);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${Math.max(9, Math.round(mid.scale * 0.34))}px "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SLIDE', mid.sx, mid.sy + mid.scale * 0.12);
  } else if (obs.kind === 'tall_block') {
    // Massive Cyber Monolith / Train Block (Switch Lanes)
    const halfW = 1.02;
    const depth = 2.6;
    const pBL = project(obs.x - halfW, 0, obs.z, width, height, boostFactor);
    const pBR = project(obs.x + halfW, 0, obs.z, width, height, boostFactor);
    const pTL = project(obs.x - halfW, obs.yMax, obs.z, width, height, boostFactor);
    const pTR = project(obs.x + halfW, obs.yMax, obs.z, width, height, boostFactor);

    const pBackTL = project(obs.x - halfW, obs.yMax, obs.z + depth, width, height, boostFactor);
    const pBackTR = project(obs.x + halfW, obs.yMax, obs.z + depth, width, height, boostFactor);
    const pBackBL = project(obs.x - halfW, 0, obs.z + depth, width, height, boostFactor);
    const pBackBR = project(obs.x + halfW, 0, obs.z + depth, width, height, boostFactor);

    // Side extrusion (3D depth!)
    ctx.fillStyle = '#1E1B4B';
    if (obs.x > 0) {
      ctx.beginPath();
      ctx.moveTo(pBL.sx, pBL.sy);
      ctx.lineTo(pTL.sx, pTL.sy);
      ctx.lineTo(pBackTL.sx, pBackTL.sy);
      ctx.lineTo(pBackBL.sx, pBackBL.sy);
      ctx.closePath();
      ctx.fill();
    } else if (obs.x < 0) {
      ctx.beginPath();
      ctx.moveTo(pBR.sx, pBR.sy);
      ctx.lineTo(pTR.sx, pTR.sy);
      ctx.lineTo(pBackTR.sx, pBackTR.sy);
      ctx.lineTo(pBackBR.sx, pBackBR.sy);
      ctx.closePath();
      ctx.fill();
    }

    // Roof
    ctx.fillStyle = '#4C1D95';
    ctx.beginPath();
    ctx.moveTo(pTL.sx, pTL.sy);
    ctx.lineTo(pTR.sx, pTR.sy);
    ctx.lineTo(pBackTR.sx, pBackTR.sy);
    ctx.lineTo(pBackTL.sx, pBackTL.sy);
    ctx.closePath();
    ctx.fill();

    // Front armor face
    const faceGrad = ctx.createLinearGradient(0, pTL.sy, 0, pBL.sy);
    faceGrad.addColorStop(0, '#312E81');
    faceGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.moveTo(pTL.sx, pTL.sy);
    ctx.lineTo(pTR.sx, pTR.sy);
    ctx.lineTo(pBR.sx, pBR.sy);
    ctx.lineTo(pBL.sx, pBL.sy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = Math.max(1.5, pBL.scale * 0.06);
    ctx.stroke();

    // Cyber train headlights
    const lightY = project(obs.x, 1.1, obs.z, width, height, boostFactor).sy;
    const lightL = project(obs.x - 0.55, 1.1, obs.z, width, height, boostFactor);
    const lightR = project(obs.x + 0.55, 1.1, obs.z, width, height, boostFactor);
    const r = Math.max(2.5, lightL.scale * 0.18);
    ctx.fillStyle = '#FF2E93';
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(lightL.sx, lightY, r, 0, Math.PI * 2);
    ctx.arc(lightR.sx, lightY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // Hover Patrol Drone
    const bob = Math.sin(time * 7 + obs.patrolPhase) * 0.14;
    const center = project(obs.x, 1.05 + bob, obs.z, width, height, boostFactor);
    const groundShadow = project(obs.x, 0.02, obs.z, width, height, boostFactor);
    const s = center.scale;

    // Ground danger shadow
    ctx.fillStyle = 'rgba(255, 46, 147, 0.35)';
    ctx.beginPath();
    ctx.ellipse(groundShadow.sx, groundShadow.sy, s * 0.75, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drone wings
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#FF2E93';
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.beginPath();
    ctx.moveTo(center.sx - s * 0.95, center.sy);
    ctx.lineTo(center.sx, center.sy - s * 0.42);
    ctx.lineTo(center.sx + s * 0.95, center.sy);
    ctx.lineTo(center.sx, center.sy + s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red/pink core eye
    ctx.fillStyle = '#FF2E93';
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(center.sx, center.sy, Math.max(3, s * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.globalAlpha = 1;
}

function drawCollectible(
  ctx: CanvasRenderingContext2D,
  item: CollectibleEntity,
  width: number,
  height: number,
  time: number,
  boostFactor: number
): void {
  const bob = Math.sin(item.bobPhase) * 0.14;
  const pt = project(item.x, item.y + bob, item.z, width, height, boostFactor);
  const gPt = project(item.x, 0.02, item.z, width, height, boostFactor);
  const s = pt.scale;
  const fade = Math.min(1, (MAX_Z - item.z) / 16);

  ctx.globalAlpha = fade;

  // Ground reflection ring
  ctx.fillStyle =
    item.kind === 'coin'
      ? 'rgba(250, 204, 21, 0.28)'
      : item.kind === 'diamond'
      ? 'rgba(255, 46, 147, 0.35)'
      : 'rgba(0, 229, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(gPt.sx, gPt.sy, s * 0.34, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  if (item.kind === 'coin') {
    const spin = Math.abs(Math.cos(time * 4 + item.bobPhase));
    const rx = Math.max(2.5, s * 0.34 * (0.35 + 0.65 * spin));
    const ry = Math.max(4, s * 0.34);

    ctx.fillStyle = '#FACC15';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(pt.sx, pt.sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.stroke();
  } else if (item.kind === 'diamond') {
    const r = Math.max(5, s * 0.45);
    ctx.fillStyle = '#FF2E93';
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(pt.sx, pt.sy - r);
    ctx.lineTo(pt.sx + r * 0.78, pt.sy);
    ctx.lineTo(pt.sx, pt.sy + r);
    ctx.lineTo(pt.sx - r * 0.78, pt.sy);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFC2E2';
    ctx.beginPath();
    ctx.moveTo(pt.sx, pt.sy - r * 0.55);
    ctx.lineTo(pt.sx + r * 0.38, pt.sy);
    ctx.lineTo(pt.sx, pt.sy + r * 0.55);
    ctx.lineTo(pt.sx - r * 0.38, pt.sy);
    ctx.closePath();
    ctx.fill();
  } else {
    // Power-up orb (Magnet / Shield / Boost)
    const color =
      item.kind === 'magnet' ? '#A855F7' : item.kind === 'shield' ? '#38BDF8' : '#00E5FF';
    const label = item.kind === 'magnet' ? 'M' : item.kind === 'shield' ? 'S' : '⚡';
    const r = Math.max(6, s * 0.48);

    ctx.fillStyle = `${color}33`;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(pt.sx, pt.sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.max(10, Math.round(r * 1.05))}px "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pt.sx, pt.sy + 1);
  }

  ctx.globalAlpha = 1;
}

function drawRunner(
  ctx: CanvasRenderingContext2D,
  engine: NeonRushEngine,
  width: number,
  height: number,
  boostFactor: number
): void {
  // Blink if invulnerable
  if (engine.invulnTimer > 0 && Math.floor(engine.invulnTimer * 16) % 2 === 0) {
    return;
  }
  if (engine.isCrashed && engine.crashTimer > 0.2) {
    return;
  }

  const skin = engine.skin;
  const shadowPt = project(engine.playerX, 0.02, PLAYER_Z, width, height, boostFactor);
  const footPt = project(engine.playerX, engine.playerY, PLAYER_Z, width, height, boostFactor);
  const s = footPt.scale;

  // Dynamic ground shadow shrinks when jumping higher
  const shadowScale = Math.max(0.35, 1 - engine.playerY * 0.18);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
  ctx.beginPath();
  ctx.ellipse(shadowPt.sx, shadowPt.sy, s * 0.65 * shadowScale, s * 0.22 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Magnet aura ring
  if (engine.magnetTimer > 0) {
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.45 + 0.3 * Math.sin(engine.worldTime * 8)})`;
    ctx.lineWidth = Math.max(2, s * 0.06);
    ctx.beginPath();
    ctx.ellipse(footPt.sx, footPt.sy - s * 0.85, s * 1.15, s * 1.15, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Shield dome
  if (engine.hasShield) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(footPt.sx, footPt.sy - s * 0.9, s * 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.save();
  ctx.translate(footPt.sx, footPt.sy);
  ctx.rotate(engine.laneTilt);

  const isSliding = engine.slideTimer > 0;
  const isAirborne = engine.playerY > 0.15;

  if (isSliding) {
    // Low aerodynamic cyber-slide pose
    ctx.rotate(-0.48);
    // Legs forward
    ctx.fillStyle = skin.suitDark;
    ctx.strokeStyle = skin.primaryColor;
    ctx.lineWidth = Math.max(1.5, s * 0.055);
    ctx.beginPath();
    ctx.roundRect(-s * 0.25, -s * 0.55, s * 0.52, s * 0.48, s * 0.14);
    ctx.fill();
    ctx.stroke();

    // Head/helmet
    ctx.fillStyle = skin.suitDark;
    ctx.beginPath();
    ctx.arc(0, -s * 0.78, s * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Visor
    ctx.fillStyle = skin.visorColor;
    ctx.fillRect(-s * 0.16, -s * 0.83, s * 0.32, s * 0.1);
  } else {
    const legSwing = isAirborne ? 0.55 : Math.sin(engine.runAnimPhase);
    const armSwing = -legSwing;

    // Neon jetpack / scarf trail ribbon
    ctx.fillStyle = `${skin.trailColor}AA`;
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, -s * 1.25);
    ctx.lineTo(-s * 0.55 - Math.sin(engine.worldTime * 16) * s * 0.1, -s * 0.75);
    ctx.lineTo(-s * 0.1, -s * 0.9);
    ctx.closePath();
    ctx.fill();

    // Left & Right Legs
    const drawLeg = (xOff: number, swing: number, back: boolean) => {
      ctx.save();
      ctx.translate(xOff * s, -s * 0.72);
      ctx.rotate(swing * 0.55);
      ctx.fillStyle = back ? '#0A0E1F' : skin.suitDark;
      ctx.strokeStyle = back ? skin.secondaryColor : skin.primaryColor;
      ctx.lineWidth = Math.max(1.5, s * 0.05);
      ctx.beginPath();
      ctx.roundRect(-s * 0.11, 0, s * 0.22, s * 0.68, s * 0.08);
      ctx.fill();
      ctx.stroke();
      // Glowing cyber boot
      ctx.fillStyle = skin.primaryColor;
      ctx.fillRect(-s * 0.12, s * 0.56, s * 0.24, s * 0.13);
      ctx.restore();
    };

    drawLeg(-0.16, legSwing, true);
    drawLeg(0.16, -legSwing, false);

    // Torso exo-armor
    ctx.fillStyle = skin.suitDark;
    ctx.strokeStyle = skin.primaryColor;
    ctx.lineWidth = Math.max(1.8, s * 0.06);
    ctx.beginPath();
    ctx.roundRect(-s * 0.28, -s * 1.38, s * 0.56, s * 0.7, s * 0.14);
    ctx.fill();
    ctx.stroke();

    // Glowing spine/core reactor
    ctx.fillStyle = skin.secondaryColor;
    ctx.shadowColor = skin.primaryColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(-s * 0.1, -s * 1.25, s * 0.2, s * 0.4, s * 0.06);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Arms
    const drawArm = (xOff: number, swing: number) => {
      ctx.save();
      ctx.translate(xOff * s, -s * 1.28);
      ctx.rotate(swing * 0.45);
      ctx.fillStyle = skin.suitDark;
      ctx.strokeStyle = skin.secondaryColor;
      ctx.lineWidth = Math.max(1.5, s * 0.045);
      ctx.beginPath();
      ctx.roundRect(-s * 0.09, 0, s * 0.18, s * 0.52, s * 0.08);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    drawArm(-0.34, armSwing);
    drawArm(0.34, -armSwing);

    // Cyber Helmet & Visor
    ctx.fillStyle = skin.suitDark;
    ctx.strokeStyle = skin.primaryColor;
    ctx.lineWidth = Math.max(1.8, s * 0.06);
    ctx.beginPath();
    ctx.arc(0, -s * 1.66, s * 0.27, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = skin.visorColor;
    ctx.shadowColor = skin.visorColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(-s * 0.18, -s * 1.72, s * 0.36, s * 0.11, s * 0.04);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  alpha: number
): void {
  const cx = width * 0.5;
  const cy = height * 0.38;
  ctx.save();
  ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
  ctx.lineWidth = 2;

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + Math.floor(time * 18) * 0.15;
    const innerR = Math.min(width, height) * (0.28 + ((i * 19 + time * 12) % 10) * 0.02);
    const outerR = Math.max(width, height) * 0.78;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }
  ctx.restore();
}
