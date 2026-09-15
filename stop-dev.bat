@echo off
title Smart Attendance Server Stopper
echo ===================================================
echo       Stopping Smart Attendance Full-Stack         
echo ===================================================

echo Checking for running services on ports 8000 and 5173...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(8000, 5173); " ^
  "$stopped = 0; " ^
  "foreach ($port in $ports) { " ^
  "  $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { " ^
  "    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique; " ^
  "    foreach ($p in $pids) { " ^
  "      if ($p -and $p -ne 0) { " ^
  "        Write-Host ('Stopping server process (PID: ' + $p + ') on port ' + $port + '...') -ForegroundColor Yellow; " ^
  "        taskkill /F /T /PID $p 2>$null; " ^
  "        $stopped++; " ^
  "      } " ^
  "    } " ^
  "  } " ^
  "}; " ^
  "taskkill /F /FI 'WINDOWTITLE eq Smart Attendance - *' 2>$null; " ^
  "if ($stopped -gt 0) { Write-Host 'All Smart Attendance servers stopped successfully.' -ForegroundColor Green; } " ^
  "else { Write-Host 'No active Smart Attendance servers were running on ports 8000 or 5173.' -ForegroundColor Cyan; }"

echo.
echo ===================================================
echo Done! Closing in 2 seconds...
timeout /t 2 >nul
exit
