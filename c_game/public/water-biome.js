// ─── water-biome.js ──────────────────────────────────────────
// Handles all water biome physics, visuals, enemies, and depth
// ─────────────────────────────────────────────────────────────

// ─── Water State ─────────────────────────────────────────────
let waterActive    = false;
let waterDepth     = 0;       // how deep kyle is (positive = deeper)
let waterSurface   = 0;       // y position of water surface
let waterFloor     = 0;       // y position of sea floor
let waterVY        = 0;       // kyle's vertical velocity in water
let bridgeBroken   = false;
let bridgeX        = 0;
let bridgeAnim     = 0;       // bridge break animation timer
let splashParticles = [];
let waterEntered   = false;
// ─── Fall State ───────────────────────────────────────────────
let fallActive    = false;
let fallY         = 0;      // how far kyle has fallen
let fallSpeed     = 0;      // current fall speed
let fallGlow      = 0;      // radioactive glow intensity from below
let cliffOffset   = 0;      // scrolling cliff walls

// ─── Water Physics Constants ──────────────────────────────────
const WATER_FLOAT_FORCE  = -0.35;  // upward force when tapping
const WATER_SINK_FORCE   =  0.18;  // downward force when releasing
const WATER_DRAG         =  0.92;  // slows velocity (water resistance)
const WATER_MAX_VY       =  4;     // max vertical speed in water
const WATER_ROTATION_MAX =  0.02;  // gentle rotation speed

// ─── Bubbles ─────────────────────────────────────────────────
const bubbles = [];
let bubbleTimer = 0;

function spawnBubble(canvasW, surfaceY, floorY) {
  bubbles.push({
    x:     Math.random() * canvasW,
    y:     floorY - Math.random() * (floorY - surfaceY) * 0.5,
    r:     1.5 + Math.random() * 4,
    vy:    -(0.4 + Math.random() * 0.8),
    alpha: 0.3 + Math.random() * 0.4,
    wobble: Math.random() * Math.PI * 2,
  });
}

// ─── Black Water Patches ──────────────────────────────────────
const blackPatches = [];
let patchTimer = 0;

function spawnBlackPatch(canvasW, surfaceY, floorY) {
  const w = 40 + Math.random() * 100;
  const h = 30 + Math.random() * 60;
  const y = surfaceY + Math.random() * (floorY - surfaceY - h);
  blackPatches.push({
    x:     canvasW + w,
    y,
    w, h,
    speed: 2 + Math.random() * 2,
    alpha: 0.85 + Math.random() * 0.15,
  });
}

// ─── Enemies ─────────────────────────────────────────────────
const waterEnemies = [];
let enemyTimer = 0;

function spawnEnemy(canvasW, surfaceY, floorY) {
  const types = ['shark', 'piranha', 'scrap'];
  const type  = types[Math.floor(Math.random() * types.length)];
  const mid   = surfaceY + (floorY - surfaceY) * 0.5;

  let enemy = {
    type,
    x: canvasW + 60,
    speed: 2 + Math.random() * 3,
    wobble: 0,
    wobbleSpeed: 0.02 + Math.random() * 0.03,
    wobbleAmp: 10 + Math.random() * 20,
  };

  if (type === 'shark') {
    enemy.y = surfaceY + (floorY - surfaceY) * (0.2 + Math.random() * 0.5);
    enemy.w = 80; enemy.h = 35;
    enemy.speed = 2.5 + Math.random() * 1.5;
  } else if (type === 'piranha') {
    enemy.y = surfaceY + (floorY - surfaceY) * Math.random() * 0.8;
    enemy.w = 28; enemy.h = 18;
    enemy.speed = 4 + Math.random() * 3;
    enemy.count = 2 + Math.floor(Math.random() * 4);
    enemy.spread = 30;
  } else {
    enemy.y = floorY - 30 - Math.random() * 40;
    enemy.w = 45; enemy.h = 30;
    enemy.speed = 1.5 + Math.random() * 1.5;
  }

  waterEnemies.push(enemy);
}

// ─── Light Rays ──────────────────────────────────────────────
const lightRays = [];
function initLightRays(canvasW, surfaceY) {
  lightRays.length = 0;
  for (let i = 0; i < 6; i++) {
    lightRays.push({
      x:     canvasW * (0.1 + Math.random() * 0.8),
      width: 15 + Math.random() * 30,
      alpha: 0.03 + Math.random() * 0.05,
      speed: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    });
  }
}

// ─── Sunken Ships ────────────────────────────────────────────
const sunkenShips = [];
let shipOffset = 0;

function initSunkenShips(canvasW, floorY) {
  sunkenShips.length = 0;
  const count = 4;
  for (let i = 0; i < count; i++) {
    sunkenShips.push({
      x:     canvasW * (i / count) + Math.random() * 100,
      tilt:  (Math.random() - 0.5) * 0.4,
      w:     80 + Math.random() * 60,
      h:     25 + Math.random() * 20,
      mast:  Math.random() > 0.5,
    });
  }
}

// ─── Splash Particles ────────────────────────────────────────
function createSplash(x, surfaceY) {
  for (let i = 0; i < 20; i++) {
    splashParticles.push({
      x,
      y:     surfaceY,
      vx:    (Math.random() - 0.5) * 6,
      vy:    -(Math.random() * 5 + 2),
      r:     2 + Math.random() * 4,
      life:  1,
      color: '#c8a000',
    });
  }
}

// ─── Init Water Biome ─────────────────────────────────────────
function initWaterBiome(canvasW, canvasH) {
  waterActive   = true;
  waterEntered  = false;
  waterSurface  = canvasH * 0.15;
  waterFloor    = canvasH * 0.88;
  waterDepth    = 0;
  waterVY       = 0;
  bridgeBroken  = false;
  bridgeX       = canvasW * 0.6;
  bridgeAnim    = 0;

  fallActive  = false;
fallY       = 0;
fallSpeed   = 0;
fallGlow    = 0;
cliffOffset = 0;

  bubbles.length      = 0;
  blackPatches.length = 0;
  waterEnemies.length = 0;
  splashParticles.length = 0;

  initLightRays(canvasW, waterSurface);
  initSunkenShips(canvasW, waterFloor);
}

// ─── Reset Water Biome ────────────────────────────────────────
function resetWaterBiome() {
  waterActive   = false;
  waterEntered  = false;
  waterDepth    = 0;
  waterVY       = 0;
  bridgeBroken  = false;
  bubbles.length      = 0;
  blackPatches.length = 0;
  waterEnemies.length = 0;
  splashParticles.length = 0;
  lightRays.length    = 0;
  sunkenShips.length  = 0;
}

// ─── Fall Sequence ────────────────────────────────────────────
function startFall(ball, canvasH) {
  fallActive    = true;
  fallSpeed     = 1;
  fallY         = 0;
  waterSurface  = canvasH * 0.15;
  waterFloor    = canvasH * 0.88;
  ball.onGround = false;
  ball.vy       = 0;
}

function updateFall(ball) {
  if (!fallActive) return false;

  // Accelerate fall
  fallSpeed  += 0.15;
  ball.y     += fallSpeed;
  ball.angle += 0.04;
  cliffOffset += fallSpeed * 0.5;

  // Glow gets brighter as we fall deeper
  fallGlow = Math.min(fallY / 200, 1);
  fallY   += fallSpeed;

  // Once kyle reaches water surface — end fall
  if (ball.y >= waterSurface) {
    ball.y     = waterSurface - ball.r;
    fallActive = false;
    waterEntered = true;
    createSplash(ball.x, waterSurface);
    return true; // signals fall is done
  }
  return false;
}

function drawFall(ctx, canvasW, canvasH, ball) {
  if (!fallActive) return;

  // Dark sky above
  ctx.fillStyle = '#030303';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Cliff walls scrolling upward
  for (let i = 0; i < 12; i++) {
    const wy = ((i * 80 - cliffOffset) % (canvasH + 60) + canvasH + 60) % (canvasH + 60) - 30;

    // Left cliff detail
    ctx.fillStyle = '#0a0800';
    ctx.fillRect(0, wy, 40 + Math.sin(i * 1.3) * 15, 50 + (i % 3) * 10);

    // Right cliff detail
    ctx.fillStyle = '#0a0800';
    const rw = 35 + Math.cos(i * 1.1) * 12;
    ctx.fillRect(canvasW - rw, wy + 20, rw, 45 + (i % 4) * 8);
  }

  // Radioactive glow from below
  const glowAlpha = Math.min(fallGlow * 0.6, 0.5);
  const glowGrad  = ctx.createLinearGradient(0, canvasH * 0.6, 0, canvasH);
  glowGrad.addColorStop(0, 'transparent');
  glowGrad.addColorStop(1, `rgba(200, 160, 0, ${glowAlpha})`);
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, canvasH * 0.6, canvasW, canvasH * 0.4);

  // Falling particles (air rushing past)
  ctx.fillStyle = 'rgba(200,160,0,0.15)';
  for (let i = 0; i < 8; i++) {
    const px = (i * 120 + cliffOffset * 0.3) % canvasW;
    const py = ((i * 80 + cliffOffset * 2) % canvasH);
    ctx.fillRect(px, py, 1, 8 + (i % 3) * 4);
  }

  // Water surface glimpse at bottom
  if (fallGlow > 0.5) {
    ctx.save();
    ctx.globalAlpha = (fallGlow - 0.5) * 2;
    ctx.fillStyle   = '#2a1f00';
    ctx.fillRect(0, canvasH - 40, canvasW, 40);
    ctx.strokeStyle = '#c8a000';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvasH - 40);
    ctx.lineTo(canvasW, canvasH - 40);
    ctx.stroke();
    ctx.restore();
  }
}

// ─── Update Water Physics ─────────────────────────────────────
function updateWaterPhysics(ball, tapping, frame) {
  if (!waterActive || !waterEntered) return;

  // Always sink unless tapped
  waterVY += WATER_SINK_FORCE;

  // Water drag
  waterVY *= WATER_DRAG;

  // Clamp velocity
  waterVY = Math.max(-WATER_MAX_VY, Math.min(WATER_MAX_VY, waterVY));

  // Move ball
  ball.y += waterVY;

  // Gentle random rotation
ball.angle += 0.008 + Math.sin(frameCount * 0.02) * 0.006;
  // Clamp to water bounds
if (ball.y - ball.r < waterSurface) {
    ball.y  = waterSurface + ball.r + 2;
    waterVY = Math.abs(waterVY) * 0.5;
  }
  if (ball.y + ball.r > waterFloor) {
    ball.y  = waterFloor - ball.r;
    waterVY = -1;
  }

  // Update depth
  waterDepth = Math.floor(
    ((ball.y - waterSurface) / (waterFloor - waterSurface)) * 100
  );
}

// ─── Update Water World ───────────────────────────────────────
function updateWaterWorld(canvasW, canvasH, gameSpeed, frameCount) {
  if (!waterActive) return;

  shipOffset += gameSpeed * 0.3;

  // Bubbles
  bubbleTimer++;
  if (bubbleTimer > 12) {
    spawnBubble(canvasW, waterSurface, waterFloor);
    bubbleTimer = 0;
  }
  bubbles.forEach(b => {
    b.y      += b.vy;
    b.wobble += 0.05;
    b.x      += Math.sin(b.wobble) * 0.5;
    b.life    = b.y > waterSurface ? 1 : 0;
  });
  bubbles.splice(0, bubbles.filter(b => b.y < waterSurface || b.life <= 0).length);

  // Black patches
  patchTimer++;
  if (patchTimer > 180) {
    spawnBlackPatch(canvasW, waterSurface, waterFloor);
    patchTimer = 0;
  }
  blackPatches.forEach(p => { p.x -= p.speed; });
  blackPatches.splice(0, blackPatches.filter(p => p.x + p.w < 0).length);

  // Enemies
  enemyTimer++;
  if (enemyTimer > 220) {
    spawnEnemy(canvasW, waterSurface, waterFloor);
    enemyTimer = 0;
  }
  waterEnemies.forEach(e => {
    e.x      -= e.speed;
    e.wobble += e.wobbleSpeed;
    e.y      += Math.sin(e.wobble) * 0.4;
  });
  waterEnemies.splice(0, waterEnemies.filter(e => e.x + e.w < -10).length);

  // Splash particles
  splashParticles.forEach(p => {
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.2;
    p.life -= 0.04;
  });
  splashParticles.splice(0, splashParticles.filter(p => p.life <= 0).length);

  // Move sunken ships
  sunkenShips.forEach(s => {
    s.x -= gameSpeed * 0.3;
    if (s.x + s.w < -100) s.x = canvasW + s.w;
  });
}

// ─── Draw Water Background ────────────────────────────────────
function drawWaterBiome(ctx, canvasW, canvasH, frameCount) {
  if (!waterActive) return;

  // Sky above water
  ctx.fillStyle = '#050a05';
  ctx.fillRect(0, 0, canvasW, waterSurface);

  // Water body gradient
  const waterGrad = ctx.createLinearGradient(0, waterSurface, 0, waterFloor);
waterGrad.addColorStop(0,   '#2a1f00');
waterGrad.addColorStop(0.2, '#1f1500');
waterGrad.addColorStop(0.5, '#180f00');
waterGrad.addColorStop(0.8, '#100a00');
waterGrad.addColorStop(1,   '#080500');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, waterSurface, canvasW, waterFloor - waterSurface);

  // Below floor
  ctx.fillStyle = '#020602';
  ctx.fillRect(0, waterFloor, canvasW, canvasH - waterFloor);

  // Water surface line glow
  ctx.save();
ctx.shadowColor = '#c8a000';
ctx.shadowBlur  = 14;
ctx.strokeStyle = '#8a6a00';
  ctx.lineWidth   = 2;
  ctx.beginPath();

  for (let x = 0; x < canvasW; x += 4) {
    const y = waterSurface + Math.sin((x + frameCount * 1.5) * 0.03) * 4;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // Light rays from surface
  lightRays.forEach(r => {
    const pulse = Math.sin(frameCount * 0.02 + r.offset) * 0.5 + 0.5;
    ctx.save();
    ctx.globalAlpha = r.alpha * pulse;
    const rayGrad = ctx.createLinearGradient(r.x, waterSurface, r.x, waterFloor * 0.7);
    rayGrad.addColorStop(0, '#c8a000');
    rayGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(r.x - r.width / 2, waterSurface);
    ctx.lineTo(r.x + r.width / 2, waterSurface);
    ctx.lineTo(r.x + r.width,     waterFloor * 0.7);
    ctx.lineTo(r.x - r.width,     waterFloor * 0.7);
    ctx.fill();
    ctx.restore();
  });
// Toxic particles floating in water
  for (let i = 0; i < 8; i++) {
    const px = ((i * 130 - shipOffset * 0.3) % (canvasW + 60) + canvasW + 60) % (canvasW + 60) - 30;
    const py = waterSurface + (i * 67) % (waterFloor - waterSurface);
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#c8a000';
    ctx.beginPath();
    ctx.arc(px, py, 8 + (i % 3) * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Water stains
  for (let i = 0; i < 5; i++) {
    const stx = ((i * 180 - shipOffset * 0.4) % (canvasW + 100) + canvasW + 100) % (canvasW + 100) - 50;
    const sty = waterSurface + (i * 80) % (waterFloor - waterSurface - 40);
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#8a6a00';
    ctx.beginPath();
    ctx.ellipse(stx, sty, 40, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Bubbles
  bubbles.forEach(b => {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.strokeStyle = '#c8a000';
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

// Sea floor — scrolling
  ctx.fillStyle = '#0a0800';
  ctx.fillRect(0, waterFloor, canvasW, canvasH - waterFloor);

  // Scrolling floor debris
  ctx.fillStyle = '#151000';
  for (let i = 0; i < 10; i++) {
    const dx = ((i * 110 - shipOffset) % (canvasW + 80) + canvasW + 80) % (canvasW + 80) - 40;
    const dw = 20 + (i % 4) * 15;
    const dh = 6 + (i % 3) * 4;
    ctx.fillRect(dx, waterFloor + 4, dw, dh);
  }

  // Floor line
  ctx.strokeStyle = '#2a1f00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, waterFloor);
  ctx.lineTo(canvasW, waterFloor);
  ctx.stroke();

  // Toxic stains on floor
  for (let i = 0; i < 6; i++) {
    const sx = ((i * 160 - shipOffset * 0.5) % (canvasW + 100) + canvasW + 100) % (canvasW + 100) - 50;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#c8a000';
    ctx.beginPath();
    ctx.ellipse(sx, waterFloor + 8, 30 + i * 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sunken ships
  sunkenShips.forEach(s => {
    ctx.save();
    ctx.translate(s.x + s.w / 2, waterFloor - s.h / 2);
    ctx.rotate(s.tilt);
    ctx.fillStyle   = '#0a120a';
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth   = 1;
    ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
    ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
    // Mast
    if (s.mast) {
      ctx.strokeStyle = '#0f1f0f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -s.h / 2);
      ctx.lineTo(0, -s.h / 2 - 40);
      ctx.stroke();
    }
    ctx.restore();
  });

  // Black water patches
  blackPatches.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = '#000000';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a0000';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  });

  // Enemies
  waterEnemies.forEach(e => {
    ctx.save();
    if (e.type === 'shark') {
      // Shark body
      ctx.fillStyle = '#1a2a1a';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fin
      ctx.beginPath();
      ctx.moveTo(e.x - 10, e.y - e.h / 2);
      ctx.lineTo(e.x,      e.y - e.h / 2 - 20);
      ctx.lineTo(e.x + 10, e.y - e.h / 2);
      ctx.fillStyle = '#253525';
      ctx.fill();
      // Eye
      ctx.beginPath();
      ctx.arc(e.x - e.w / 3, e.y - 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
      // Label
      ctx.fillStyle = '#ff4444';
      ctx.font      = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SHARK', e.x, e.y - e.h / 2 - 25);

    } else if (e.type === 'piranha') {
      for (let i = 0; i < (e.count || 3); i++) {
        const px = e.x + i * e.spread;
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.ellipse(px, e.y + Math.sin(i * 1.2) * 10, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - e.w / 3, e.y + Math.sin(i * 1.2) * 10 - 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
      }
      ctx.fillStyle = '#ff6600';
      ctx.font      = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PIRANHA', e.x, e.y - e.h / 2 - 8);

    } else {
      // Scrap metal
      ctx.fillStyle   = '#1a1a0a';
      ctx.strokeStyle = '#2a2a0a';
      ctx.lineWidth   = 1;
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      ctx.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      ctx.fillStyle = '#888855';
      ctx.font      = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SCRAP', e.x, e.y - e.h / 2 - 6);
    }
    ctx.restore();
  });

  // Splash particles
  splashParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ─── Draw Depth Meter ─────────────────────────────────────────
function drawDepthMeter(ctx, canvasW, canvasH) {
  if (!waterActive || !waterEntered) return;

  const depthLabel = waterDepth < 30  ? 'SURFACE'
                   : waterDepth < 60  ? 'MID DEPTH'
                   : waterDepth < 85  ? 'DEEP'
                   : 'DANGER ZONE';

  const depthColor = waterDepth < 30  ? '#7fff44'
                   : waterDepth < 60  ? '#aaff00'
                   : waterDepth < 85  ? '#ffaa00'
                   : '#ff4444';

  document.getElementById('meterVal').textContent =
    document.getElementById('meterVal').textContent.split('|')[0].trim() +
    ' | 🌊 -' + waterDepth + 'm';
}

// ─── Check Water Collisions ───────────────────────────────────
function checkWaterCollisions(ball) {
  if (!waterActive || !waterEntered) return false;

  const bx = ball.x;
  const by = ball.y;
  const br = ball.r;

  // Black patch collision
  for (const p of blackPatches) {
    const dx = bx - (p.x + p.w / 2);
    const dy = by - (p.y + p.h / 2);
    if (
      Math.abs(dx) < p.w / 2 + br &&
      Math.abs(dy) < p.h / 2 + br
    ) return true;
  }

  // Enemy collision
  for (const e of waterEnemies) {
    const ex = e.x;
    const ey = e.y;
    const ew = e.w / 2 + br;
    const eh = e.h / 2 + br;
    if (Math.abs(bx - ex) < ew && Math.abs(by - ey) < eh) return true;
  }

  // Hit floor
  if (by + br >= waterFloor) return true;

  // Hit ceiling (surface)

  return false;
}