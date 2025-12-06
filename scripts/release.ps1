# Release Process Script for Windows
# Usage: .\scripts\release.ps1 <version>
# Example: .\scripts\release.ps1 1.1.0

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

# Validate version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Invalid version format. Use semantic versioning: X.Y.Z" -ForegroundColor Red
    Write-Host "Example: .\scripts\release.ps1 1.1.0"
    exit 1
}

$TagName = "v$Version"

Write-Host ""
Write-Host "🚀 Starting release process for $TagName" -ForegroundColor Cyan
Write-Host ""

# Step 1: Ensure we're on develop and up to date
Write-Host "📥 Updating develop branch..." -ForegroundColor Yellow
git checkout develop
git pull origin develop

# Step 2: Run all checks
Write-Host "🔍 Running pre-release checks..." -ForegroundColor Yellow

Write-Host "  → Installing dependencies..." -ForegroundColor Gray
pnpm install

Write-Host "  → Running lint..." -ForegroundColor Gray
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lint failed. Fix issues before releasing." -ForegroundColor Red
    exit 1
}

Write-Host "  → Running type check..." -ForegroundColor Gray
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type check failed. Fix issues before releasing." -ForegroundColor Red
    exit 1
}

Write-Host "  → Running build..." -ForegroundColor Gray
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Fix issues before releasing." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All checks passed!" -ForegroundColor Green
Write-Host ""

# Step 3: Merge develop into main
Write-Host "🔀 Merging develop → main..." -ForegroundColor Yellow
git checkout main
git pull origin main
git merge --no-ff develop -m "chore: release $TagName"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Merge failed. Resolve conflicts and try again." -ForegroundColor Red
    exit 1
}

# Step 4: Create tag
Write-Host "🏷️  Creating tag $TagName..." -ForegroundColor Yellow
git tag -a $TagName -m "Release $TagName"

# Step 5: Push everything
Write-Host "📤 Pushing main and tag..." -ForegroundColor Yellow
git push origin main
git push origin $TagName

# Step 6: Switch back to develop
Write-Host "🔄 Switching back to develop..." -ForegroundColor Yellow
git checkout develop

# Success message
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Release $TagName completed successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Go to GitHub → Releases → Create release from tag $TagName"
Write-Host "  2. Add release notes from docs/CHANGELOG.md"
Write-Host "  3. Update docs/ROADMAP.md with completed items"
Write-Host "  4. The deploy workflow will auto-deploy to production"
Write-Host ""
Write-Host "GitHub Release URL:" -ForegroundColor Cyan
Write-Host "  https://github.com/NukeByLuke/Thynkr/releases/new?tag=$TagName"
Write-Host ""
