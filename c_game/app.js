const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors'); // Allow frontend to connect (important!)

const app = express();
const PORT = 4000;

// Enable CORS
app.use(cors());

// MySQL connection
const connection = mysql.createConnection({
    host: 'phpmyadmin.romangry.fr',
    user: 'fp_1_2',
    password: 'PNPhStud3nt_1_2',
    database: 'fp_1_2'
});

// Connect to DB
connection.connect((err) => {
    if (err) {
        console.error('❌ MySQL connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL');
});

// Route: GET /leaderboard
app.get('/leaderboard', (req, res) => {
    const query = `
        SELECT username, lights, score
        FROM users
        ORDER BY score DESC
        LIMIT 10
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching leaderboard:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(results);
    });
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
