# Git Helper Scripts

This directory contains helper scripts to simplify common Git operations with your GitHub repository.

## Available Scripts

### PowerShell Scripts (Windows)
- **`git-push.ps1`** - Push changes to GitHub
- **`git-pull.ps1`** - Pull latest changes from GitHub
- **`git-sync.ps1`** - Sync with GitHub (pull then push)

### Bash Scripts (Git Bash / Linux / Mac)
- **`git-push.sh`** - Push changes to GitHub
- **`git-pull.sh`** - Pull latest changes from GitHub
- **`git-sync.sh`** - Sync with GitHub (pull then push)

## Usage

### PowerShell (Windows)

#### Push changes:
```powershell
# Push with commit message
.\scripts\git-push.ps1 -Message "Your commit message"

# Push to specific branch
.\scripts\git-push.ps1 -Message "Your commit message" -Branch "feature-branch"

# Just push (if already committed)
.\scripts\git-push.ps1
```

#### Pull changes:
```powershell
# Pull from current branch
.\scripts\git-pull.ps1

# Pull from specific branch
.\scripts\git-pull.ps1 -Branch "main"
```

#### Sync (pull then push):
```powershell
# Sync with commit message
.\scripts\git-sync.ps1 -Message "Your commit message"

# Sync to specific branch
.\scripts\git-sync.ps1 -Message "Your commit message" -Branch "main"
```

### Bash (Git Bash / Linux / Mac)

First, make scripts executable:
```bash
chmod +x scripts/*.sh
```

#### Push changes:
```bash
# Push with commit message
./scripts/git-push.sh "Your commit message"

# Push to specific branch
./scripts/git-push.sh "Your commit message" "feature-branch"

# Just push (if already committed)
./scripts/git-push.sh
```

#### Pull changes:
```bash
# Pull from current branch
./scripts/git-pull.sh

# Pull from specific branch
./scripts/git-pull.sh "main"
```

#### Sync (pull then push):
```bash
# Sync with commit message
./scripts/git-sync.sh "Your commit message"

# Sync to specific branch
./scripts/git-sync.sh "Your commit message" "main"
```

## Features

### git-push.ps1 / git-push.sh
- Automatically stages all changes
- Commits with provided message
- Fetches latest changes before pushing
- Pulls and rebases if local branch is behind
- Shows helpful status messages

### git-pull.ps1 / git-pull.sh
- Checks for uncommitted changes
- Offers to stash changes if needed
- Fetches and pulls latest changes
- Restores stashed changes after pull
- Shows current status after pull

### git-sync.ps1 / git-sync.sh
- Combines pull and push operations
- Ensures you're up to date before pushing
- Handles conflicts gracefully

## Notes

- All scripts will use your current branch if not specified
- Scripts will prompt you if there are conflicts or issues
- The scripts respect your Git hooks (pre-commit, pre-push)
- Make sure you have Git installed and configured

## Troubleshooting

If you encounter permission errors on Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

If scripts don't work, make sure:
1. Git is installed and in your PATH
2. You're in the repository root directory
3. You have write permissions to the repository

