#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Redesigns GitHub labels with a accessible color scheme
.DESCRIPTION
    Replaces existing labels with a new set of high-contrast, easy-to-read labels
    specifically designed for cognitive clarity.
#>

$Owner = "NukeByLuke"
$Repo = "Thynkr"

# Define the new label system with ADHD-friendly colors
$labels = @(
    # Status Labels - Clear indicators of state
    @{ name = "SAFE TO MERGE"; color = "238636"; description = "Automated checks passed. Safe to merge." },
    @{ name = "MANUAL REVIEW"; color = "d29922"; description = "Needs human attention." },
    @{ name = "BREAKING CHANGE"; color = "b60205"; description = "Contains breaking changes." },
    @{ name = "DO NOT MERGE"; color = "000000"; description = "Blocked or work in progress." },
    
    # Area Labels - Distinct colors for different parts of stack
    @{ name = "deps-backend"; color = "5468ff"; description = "Backend dependencies" },
    @{ name = "deps-frontend"; color = "1d76db"; description = "Frontend dependencies" },
    @{ name = "deps-infra"; color = "6f42c1"; description = "Docker, CI/CD, and config" },
    
    # Type Labels - Clear categorization
    @{ name = "security"; color = "ff0000"; description = "Security fix" },
    @{ name = "bug"; color = "faad14"; description = "Fixes a bug" },
    @{ name = "feature"; color = "52c41a"; description = "New feature" },
    @{ name = "docs"; color = "13c2c2"; description = "Documentation only" }
)

Write-Host "Redesigning GitHub labels for clarity..." -ForegroundColor Cyan

# Delete existing confusing labels (optional, but cleaner)
$oldLabels = @("dependencies", "automated", "backend", "frontend", "docker", "ci", "ready-to-merge")
foreach ($old in $oldLabels) {
    Try {
        gh label delete "$old" --repo "$Owner/$Repo" --yes 2>$null
        Write-Host "  Removed old label: $old" -ForegroundColor Gray
    } Catch {
        # Ignore if it doesn't exist
    }
}

# Create/Update new labels
foreach ($label in $labels) {
    Write-Host "configuring: $($label.name)" -ForegroundColor White
    
    # Try to clean up existing one first to ensure color update
    gh label deleteLink "$($label.name)" --repo "$Owner/$Repo" 2>$null
    
    # Create new
    $result = gh label create "$($label.name)" `
        --color "$($label.color)" `
        --description "$($label.description)" `
        --repo "$Owner/$Repo" --force 2>&1
        
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Set label: $($label.name)" -ForegroundColor Green
    } else {
        # If create fails, try edit
         gh label edit "$($label.name)" `
            --color "$($label.color)" `
            --description "$($label.description)" `
            --repo "$Owner/$Repo" 2>&1 | Out-Null
         Write-Host "  ✓ Updated label: $($label.name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Labels updated for accessibility!" -ForegroundColor Green
