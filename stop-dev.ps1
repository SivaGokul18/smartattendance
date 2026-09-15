# Smart Attendance PowerShell Server Stopper
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "      Stopping Smart Attendance Full-Stack         " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$ports = @(8000, 5173)
$stopped = 0

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -and $p -ne 0) {
                Write-Host "Terminating process $p on port $port..." -ForegroundColor Yellow
                & taskkill /F /T /PID $p 2>$null
                $stopped++
            }
        }
    }
}

& taskkill /F /FI "WINDOWTITLE eq Smart Attendance - *" 2>$null

if ($stopped -gt 0) {
    Write-Host "`nAll Smart Attendance servers stopped successfully." -ForegroundColor Green
} else {
    Write-Host "`nNo Smart Attendance services found running on ports 8000 or 5173." -ForegroundColor Cyan
}

Write-Host "===================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
