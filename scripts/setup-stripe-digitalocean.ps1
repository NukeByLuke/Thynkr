# Stripe Test Mode Setup for DigitalOcean
# This script helps you configure Stripe test keys on your DigitalOcean droplet

Write-Host "ðŸŽ¯ Thynkr - DigitalOcean Stripe Test Setup" -ForegroundColor Cyan
Write-Host "==========================================`n"

# Collect Stripe Test Keys
Write-Host "ðŸ“ Please provide your Stripe TEST mode credentials:" -ForegroundColor Yellow
Write-Host "(Find these at https://dashboard.stripe.com/test/apikeys)`n"

$stripeSecretKey = Read-Host "Stripe Secret Key (sk_test_...)"
$stripePublishableKey = Read-Host "Stripe Publishable Key (pk_test_...)"
$stripeWebhookSecret = Read-Host "Stripe Webhook Secret (whsec_...)"

Write-Host "`nðŸ“¦ Price IDs from your Stripe products:"
$priceProMonthly = Read-Host "Pro Monthly Price ID (price_...)"
$priceProYearly = Read-Host "Pro Yearly Price ID (price_...)"
$pricePremiumMonthly = Read-Host "Premium Monthly Price ID (price_...)"
$pricePremiumYearly = Read-Host "Premium Yearly Price ID (price_...)"

Write-Host "`nðŸŒ Server Configuration:"
$dropletIp = Read-Host "DigitalOcean Droplet IP"
$domain = Read-Host "Domain (e.g., thynkr.ca)" 

# Generate SSH command
Write-Host "`nðŸ“‹ Commands to run on your DigitalOcean server:" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

$sshCommands = @"
# SSH into your droplet
ssh root@$dropletIp

# Navigate to project directory
cd /root

# Backup existing .env
cp .env .env.backup

# Update Stripe configuration
cat >> .env << 'EOF'

# Stripe Test Mode Configuration (Updated $(Get-Date -Format 'yyyy-MM-dd HH:mm'))
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
EOF

# Rebuild and restart services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
sleep 10

# Check health
curl https://$domain/api/health

# Monitor logs
docker compose -f docker-compose.prod.yml logs -f backend
"@

Write-Host $sshCommands

# Save to file
$sshCommands | Out-File -FilePath "deploy-stripe-test.sh" -Encoding UTF8
Write-Host "`nâœ… Commands saved to: deploy-stripe-test.sh" -ForegroundColor Green

# GitHub Secret Update Instructions
Write-Host "`nðŸ”‘ GitHub Secrets to Update:" -ForegroundColor Magenta
Write-Host "============================`n"
Write-Host "Go to: https://github.com/YOUR_USERNAME/Thynkr/settings/secrets/actions"
Write-Host "Update or create these secrets:`n"
Write-Host "Secret Name: VITE_STRIPE_PRICE_STANDARD_MONTHLY"
Write-Host "Value: $priceProMonthly`n"
Write-Host "Secret Name: VITE_STRIPE_PRICE_STANDARD_YEARLY"
Write-Host "Value: $priceProYearly`n"
Write-Host "Secret Name: VITE_STRIPE_PRICE_PREMIUM_MONTHLY"
Write-Host "Value: $pricePremiumMonthly`n"
Write-Host "Secret Name: VITE_STRIPE_PRICE_PREMIUM_YEARLY"
Write-Host "Value: $pricePremiumYearly`n"
Write-Host "Then trigger deployment:"
Write-Host "   - Go to Actions tab"
Write-Host "   - Run 'Deploy to Production' workflow"
Write-Host "   OR push to main branch to auto-deploy`n"

# Webhook Setup Reminder
Write-Host "ðŸ”Œ Webhook Configuration:" -ForegroundColor Yellow
Write-Host "========================`n"
Write-Host "Set up webhook in Stripe Dashboard:"
Write-Host "1. Go to: https://dashboard.stripe.com/test/webhooks"
Write-Host "2. Click 'Add endpoint'"
Write-Host "3. Endpoint URL: https://$domain/api/webhooks/stripe"
Write-Host "4. Select events:"
Write-Host "   - checkout.session.completed"
Write-Host "   - customer.subscription.created"
Write-Host "   - customer.subscription.updated"
Write-Host "   - customer.subscription.deleted"
Write-Host "   - invoice.payment_succeeded"
Write-Host "   - invoice.payment_failed"
Write-Host "5. Click 'Add endpoint'"
Write-Host "6. Copy the signing secret (should match what you entered above)`n"

# Test Card Reminder
Write-Host "ðŸ’³ Test Card for Testing:" -ForegroundColor Cyan
Write-Host "========================"
Write-Host "Card: 4242 4242 4242 4242"
Write-Host "Expiry: Any future date (12/30)"
Write-Host "CVC: Any 3 digits (123)"
Write-Host "ZIP: Any 5 digits (12345)`n"

Write-Host "ðŸ“š Full guide: docs\STRIPE_DIGITALOCEAN_TEST_SETUP.md`n" -ForegroundColor Green
Write-Host "âœ¨ Setup complete! Follow the commands above to deploy." -ForegroundColor Green
