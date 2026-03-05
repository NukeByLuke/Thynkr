Write-Host "Stripe DigitalOcean Test Setup" -ForegroundColor Cyan
Write-Host "==============================`n"

Write-Host "Please provide your Stripe TEST mode credentials:`n" -ForegroundColor Yellow

$stripeSecretKey = Read-Host "Stripe Secret Key (sk_test_...)"
$stripePublishableKey = Read-Host "Stripe Publishable Key (pk_test_...)"
$stripeWebhookSecret = Read-Host "Stripe Webhook Secret (whsec_...)"

Write-Host "`nPrice IDs from your Stripe products:" -ForegroundColor Yellow
$priceProMonthly = Read-Host "Pro Monthly Price ID (price_...)"
$priceProYearly = Read-Host "Pro Yearly Price ID (price_...)"
$pricePremiumMonthly = Read-Host "Premium Monthly Price ID (price_...)"
$pricePremiumYearly = Read-Host "Premium Yearly Price ID (price_...)"

Write-Host "`nServer Configuration:" -ForegroundColor Yellow
$dropletIp = Read-Host "DigitalOcean Droplet IP"
$domain = Read-Host "Domain (e.g., thynkr.ca)"

Write-Host "`n=== GITHUB SECRETS ===" -ForegroundColor Magenta
Write-Host "Add these at: https://github.com/YOUR_USERNAME/Thynkr/settings/secrets/actions`n"
Write-Host "VITE_STRIPE_PRICE_STANDARD_MONTHLY = $priceProMonthly"
Write-Host "VITE_STRIPE_PRICE_STANDARD_YEARLY = $priceProYearly"
Write-Host "VITE_STRIPE_PRICE_PREMIUM_MONTHLY = $pricePremiumMonthly"
Write-Host "VITE_STRIPE_PRICE_PREMIUM_YEARLY = $pricePremiumYearly"

Write-Host "`n=== SERVER COMMANDS ===" -ForegroundColor Green
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

Write-Host "`nSSH into your server: ssh root@$dropletIp"
Write-Host "Then run these commands:`n"
Write-Host "cd /root"
Write-Host "cp .env .env.backup"
Write-Host ""
Write-Host "# Add these to .env:"
$envVars

Write-Host "`n# Restart backend:"
Write-Host "docker compose -f docker-compose.prod.yml restart backend"
Write-Host "curl https://$domain/api/health"

Write-Host "`n=== SAVED TO FILE ===" -ForegroundColor Green
$envVars | Out-File -FilePath "stripe-env-vars.txt" -Encoding UTF8
Write-Host "Environment variables saved to: stripe-env-vars.txt"

Write-Host "`nDone! Follow the steps above." -ForegroundColor Cyan
