@echo off
echo ============================
echo Running imported.js to push scores to MySQL...
echo ============================
node imported.js

echo ============================
echo Starting web server (app.js)...
echo ============================
start cmd /k "node app.js"

echo Waiting for server to start...
timeout /t 2 >nul

echo ============================
echo Opening browser to leaderboard...
echo ============================
start http://localhost:4000
