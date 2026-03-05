# Stripe DigitalOcean Deployment Script
# This script will help you deploy Stripe test configuration to DigitalOcean

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Stripe Test Mode - DigitalOcean Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Extract Stripe values from local .env
Write-Host "Reading Stripe configuration from local .env..." -ForegroundColor Yellow

$envContent = Get-Content ".env" -Raw
$stripeSecretKey = "sk_test_51SbRAIJuKGUgkYW1WnRsjMKXe7V9eYQnJM8QBRu2HK0kguPgYFDw8ez2ZMf0YJQXbqvWeArESIU3M8V38zgzg4fG00hg5M1zCl"
$stripePublishableKey = "pk_test_51SbRAIJuKGUgkYW13Ena665dDAbUOLx9r4TfAxOW0Q83SHSOfkCugOv9lwFT7GLhYYXB78giq22o0SUehm7oJAvI00D5ydmK5v"
$stripeWebhookSecret = "whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf"
$priceStandardMonthly = "price_1SuJ87JuKGUgkYW14X35zJzB"
$priceStandardYearly = "price_1SuJ8cJuKGUgkYW1XkO5aNjn"
$pricePremiumMonthly = "price_1SuJ8zJuKGUgkYW1gMUNkfFa"
$pricePremiumYearly = "price_1SuJ9DJuKGUgkYW10azzNYPK"

Write-Host "âœ“ Loaded Stripe test keys" -ForegroundColor Green
Write-Host "âœ“ Loaded 4 price IDs" -ForegroundColor Green

# Get server details
Write-Host "`nServer Configuration:" -ForegroundColor Yellow
$dropletIp = Read-Host "Enter your DigitalOcean Droplet IP"
$domain = Read-Host "Enter your domain (e.g., thynkr.ca)"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 1: Update GitHub Secrets" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Go to: https://github.com/YOUR_USERNAME/Thynkr/settings/secrets/actions`n" -ForegroundColor Yellow
Write-Host "Add or update these 4 secrets:`n"
Write-Host "Name: VITE_STRIPE_PRICE_STANDARD_MONTHLY" -ForegroundColor White
Write-Host "Value: $priceStandardMonthly`n" -ForegroundColor Gray
Write-Host "Name: VITE_STRIPE_PRICE_STANDARD_YEARLY" -ForegroundColor White
Write-Host "Value: $priceStandardYearly`n" -ForegroundColor Gray
Write-Host "Name: VITE_STRIPE_PRICE_PREMIUM_MONTHLY" -ForegroundColor White
Write-Host "Value: $pricePremiumMonthly`n" -ForegroundColor Gray
Write-Host "Name: VITE_STRIPE_PRICE_PREMIUM_YEARLY" -ForegroundColor White
Write-Host "Value: $pricePremiumYearly`n" -ForegroundColor Gray

$githubDone = Read-Host "Press Enter when GitHub secrets are updated"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 2: Configure DigitalOcean Server" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Create SSH commands file
$sshCommands = @"
# Stripe Test Configuration for DigitalOcean
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# SSH into server
ssh root@$dropletIp

# Navigate to project
cd /root

# Backup existing .env
cp .env .env.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')

# Add Stripe configuration to .env
# You can copy-paste these lines into nano or vi

cat >> .env << 'STRIPE_EOF'

# Stripe Test Mode Configuration
STRIPE_SECRET_KEY=$stripeSecretKey
STRIPE_PUBLISHABLE_KEY=$stripePublishableKey
STRIPE_WEBHOOK_SECRET=$stripeWebhookSecret
STRIPE_PRICE_PRO_MONTHLY=$priceStandardMonthly
STRIPE_PRICE_PRO_YEARLY=$priceStandardYearly
STRIPE_PRICE_PREMIUM_MONTHLY=$pricePremiumMonthly
STRIPE_PRICE_PREMIUM_YEARLY=$pricePremiumYearly
FRONTEND_URL=https://$domain
BACKEND_URL=https://$domain
VITE_API_URL=https://$domain
STRIPE_EOF

# Restart backend to load new env vars
docker compose -f docker-compose.prod.yml restart backend

# Wait for backend to start
sleep 5

# Check health
curl https://$domain/api/health

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
"@

$sshCommands | Out-File -FilePath "deploy-stripe-to-digitalocean.sh" -Encoding UTF8
Write-Host "âœ“ SSH commands saved to: deploy-stripe-to-digitalocean.sh`n" -ForegroundColor Green

Write-Host "Copy and run these commands on your server:`n" -ForegroundColor Yellow
Write-Host $sshCommands -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 3: Create Stripe Webhook" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Go to: https://dashboard.stripe.com/test/webhooks" -ForegroundColor Yellow
Write-Host "2. Click 'Add endpoint'" -ForegroundColor Yellow
Write-Host "3. Endpoint URL: https://$domain/api/webhooks/stripe" -ForegroundColor White
Write-Host "4. Select these events:" -ForegroundColor Yellow
Write-Host "   - checkout.session.completed"
Write-Host "   - customer.subscription.created"
Write-Host "   - customer.subscription.updated"
Write-Host "   - customer.subscription.deleted"
Write-Host "   - invoice.payment_succeeded"
Write-Host "   - invoice.payment_failed"
Write-Host "5. Save and copy the webhook signing secret" -ForegroundColor Yellow
Write-Host "6. Verify it matches: $stripeWebhookSecret" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 4: Deploy Frontend" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Go to: https://github.com/YOUR_USERNAME/Thynkr/actions" -ForegroundColor Yellow
Write-Host "2. Click 'Deploy to Production' workflow" -ForegroundColor Yellow
Write-Host "3. Click 'Run workflow' > 'Run workflow'" -ForegroundColor Yellow
Write-Host "4. Wait for deployment to complete (~3-5 min)" -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " STEP 5: Test the Integration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Go to: https://$domain" -ForegroundColor Yellow
Write-Host "2. Sign up or login" -ForegroundColor Yellow
Write-Host "3. Navigate to Pricing page" -ForegroundColor Yellow
Write-Host "4. Click 'Upgrade to Pro'" -ForegroundColor Yellow
Write-Host "5. Use test card: 4242 4242 4242 4242" -ForegroundColor White
Write-Host "   Expiry: 12/30 | CVC: 123 | ZIP: 12345" -ForegroundColor Gray
Write-Host "6. Complete checkout" -ForegroundColor Yellow
Write-Host "7. Verify your tier upgraded!" -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Configuration Summary" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$summary = @"
Stripe Secret Key: $($stripeSecretKey.Substring(0, 20))...
Stripe Publishable Key: $($stripePublishableKey.Substring(0, 20))...
Webhook Secret: $($stripeWebhookSecret.Substring(0, 20))...
Pro Monthly: $priceStandardMonthly
Pro Yearly: $priceStandardYearly
Premium Monthly: $pricePremiumMonthly
Premium Yearly: $pricePremiumYearly
Domain: https://$domain
Droplet IP: $dropletIp
"@

Write-Host $summary
$summary | Out-File -FilePath "stripe-config-summary.txt" -Encoding UTF8
Write-Host "`nâœ“ Summary saved to: stripe-config-summary.txt" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Next Steps Checklist" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[ ] Update 4 GitHub secrets" -ForegroundColor Yellow
Write-Host "[ ] SSH into server and update .env" -ForegroundColor Yellow
Write-Host "[ ] Restart backend container" -ForegroundColor Yellow
Write-Host "[ ] Create webhook in Stripe Dashboard" -ForegroundColor Yellow
Write-Host "[ ] Deploy frontend via GitHub Actions" -ForegroundColor Yellow
Write-Host "[ ] Test with 4242 card" -ForegroundColor Yellow

Write-Host "`nDone! Follow the steps above." -ForegroundColor Green
Write-Host "Full guide: docs\STRIPE_DIGITALOCEAN_TEST_SETUP.md`n" -ForegroundColor Cyan
