# Quick Start Script for Testing Stripe Locally
# Run this before testing Stripe integration

Write-Host "🚀 Starting Stripe Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Please run this script from the thynkr root directory" -ForegroundColor Red
    exit 1
}

# Check if Stripe CLI is available
if (-not (Test-Path "stripe-cli\stripe.exe")) {
    Write-Host "❌ Error: Stripe CLI not found. Please run the setup first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Starting Stripe Webhook Listener..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\stripe-cli\stripe.exe listen --forward-to localhost:3001/api/webhooks/stripe"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✨ Stripe Development Environment Ready!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Start Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "  3. Open Browser:   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💳 Test Card:" -ForegroundColor Yellow
Write-Host "  Card:   4242 4242 4242 4242" -ForegroundColor White
Write-Host "  Expiry: Any future date (e.g., 12/34)" -ForegroundColor White
Write-Host "  CVC:    Any 3 digits (e.g., 123)" -ForegroundColor White
Write-Host "  ZIP:    Any ZIP code" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:       http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:    http://localhost:3001" -ForegroundColor White
Write-Host "  Backend Health: http://localhost:3001/health" -ForegroundColor White
Write-Host "  Stripe Dash:    https://dashboard.stripe.com/test" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "  Testing Guide:  STRIPE_TESTING_GUIDE.md" -ForegroundColor White
Write-Host "  Setup Complete: STRIPE_SETUP_COMPLETE.md" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "💡 Tip: Keep the Stripe webhook listener window open while testing!" -ForegroundColor Cyan
Write-Host ""
