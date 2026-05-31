@echo off
title Prompt Refinery
cd /d "c:\Users\trent\antigravity\Prompt-Refinery"

echo ====================================================
echo Starting Prompt Refinery...
echo ====================================================

if not exist node_modules (
    echo node_modules not found. Installing dependencies...
    call npm install
)

echo Starting development server...
:: Wait 3 seconds, then open the web application in the default browser
start "" cmd /c "ping 127.0.0.1 -n 4 >nul && start http://localhost:3000"

:: Start the server
call npm run dev

pause
