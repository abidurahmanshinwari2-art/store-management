@echo off
title Hasan Shinwari Genral Store
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install it first, then run this file again.
  pause
  exit /b 1
)

if not exist "backend\node_modules" (
  echo Installing store server...
  call npm --prefix backend install
)
if not exist "frontend\node_modules" (
  echo Installing store screens...
  call npm --prefix frontend install
)
if not exist "frontend\dist\index.html" (
  echo Building store screens...
  call npm --prefix frontend run build
)

echo.
echo Shop data stays on this PC.
echo Opening http://localhost:3847
start "" "http://localhost:3847"
node backend\src\server.js
pause
