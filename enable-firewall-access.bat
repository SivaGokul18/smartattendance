@echo off
title Smart Attendance - Windows Firewall Port Opener
echo =========================================================
echo    Smart Attendance - Opening Wi-Fi Ports for Phone
echo =========================================================
echo.
echo Checking for Administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges.
    echo Please right-click 'enable-firewall-access.bat' and select 'Run as administrator'.
    echo.
    pause
    exit /b 1
)

echo Adding Windows Firewall Inbound Rule for FastAPI Backend (Port 8000)...
netsh advfirewall firewall delete rule name="Smart Attendance Backend (8000)" >nul 2>&1
netsh advfirewall firewall add rule name="Smart Attendance Backend (8000)" dir=in action=allow protocol=TCP localport=8000 profile=any >nul
if %errorLevel% equ 0 (
    echo [OK] Port 8000 opened successfully.
) else (
    echo [FAILED] Could not open port 8000.
)

echo Adding Windows Firewall Inbound Rule for Vite Frontend (Port 5173)...
netsh advfirewall firewall delete rule name="Smart Attendance Frontend (5173)" >nul 2>&1
netsh advfirewall firewall add rule name="Smart Attendance Frontend (5173)" dir=in action=allow protocol=TCP localport=5173 profile=any >nul
if %errorLevel% equ 0 (
    echo [OK] Port 5173 opened successfully.
) else (
    echo [FAILED] Could not open port 5173.
)

echo.
echo =========================================================
echo  Firewall configuration complete!
echo  Your phone can now connect to both port 8000 and port 5173.
echo =========================================================
echo.
pause
