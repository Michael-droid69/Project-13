// ─── sounds.js ───────────────────────────────────────────────
// Handles all sound effects, music, and Kyle's dialogue bubbles
// ─────────────────────────────────────────────────────────────

// ─── Sound Library ───────────────────────────────────────────
const SOUNDS = {
  jump: [
    new Audio('assets/sounds/jump/jump1.mp3'),
  ],
  collect: [
    new Audio('assets/sounds/collect/collect1.mp3'),
    new Audio('assets/sounds/collect/collect2.mp3'),
  ],
  gameover: [
    new Audio('assets/sounds/gameover/gameover1.mp3'),
    new Audio('assets/sounds/gameover/gameover2.mp3'),
    new Audio('assets/sounds/gameover/gameover3.mp3'),
  ],
};

// ─── Background Music ─────────────────────────────────────────
const MUSIC_TRACKS = [
  new Audio('assets/sounds/music/sound1.mp3'),
  new Audio('assets/sounds/music/sound2.mp3'),
];

let currentTrack    = null;
let musicEnabled    = true;
let sfxEnabled      = true;
let currentTrackIdx = 0;

// Set all music to loop
MUSIC_TRACKS.forEach(track => {
  track.loop   = false;
  track.volume = 0.35;
});

// ─── Play Random SFX ─────────────────────────────────────────
function playSound(type) {
  if (!sfxEnabled) return;
  const list = SOUNDS[type];
  if (!list || list.length === 0) return;
  const sound = list[Math.floor(Math.random() * list.length)];
  sound.currentTime = 0;
  sound.volume = 0.6;
  sound.play().catch(() => {});
}

// ─── Music Controls ──────────────────────────────────────────
function playMusic() {
  if (!musicEnabled) return;
  currentTrack = MUSIC_TRACKS[currentTrackIdx];
  currentTrack.volume = 0.35;
  currentTrack.play().catch(() => {});

  // When track ends play next one
  currentTrack.onended = () => {
    currentTrackIdx = (currentTrackIdx + 1) % MUSIC_TRACKS.length;
    playMusic();
  };
}

function stopMusic() {
  if (currentTrack) {
    currentTrack.pause();
    currentTrack.currentTime = 0;
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    playMusic();
  } else {
    stopMusic();
  }
  return musicEnabled;
}

function toggleSFX() {
  sfxEnabled = !sfxEnabled;
  return sfxEnabled;
}

// ─── Kyle's Dialogue Lines ───────────────────────────────────
const KYLE_DIALOGUES = {
  jump:    ['Hah!', 'Woah!', 'Got it!', 'Easy!', 'Yeet!'],
  collect: ['Nice!', 'Yes!', 'Got one!', 'Sweet!', 'Mine!'],
  death:   ['Ohh nooo!', 'Not again...', 'Ugh!', 'Nooo!', 'Come on!'],
  start:   ["Let's roll!", 'Here we go!', 'Watch this!'],
};

let dialogueBubble    = null;
let dialogueTimeout   = null;
let lastDialogueTime  = 0;
const DIALOGUE_COOLDOWN = 2500; // ms between dialogues

// ─── Show Dialogue Bubble ────────────────────────────────────
function showDialogue(type, x, y) {
  const now = Date.now();
  if (now - lastDialogueTime < DIALOGUE_COOLDOWN) return;

  // Not always — random chance
  const chance = type === 'death' ? 1.0 : 0.45;
  if (Math.random() > chance) return;

  lastDialogueTime = now;

  const lines = KYLE_DIALOGUES[type];
  if (!lines) return;
  const text = lines[Math.floor(Math.random() * lines.length)];

  // Remove existing bubble
  if (dialogueBubble) dialogueBubble.remove();
  if (dialogueTimeout) clearTimeout(dialogueTimeout);

  // Create bubble
  const bubble = document.createElement('div');
  bubble.className = 'kyle-bubble';
  bubble.textContent = text;

  const wrapper = document.getElementById('gameWrapper');
  const rect    = wrapper.getBoundingClientRect();
  const canvas  = document.getElementById('gameCanvas');
  const scaleX  = canvas.clientWidth  / canvas.width;
  const scaleY  = canvas.clientHeight / canvas.height;

  bubble.style.cssText = `
    position: absolute;
    left: ${x * scaleX - 30}px;
    top:  ${y * scaleY - 60}px;
    background: rgba(0,0,0,0.85);
    border: 1px solid #f0c040;
    color: #f0c040;
    font-size: 12px;
    font-family: monospace;
    padding: 4px 10px;
    border-radius: 12px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 30;
    animation: bubblePop 0.2s ease;
  `;

  wrapper.appendChild(bubble);
  dialogueBubble = bubble;

  dialogueTimeout = setTimeout(() => {
    if (bubble.parentNode) bubble.remove();
    dialogueBubble = null;
  }, type === 'death' ? 2500 : 1200);
}

// ─── Bubble Animation CSS ────────────────────────────────────
const bubbleStyle = document.createElement('style');
bubbleStyle.textContent = `
  @keyframes bubblePop {
    0%   { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1);   opacity: 1; }
  }
`;
document.head.appendChild(bubbleStyle);