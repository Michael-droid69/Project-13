const fs = require('fs');
const mysql = require('mysql2');

// Connect to MySQL
const connection = mysql.createConnection({
  host: 'phpmyadmin.romangry.fr',
  user: 'fp_1_2',
  password: 'PNPhStud3nt_1_2',       // default XAMPP setup (no password)
  database: 'fp_1_2'
});

// Read text file
fs.readFile('scores.txt', 'utf8', (err, data) => {
  if (err) return console.error('Error reading file:', err);

  const lines = data.trim().split('\n');

  lines.forEach(line => {
    const [username, password, lights, score] = line.split(',');

    connection.query(
      'INSERT INTO users (username, password, lights, score) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE lights=?, score=?',
      [username, password, lights, score, lights, score],
      (err) => {
        if (err) console.error('Insert error:', err);
        else console.log(`Inserted/Updated: ${username}`);
      }
    );
  });

  connection.end();
});
