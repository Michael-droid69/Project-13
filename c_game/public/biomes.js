// ─── biomes.js ───────────────────────────────────────────────
// Handles all biome backgrounds, transitions, and location popups
// ─────────────────────────────────────────────────────────────
function updateBiomeFrame() {}

function triggerBiomePopup(biomeId) {
  popupBiome      = BIOMES[biomeId];
  biomePopupState = 'fadein';
  biomePopupAlpha = 0;
  biomePopupTimer = 0;
}

function forceSetBiome(biomeId) {
  currentBiome  = biomeId;
  biomeProgress = 1;
}

const BIOMES = {
  city: {
    id:       'city',
    name:     'Dead City',
    subtitle: 'Nothing survives here...',
    color:    '#ff6600',
    startAt:  0,
  },
  forest: {
    id:       'forest',
    name:     'Dark Forest',
    subtitle: 'You\'ve entered the darkness...',
    color:    '#00ff88',
    startAt:  100,
  },
water: {
    id:       'water',
    name:     'Death Ocean',
    subtitle: 'The water remembers everyone it takes...',
    color:    '#f0c040',
    startAt:  100,
  },
};

// ─── State ───────────────────────────────────────────────────
let currentBiome     = 'city';
let biomeProgress    = 0; // 0 to 1 transition blend
let lastBiome        = 'city';
let biomePopupAlpha  = 0;
let biomePopupState  = 'hidden'; // hidden | fadein | visible | fadeout
let biomePopupTimer  = 0;
let popupBiome       = null;

// ─── Foreground Trees ────────────────────────────────────────
const foregroundTrees = [];
let fgTreeTimer = 0;

function spawnForegroundTree(canvasW, canvasH) {
  const w         = 25 + Math.random() * 60;
  const h         = canvasH * (0.5 + Math.random() * 0.45);
  const speed     = 5 + Math.random() * 7;
  const hasBranch = Math.random() > 0.3;

  foregroundTrees.push({
    x: canvasW + w,
    y: 0,
    w, h,
    speed,
    alpha: 1,
    hasBranch,
    branchSide:  Math.random() > 0.5 ? 1 : -1,
    branchY:     h * (0.2 + Math.random() * 0.35),
    branchLen:   40 + Math.random() * 70,
    branchAngle: 0.2 + Math.random() * 0.5,
  });
}

// ─── Background Trees (distant) ──────────────────────────────
const bgTrees = [];
function initBgTrees(canvasW, canvasH) {
  bgTrees.length = 0;
  for (let i = 0; i < 12; i++) {
    bgTrees.push({
      x:     Math.random() * canvasW,
      y:     canvasH * 0.25,
      h:     canvasH * (0.3 + Math.random() * 0.25),
      w:     8 + Math.random() * 14,
      speed: 0.8 + Math.random() * 0.6,
    });
  }
}

// ─── Smoke Particles (city) ──────────────────────────────────
const smokeParticles = [];
let smokeTimer = 0;

function spawnSmoke(canvasW, canvasH) {
  smokeParticles.push({
    x:     canvasW * (0.5 + Math.random() * 0.5),
    y:     canvasH * (0.2 + Math.random() * 0.3),
    r:     8 + Math.random() * 20,
    vx:    -0.3 - Math.random() * 0.4,
    vy:    -0.2 - Math.random() * 0.3,
    alpha: 0.08 + Math.random() * 0.12,
    life:  1,
  });
}

// ─── Fireflies (forest) ──────────────────────────────────────
const fireflies = [];
function initFireflies(canvasW, canvasH) {
  fireflies.length = 0;
  for (let i = 0; i < 18; i++) {
    fireflies.push({
      x:     Math.random() * canvasW,
      y:     canvasH * (0.1 + Math.random() * 0.6),
      vx:    (Math.random() - 0.5) * 0.6,
      vy:    (Math.random() - 0.5) * 0.4,
      pulse: Math.random() * Math.PI * 2,
      size:  1.5 + Math.random() * 2,
    });
  }
}

// ─── Main Update ─────────────────────────────────────────────
function updateBiomes(distance, gameSpeed, canvasW, canvasH) {
  // Check biome transition
const newBiome = distance >= BIOMES.water.startAt  ? 'water'
               : distance >= BIOMES.forest.startAt ? 'forest'
               : 'city';
                 if (newBiome !== currentBiome) {
    lastBiome    = currentBiome;
    currentBiome = newBiome;
    biomeProgress = 0;

    // Trigger popup
    popupBiome      = BIOMES[currentBiome];
    biomePopupState = 'fadein';
    biomePopupAlpha = 0;
    biomePopupTimer = 0;

    // Init forest elements
    if (currentBiome === 'forest') {
      initBgTrees(canvasW, canvasH);
      initFireflies(canvasW, canvasH);
 } else if (currentBiome === 'water') {
  initWaterBiome(canvasW, canvasH);
  window.dispatchEvent(new CustomEvent('stopObstacles', { detail: { duration: 180 } }));
}
  }

  // Smooth transition blend
  if (biomeProgress < 1) biomeProgress += 0.008;

  // Popup animation
  if (biomePopupState === 'fadein') {
    biomePopupAlpha += 0.03;
    if (biomePopupAlpha >= 1) {
      biomePopupAlpha = 1;
      biomePopupState = 'visible';
      biomePopupTimer = 0;
    }
  } else if (biomePopupState === 'visible') {
    biomePopupTimer++;
    if (biomePopupTimer > 120) biomePopupState = 'fadeout';
  } else if (biomePopupState === 'fadeout') {
    biomePopupAlpha -= 0.025;
    if (biomePopupAlpha <= 0) {
      biomePopupAlpha = 0;
      biomePopupState = 'hidden';
    }
  }

  // Move bg trees
  bgTrees.forEach(t => {
    t.x -= t.speed * (gameSpeed * 0.18);
    if (t.x + t.w < 0) t.x = canvasW + t.w;
  });

  // Move foreground trees
  foregroundTrees.forEach(t => { t.x -= t.speed; });
  foregroundTrees.splice(0, foregroundTrees.filter(t => t.x + t.w < -60).length);

  // Spawn foreground trees in forest
  if (currentBiome === 'forest') {
    fgTreeTimer++;
    const interval = Math.floor(80 + Math.random() * 120);
    if (fgTreeTimer > interval) {
      spawnForegroundTree(canvasW, canvasH);
      fgTreeTimer = 0;
    }
  }

  // Move fireflies
  fireflies.forEach(f => {
    f.x     += f.vx;
    f.y     += f.vy;
    f.pulse += 0.05;
    if (f.x < 0 || f.x > canvasW) f.vx *= -1;
    if (f.y < 0 || f.y > canvasH * 0.7) f.vy *= -1;
  });

  // Smoke in city
  if (currentBiome === 'city') {
    smokeTimer++;
    if (smokeTimer > 8) {
      spawnSmoke(canvasW, canvasH);
      smokeTimer = 0;
    }
  }
  smokeParticles.forEach(s => {
    s.x    += s.vx;
    s.y    += s.vy;
    s.life -= 0.004;
    s.r    += 0.3;
  });
  smokeParticles.splice(0, smokeParticles.filter(s => s.life <= 0).length);
}

// ─── Draw Sky ────────────────────────────────────────────────
function drawSky(ctx, canvasW, canvasH) {
  let topColor, bottomColor;

  if (currentBiome === 'city') {
    topColor    = '#080808';
    bottomColor = '#1a0800';
  } else if (currentBiome === 'forest') {
    const t     = Math.min(biomeProgress, 1);
    const r     = Math.round(8   + (2  - 8)   * t);
    const g     = Math.round(8   + (12 - 8)   * t);
    const b     = Math.round(8   + (4  - 8)   * t);
    topColor    = `rgb(${r},${g},${b})`;
    bottomColor = '#020802';
  }

  const grad = ctx.createLinearGradient(0, 0, 0, canvasH * 0.75);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);
}

// ─── Draw City Biome ─────────────────────────────────────────
function drawCity(ctx, canvasW, canvasH, bgOffset, groundY, stopTimer = 180) {  // Distant orange glow on horizon
  ctx.save();
  ctx.globalAlpha = 0.12;
  const glow = ctx.createRadialGradient(
    canvasW * 0.7, groundY, 10,
    canvasW * 0.7, groundY, canvasH * 0.5
  );
  glow.addColorStop(0, '#ff4400');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();

  // Destroyed buildings
  ctx.fillStyle = '#0d0d0d';
  const bWidths  = [55, 70, 45, 80, 60, 50, 65, 40];
  const bHeights = [90, 120, 75, 100, 85, 65, 110, 70];
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 140 - bgOffset * 0.15) % (canvasW + 100) + canvasW + 100) % (canvasW + 100) - 80;
    ctx.fillRect(bx, groundY - bHeights[i], bWidths[i], bHeights[i]);
    // Broken tops
    ctx.fillStyle = '#111';
    ctx.fillRect(bx + 5,  groundY - bHeights[i] - 8, 12, 10);
    ctx.fillRect(bx + 28, groundY - bHeights[i] - 5, 8,  7);
    ctx.fillStyle = '#0d0d0d';
  }

  // Smoke
  smokeParticles.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.alpha * s.life;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();
    ctx.restore();
  });

  // Mid ruins
  ctx.fillStyle = '#101010';
  for (let i = 0; i < 5; i++) {
    const mx = ((i * 200 - bgOffset * 0.4) % (canvasW + 120) + canvasW + 120) % (canvasW + 120) - 60;
    ctx.fillRect(mx, groundY - 55, 35, 55);
    ctx.fillRect(mx + 40, groundY - 38, 20, 38);
  }
}
// ─── Pre-Water Transition Zone ───────────────────────────
if (window._stopTimer < 180) {
  const t = 1 - (obstacleStopTimer / 180); // 0 to 1 as timer counts down

  // Sky shifts to sickly green/yellow
  ctx.save();
  ctx.globalAlpha = t * 0.3;
  ctx.fillStyle = '#1a1500';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();

  // Smaller broken houses
  ctx.fillStyle = '#0a0a0a';
  for (let i = 0; i < 6; i++) {
    const hx = ((i * 120 - bgOffset * 0.8) % (canvasW + 80) + canvasW + 80) % (canvasW + 80) - 40;
    const hh = 20 + (i % 3) * 15;
    const hw = 25 + (i % 4) * 10;
    ctx.fillRect(hx, groundY - hh, hw, hh);
    // Broken top
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(hx, groundY - hh);
    ctx.lineTo(hx + hw * 0.4, groundY - hh - 8);
    ctx.lineTo(hx + hw * 0.7, groundY - hh - 3);
    ctx.lineTo(hx + hw, groundY - hh);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
  }

  // Dead thin trees
  ctx.strokeStyle = '#111111';
  for (let i = 0; i < 5; i++) {
    const tx = ((i * 150 - bgOffset * 1.0) % (canvasW + 60) + canvasW + 60) % (canvasW + 60) - 30;
    const th = 35 + (i % 3) * 15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, groundY);
    ctx.lineTo(tx, groundY - th);
    ctx.stroke();
    // Small branches
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, groundY - th * 0.6);
    ctx.lineTo(tx - 12, groundY - th * 0.8);
    ctx.moveTo(tx, groundY - th * 0.75);
    ctx.lineTo(tx + 10, groundY - th * 0.9);
    ctx.stroke();
  }

  // Bush clusters
  ctx.fillStyle = '#0d0d08';
  for (let i = 0; i < 7; i++) {
    const bx = ((i * 100 - bgOffset * 1.1) % (canvasW + 50) + canvasW + 50) % (canvasW + 50) - 25;
    ctx.beginPath();
    ctx.arc(bx, groundY - 6, 8 + (i % 3) * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 10, groundY - 4, 6 + (i % 2) * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Barbwire fence on ground
  ctx.strokeStyle = '#222211';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const fx = ((i * 80 - bgOffset * 1.3) % (canvasW + 40) + canvasW + 40) % (canvasW + 40) - 20;
    // Fence post
    ctx.beginPath();
    ctx.moveTo(fx, groundY);
    ctx.lineTo(fx, groundY - 18);
    ctx.stroke();
    // Wire
    ctx.beginPath();
    ctx.moveTo(fx - 40, groundY - 12);
    ctx.lineTo(fx + 40, groundY - 12);
    ctx.stroke();
    // Barbs
    for (let b = -30; b <= 30; b += 15) {
      ctx.beginPath();
      ctx.moveTo(fx + b, groundY - 12);
      ctx.lineTo(fx + b - 3, groundY - 16);
      ctx.moveTo(fx + b, groundY - 12);
      ctx.lineTo(fx + b + 3, groundY - 8);
      ctx.stroke();
    }
  }

  // Radioactive ground tint
  ctx.save();
  ctx.globalAlpha = t * 0.15;
  const groundGrad = ctx.createLinearGradient(0, groundY - 20, 0, groundY + 30);
  groundGrad.addColorStop(0, 'transparent');
  groundGrad.addColorStop(1, '#c8a000');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY - 20, canvasW, 50);
  ctx.restore();
}

// ─── Draw Forest Biome ───────────────────────────────────────
function drawForest(ctx, canvasW, canvasH, bgOffset, groundY) {
  const blend = Math.min(biomeProgress, 1);

  // Distant fog/mist
  ctx.save();
  ctx.globalAlpha = 0.06 * blend;
  ctx.fillStyle = '#003311';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();

  // Distant background trees
  bgTrees.forEach(t => {
    ctx.save();
    ctx.globalAlpha = 0.35 * blend;
    ctx.fillStyle = '#050f05';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.restore();
  });

  // Mid layer trees
  ctx.fillStyle = '#060e06';
  for (let i = 0; i < 8; i++) {
    const tx = ((i * 130 - bgOffset * 0.5) % (canvasW + 80) + canvasW + 80) % (canvasW + 80) - 40;
    const th = canvasH * (0.35 + (i % 3) * 0.08);
    const tw = 14 + (i % 4) * 6;
    ctx.save();
    ctx.globalAlpha = 0.7 * blend;
    ctx.fillRect(tx, groundY - th, tw, th);
    // Tree top triangle
    ctx.beginPath();
    ctx.moveTo(tx - tw, groundY - th);
    ctx.lineTo(tx + tw / 2, groundY - th - 40);
    ctx.lineTo(tx + tw * 2, groundY - th);
    ctx.fill();
    ctx.restore();
  }

  // Fireflies
  fireflies.forEach(f => {
    const glow = 4 + Math.sin(f.pulse) * 2;
    ctx.save();
    ctx.globalAlpha = (0.4 + Math.sin(f.pulse) * 0.4) * blend;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = glow * 3;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();
    ctx.restore();
  });

  // Ground grass tufts
  ctx.fillStyle = '#0a1a0a';
  for (let i = 0; i < 12; i++) {
    const gx = ((i * 80 - bgOffset * 1.2) % (canvasW + 40) + canvasW + 40) % (canvasW + 40) - 20;
    ctx.save();
    ctx.globalAlpha = 0.8 * blend;
    // Grass blades
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      ctx.moveTo(gx + b * 4, groundY);
      ctx.lineTo(gx + b * 4 - 2, groundY - 8 - b * 2);
      ctx.strokeStyle = '#1a3a1a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ─── Draw Foreground Trees (passing by) ──────────────────────
function drawForegroundTrees(ctx, canvasW, canvasH, groundY) {  if (currentBiome !== 'forest' && biomeProgress < 0.3) return;

  const blend = currentBiome === 'forest' ? Math.min(biomeProgress * 2, 1) : 0;

  foregroundTrees.forEach(t => {
    ctx.save();
    ctx.globalAlpha = blend;

    // Tree trunk — starts from top goes to ground
    ctx.fillStyle = '#010801';
    ctx.fillRect(t.x - t.w / 2, 0, t.w, canvasH);
    // Branch
    if (t.hasBranch) {
      ctx.strokeStyle = '#010801';
      ctx.lineWidth   = t.w * 0.5;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(t.x, t.branchY);
      ctx.lineTo(
        t.x + t.branchSide * t.branchLen,
        t.branchY - t.branchLen * t.branchAngle
      );
      ctx.stroke();

      // Sub branch
      ctx.lineWidth = t.w * 0.3;
      ctx.beginPath();
      ctx.moveTo(
        t.x + t.branchSide * t.branchLen * 0.6,
        t.branchY - t.branchLen * t.branchAngle * 0.6
      );
      ctx.lineTo(
        t.x + t.branchSide * (t.branchLen * 0.6 + 25),
        t.branchY - t.branchLen * t.branchAngle * 0.6 - 20
      );
      ctx.stroke();
    }

    // Leaves mass at top
    ctx.beginPath();
    ctx.arc(t.x, t.h * 0.06, t.w * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#010801';
    ctx.fill();

    ctx.restore();
  });
}

// ─── Draw Ground ─────────────────────────────────────────────
function drawGround(ctx, canvasW, canvasH, bgOffset, groundY) {
  if (currentBiome === 'city') {
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(0, groundY, canvasW, canvasH - groundY);
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY); ctx.lineTo(canvasW, groundY);
    ctx.stroke();
    // Cracks
    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const lx = ((i * 95 - bgOffset) % (canvasW + 40) + canvasW + 40) % (canvasW + 40) - 20;
      ctx.beginPath();
      ctx.moveTo(lx, groundY + 2);
      ctx.lineTo(lx + 18, groundY + 10);
      ctx.stroke();
    }
  } else {
    // Forest ground
    const blend = Math.min(biomeProgress, 1);
    const r = Math.round(14 * (1 - blend) + 5  * blend);
    const g = Math.round(14 * (1 - blend) + 18 * blend);
    const b = Math.round(14 * (1 - blend) + 5  * blend);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, groundY, canvasW, canvasH - groundY);

    ctx.strokeStyle = '#0a1a0a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY); ctx.lineTo(canvasW, groundY);
    ctx.stroke();
  }
}

// ─── Draw Biome Popup ────────────────────────────────────────
function drawBiomePopup(ctx, canvasW, canvasH) {
  if (biomePopupState === 'hidden' || !popupBiome) return;

  ctx.save();
  ctx.globalAlpha = biomePopupAlpha;

  const cx = canvasW / 2;
  const cy = canvasH * 0.28;

  // Background pill
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(cx - 160, cy - 36, 320, 72, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = popupBiome.color;
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Title
  ctx.fillStyle   = popupBiome.color;
ctx.font        = 'bold 22px Georgia, serif';  ctx.textAlign   = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText(popupBiome.name.toUpperCase(), cx, cy + 2);

// Subtitle
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.font      = '11px Georgia, serif';
  ctx.fillText(popupBiome.subtitle, cx, cy + 22);

  ctx.restore();
}

// ─── Main Draw ───────────────────────────────────────────────
function drawBiome(ctx, canvasW, canvasH, bgOffset, groundY, frame) {
  if (currentBiome === 'water') {
    drawWaterBiome(ctx, canvasW, canvasH, frame);
    drawBiomePopup(ctx, canvasW, canvasH);
    return;
  }
  drawSky(ctx, canvasW, canvasH);
  if (currentBiome === 'city') {
    drawCity(ctx, canvasW, canvasH, bgOffset, groundY, window._stopTimer || 180);
  } else if (currentBiome === 'forest') {
    drawForest(ctx, canvasW, canvasH, bgOffset, groundY);
  }
  drawGround(ctx, canvasW, canvasH, bgOffset, groundY);
  drawBiomePopup(ctx, canvasW, canvasH);
}
  drawSky(ctx, canvasW, canvasH);
  if (currentBiome === 'city') {
    drawCity(ctx, canvasW, canvasH, bgOffset, groundY);
  } else if (currentBiome === 'forest') {
    drawForest(ctx, canvasW, canvasH, bgOffset, groundY);
  }
  drawGround(ctx, canvasW, canvasH, bgOffset, groundY);
  drawBiomePopup(ctx, canvasW, canvasH);

// ─── Reset for new game ──────────────────────────────────────
function resetBiomes() {
  //const nextBiome = Math.random() > 0.5 ? 'forest' : 'water';
  //BIOMES.forest.startAt = nextBiome === 'forest' ? 30 : 99999;
  //BIOMES.water.startAt  = nextBiome === 'water'  ? 30 : 99999;
  const nextBiome = 'water';
BIOMES.forest.startAt = 99999;
BIOMES.water.startAt  = 30;
  currentBiome    = 'city';
  biomeProgress   = 0;
  lastBiome       = 'city';
  biomePopupState = 'hidden';
  biomePopupAlpha = 0;
  foregroundTrees.length = 0;
  smokeParticles.length  = 0;
  fireflies.length       = 0;
  fgTreeTimer   = 0;
  smokeTimer    = 0;
}