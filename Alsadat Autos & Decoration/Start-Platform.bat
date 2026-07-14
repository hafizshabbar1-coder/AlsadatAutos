@echo off
title AL-SADAT AUTO POS Launcher
echo ==========================================================
echo           AL-SADAT AUTO BUSINESS PLATFORM & POS
echo ==========================================================
echo.
echo Launching native local web server...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_server.ps1"
echo.
echo Server closed.
pause
