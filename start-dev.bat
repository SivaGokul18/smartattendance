@echo off
setlocal enabledelayedexpansion
title Smart Attendance Launcher
echo ===================================================
echo       Launching Smart Attendance Full-Stack        
echo ===================================================

set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo Freeing ports 8000 and 5173 if currently occupied...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(8000, 5173); " ^
  "foreach ($port in $ports) { " ^
  "  $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { " ^
  "    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; " ^
  "    foreach ($p in $pids) { " ^
  "      if ($p -and $p -ne 0) { " ^
  "        taskkill /F /T /PID $p 2>$null; " ^
  "      } " ^
  "    } " ^
  "  } " ^
  "}; " ^
  "taskkill /F /FI 'WINDOWTITLE eq Smart Attendance - *' 2>$null;"

timeout /t 1 /nobreak >nul

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "LOCAL_IP=%%a"
    goto :found_ip
)
:found_ip
set "LOCAL_IP=%LOCAL_IP: =%"

echo [1/2] Launching FastAPI Backend on 0.0.0.0:8000 (accessible from phone)...
start "Smart Attendance - FastAPI Backend" /d "%PROJECT_ROOT%\backend" powershell.exe -NoExit -Command "& '.\.venv\Scripts\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Launching Vite React Frontend on 0.0.0.0:5173...
start "Smart Attendance - Vite Frontend" /d "%PROJECT_ROOT%" powershell.exe -NoExit -Command "npm run dev -- --host"

echo.
echo Waiting for servers to initialize...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo ===================================================
echo  Services started successfully:
echo  - Desktop UI:       http://localhost:5173
echo  - Phone Mobile UI:  http://%LOCAL_IP%:5173
echo  - Backend API:      http://localhost:8000/docs
echo  - Phone Backend:    http://%LOCAL_IP%:8000/docs
echo ===================================================
timeout /t 5 >nul
exit
