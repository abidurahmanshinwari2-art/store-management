@echo off
title Hasan Shinwari Genral Store
cd /d "%~dp0"
setlocal EnableDelayedExpansion

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install it first, then run this file again.
  pause
  exit /b 1
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3847" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%P >nul 2>nul
)

if not exist "backend\node_modules" (
  echo Installing store server...
  call npm --prefix backend install
)
if not exist "frontend\node_modules" (
  echo Installing store screens...
  call npm --prefix frontend install
)

set UI_BUILD=2026-08-30-scan
set NEED_BUILD=0
if not exist "frontend\dist\index.html" set NEED_BUILD=1
if not exist "frontend\dist\.ui-build" set NEED_BUILD=1
if exist "frontend\dist\.ui-build" (
  set /p GOT=<frontend\dist\.ui-build
)
if not "!GOT!"=="%UI_BUILD%" set NEED_BUILD=1

if "%NEED_BUILD%"=="1" (
  echo Building store screens...
  call npm --prefix frontend run build
  >frontend\dist\.ui-build echo %UI_BUILD%
)

echo.
echo App folder: %~dp0
echo Shop data: %~d0\HasanShinwariStore
echo Opening http://localhost:3847
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3847"
node backend\src\server.js
pause
