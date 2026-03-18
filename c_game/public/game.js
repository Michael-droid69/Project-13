// ─── Canvas Setup ───────────────────────────────────────────
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const wrapper = document.getElementById('gameWrapper');

function resize() {
  canvas.width  = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
}
resize();
window.addEventListener('resize', resize);

// ─── Constants ──────────────────────────────────────────────
const GROUND_Y  = () => canvas.height * 0.72;
const BALL_X    = () => canvas.width  * 0.18;
const GRAVITY   = 0.55;
const JUMP_FORCE = -13;

// ─── Obstacle Images ─────────────────────────────────────────
const rockImages = [];
for (let i = 1; i <= 5; i++) {
  const img = new Image();
  img.src = `assets/obstacles/rock${i}.png`;
  rockImages.push(img);
}

const BEHAVIORS = [
  { color: '#FF69B4', name: 'Pink',   meaning: 'Love',       score: 20 },
  { color: '#66BB6A', name: 'Green',  meaning: 'Peace',      score: 15 },
  { color: '#42A5F5', name: 'Blue',   meaning: 'Silence',    score: 12 },
  { color: '#EF5350', name: 'Red',    meaning: 'Anger',      score:  10 },
  { color: '#FFEE58', name: 'Yellow', meaning: 'Hope',       score: 14 },
  { color: '#AB47BC', name: 'Purple', meaning: 'Fear',       score:  9 },
  { color: '#FFA726', name: 'Orange', meaning: 'Joy',        score: 13 },
  { color: '#ECEFF1', name: 'White',  meaning: 'Innocence',  score: 11 },
  { color: '#111111', name: 'Black',  meaning: 'Death',      score:  0, deadly: true },
  { color: '#26C6DA', name: 'Teal',   meaning: 'Acceptance', score: 16 },
  { color: '#90A4AE', name: 'Gray',   meaning: 'Doubt',      score:  7 },
  { color: '#00E5FF', name: 'Cyan',   meaning: 'Curiosity',  score: 17 },
  { color: '#FFD700', name: 'Gold',   meaning: 'Wisdom',     score: 18 },
];

const OBSTACLES = ['rock', 'crack', 'spikes', 'hole', 'fire'];
const TRAPS     = ['birds', 'missile', 'fallen tree', 'barbwire'];

// ─── Character Image ─────────────────────────────────────────
// ─── URL Params ──────────────────────────────────────────────
const params  = new URLSearchParams(window.location.search);
let username  = params.get('username') || 'Player';
const charImg = params.get('charImg')  || 'assets/characters/kyle.png';

// ─── Character Image ─────────────────────────────────────────
const ballImage = new Image();

if (charImg === 'custom') {
  // Load from localStorage
  const customImg = localStorage.getItem('customCharImg');
  if (customImg) {
    ballImage.src = customImg;
  }
} else {
  ballImage.src = charImg;
}

let imageLoaded = false;
ballImage.onload = () => { imageLoaded = true; };
// ─── Game State ──────────────────────────────────────────────
let state = 'idle';
let ball, obstacleList, lightList, particleList;
let score, lightsCollected, gameSpeed, frameCount;
let ballGlowColor;
let duckHeld;
let spawnTimer, lightTimer;
let collectedColors = [];
let promptTimeout = null;
let bgOffset = 0;
let buildingOffsets = [0, 150, 300, 450, 600, 750];
// ─── Init ────────────────────────────────────────────────────
function initGame() {
  resetBiomes();
  ball = {
    x: BALL_X(),
    y: GROUND_Y(),
    r: 18,
    vy: 0,
    onGround: true,
    angle: 0,
    ducking: false,
  };

  obstacleList  = [];
  lightList     = [];
  particleList  = [];
  collectedColors = [];

  score          = 0;
  lightsCollected = 0;
  gameSpeed      = 3.5;
  frameCount     = 0;
  ballGlowColor  = '#ffffff';
  duckHeld       = false;
  spawnTimer     = 0;
  lightTimer     = 0;

  updateHUD();
  hidePrompt();
  buildLightBar();
state = 'running';
playMusic();
showDialogue('start', ball.x, ball.y - 40);}

// ─── HUD ─────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('scoreVal').textContent   = Math.floor(score);
  document.getElementById('lightsVal').textContent  = lightsCollected;
  document.getElementById('speedVal').textContent   = gameSpeed.toFixed(1) + 'x';
  document.getElementById('playerName').textContent = username;
  document.getElementById('meterVal').textContent = Math.floor(score / 2) + 'm';
}

function buildLightBar() {
  const bar = document.getElementById('lightBar');
  bar.innerHTML = '';
  BEHAVIORS.forEach(b => {
    if (b.deadly) return;
    const dot = document.createElement('div');
    dot.className = 'light-dot';
    dot.id = 'dot-' + b.name;
    dot.title = b.name;
    bar.appendChild(dot);
  });
}

function markLightDot(name, color) {
  const dot = document.getElementById('dot-' + name);
  if (dot) {
    dot.classList.add('collected');
    dot.style.background = color;
  }
}

// ─── Prompt ──────────────────────────────────────────────────
function showPrompt(msg, duration) {
  const box = document.getElementById('promptBox');
  box.textContent = msg;
  box.style.display = 'block';
  if (promptTimeout) clearTimeout(promptTimeout);
  promptTimeout = setTimeout(() => {
    if (state === 'running') hidePrompt();
  }, duration || 1800);
}

function hidePrompt() {
  document.getElementById('promptBox').style.display = 'none';
}

// ─── Controls ────────────────────────────────────────────────
function jump() {
  if (state !== 'running') return;
  if (ball.onGround && !ball.ducking) {
    ball.vy = JUMP_FORCE;
    ball.onGround = false;
    spawnParticles(ball.x, ball.y + ball.r, '#666', 6);
    playSound('jump');
    showDialogue('jump', ball.x, ball.y);
  }
}
function duck(on) {
  if (state !== 'running') return;
  duckHeld = on;
  ball.ducking = on && ball.onGround;
}

// ─── Particles ───────────────────────────────────────────────
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particleList.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 3 - 1,
      life: 1,
      color,
      size: Math.random() * 4 + 2,
    });
  }
}

// ─── Spawning ─────────────────────────────────────────────────
function spawnObstacle() {
  const aerial = Math.random() < 0.38;
  const w = canvas.width;

  if (aerial) {
    const trap = TRAPS[Math.floor(Math.random() * TRAPS.length)];
    obstacleList.push({
      x: w + 40,
      y: GROUND_Y() - 65 - Math.random() * 15,
      w: 54, h: 28,
      type: 'aerial',
      label: trap,
    });
  } else {
    const obs = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
    const oh  = 28 + Math.random() * 20;
   const isRock = obs === 'rock';
const rockImg = isRock ? rockImages[Math.floor(Math.random() * rockImages.length)] : null;

obstacleList.push({
  x: w + 40,
  y: GROUND_Y() - oh + 18,
  w: isRock ? 55 : 40,
  h: oh,
  type: 'ground',
  label: obs,
  rockImg: rockImg,
});
  }
}

function spawnLight() {
  const b    = BEHAVIORS[Math.floor(Math.random() * BEHAVIORS.length)];
  const gy   = GROUND_Y();
  const yPos = b.deadly
    ? gy - 22
    : gy - 22 - Math.random() * 85;

  lightList.push({
    x: canvas.width + 20,
    y: yPos,
    r: 11,
    behavior: b,
    pulse: Math.random() * Math.PI * 2,
  });
}

// ─── Collision ───────────────────────────────────────────────
function hitTest(b, o) {
  const by = b.ducking ? b.y + b.r * 0.4 : b.y;
  const br = b.ducking ? b.r * 0.6  : b.r;
  return !(
    b.x + br < o.x      ||
    b.x - br > o.x + o.w ||
    by + br  < o.y      ||
    by - br  > o.y + o.h
  );
}

// ─── Update ──────────────────────────────────────────────────
function update() {
  if (state !== 'running') return;
  frameCount++;

  const gy = GROUND_Y();

  // Physics
  ball.vy += GRAVITY;
  ball.y  += ball.vy;
  ball.angle += 0.09;

  if (ball.y >= gy) {
    ball.y       = gy;
    ball.vy      = 0;
    ball.onGround = true;
    ball.ducking  = duckHeld;
  } else {
    ball.onGround = false;
    ball.ducking  = false;
  }

  // Speed ramp
  gameSpeed = 3.5 + score * 0.004;
  bgOffset += gameSpeed * 0.4;
  updateBiomes(Math.floor(score / 2), gameSpeed, canvas.width, canvas.height);

  // Spawn obstacles
  spawnTimer++;
  const spawnInterval = Math.max(52, 105 - score * 0.05);
  if (spawnTimer >= spawnInterval) {
    spawnObstacle();
    spawnTimer = 0;
  }

  // Spawn lights
  lightTimer++;
  if (lightTimer >= 130) {
    spawnLight();
    lightTimer = 0;
  }

  // Move obstacles
  obstacleList.forEach(o => { o.x -= gameSpeed; });
  obstacleList = obstacleList.filter(o => o.x + o.w > -20);

  // Move lights
  lightList.forEach(l => { l.x -= gameSpeed * 0.88; l.pulse += 0.07; });
  lightList = lightList.filter(l => l.x + l.r > -20);

  // Move particles
  particleList.forEach(p => {
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.1;
    p.life -= 0.04;
  });
  particleList = particleList.filter(p => p.life > 0);

  // Obstacle collision
  for (const o of obstacleList) {
    if (!hitTest(ball, o)) continue;

    if (o.type === 'ground' && ball.ducking)  continue;
    if (o.type === 'aerial' && !ball.onGround) continue;

    triggerGameOver();
    return;
  }

  // Light collision
  const bEffY = ball.ducking ? ball.y + ball.r * 0.4 : ball.y;
  const bEffR = ball.ducking ? ball.r * 0.6 : ball.r;

  for (let i = lightList.length - 1; i >= 0; i--) {
    const l  = lightList[i];
    const dx = ball.x - l.x;
    const dy = bEffY  - l.y;
    if (Math.sqrt(dx * dx + dy * dy) > bEffR + l.r) continue;

    if (l.behavior.deadly) {
      triggerGameOver();
      return;
    }

  score          += l.behavior.score;
lightsCollected++;
ballGlowColor   = l.behavior.color;
collectedColors.push(l.behavior.color);

spawnParticles(l.x, l.y, l.behavior.color, 12);
playSound('collect');
showDialogue('collect', ball.x, ball.y);
    showPrompt(
      l.behavior.name + ' light! +' + l.behavior.score + ' pts  (' + l.behavior.meaning + ')',
      1600
    );
    markLightDot(l.behavior.name, l.behavior.color);
    lightList.splice(i, 1);
  }

  // Passive score
  score += 0.06;
  updateHUD();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  if (state !== 'idle') {
    drawLights();
    drawObstacles();
    drawBall();
    drawParticles();
    drawForegroundTrees(ctx, canvas.width, canvas.height, GROUND_Y());
  }
}

function drawBackground() {
  drawBiome(ctx, canvas.width, canvas.height, bgOffset, GROUND_Y());
}

function drawBall() {
  const b  = ball;
  const by = b.ducking ? b.y + b.r * 0.4 : b.y;
  const br = b.ducking ? b.r * 0.6  : b.r;

  ctx.save();
  ctx.translate(b.x, by);
  ctx.rotate(b.angle);

  // Glow effect
  ctx.shadowColor = ballGlowColor;
  ctx.shadowBlur  = 14;

  // Clip into circle
  ctx.beginPath();
  ctx.arc(0, 0, br, 0, Math.PI * 2);
  ctx.clip();

  if (imageLoaded) {
    // Draw Kyle as the ball
    ctx.drawImage(ballImage, -br, -br, br * 2, br * 2);
  } else {
    // Fallback plain ball if image not loaded
    ctx.fillStyle = '#d8d8d8';
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();

  // Circle border
  ctx.save();
  ctx.translate(b.x, by);
  ctx.beginPath();
  ctx.arc(0, 0, br, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Ground shadow
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(b.x, GROUND_Y() + 3, br * 0.9, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  obstacleList.forEach(o => {
    ctx.save();

    if (o.type === 'aerial') {
      // Aerial trap box
      ctx.fillStyle   = '#3a0000';
      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth   = 1;
      ctx.fillRect  (o.x, o.y, o.w, o.h);
      ctx.strokeRect(o.x, o.y, o.w, o.h);

      // Label
      ctx.fillStyle  = '#ff5555';
      ctx.font       = 'bold 10px monospace';
      ctx.textAlign  = 'center';
      ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 4);

      // DUCK hint
      ctx.fillStyle = '#ff3333';
      ctx.font      = '9px monospace';
      ctx.fillText('↓ DUCK', o.x + o.w / 2, o.y - 6);

    } else {
  if (o.label === 'rock' && o.rockImg && o.rockImg.complete) {
    // Draw rock image
    ctx.drawImage(o.rockImg, o.x, o.y, o.w, o.h);
  } else {
    // Fallback box for non-rock obstacles
    ctx.fillStyle   = '#2a2a2a';
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth   = 1;
    ctx.fillRect  (o.x, o.y, o.w, o.h);
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle  = '#aaaaaa';
    ctx.font       = 'bold 10px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 4);
  }
  // JUMP hint
  ctx.fillStyle = '#00ff88';
  ctx.font      = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('↑ JUMP', o.x + o.w / 2, o.y - 6);
}

    ctx.restore();
  });
}

function drawLights() {
  lightList.forEach(l => {
    const glow = 8 + Math.sin(l.pulse) * 4;

    ctx.save();
    ctx.shadowColor = l.behavior.color;
    ctx.shadowBlur  = glow;

    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    ctx.fillStyle = l.behavior.color;
    ctx.fill();

    if (l.behavior.deadly) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Light name below
    ctx.fillStyle = l.behavior.deadly ? '#ff4444' : '#999';
    ctx.font      = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(l.behavior.name, l.x, l.y + l.r + 11);

    ctx.restore();
  });
}

function drawParticles() {
  particleList.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ─── Game Over ───────────────────────────────────────────────
function triggerGameOver() {
  state = 'dead';
  spawnParticles(ball.x, ball.y, '#ff4444', 20);
  playSound('gameover');
  showDialogue('death', ball.x, ball.y);
  stopMusic();

  // Show final stats
  document.getElementById('gameOverStats').style.display = 'block';
  document.getElementById('finalScore').textContent      = Math.floor(score);
  document.getElementById('finalLights').textContent     = lightsCollected;

  // Swap overlay to game over mode
  document.getElementById('overlayTitle').textContent    = 'GAME OVER';
  document.getElementById('overlayDesc').innerHTML       = 'The wasteland claims another soul.';
  document.getElementById('nameForm').style.display      = 'none';
  document.getElementById('playAgainBtn').style.display  = 'inline-block';
  document.getElementById('overlay').style.display       = 'flex';

  // Save score to backend
  if (typeof saveScore === 'function') {
    saveScore(username, lightsCollected, Math.floor(score));
  }
}

// ─── Game Loop ───────────────────────────────────────────────
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

const startBtnEl = document.getElementById('startBtn');
if (startBtnEl) {
  startBtnEl.addEventListener('click', () => {
    document.getElementById('overlay').style.display = 'none';
    initGame();
  });
}

// Auto start if coming from character select
window.addEventListener('load', () => {
  if (params.get('username')) {
    document.getElementById('overlayTitle').textContent   = 'READY?';
    document.getElementById('overlayDesc').innerHTML      = `
      Rolling as <strong style="color:#f0c040">${username}</strong><br/>
      Jump over obstacles. Duck under traps.<br/>
      <span class="danger">Avoid the black light.</span>
    `;
    document.getElementById('playAgainBtn').style.display = 'none';
    document.getElementById('nameForm').style.display     = 'none';

    const readyBtn = document.createElement('button');
    readyBtn.textContent = "LET'S GO!";
    readyBtn.style.cssText = `
      background: #f0c040; color: #111; border: none;
      padding: 10px 36px; font-size: 14px; font-weight: bold;
      border-radius: 4px; cursor: pointer; font-family: monospace;
    `;
    readyBtn.addEventListener('click', () => {
      document.getElementById('overlay').style.display = 'none';
      initGame();
    });
    document.getElementById('overlayButtons').prepend(readyBtn);
  }
});
document.getElementById('playAgainBtn').addEventListener('click', () => {
  document.getElementById('overlay').style.display       = 'none';
  document.getElementById('gameOverStats').style.display = 'none';
  document.getElementById('playAgainBtn').style.display  = 'none';
  document.getElementById('nameForm').style.display      = 'flex';
  document.getElementById('overlayTitle').textContent    = 'ADVENTURE MODE';
  document.getElementById('overlayDesc').innerHTML       = `
    The ball rolls forever through the wasteland.<br/>
    Jump over ground obstacles. Duck under aerial traps.<br/>
    Collect lights. <span class="danger">Avoid the black light — it means death.</span>
  `;
  document.getElementById('overlay').style.display = 'flex';
});

document.getElementById('jumpBtn').addEventListener('click', jump);

document.getElementById('duckBtn').addEventListener('mousedown',  () => duck(true));
document.getElementById('duckBtn').addEventListener('mouseup',    () => duck(false));
document.getElementById('duckBtn').addEventListener('mouseleave', () => duck(false));
document.getElementById('duckBtn').addEventListener('touchstart', (e) => { e.preventDefault(); duck(true);  }, { passive: false });
document.getElementById('duckBtn').addEventListener('touchend',   ()  => duck(false));

document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    jump();
  }
  if (e.code === 'ArrowDown') {
    e.preventDefault();
    duck(true);
  }
});

document.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown') duck(false);
});

const usernameInputEl = document.getElementById('usernameInput');
if (usernameInputEl) {
  usernameInputEl.addEventListener('keydown', e => {
    if (e.code === 'Enter') document.getElementById('startBtn').click();
  });
}

// ─── Start Loop ──────────────────────────────────────────────
loop();