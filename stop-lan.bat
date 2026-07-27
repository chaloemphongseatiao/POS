@echo off
chcp 65001 >nul
title POS LAN Stop

echo ============================================
echo   POS System - Stop LAN Servers
echo ============================================
echo.
echo [*] Stopping processes on ports 3000 and 3001...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = 3000, 3001; " ^
  "$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in $ports }; " ^
  "if (-not $connections) { Write-Host '[*] No POS server is running'; exit 0 }; " ^
  "$processIds = $connections.OwningProcess | Sort-Object -Unique; " ^
  "foreach ($processId in $processIds) { " ^
  "  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue; " ^
  "  if ($process) { " ^
  "    Write-Host ('[-] Stopping ' + $process.ProcessName + ' (PID ' + $processId + ')'); " ^
  "    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue " ^
  "  } " ^
  "}"

echo.
echo ============================================
echo   POS servers stopped
echo ============================================
echo.
pause
