#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates GitHub labels required by Dependabot and workflows
.DESCRIPTION
    This script creates all labels referenced in .github/dependabot.yml
    Run this once to set up your repository with the required labels.
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Owner = "luked177",
    
    [Parameter(Mandatory=$false)]
    [string]$Repo = "Thynkr"
)

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is not installed. Please install it first: https://cli.github.com/"
    exit 1
}

# Check if authenticated
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Not authenticated with GitHub CLI. Run: gh auth login"
    exit 1
}

Write-Host "Creating GitHub labels for $Owner/$Repo..." -ForegroundColor Cyan

# Define labels needed by Dependabot and workflows
$labels = @(
    @{ name = "dependencies"; color = "0366d6"; description = "Pull requests that update a dependency file" },
    @{ name = "automated"; color = "00ff00"; description = "Automated changes from bots or scripts" },
    @{ name = "backend"; color = "d73a4a"; description = "Backend-related changes" },
    @{ name = "frontend"; color = "0075ca"; description = "Frontend-related changes" },
    @{ name = "docker"; color = "384d54"; description = "Docker and containerization" },
    @{ name = "documentation"; color = "0075ca"; description = "Improvements or additions to documentation" },
    @{ name = "enhancement"; color = "a2eeef"; description = "New feature or request" },
    @{ name = "bug"; color = "d73a4a"; description = "Something isn't working" },
    @{ name = "security"; color = "ee0701"; description = "Security-related changes" }
)

$created = 0
$existing = 0
$failed = 0

foreach ($label in $labels) {
    Write-Host ""
    Write-Host "Processing label: $($label.name)" -ForegroundColor Yellow
    
    # Try to create the label
    $result = gh label create $label.name `
        --color $label.color `
        --description $label.description `
        --repo "$Owner/$Repo" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Created label: $($label.name)" -ForegroundColor Green
        $created++
    }
    else {
        # Check if it already exists
        if ($result -match "already exists") {
            Write-Host "  Label already exists: $($label.name)" -ForegroundColor Gray
            $existing++
        }
        else {
            Write-Host "  Failed to create label: $($label.name)" -ForegroundColor Red
            Write-Host "    Error: $result" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host ("="*60) -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Created:  $created" -ForegroundColor Green
Write-Host "  Existing: $existing" -ForegroundColor Gray
Write-Host "  Failed:   $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host ("="*60) -ForegroundColor Cyan

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "Some labels could not be created. Check the errors above." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "All labels are ready! Dependabot should work now." -ForegroundColor Green
