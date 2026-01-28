#!/bin/bash
# Creates GitHub labels required by Dependabot and workflows
# Run this once to set up your repository with the required labels.

set -e

OWNER="${1:-luked177}"
REPO="${2:-Thynkr}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Please install it first: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "Creating GitHub labels for $OWNER/$REPO..."

# Define labels needed by Dependabot and workflows
declare -a labels=(
    "dependencies:0366d6:Pull requests that update a dependency file"
    "automated:00ff00:Automated changes from bots or scripts"
    "backend:d73a4a:Backend-related changes"
    "frontend:0075ca:Frontend-related changes"
    "docker:384d54:Docker and containerization"
    "documentation:0075ca:Improvements or additions to documentation"
    "enhancement:a2eeef:New feature or request"
    "bug:d73a4a:Something isn't working"
    "security:ee0701:Security-related changes"
)

created=0
existing=0
failed=0

for label_def in "${labels[@]}"; do
    IFS=':' read -r name color description <<< "$label_def"
    
    echo ""
    echo "Processing label: $name"
    
    if gh label create "$name" \
        --color "$color" \
        --description "$description" \
        --repo "$OWNER/$REPO" 2>&1; then
        echo "  ✓ Created label: $name"
        ((created++))
    else
        if [[ $? -eq 1 ]]; then
            echo "  ℹ Label already exists: $name"
            ((existing++))
        else
            echo "  ✗ Failed to create label: $name"
            ((failed++))
        fi
    fi
done

echo ""
echo "============================================================"
echo "Summary:"
echo "  Created:  $created"
echo "  Existing: $existing"
echo "  Failed:   $failed"
echo "============================================================"

if [ $failed -gt 0 ]; then
    echo ""
    echo "Some labels could not be created. Check the errors above."
    exit 1
fi

echo ""
echo "✓ All labels are ready! Dependabot should work now."
