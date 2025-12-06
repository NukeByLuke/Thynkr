#!/bin/bash
# Release Process Script
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 1.1.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m'

# Check version argument
if [ -z "$1" ]; then
    echo -e "${RED}❌ Version is required${NC}"
    echo "Usage: ./scripts/release.sh <version>"
    echo "Example: ./scripts/release.sh 1.1.0"
    exit 1
fi

VERSION=$1
TAG_NAME="v$VERSION"

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}❌ Invalid version format. Use semantic versioning: X.Y.Z${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Starting release process for ${TAG_NAME}${NC}"
echo ""

# Step 1: Ensure we're on develop and up to date
echo -e "${YELLOW}📥 Updating develop branch...${NC}"
git checkout develop
git pull origin develop

# Step 2: Run all checks
echo -e "${YELLOW}🔍 Running pre-release checks...${NC}"

echo -e "${GRAY}  → Installing dependencies...${NC}"
pnpm install

echo -e "${GRAY}  → Running lint...${NC}"
if ! pnpm lint; then
    echo -e "${RED}❌ Lint failed. Fix issues before releasing.${NC}"
    exit 1
fi

echo -e "${GRAY}  → Running type check...${NC}"
if ! pnpm typecheck; then
    echo -e "${RED}❌ Type check failed. Fix issues before releasing.${NC}"
    exit 1
fi

echo -e "${GRAY}  → Running build...${NC}"
if ! pnpm build; then
    echo -e "${RED}❌ Build failed. Fix issues before releasing.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""

# Step 3: Merge develop into main
echo -e "${YELLOW}🔀 Merging develop → main...${NC}"
git checkout main
git pull origin main
git merge --no-ff develop -m "chore: release $TAG_NAME"

# Step 4: Create tag
echo -e "${YELLOW}🏷️  Creating tag ${TAG_NAME}...${NC}"
git tag -a "$TAG_NAME" -m "Release $TAG_NAME"

# Step 5: Push everything
echo -e "${YELLOW}📤 Pushing main and tag...${NC}"
git push origin main
git push origin "$TAG_NAME"

# Step 6: Switch back to develop
echo -e "${YELLOW}🔄 Switching back to develop...${NC}"
git checkout develop

# Success message
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Release ${TAG_NAME} completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Go to GitHub → Releases → Create release from tag $TAG_NAME"
echo "  2. Add release notes from docs/CHANGELOG.md"
echo "  3. Update docs/ROADMAP.md with completed items"
echo "  4. The deploy workflow will auto-deploy to production"
echo ""
echo -e "${BLUE}GitHub Release URL:${NC}"
echo "  https://github.com/NukeByLuke/Thynkr/releases/new?tag=$TAG_NAME"
echo ""
