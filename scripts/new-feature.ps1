# Feature Branch Creation Script for Windows
# Usage: .\scripts\new-feature.ps1 <feature-name>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$FeatureName
)

$ErrorActionPreference = "Stop"

$BranchName = "feature/$FeatureName"

Write-Host ""
Write-Host "🚀 Creating feature branch: $BranchName" -ForegroundColor Cyan
Write-Host ""

# Step 1: Ensure we're on develop and up to date
Write-Host "📥 Switching to develop and pulling latest..." -ForegroundColor Yellow
git checkout develop
if ($LASTEXITCODE -ne 0) { throw "Failed to checkout develop" }

git pull origin develop
if ($LASTEXITCODE -ne 0) { throw "Failed to pull develop" }

# Step 2: Create the feature branch
Write-Host "🌿 Creating branch: $BranchName" -ForegroundColor Yellow
git checkout -b $BranchName
if ($LASTEXITCODE -ne 0) { throw "Failed to create branch" }

# Step 3: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Step 4: Run checks
Write-Host "🔍 Running lint check..." -ForegroundColor Yellow
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Lint warnings found (continuing...)" -ForegroundColor Yellow
}

Write-Host "📝 Running type check..." -ForegroundColor Yellow
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Type warnings found (continuing...)" -ForegroundColor Yellow
}

# Step 5: Success message
Write-Host ""
Write-Host "✅ Feature branch created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Branch: " -NoNewline
Write-Host $BranchName -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Make your changes"
Write-Host "  2. Commit with conventional format:"
Write-Host "     git commit -m `"feat: add your feature`""
Write-Host "  3. Push when ready:"
Write-Host "     git push origin $BranchName"
Write-Host "  4. Open PR to merge into develop"
Write-Host ""
Write-Host "📝 Don't forget to update docs/CHANGELOG.md!" -ForegroundColor Yellow
