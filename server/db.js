// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
// db.js
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'phpmyadmin.romangry.fr',      // or 127.0.0.1
    user: 'fp_1_2',      // fp_1_2
    password: 'PNPhStud3nt_1_2',  // your password
    database: 'fp_1_2_db'     // the database you created (e.g., fp_1_2_db)
});

connection.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err.message);
    } else {
        console.log('✅ Connected to MySQL database');
    }
});

module.exports = connection;
