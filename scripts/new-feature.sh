#!/bin/bash
# Feature Branch Creation Script
# Usage: ./scripts/new-feature.sh <feature-name>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if feature name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Feature name is required${NC}"
    echo "Usage: ./scripts/new-feature.sh <feature-name>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/new-feature.sh stripe-webhooks"
    echo "  ./scripts/new-feature.sh admin-dashboard"
    exit 1
fi

FEATURE_NAME=$1
BRANCH_NAME="feature/$FEATURE_NAME"

echo -e "${BLUE}🚀 Creating feature branch: ${BRANCH_NAME}${NC}"
echo ""

# Step 1: Ensure we're on develop and up to date
echo -e "${YELLOW}📥 Switching to develop and pulling latest...${NC}"
git checkout develop
git pull origin develop

# Step 2: Create the feature branch
echo -e "${YELLOW}🌿 Creating branch: ${BRANCH_NAME}${NC}"
git checkout -b "$BRANCH_NAME"

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

# Step 4: Run checks
echo -e "${YELLOW}🔍 Running lint check...${NC}"
pnpm lint || echo -e "${YELLOW}⚠️  Lint warnings found (continuing...)${NC}"

echo -e "${YELLOW}📝 Running type check...${NC}"
pnpm typecheck || echo -e "${YELLOW}⚠️  Type warnings found (continuing...)${NC}"

# Step 5: Success message
echo ""
echo -e "${GREEN}✅ Feature branch created successfully!${NC}"
echo ""
echo -e "Branch: ${BLUE}${BRANCH_NAME}${NC}"
echo ""
echo "Next steps:"
echo "  1. Make your changes"
echo "  2. Commit with conventional format:"
echo "     git commit -m \"feat: add your feature\""
echo "  3. Push when ready:"
echo "     git push origin $BRANCH_NAME"
echo "  4. Open PR to merge into develop"
echo ""
echo -e "${YELLOW}📝 Don't forget to update docs/CHANGELOG.md!${NC}"
