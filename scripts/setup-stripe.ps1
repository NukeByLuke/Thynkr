Write-Host "🚀 Thynkr Stripe Setup Helper" -ForegroundColor Cyan
Write-Host "=============================="

# Check if Stripe CLI is installed
if (Get-Command "stripe" -ErrorAction SilentlyContinue) {
    Write-Host "✅ Stripe CLI is installed." -ForegroundColor Green
} else {
    Write-Host "❌ Stripe CLI is NOT installed." -ForegroundColor Red
    Write-Host "Please install it from: https://docs.stripe.com/stripe-cli"
    Write-Host "After installing, run 'stripe login' to authenticate."
    exit
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file." -ForegroundColor Green
}

Write-Host "`n📝 To complete setup, you need to:" -ForegroundColor Yellow
Write-Host "1. Create two products in Stripe Dashboard (Test Mode):"
Write-Host '   - Standard Plan ($8/mo, $60/yr)'
Write-Host '   - Premium Plan ($12/mo, $100/yr)'
Write-Host "2. Copy the Price IDs (starting with 'price_...') into your .env file:"
Write-Host "   - STRIPE_PRICE_STANDARD_MONTHLY"
Write-Host "   - STRIPE_PRICE_STANDARD_YEARLY"
Write-Host "   - STRIPE_PRICE_PREMIUM_MONTHLY"
Write-Host "   - STRIPE_PRICE_PREMIUM_YEARLY"
Write-Host "3. Add your API keys to .env:"
Write-Host "   - STRIPE_SECRET_KEY (sk_test_...)"
Write-Host "   - VITE_STRIPE_PUBLIC_KEY (pk_test_...)"

Write-Host "`n🔌 Starting Stripe Webhook Forwarding..." -ForegroundColor Cyan
Write-Host "Forwarding to http://localhost:3001/api/stripe/webhook"

# Start listening and print the webhook secret
Write-Host "Copy the 'whsec_...' secret below into your .env file as STRIPE_WEBHOOK_SECRET" -ForegroundColor Magenta
stripe listen --forward-to localhost:3001/api/stripe/webhook
