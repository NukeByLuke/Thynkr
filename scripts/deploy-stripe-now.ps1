# Build and Deploy Stripe Configuration to DigitalOcean
# This builds locally and pushes to Docker Hub

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building & Deploying to DigitalOcean"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stripe configuration from local .env
$env:VITE_STRIPE_PRICE_STANDARD_MONTHLY = "price_1SuJ87JuKGUgkYW14X35zJzB"
$env:VITE_STRIPE_PRICE_STANDARD_YEARLY = "price_1SuJ8cJuKGUgkYW1XkO5aNjn"
$env:VITE_STRIPE_PRICE_PREMIUM_MONTHLY = "price_1SuJ8zJuKGUgkYW1gMUNkfFa"
$env:VITE_STRIPE_PRICE_PREMIUM_YEARLY = "price_1SuJ9DJuKGUgkYW10azzNYPK"
$env:VITE_API_URL = "/api"

Write-Host "[1/5] Building Frontend with Stripe price IDs..." -ForegroundColor Yellow
docker build `
  --build-arg VITE_API_URL="/api" `
  --build-arg VITE_STRIPE_PRICE_STANDARD_MONTHLY="price_1SuJ87JuKGUgkYW14X35zJzB" `
  --build-arg VITE_STRIPE_PRICE_STANDARD_YEARLY="price_1SuJ8cJuKGUgkYW1XkO5aNjn" `
  --build-arg VITE_STRIPE_PRICE_PREMIUM_MONTHLY="price_1SuJ8zJuKGUgkYW1gMUNkfFa" `
  --build-arg VITE_STRIPE_PRICE_PREMIUM_YEARLY="price_1SuJ9DJuKGUgkYW10azzNYPK" `
  -t nukebyluke/thynkr-frontend:latest `
  ./frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "[2/5] Building Backend..." -ForegroundColor Yellow
docker build -t nukebyluke/thynkr-backend:latest ./backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "[3/5] Pushing Frontend to Docker Hub..." -ForegroundColor Yellow
docker push nukebyluke/thynkr-frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend push failed" -ForegroundColor Red
    exit 1
}

Write-Host "[4/5] Pushing Backend to Docker Hub..." -ForegroundColor Yellow
docker push nukebyluke/thynkr-backend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backend push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Images built and pushed to Docker Hub!" -ForegroundColor Green
Write-Host ""

# Get server details
Write-Host "Enter your DigitalOcean details:" -ForegroundColor Yellow
$dropletIp = Read-Host "Droplet IP"
$domain = Read-Host "Domain (e.g., thynkr.ca)"

Write-Host ""
Write-Host "[5/5] Deploying to DigitalOcean..." -ForegroundColor Yellow
Write-Host ""

# Create the env vars to add
$envVarsToAdd = @"

# Stripe Test Mode Configuration - Added $(Get-Date -Format 'yyyy-MM-dd HH:mm')
STRIPE_SECRET_KEY=sk_test_51SbRAIJuKGUgkYW1WnRsjMKXe7V9eYQnJM8QBRu2HK0kguPgYFDw8ez2ZMf0YJQXbqvWeArESIU3M8V38zgzg4fG00hg5M1zCl
STRIPE_PUBLISHABLE_KEY=pk_test_51SbRAIJuKGUgkYW13Ena665dDAbUOLx9r4TfAxOW0Q83SHSOfkCugOv9lwFT7GLhYYXB78giq22o0SUehm7oJAvI00D5ydmK5v
STRIPE_WEBHOOK_SECRET=whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf
STRIPE_PRICE_PRO_MONTHLY=price_1SuJ87JuKGUgkYW14X35zJzB
STRIPE_PRICE_PRO_YEARLY=price_1SuJ8cJuKGUgkYW1XkO5aNjn
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SuJ8zJuKGUgkYW1gMUNkfFa
STRIPE_PRICE_PREMIUM_YEARLY=price_1SuJ9DJuKGUgkYW10azzNYPK
"@

# Save to temp file
$envVarsToAdd | Set-Content -Path "stripe-vars-temp.txt"

# SSH and deploy
$deployScript = @"
cd /root
echo '$envVarsToAdd' >> .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
sleep 5
curl https://$domain/api/health
"@

Write-Host "Connecting to server..." -ForegroundColor Yellow
ssh root@$dropletIp $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Configure Stripe webhook" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to: https://dashboard.stripe.com/test/webhooks" -ForegroundColor White
    Write-Host "2. Add endpoint: https://$domain/api/webhooks/stripe" -ForegroundColor White
    Write-Host "3. Select events: checkout.session.completed, customer.subscription.*, invoice.payment_*" -ForegroundColor White
    Write-Host "4. Verify secret: whsec_f9f4b41a1a6d6800..." -ForegroundColor White
    Write-Host ""
    Write-Host "Test with card: 4242 4242 4242 4242" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual deployment commands saved to: stripe-vars-temp.txt" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SSH into server manually:" -ForegroundColor Yellow
    Write-Host "  ssh root@$dropletIp" -ForegroundColor White
    Write-Host "  cd /root" -ForegroundColor White
    Write-Host "  nano .env  # Add the vars from stripe-vars-temp.txt" -ForegroundColor White
    Write-Host "  docker compose -f docker-compose.prod.yml pull" -ForegroundColor White
    Write-Host "  docker compose -f docker-compose.prod.yml up -d" -ForegroundColor White
    Write-Host ""
}
