# Quick Deploy - Stripe to DigitalOcean
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Stripe DigitalOcean Deployment" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not responding"
    }
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker Desktop is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Build frontend with Stripe live price IDs"
Write-Host "  2. Build backend"
Write-Host "  3. Push to Docker Hub"
Write-Host "  4. Deploy to your DigitalOcean server"
Write-Host ""

$confirm = "y" # Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/5] Building Frontend..." -ForegroundColor Cyan
docker build `
  --build-arg VITE_API_URL="/api" `
  --build-arg VITE_STRIPE_PRICE_STANDARD_MONTHLY="price_1T6iAIJuKGUgkYW110eHHbY2" `
  --build-arg VITE_STRIPE_PRICE_STANDARD_YEARLY="price_1SbckrJuKGUgkYW1xtzor4VE" `
  --build-arg VITE_STRIPE_PRICE_PREMIUM_MONTHLY="price_1T6iBHJuKGUgkYW12vqcdCUd" `
  --build-arg VITE_STRIPE_PRICE_PREMIUM_YEARLY="price_1SbcksJuKGUgkYW1k4cxrjI9" `
  -t nukebyluke/thynkr-frontend:latest `
  ./frontend

if ($LASTEXITCODE -ne 0) { Write-Host "[FAILED]" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Frontend built" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Building Backend..." -ForegroundColor Cyan
docker build -t nukebyluke/thynkr-backend:latest ./backend

if ($LASTEXITCODE -ne 0) { Write-Host "[FAILED]" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Backend built" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Pushing Frontend to Docker Hub..." -ForegroundColor Cyan
docker push nukebyluke/thynkr-frontend:latest

if ($LASTEXITCODE -ne 0) { Write-Host "[FAILED]" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Frontend pushed" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Pushing Backend to Docker Hub..." -ForegroundColor Cyan
docker push nukebyluke/thynkr-backend:latest

if ($LASTEXITCODE -ne 0) { Write-Host "[FAILED]" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Backend pushed" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Deploying to DigitalOcean..." -ForegroundColor Cyan
Write-Host ""

# $dropletIp = Read-Host "DigitalOcean Droplet IP"
# $domain = Read-Host "Domain (e.g., thynkr.ca)"
$dropletIp = "138.197.208.81"
$domain = "thynkr.ca"

Write-Host ""
Write-Host "Connecting to server and updating..." -ForegroundColor Yellow

# Create deployment script
$deployScript = @'
cd /root
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
echo "Waiting for services to start..."
sleep 10
'@ + "`ncurl https://$domain/api/health"

# Fix formatting for Linux
$deployScript = $deployScript -replace "\r\n", "`n"

ssh root@$dropletIp $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Set up Stripe webhook" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to: https://dashboard.stripe.com/test/webhooks"
    Write-Host "2. Add endpoint: https://$domain/api/webhooks/stripe"
    Write-Host "3. Events: checkout.session.completed, customer.subscription.*, invoice.payment_*"
    Write-Host ""
    Write-Host "Then test at: https://$domain" -ForegroundColor Cyan
    Write-Host "Test card: 4242 4242 4242 4242" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    Write-Host "Check SSH connection and try manually" -ForegroundColor Yellow
    Write-Host ""
}
