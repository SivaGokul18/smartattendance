# Smart Attendance PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "      Launching Smart Attendance Full-Stack        " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Free existing servers on ports 8000 and 5173 if running
$ports = @(8000, 5173)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -and $p -ne 0) {
                Write-Host "Releasing port $port (Stopping PID $p)..." -ForegroundColor Yellow
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Start-Sleep -Seconds 1

# 1. Start Backend in a new PowerShell window
Write-Host "[1/2] Launching FastAPI Backend (port 8000)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; & '.\.venv\Scripts\uvicorn.exe' app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Frontend in a new PowerShell window
Write-Host "[2/2] Launching Vite React Frontend (port 5173)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm run dev"

Write-Host ""
Write-Host "Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Services started:" -ForegroundColor Yellow
Write-Host "  -> Frontend App: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  -> Backend Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
