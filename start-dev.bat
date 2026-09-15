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

echo [1/2] Launching FastAPI Backend on port 8000...
start "Smart Attendance - FastAPI Backend" /d "%PROJECT_ROOT%\backend" powershell.exe -NoExit -Command "& '.\.venv\Scripts\uvicorn.exe' app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Vite React Frontend on port 5173...
start "Smart Attendance - Vite Frontend" /d "%PROJECT_ROOT%" powershell.exe -NoExit -Command "npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo ===================================================
echo  Services started successfully:
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend REST API: http://127.0.0.1:8000/docs
echo ===================================================
timeout /t 3 >nul
exit
