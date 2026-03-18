const { exec } = require('child_process');
const fs = require('fs');
const express = require('express');
const path    = require('path');
const mysql   = require('mysql2');
const cors    = require('cors');

const app  = express();
const PORT = 4000;

// ─── Middleware ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json()); // needed to read POST body

const connection = mysql.createConnection({
  host:     'interchange.proxy.rlwy.net',
  port:     54430,
  user:     'root',
  password: 'ozNyRifXQvJaGsGuPENChheHppDisAYj',
  database: 'railway'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// ─── ROUTE: Homepage ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── ROUTE: Leaderboard page ─────────────────────────────────
app.get('/leaderboards.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboards.html'));
});

// ─── ROUTE: Game page ────────────────────────────────────────
app.get('/game.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// ─── ROUTE: GET /leaderboard ─────────────────────────────────
// Fetches top scores — used by leaderboards.html and game-api.js
app.get('/leaderboard', (req, res) => {
  const mode  = req.query.mode  || 'adventure';
  const limit = parseInt(req.query.limit) || 10;

 const query = `
    SELECT username, lights, score, mode, created_at
    FROM scores
    ORDER BY score DESC
    LIMIT ?
  `;

  connection.query(query, [limit], (err, results) => {

    if (err) {
      console.error('❌ Error fetching leaderboard:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, scores: results });
  });
});

// ─── ROUTE: POST /save-score ─────────────────────────────────
// Saves a score after game over — called by game-api.js
app.post('/save-score', (req, res) => {
  const { username, lights, score, mode } = req.body;

  if (!username || score === undefined) {
    return res.status(400).json({ success: false, message: 'Missing username or score' });
  }

  const query = `
    INSERT INTO scores (username, lights, score, mode)
    VALUES (?, ?, ?, ?)
  `;

  connection.query(query, [username, lights || 0, score, mode || 'adventure'], (err, result) => {
    if (err) {
      console.error('❌ Error saving score:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, message: 'Score saved!', id: result.insertId });
  });
});

// ─── ROUTE: GET /check-user ───────────────────────────────────
// Checks if a username already exists in scores
app.get('/check-user', (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Missing username' });
  }

  const query = `SELECT COUNT(*) AS count FROM scores WHERE username = ?`;

  connection.query(query, [username], (err, results) => {
    if (err) {
      console.error('❌ Error checking username:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.json({ success: true, exists: results[0].count > 0 });
  });
});
app.get('/launch-story', (req, res) => {
  const exePath = path.join(__dirname, 'game.exe');
  exec(`start cmd /k "${exePath}"`, { cwd: __dirname }, (err) => {
    if (err) {
      console.error('Failed to launch game.exe:', err);
      return res.json({ success: false });
    }
  });
  res.json({ success: true });
});

app.get('/sync-scores', (req, res) => {
  const filePath = path.join(__dirname, 'scores.txt');

  if (!fs.existsSync(filePath)) {
    return res.json({ success: false, message: 'scores.txt not found' });
  }

  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');

  lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length < 4) return;
    const [username, password, lights, score] = parts;

    const query = `
      INSERT INTO scores (username, lights, score, mode)
      SELECT ?, ?, ?, 'story'
      FROM DUAL
      WHERE NOT EXISTS (
        SELECT 1 FROM scores
        WHERE username = ? AND score = ? AND mode = 'story'
      )
    `;
    connection.query(query, [
      username.trim(),
      parseInt(lights),
      parseInt(score),
      username.trim(),
      parseInt(score)
    ], (err) => {
      if (err) console.error('Sync error:', err);
    });
  });

  res.json({ success: true, message: 'Synced without duplicates!' });
});
// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});