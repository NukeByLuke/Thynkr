# Merge Feature Branch Script for Windows
# Usage: .\scripts\merge-feature.ps1 <feature-name>
# Example: .\scripts\merge-feature.ps1 stripe-webhooks

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$FeatureName
)

$ErrorActionPreference = "Stop"

$BranchName = "feature/$FeatureName"

Write-Host ""
Write-Host "🔀 Merging $BranchName → develop" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify branch exists
$branches = git branch --list $BranchName
if (-not $branches) {
    Write-Host "❌ Branch '$BranchName' does not exist" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available feature branches:" -ForegroundColor Yellow
    git branch --list "feature/*"
    exit 1
}

# Step 2: Ensure feature branch is up to date with develop
Write-Host "📥 Updating develop..." -ForegroundColor Yellow
git checkout develop
git pull origin develop

Write-Host "🔄 Rebasing $BranchName on develop..." -ForegroundColor Yellow
git checkout $BranchName
git rebase develop

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rebase failed. Resolve conflicts, then run:" -ForegroundColor Red
    Write-Host "   git rebase --continue" -ForegroundColor Gray
    Write-Host "   .\scripts\merge-feature.ps1 $FeatureName" -ForegroundColor Gray
    exit 1
}

# Step 3: Run checks on feature branch
Write-Host "🔍 Running pre-merge checks..." -ForegroundColor Yellow

Write-Host "  → Running lint..." -ForegroundColor Gray
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lint failed. Fix issues before merging." -ForegroundColor Red
    exit 1
}

Write-Host "  → Running type check..." -ForegroundColor Gray
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type check failed. Fix issues before merging." -ForegroundColor Red
    exit 1
}

Write-Host "  → Running build..." -ForegroundColor Gray
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Fix issues before merging." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All checks passed!" -ForegroundColor Green
Write-Host ""

# Step 4: Merge into develop
Write-Host "🔀 Merging into develop..." -ForegroundColor Yellow
git checkout develop
git merge --no-ff $BranchName -m "feat: merge $BranchName"

# Step 5: Push develop
Write-Host "📤 Pushing develop..." -ForegroundColor Yellow
git push origin develop

# Step 6: Ask about branch deletion
Write-Host ""
Write-Host "✅ Merge complete!" -ForegroundColor Green
Write-Host ""
$delete = Read-Host "Delete branch '$BranchName'? (y/N)"
if ($delete -eq 'y' -or $delete -eq 'Y') {
    git branch -d $BranchName
    git push origin --delete $BranchName 2>$null
    Write-Host "🗑️  Branch deleted" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ $BranchName merged into develop successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Don't forget to update docs/CHANGELOG.md!" -ForegroundColor Yellow
Write-Host ""
