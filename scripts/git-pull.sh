#!/bin/bash
# Bash script to simplify git pull operations (for Git Bash on Windows or Linux/Mac)
# Usage: ./scripts/git-pull.sh [branch-name]

BRANCH="${1:-}"

echo "⬇️  Git Pull Helper Script"
echo ""

# Get current branch if not specified
if [ -z "$BRANCH" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Current branch: $BRANCH"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes:"
    git status --short
    echo ""
    echo "Options:"
    echo "  1. Stash changes and pull"
    echo "  2. Commit changes first"
    echo "  3. Cancel"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            echo "📦 Stashing changes..."
            git stash push -m "Auto-stash before pull $(date '+%Y-%m-%d %H:%M:%S')"
            ;;
        2)
            echo "💾 Please commit your changes first:"
            echo "   git add ."
            echo "   git commit -m 'your message'"
            exit 0
            ;;
        3)
            echo "❌ Pull cancelled."
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Exiting."
            exit 1
            ;;
    esac
fi

# Fetch latest changes
echo ""
echo "📥 Fetching latest changes from remote..."
git fetch origin

# Check if branch exists on remote
REMOTE_BRANCH=$(git ls-remote --heads origin "$BRANCH")
if [ -z "$REMOTE_BRANCH" ]; then
    echo "⚠️  Branch '$BRANCH' does not exist on remote."
    echo "   Available branches:"
    git branch -r
    exit 0
fi

# Pull changes
echo "⬇️  Pulling changes from origin/$BRANCH..."
git pull origin "$BRANCH" --rebase

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pulled latest changes!"
    
    # Restore stashed changes if any
    if [ "$choice" = "1" ] && [ -n "$(git stash list)" ]; then
        echo ""
        echo "📦 Restoring stashed changes..."
        git stash pop
        
        if [ $? -ne 0 ]; then
            echo "⚠️  Warning: There were conflicts when restoring stashed changes."
            echo "   Please resolve them manually."
        fi
    fi
    
    echo ""
    echo "📊 Current status:"
    git status --short
else
    echo ""
    echo "❌ Pull failed. Please check the error above."
    exit 1
fi

