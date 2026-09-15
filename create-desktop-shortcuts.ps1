# Create Smart Attendance Desktop Shortcuts
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ProjectDir = $PSScriptRoot
$WshShell = New-Object -ComObject WScript.Shell

# 1. Start Server Shortcut
$StartPath = Join-Path $DesktopPath "Start Smart Attendance.lnk"
$StartShortcut = $WshShell.CreateShortcut($StartPath)
$StartShortcut.TargetPath = Join-Path $ProjectDir "start-dev.bat"
$StartShortcut.WorkingDirectory = $ProjectDir
$StartShortcut.Description = "Start Smart Attendance Full-Stack Servers (Backend + Frontend)"
# Green play / run icon from shell32
$StartShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,137"
$StartShortcut.Save()
Write-Host "Created shortcut: $StartPath" -ForegroundColor Green

# 2. Stop Server Shortcut
$StopPath = Join-Path $DesktopPath "Stop Smart Attendance.lnk"
$StopShortcut = $WshShell.CreateShortcut($StopPath)
$StopShortcut.TargetPath = Join-Path $ProjectDir "stop-dev.bat"
$StopShortcut.WorkingDirectory = $ProjectDir
$StopShortcut.Description = "Stop Smart Attendance Full-Stack Servers"
# Red stop / power icon from shell32
$StopShortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,131"
$StopShortcut.Save()
Write-Host "Created shortcut: $StopPath" -ForegroundColor Green

Write-Host "`nDesktop shortcuts configured successfully!" -ForegroundColor Cyan
