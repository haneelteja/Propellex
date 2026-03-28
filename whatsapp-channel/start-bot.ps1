# WhatsApp Claude Bot — background launcher
# Called by Windows Task Scheduler at login

$env:CLAUDE_CODE_GIT_BASH_PATH = "C:\Users\Haneel Teja\AppData\Local\Programs\Git\bin\bash.exe"

# Ensure npm global bin is in PATH (needed for `claude` command)
$env:PATH = "$env:APPDATA\npm;$env:PATH"

$botDir = "C:\Users\Haneel Teja\Cursor Applications\Propellex\Propellex\whatsapp-channel"
$logFile = Join-Path $botDir "bot.log"
$nodeExe = "C:\Program Files\nodejs\node.exe"

Set-Location $botDir

# Append timestamped start marker to log
Add-Content $logFile "`n=== Bot started $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===`n"

# Run node, redirect all output to bot.log
& $nodeExe --import tsx/esm server.ts *>> $logFile
