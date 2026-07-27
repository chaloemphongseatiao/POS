@echo off
setlocal EnableExtensions
chcp 65001 >nul
title POS Local Setup

echo ============================================
echo   POS System - Local Setup
echo ============================================
echo.

> "%~dp0WebApp\.env.local" echo NEXT_PUBLIC_API_URL=http://localhost:3001
echo [+] Updated WebApp\.env.local

> "%~dp0WebAPI\.env" echo DATABASE_URL="file:./dev.db"
>> "%~dp0WebAPI\.env" echo JWT_SECRET="pos-super-secret-key-change-in-production-2024"
>> "%~dp0WebAPI\.env" echo PORT=3001
>> "%~dp0WebAPI\.env" echo NODE_ENV=development
echo [+] Updated WebAPI\.env

echo.
echo ============================================
echo   Starting servers...
echo ============================================
echo.

start "POS - WebAPI" cmd /k "cd /d ""%~dp0WebAPI"" && npm run dev"
timeout /t 3 /nobreak >nul
start "POS - WebApp" cmd /k "cd /d ""%~dp0WebApp"" && npm run dev"

echo.
echo ============================================
echo   Setup complete
echo ============================================
echo.
echo   Open this URL on this computer:
echo   http://localhost:3000
echo.
echo ============================================
echo.
pause
endlocal
