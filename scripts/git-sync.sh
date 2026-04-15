#!/bin/bash
# Bash script to sync with GitHub (pull then push)
# Usage: ./scripts/git-sync.sh [commit-message] [branch-name]

COMMIT_MSG="${1:-}"
BRANCH="${2:-}"

echo "🔄 Git Sync Helper Script"
echo "This will pull latest changes, then push your changes."
echo ""

# Get current branch if not specified
if [ -z "$BRANCH" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Current branch: $BRANCH"
fi

# Step 1: Pull latest changes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Pulling latest changes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/git-pull.sh" "$BRANCH"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pull failed. Sync aborted."
    exit 1
fi

# Step 2: Push changes
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Pushing your changes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

"$SCRIPT_DIR/git-push.sh" "$COMMIT_MSG" "$BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Sync completed successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ Push failed. Please check the error above."
    exit 1
fi

