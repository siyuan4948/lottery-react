#!/bin/bash

# ===========================================
# Lottery React App Deployment Script
# ===========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="siyuan4948"
REPO_NAME="lottery-react"
BRANCH="master"
DEPLOY_PATH="/"

echo -e "${GREEN}🎰 Lottery React Deployment Script${NC}"
echo "=================================="

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the lottery-react directory.${NC}"
    exit 1
fi

# Step 2: Build the React app
echo ""
echo -e "${YELLOW}📦 Step 1/4: Building React app...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Error: Build failed, dist directory not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful!${NC}"

# Step 3: Copy build artifacts to root directory
echo ""
echo -e "${YELLOW}📁 Step 2/4: Copying build artifacts to root...${NC}"
cp -r dist/* .
rm -rf dist
echo -e "${GREEN}✅ Files copied to root directory${NC}"

# Step 4: Check if there are changes to commit
echo ""
echo -e "${YELLOW}📝 Step 3/4: Checking for changes...${NC}"
git add -A

if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    echo "Changes detected:"
    git diff --cached --stat
    echo ""
    read -p "Commit message (default: 'Deploy: $(date)'): " COMMIT_MSG
    COMMIT_MSG=${COMMIT_MSG:-"Deploy: $(date)"}
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Step 5: Push to GitHub
echo ""
echo -e "${YELLOW}🚀 Step 4/4: Pushing to GitHub...${NC}"
git push origin $BRANCH
echo -e "${GREEN}✅ Pushed to GitHub${NC}"

# Step 6: Enable/Update GitHub Pages
echo ""
echo -e "${YELLOW}🌐 Configuring GitHub Pages...${NC}"

# Delete existing Pages configuration
echo "Removing old Pages configuration..."
gh api -X DELETE repos/$REPO_OWNER/$REPO_NAME/pages 2>/dev/null || echo "No existing Pages config to remove"

# Create new Pages configuration
echo "Creating new Pages configuration..."
PAGES_RESPONSE=$(gh api repos/$REPO_OWNER/$REPO_NAME/pages -X POST --input - <<EOF
{
  "build_type": "legacy",
  "source": {
    "branch": "$BRANCH",
    "path": "$DEPLOY_PATH"
  }
}
EOF
)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ GitHub Pages configured successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub Pages configuration may have failed, but the files are pushed${NC}"
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""
echo "📱 Access your lottery app at:"
echo -e "${GREEN}https://$REPO_OWNER.github.io/$REPO_NAME/${NC}"
echo ""
echo "📋 Deployment Summary:"
echo "   - Repository: $REPO_OWNER/$REPO_NAME"
echo "   - Branch: $BRANCH"
echo "   - Path: $DEPLOY_PATH"
echo ""
