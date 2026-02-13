$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host " Stripe Test Mode - DigitalOcean Setup"
Write-Host "========================================"
Write-Host ""

# Stripe values from local .env
$stripeSecretKey = "sk_test_51SbRAIJuKGUgkYW1WnRsjMKXe7V9eYQnJM8QBRu2HK0kguPgYFDw8ez2ZMf0YJQXbqvWeArESIU3M8V38zgzg4fG00hg5M1zCl"
$stripePublishableKey = "pk_test_51SbRAIJuKGUgkYW13Ena665dDAbUOLx9r4TfAxOW0Q83SHSOfkCugOv9lwFT7GLhYYXB78giq22o0SUehm7oJAvI00D5ydmK5v"
$stripeWebhookSecret = "whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf"
$priceProMonthly = "price_1SuJ87JuKGUgkYW14X35zJzB"
$priceProYearly = "price_1SuJ8cJuKGUgkYW1XkO5aNjn"
$pricePremiumMonthly = "price_1SuJ8zJuKGUgkYW1gMUNkfFa"
$pricePremiumYearly = "price_1SuJ9DJuKGUgkYW10azzNYPK"

Write-Host "[OK] Loaded Stripe test keys from local .env"
Write-Host "[OK] Loaded 4 price IDs"
Write-Host ""

# Get server details
Write-Host "Enter your server details:"
$dropletIp = Read-Host "DigitalOcean Droplet IP"
$domain = Read-Host "Domain (e.g., thynkr.study)"

Write-Host ""
Write-Host "========================================"
Write-Host " STEP 1: GitHub Secrets"
Write-Host "========================================"
Write-Host ""
Write-Host "Go to: https://github.com/YOUR_USERNAME/Thynkr/settings/secrets/actions"
Write-Host ""
Write-Host "Add/update these 4 secrets:"
Write-Host ""
Write-Host "VITE_STRIPE_PRICE_STANDARD_MONTHLY"
Write-Host "  $priceProMonthly"
Write-Host ""
Write-Host "VITE_STRIPE_PRICE_STANDARD_YEARLY"
Write-Host "  $priceProYearly"
Write-Host ""
Write-Host "VITE_STRIPE_PRICE_PREMIUM_MONTHLY"
Write-Host "  $pricePremiumMonthly"
Write-Host ""
Write-Host "VITE_STRIPE_PRICE_PREMIUM_YEARLY"
Write-Host "  $pricePremiumYearly"
Write-Host ""

$null = Read-Host "Press Enter when GitHub secrets are updated"

Write-Host ""
Write-Host "========================================"
Write-Host " STEP 2: Server Environment Variables"
Write-Host "========================================"
Write-Host ""

# Create env vars file
$envVars = @"
STRIPE_SECRET_KEY=$stripeSecretKey
STRIPE_PUBLISHABLE_KEY=$stripePublishableKey
STRIPE_WEBHOOK_SECRET=$stripeWebhookSecret
STRIPE_PRICE_PRO_MONTHLY=$priceProMonthly
STRIPE_PRICE_PRO_YEARLY=$priceProYearly
STRIPE_PRICE_PREMIUM_MONTHLY=$pricePremiumMonthly
STRIPE_PRICE_PREMIUM_YEARLY=$pricePremiumYearly
FRONTEND_URL=https://$domain
BACKEND_URL=https://$domain
VITE_API_URL=https://$domain
"@

$envVars | Set-Content -Path "stripe-env-for-server.txt"
Write-Host "[SAVED] stripe-env-for-server.txt"
Write-Host ""
Write-Host "SSH into your server:"
Write-Host "  ssh root@$dropletIp"
Write-Host ""
Write-Host "Then add these to /root/.env:"
Write-Host ""
Write-Host $envVars
Write-Host ""
Write-Host "Restart backend:"
Write-Host "  docker compose -f docker-compose.prod.yml restart backend"
Write-Host "  curl https://$domain/api/health"
Write-Host ""

$null = Read-Host "Press Enter when server is updated"

Write-Host ""
Write-Host "========================================"
Write-Host " STEP 3: Stripe Webhook"
Write-Host "========================================"
Write-Host ""
Write-Host "1. Go to: https://dashboard.stripe.com/test/webhooks"
Write-Host "2. Click 'Add endpoint'"
Write-Host "3. URL: https://$domain/api/webhooks/stripe"
Write-Host "4. Events: checkout.session.completed, customer.subscription.*, invoice.payment_*"
Write-Host "5. Verify webhook secret matches: $($stripeWebhookSecret.Substring(0,15))..."
Write-Host ""

$null = Read-Host "Press Enter when webhook is configured"

Write-Host ""
Write-Host "========================================"
Write-Host " STEP 4: Deploy Frontend"
Write-Host "========================================"
Write-Host ""
Write-Host "1. Go to: https://github.com/YOUR_USERNAME/Thynkr/actions"
Write-Host "2. Run 'Deploy to Production' workflow"
Write-Host "3. Wait ~5 minutes"
Write-Host ""

$null = Read-Host "Press Enter when deployment is complete"

Write-Host ""
Write-Host "========================================"
Write-Host " STEP 5: Test!"
Write-Host "========================================"
Write-Host ""
Write-Host "1. Go to: https://$domain"
Write-Host "2. Sign up or login"
Write-Host "3. Go to Pricing"
Write-Host "4. Upgrade to Pro"
Write-Host "5. Use card: 4242 4242 4242 4242"
Write-Host "6. Verify upgrade worked!"
Write-Host ""
Write-Host "[DONE] Setup complete!"
Write-Host ""
