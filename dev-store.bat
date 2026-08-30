@echo off
title Store - developer mode
cd /d "%~dp0"
start "Store API" cmd /k "npm --prefix backend run dev"
timeout /t 2 >nul
start "Store UI" cmd /k "npm --prefix frontend run dev"
start "" "http://localhost:5173"
