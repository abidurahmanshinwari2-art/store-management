@echo off
title Update General Store Management system
cd /d "%~dp0"
setlocal EnableDelayedExpansion

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install it first, then run this file again.
  pause
  exit /b 1
)

echo Downloading the latest store from GitHub...
set "ZIP=%TEMP%\store-update-main.zip"
set "UNPACK=%TEMP%\store-update-unpacked"
del /q "%ZIP%" >nul 2>nul
rmdir /s /q "%UNPACK%" >nul 2>nul
mkdir "%UNPACK%" >nul 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Invoke-WebRequest -Uri 'https://github.com/abidurahmanshinwari2-art/store-management/archive/refs/heads/main.zip' -OutFile '%ZIP%' -UseBasicParsing"
if not exist "%ZIP%" (
  echo Could not download the update. Check internet, then try again.
  pause
  exit /b 1
)

tar -xf "%ZIP%" -C "%UNPACK%"
if errorlevel 1 (
  echo Could not open the download.
  pause
  exit /b 1
)

for /d %%D in ("%UNPACK%\*") do set "INNER=%%~fD"
if not defined INNER (
  echo The download was empty.
  pause
  exit /b 1
)

echo Copying new files. Shop data on this PC is not changed.
robocopy "%INNER%" "%~dp0." /E /XD node_modules .git dist /NFL /NDL /NJH /NJS /nc /ns /np >nul
if exist "frontend\dist\.ui-build" del /q "frontend\dist\.ui-build" >nul 2>nul

if not exist "backend\node_modules" call npm --prefix backend install
if not exist "frontend\node_modules" call npm --prefix frontend install
echo Building store screens...
call npm --prefix frontend run build

echo.
echo Update is done. Close this window, then open General Store Management system again.
pause
