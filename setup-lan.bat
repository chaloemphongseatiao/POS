@echo off
setlocal EnableExtensions
chcp 65001 >nul
title POS LAN Setup

echo ============================================
echo   POS System - LAN Setup
echo ============================================
echo.

net session >nul 2>&1
if not %errorlevel%==0 (
  echo [ERROR] This script must be run as Administrator.
  echo Right-click setup-lan.bat and choose "Run as administrator",
  echo otherwise the firewall rules for ports 3000/3001 will NOT be added
  echo and other devices on the LAN will not be able to connect.
  echo.
  pause
  exit /b 1
)

rem Find the first non-loopback IPv4 address.
set "SERVER_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
  if not defined SERVER_IP set "SERVER_IP=%%a"
)
set "SERVER_IP=%SERVER_IP: =%"

if not defined SERVER_IP (
  echo [ERROR] No LAN IPv4 address found.
  echo Connect this computer to Wi-Fi or LAN, then run this file again.
  pause
  exit /b 1
)

echo [*] Server IP: %SERVER_IP%
echo.

> "%~dp0WebApp\.env.local" echo NEXT_PUBLIC_API_URL=http://%SERVER_IP%:3001
echo [+] Updated WebApp\.env.local

> "%~dp0WebAPI\.env" echo DATABASE_URL="file:./dev.db"
>> "%~dp0WebAPI\.env" echo JWT_SECRET="pos-super-secret-key-change-in-production-2024"
>> "%~dp0WebAPI\.env" echo PORT=3001
>> "%~dp0WebAPI\.env" echo NODE_ENV=development
echo [+] Updated WebAPI\.env

netsh advfirewall firewall show rule name="POS API Port 3001" >nul 2>&1
if not %errorlevel%==0 netsh advfirewall firewall add rule name="POS API Port 3001" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall show rule name="POS Web Port 3000" >nul 2>&1
if not %errorlevel%==0 netsh advfirewall firewall add rule name="POS Web Port 3000" dir=in action=allow protocol=TCP localport=3000
echo [+] Firewall rules for ports 3000 and 3001 verified

echo.
echo ============================================
echo   Starting servers...
echo ============================================
echo.

start "POS - WebAPI" cmd /k "cd /d ""%~dp0WebAPI"" && npm run dev"
timeout /t 3 /nobreak >nul
start "POS - WebApp" cmd /k "cd /d ""%~dp0WebApp"" && npm run dev -- -H 0.0.0.0 -p 3000"

echo.
echo ============================================
echo   LAN setup complete
echo ============================================
echo.
echo   Open this URL on another device:
echo   http://%SERVER_IP%:3000
echo.
echo   Both devices must use the same Wi-Fi or LAN.
echo ============================================
echo.
pause
endlocal
