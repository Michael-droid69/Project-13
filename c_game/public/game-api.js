// ─── game-api.js ────────────────────────────────────────────
// Handles all communication between the game and the backend
// Calls routes defined in app.js
// ────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:4000';

// ─── Save Score ──────────────────────────────────────────────
// Called automatically on game over from game.js
// Sends: username, lights collected, final score, mode
async function saveScore(username, lights, score) {
  try {
    const res = await fetch(`${API_BASE}/save-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        lights:   lights,
        score:    score,
        mode:     'adventure',
      }),
    });

    const data = await res.json();

    if (data.success) {
      console.log('Score saved successfully:', data);
      showSavedBadge();
    } else {
      console.warn('Score not saved:', data.message);
    }

  } catch (err) {
    console.error('Could not connect to server. Score not saved.', err);
  }
}

// ─── Fetch Leaderboard ───────────────────────────────────────
// Fetches top scores from the database
// Can be called from leaderboards.html or after game over
async function fetchLeaderboard(mode = 'adventure', limit = 10) {
  try {
    const res  = await fetch(`${API_BASE}/leaderboard?mode=${mode}&limit=${limit}`);
    const data = await res.json();

    if (data.success) {
      return data.scores; // array of { username, score, lights, date }
    } else {
      console.warn('Could not fetch leaderboard:', data.message);
      return [];
    }

  } catch (err) {
    console.error('Could not connect to server for leaderboard.', err);
    return [];
  }
}

// ─── Check if username exists ────────────────────────────────
// Optional: check if name is already taken before game starts
async function checkUsername(username) {
  try {
    const res  = await fetch(`${API_BASE}/check-user?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    return data.exists;
  } catch (err) {
    console.error('Could not check username.', err);
    return false;
  }
}

// ─── Show Saved Badge ────────────────────────────────────────
// Small visual confirmation that score was saved
function showSavedBadge() {
  const existing = document.getElementById('savedBadge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'savedBadge';
  badge.textContent = 'Score saved!';
  badge.style.cssText = `
    position: absolute;
    top: 50px;
    right: 14px;
    background: rgba(0,200,100,0.15);
    border: 1px solid #00c864;
    color: #00c864;
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 4px;
    font-family: monospace;
    z-index: 100;
    pointer-events: none;
  `;
  document.getElementById('gameWrapper').appendChild(badge);
  setTimeout(() => badge.remove(), 3000);
}

// ─── Mini Leaderboard on Game Over ───────────────────────────
// Renders a small top-5 table inside the overlay after game over
async function renderMiniLeaderboard() {
  const scores = await fetchLeaderboard('adventure', 5);

  const existing = document.getElementById('miniLeaderboard');
  if (existing) existing.remove();

  if (!scores.length) return;

  const container = document.createElement('div');
  container.id = 'miniLeaderboard';
  container.style.cssText = `
    margin-top: 6px;
    text-align: center;
    font-family: monospace;
    font-size: 12px;
    color: #888;
  `;

  const title = document.createElement('p');
  title.textContent = '── Top 5 ──';
  title.style.color = '#555';
  title.style.marginBottom = '6px';
  container.appendChild(title);

  scores.forEach((s, i) => {
    const row = document.createElement('p');
    row.style.color = i === 0 ? '#f0c040' : '#777';
    row.textContent = `${i + 1}. ${s.username}  —  ${s.score} pts`;
    container.appendChild(row);
  });

  const stats = document.getElementById('gameOverStats');
  if (stats) stats.after(container);
}

// ─── Hook into game over ─────────────────────────────────────
// Watches for overlay to appear then triggers mini leaderboard
const observer = new MutationObserver(() => {
  const overlay = document.getElementById('overlay');
  const title   = document.getElementById('overlayTitle');
  if (
    overlay &&
    overlay.style.display !== 'none' &&
    title &&
    title.textContent === 'GAME OVER'
  ) {
    renderMiniLeaderboard();
  }
});

observer.observe(document.getElementById('overlay'), {
  attributes: true,
  attributeFilter: ['style'],
});