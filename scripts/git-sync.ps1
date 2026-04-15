# PowerShell script to sync with GitHub (pull then push)
# Usage: .\scripts\git-sync.ps1 [commit-message] [branch-name]

param(
    [string]$Message = "",
    [string]$Branch = ""
)

Write-Host "🔄 Git Sync Helper Script" -ForegroundColor Cyan
Write-Host "This will pull latest changes, then push your changes." -ForegroundColor Gray
Write-Host ""

# Get current branch if not specified
if ([string]::IsNullOrEmpty($Branch)) {
    $Branch = git rev-parse --abbrev-ref HEAD
    Write-Host "Current branch: $Branch" -ForegroundColor Yellow
}

# Step 1: Pull latest changes
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "STEP 1: Pulling latest changes" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

& "$PSScriptRoot\git-pull.ps1" -Branch $Branch

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Pull failed. Sync aborted." -ForegroundColor Red
    exit 1
}

# Step 2: Push changes
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "STEP 2: Pushing your changes" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

& "$PSScriptRoot\git-push.ps1" -Message $Message -Branch $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "✅ Sync completed successfully!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Push failed. Please check the error above." -ForegroundColor Red
    exit 1
}

