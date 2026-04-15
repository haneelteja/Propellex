# PowerShell script to simplify git push operations
# Usage: .\scripts\git-push.ps1 [commit-message] [branch-name]

param(
    [string]$Message = "",
    [string]$Branch = ""
)

Write-Host "🚀 Git Push Helper Script" -ForegroundColor Cyan
Write-Host ""

# Get current branch if not specified
if ([string]::IsNullOrEmpty($Branch)) {
    $Branch = git rev-parse --abbrev-ref HEAD
    Write-Host "Current branch: $Branch" -ForegroundColor Yellow
}

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Changes detected:" -ForegroundColor Yellow
    git status --short
    
    # Stage all changes
    Write-Host "`n📦 Staging all changes..." -ForegroundColor Cyan
    git add .
    
    # Commit if message provided
    if (-not [string]::IsNullOrEmpty($Message)) {
        Write-Host "💾 Committing changes..." -ForegroundColor Cyan
        git commit -m $Message
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Commit failed. Exiting." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  No commit message provided. Changes are staged but not committed." -ForegroundColor Yellow
        Write-Host "   Run: git commit -m 'your message'" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ No changes to commit" -ForegroundColor Green
}

# Fetch latest changes
Write-Host "`n⬇️  Fetching latest changes from remote..." -ForegroundColor Cyan
git fetch origin

# Check if local branch is behind remote
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse "origin/$Branch" 2>$null

if ($remoteCommit -and $localCommit -ne $remoteCommit) {
    Write-Host "⚠️  Local branch is behind remote. Pulling changes..." -ForegroundColor Yellow
    git pull origin $Branch --rebase
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Pull failed. Please resolve conflicts manually." -ForegroundColor Red
        exit 1
    }
}

# Push to remote
Write-Host "`n⬆️  Pushing to origin/$Branch..." -ForegroundColor Cyan
git push origin $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "   Repository: https://github.com/haneelteja/Propellex" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed. Please check the error above." -ForegroundColor Red
    exit 1
}

