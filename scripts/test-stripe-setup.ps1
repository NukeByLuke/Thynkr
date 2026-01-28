# Stripe Payment System Test Script
# Run this to verify your Stripe integration is working correctly

Write-Host "🧪 Thynkr Stripe Payment System Test" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$errors = @()
$warnings = @()

# Test 1: Check if we're in the right directory
Write-Host "📂 Test 1: Checking directory structure..." -ForegroundColor Yellow
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    $errors += "Not in the Thynkr root directory"
    Write-Host "   ❌ FAILED: Run this script from the Thynkr root directory" -ForegroundColor Red
} else {
    Write-Host "   ✅ PASSED: In correct directory" -ForegroundColor Green
}
Write-Host ""

# Test 2: Check backend .env file
Write-Host "📂 Test 2: Checking backend environment file..." -ForegroundColor Yellow
if (-not (Test-Path "backend\.env")) {
    $errors += "Backend .env file missing"
    Write-Host "   ❌ FAILED: backend\.env not found" -ForegroundColor Red
} else {
    Write-Host "   ✅ PASSED: backend\.env exists" -ForegroundColor Green
    
    # Check for required Stripe variables
    $backendEnv = Get-Content "backend\.env" -Raw
    
    $requiredVars = @(
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PRICE_STANDARD_MONTHLY",
        "STRIPE_PRICE_STANDARD_YEARLY",
        "STRIPE_PRICE_PREMIUM_MONTHLY",
        "STRIPE_PRICE_PREMIUM_YEARLY"
    )
    
    foreach ($var in $requiredVars) {
        if ($backendEnv -match "$var=.+") {
            $value = ($backendEnv | Select-String -Pattern "$var=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
            if ($value -match "your_.*|price_test_.*|sk_test_your.*|pk_test_your.*|whsec_your.*") {
                $warnings += "Backend $var needs to be set to actual value"
                Write-Host "   ⚠️  WARNING: $var is set to placeholder value" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ $var is configured" -ForegroundColor Green
            }
        } else {
            $errors += "Backend $var is missing"
            Write-Host "   ❌ FAILED: $var not found in backend\.env" -ForegroundColor Red
        }
    }
}
Write-Host ""

# Test 3: Check frontend .env file
Write-Host "📂 Test 3: Checking frontend environment file..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\.env")) {
    $errors += "Frontend .env file missing"
    Write-Host "   ❌ FAILED: frontend\.env not found" -ForegroundColor Red
} else {
    Write-Host "   ✅ PASSED: frontend\.env exists" -ForegroundColor Green
    
    $frontendEnv = Get-Content "frontend\.env" -Raw
    
    $requiredFrontendVars = @(
        "VITE_STRIPE_PUBLIC_KEY",
        "VITE_STRIPE_PRICE_STANDARD_MONTHLY",
        "VITE_STRIPE_PRICE_STANDARD_YEARLY",
        "VITE_STRIPE_PRICE_PREMIUM_MONTHLY",
        "VITE_STRIPE_PRICE_PREMIUM_YEARLY"
    )
    
    foreach ($var in $requiredFrontendVars) {
        if ($frontendEnv -match "$var=.+") {
            $value = ($frontendEnv | Select-String -Pattern "$var=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
            if ($value -match "pk_test_your.*|price_test_.*") {
                $warnings += "Frontend $var needs to be set to actual value"
                Write-Host "   ⚠️  WARNING: $var is set to placeholder value" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ $var is configured" -ForegroundColor Green
            }
        } else {
            $errors += "Frontend $var is missing"
            Write-Host "   ❌ FAILED: $var not found in frontend\.env" -ForegroundColor Red
        }
    }
}
Write-Host ""

# Test 4: Check if Stripe CLI is available
Write-Host "🔧 Test 4: Checking Stripe CLI..." -ForegroundColor Yellow
try {
    $stripeVersion = & stripe --version 2>$null
    Write-Host "   ✅ PASSED: Stripe CLI is installed ($stripeVersion)" -ForegroundColor Green
} catch {
    $warnings += "Stripe CLI not found in PATH"
    Write-Host "   ⚠️  WARNING: Stripe CLI not found in PATH" -ForegroundColor Yellow
    Write-Host "   Install with: scoop install stripe" -ForegroundColor Gray
}
Write-Host ""

# Test 5: Check if Node/pnpm is available
Write-Host "🔧 Test 5: Checking Node.js and pnpm..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>$null
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    $errors += "Node.js not found"
    Write-Host "   ❌ FAILED: Node.js not installed" -ForegroundColor Red
}

try {
    $pnpmVersion = & pnpm --version 2>$null
    Write-Host "   ✅ pnpm: v$pnpmVersion" -ForegroundColor Green
} catch {
    $errors += "pnpm not found"
    Write-Host "   ❌ FAILED: pnpm not installed (install with: npm install -g pnpm)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Check if backend dependencies are installed
Write-Host "📦 Test 6: Checking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "   ✅ PASSED: Backend dependencies installed" -ForegroundColor Green
} else {
    $warnings += "Backend dependencies not installed"
    Write-Host "   ⚠️  WARNING: Run 'cd backend && pnpm install'" -ForegroundColor Yellow
}
Write-Host ""

# Test 7: Check if frontend dependencies are installed
Write-Host "📦 Test 7: Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "   ✅ PASSED: Frontend dependencies installed" -ForegroundColor Green
} else {
    $warnings += "Frontend dependencies not installed"
    Write-Host "   ⚠️  WARNING: Run 'cd frontend && pnpm install'" -ForegroundColor Yellow
}
Write-Host ""

# Test 8: Check if database is accessible
Write-Host "🗄️  Test 8: Checking database connection..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    $dbUrl = (Get-Content "backend\.env" | Select-String -Pattern "DATABASE_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
    if ($dbUrl -match "postgresql://") {
        Write-Host "   ℹ️  Database URL configured" -ForegroundColor Cyan
        Write-Host "   Run 'cd backend && pnpm prisma db push' to sync schema" -ForegroundColor Gray
    } else {
        $warnings += "Database URL not configured"
        Write-Host "   ⚠️  WARNING: DATABASE_URL not properly configured" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Skipping (backend\.env not found)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 All tests passed! Your Stripe integration is ready to test." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start backend:  cd backend && pnpm dev" -ForegroundColor White
    Write-Host "  2. Start frontend: cd frontend && pnpm dev" -ForegroundColor White
    Write-Host "  3. Start webhooks: .\start-stripe-dev.ps1" -ForegroundColor White
    Write-Host "  4. Visit http://localhost:5173/pricing" -ForegroundColor White
    Write-Host ""
} elseif ($errors.Count -eq 0) {
    Write-Host "⚠️  Tests passed with $($warnings.Count) warning(s):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "You can proceed with testing, but address warnings for production." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "❌ Tests failed with $($errors.Count) error(s):" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   • $error" -ForegroundColor Red
    }
    Write-Host ""
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  Also found $($warnings.Count) warning(s):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   • $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    Write-Host "Fix the errors above before proceeding." -ForegroundColor Red
    Write-Host ""
}

Write-Host "For help, see: STRIPE_COMPLETE_SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host ""
