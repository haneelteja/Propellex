# PowerShell script to simplify git pull operations
# Usage: .\scripts\git-pull.ps1 [branch-name]

param(
    [string]$Branch = ""
)

Write-Host "⬇️  Git Pull Helper Script" -ForegroundColor Cyan
Write-Host ""

# Get current branch if not specified
if ([string]::IsNullOrEmpty($Branch)) {
    $Branch = git rev-parse --abbrev-ref HEAD
    Write-Host "Current branch: $Branch" -ForegroundColor Yellow
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  Warning: You have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host "`nOptions:" -ForegroundColor Cyan
    Write-Host "  1. Stash changes and pull"
    Write-Host "  2. Commit changes first"
    Write-Host "  3. Cancel"
    
    $choice = Read-Host "`nEnter your choice (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host "📦 Stashing changes..." -ForegroundColor Cyan
            git stash push -m "Auto-stash before pull $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }
        "2" {
            Write-Host "💾 Please commit your changes first:" -ForegroundColor Yellow
            Write-Host "   git add ." -ForegroundColor Cyan
            Write-Host "   git commit -m 'your message'" -ForegroundColor Cyan
            exit 0
        }
        "3" {
            Write-Host "❌ Pull cancelled." -ForegroundColor Red
            exit 0
        }
        default {
            Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
            exit 1
        }
    }
}

# Fetch latest changes
Write-Host "`n📥 Fetching latest changes from remote..." -ForegroundColor Cyan
git fetch origin

# Check if branch exists on remote
$remoteBranch = git ls-remote --heads origin $Branch
if (-not $remoteBranch) {
    Write-Host "⚠️  Branch '$Branch' does not exist on remote." -ForegroundColor Yellow
    Write-Host "   Available branches:" -ForegroundColor Cyan
    git branch -r | ForEach-Object { Write-Host "   $_" }
    exit 0
}

# Pull changes
Write-Host "⬇️  Pulling changes from origin/$Branch..." -ForegroundColor Cyan
git pull origin $Branch --rebase

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pulled latest changes!" -ForegroundColor Green
    
    # Restore stashed changes if any
    if ($choice -eq "1") {
        $stashList = git stash list
        if ($stashList) {
            Write-Host "`n📦 Restoring stashed changes..." -ForegroundColor Cyan
            git stash pop
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "⚠️  Warning: There were conflicts when restoring stashed changes." -ForegroundColor Yellow
                Write-Host "   Please resolve them manually." -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n📊 Current status:" -ForegroundColor Cyan
    git status --short
} else {
    Write-Host "`n❌ Pull failed. Please check the error above." -ForegroundColor Red
    exit 1
}

