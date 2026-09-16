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

# Detect local Wi-Fi / LAN IP address for phone connectivity
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "*Wi-Fi*", "*Wireless*", "*Ethernet*" -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
if (-not $localIp) {
    $localIp = "10.40.43.137"
}

# 1. Start Backend in a new PowerShell window listening on 0.0.0.0
Write-Host "[1/2] Launching FastAPI Backend on 0.0.0.0:8000 (accessible from phone)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; & '.\.venv\Scripts\uvicorn.exe' app.main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Frontend in a new PowerShell window with --host
Write-Host "[2/2] Launching Vite React Frontend on 0.0.0.0:5173..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm run dev -- --host"

Write-Host ""
Write-Host "Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Services started:" -ForegroundColor Yellow
Write-Host "  -> Desktop Web:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "  -> Phone Web:       http://${localIp}:5173" -ForegroundColor Green
Write-Host "  -> Backend Docs:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  -> Phone Backend:   http://${localIp}:8000/docs" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
