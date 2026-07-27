@echo off
title POS Dev Servers
echo Starting POS Development Servers...
echo.

start "WebAPI :3001" cmd /k "cd /d %~dp0WebAPI && npm run dev"
start "WebApp :3000" cmd /k "cd /d %~dp0WebApp && npm run dev"

echo Both servers started!
echo   - WebAPI : http://localhost:3001
echo   - WebApp : http://localhost:3000
echo.
timeout /t 3
