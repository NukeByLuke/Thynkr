#!/usr/bin/env pwsh
# Merge all Dependabot PRs
# Usage: .\scripts\merge-deps.ps1

Write-Host ""
Write-Host "  Merging all Dependabot PRs..." -ForegroundColor Cyan
Write-Host ""

$prs = gh pr list --author "app/dependabot" --json number,title | ConvertFrom-Json

if ($prs.Count -eq 0) {
    Write-Host "  No Dependabot PRs to merge!" -ForegroundColor Green
    exit 0
}

Write-Host "  Found $($prs.Count) PRs:" -ForegroundColor Yellow
$prs | ForEach-Object { Write-Host "    #$($_.number) - $($_.title)" }
Write-Host ""

foreach ($pr in $prs) {
    Write-Host "  Merging #$($pr.number)..." -NoNewline
    gh pr merge $pr.number --squash --admin 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Done" -ForegroundColor Green
    } else {
        Write-Host " Skipped (checks pending)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  All done!" -ForegroundColor Green
Write-Host ""
