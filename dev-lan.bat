@echo off
setlocal EnableExtensions
title POS Dev Servers (LAN Mode)

set "SERVER_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
  if not defined SERVER_IP set "SERVER_IP=%%a"
)
set "SERVER_IP=%SERVER_IP: =%"

if not defined SERVER_IP (
  echo [ERROR] No LAN IPv4 address found.
  pause
  exit /b 1
)

echo ============================================
echo   POS System - LAN Mode
echo ============================================
echo.
echo   Server IP : %SERVER_IP%
echo   WebAPI    : http://%SERVER_IP%:3001
echo   WebApp    : http://%SERVER_IP%:3000
echo ============================================
echo.

start "WebAPI :3001" cmd /k "cd /d ""%~dp0WebAPI"" && npm run dev"
start "WebApp :3000" cmd /k "cd /d ""%~dp0WebApp"" && npx next dev -H 0.0.0.0 -p 3000"

timeout /t 3
endlocal
