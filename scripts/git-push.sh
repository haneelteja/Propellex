#!/bin/bash
# Bash script to simplify git push operations (for Git Bash on Windows or Linux/Mac)
# Usage: ./scripts/git-push.sh [commit-message] [branch-name]

COMMIT_MSG="${1:-}"
BRANCH="${2:-}"

echo "🚀 Git Push Helper Script"
echo ""

# Get current branch if not specified
if [ -z "$BRANCH" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Current branch: $BRANCH"
fi

# Check if there are changes to commit
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected:"
    git status --short
    
    # Stage all changes
    echo ""
    echo "📦 Staging all changes..."
    git add .
    
    # Commit if message provided
    if [ -n "$COMMIT_MSG" ]; then
        echo "💾 Committing changes..."
        git commit -m "$COMMIT_MSG"
        
        if [ $? -ne 0 ]; then
            echo "❌ Commit failed. Exiting."
            exit 1
        fi
    else
        echo "⚠️  No commit message provided. Changes are staged but not committed."
        echo "   Run: git commit -m 'your message'"
    fi
else
    echo "✅ No changes to commit"
fi

# Fetch latest changes
echo ""
echo "⬇️  Fetching latest changes from remote..."
git fetch origin

# Check if local branch is behind remote
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH" 2>/dev/null)

if [ -n "$REMOTE_COMMIT" ] && [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "⚠️  Local branch is behind remote. Pulling changes..."
    git pull origin "$BRANCH" --rebase
    
    if [ $? -ne 0 ]; then
        echo "❌ Pull failed. Please resolve conflicts manually."
        exit 1
    fi
fi

# Push to remote
echo ""
echo "⬆️  Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "   Repository: https://github.com/haneelteja/Propellex"
else
    echo ""
    echo "❌ Push failed. Please check the error above."
    exit 1
fi

