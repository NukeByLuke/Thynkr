#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Shows Dependabot PRs ready to merge
.DESCRIPTION
    Displays a clean summary of Dependabot PRs with passing checks and approval status
#>

Write-Host "`nChecking Dependabot PRs..." -ForegroundColor Cyan
Write-Host ("="*80) -ForegroundColor Cyan

$prs = gh pr list --author "app/dependabot" --json number,title,url,statusCheckRollup,reviewDecision --jq '.[]'

if (-not $prs) {
    Write-Host "`nNo Dependabot PRs found." -ForegroundColor Yellow
    exit 0
}

$prs | ConvertFrom-Json | ForEach-Object {
    $number = $_.number
    $title = $_.title
    $url = $_.url
    $checks = $_.statusCheckRollup
    $approved = $_.reviewDecision -eq "APPROVED"
    
    # Count check states
    $passing = ($checks | Where-Object { $_.conclusion -eq "SUCCESS" -or $_.conclusion -eq "SKIPPED" }).Count
    $total = $checks.Count
    $failing = ($checks | Where-Object { $_.conclusion -eq "FAILURE" }).Count
    
    Write-Host "`n#$number - $title" -ForegroundColor White
    Write-Host "  URL: $url" -ForegroundColor Gray
    
    if ($total -eq 0) {
        Write-Host "  Status: ⏳ Checks pending..." -ForegroundColor Yellow
        Write-Host "  Approved: $(if ($approved) { '✓ Yes' } else { '✗ No' })" -ForegroundColor $(if ($approved) { "Green" } else { "Red" })
    }
    elseif ($failing -gt 0) {
        Write-Host "  Status: ❌ $failing failing, $passing/$total passing" -ForegroundColor Red
        Write-Host "  Approved: $(if ($approved) { '✓ Yes' } else { '✗ No' })" -ForegroundColor $(if ($approved) { "Green" } else { "Red" })
    }
    elseif ($passing -eq $total) {
        Write-Host "  Status: ✅ All checks passing ($total/$total)" -ForegroundColor Green
        Write-Host "  Approved: $(if ($approved) { '✓ Yes' } else { '✗ No' })" -ForegroundColor $(if ($approved) { "Green" } else { "Red" })
        
        if ($approved) {
            Write-Host "  👍 SAFE TO MERGE" -ForegroundColor Green -BackgroundColor DarkGreen
        }
    }
    else {
        Write-Host "  Status: ⏳ $passing/$total checks complete" -ForegroundColor Yellow
        Write-Host "  Approved: $(if ($approved) { '✓ Yes' } else { '✗ No' })" -ForegroundColor $(if ($approved) { "Green" } else { "Red" })
    }
}

Write-Host "`n" + ("="*80) -ForegroundColor Cyan
Write-Host "`nTo merge all safe PRs, run:" -ForegroundColor Cyan
Write-Host "  gh pr list --author 'app/dependabot' --search 'review:approved' --json number --jq '.[].number' | ForEach-Object { gh pr merge `$_ --squash }" -ForegroundColor White
Write-Host ""
