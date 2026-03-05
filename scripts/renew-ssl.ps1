#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Renew SSL certificate on DigitalOcean server
.DESCRIPTION
    SSH into production server and renew Let's Encrypt SSL certificate for thynkr.ca
#>

$SERVER = "root@thynkr.ca"

Write-Host "ðŸ” Renewing SSL Certificate for thynkr.ca..." -ForegroundColor Cyan
Write-Host ""

# Check if we can connect
Write-Host "Connecting to $SERVER..." -ForegroundColor Yellow
$connected = ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER "echo 'Connected'" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "âŒ Failed to connect to server. Check your SSH access." -ForegroundColor Red
    exit 1
}

Write-Host "âœ… Connected to server" -ForegroundColor Green
Write-Host ""

# Run certificate renewal commands
Write-Host "Stopping nginx..." -ForegroundColor Yellow
ssh $SERVER @"
cd /root && \
docker-compose -f docker-compose.prod.yml stop frontend
"@

Write-Host ""
Write-Host "Renewing certificate..." -ForegroundColor Yellow
ssh $SERVER @"
certbot renew --force-renewal
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "âš ï¸  Auto-renewal failed. Trying standalone mode..." -ForegroundColor Yellow
    ssh $SERVER @"
certbot certonly --standalone --force-renewal --cert-name thynkr.ca -d thynkr.ca -d www.thynkr.ca --non-interactive --agree-tos -m admin@thynkr.ca
"@
}

Write-Host ""
Write-Host "Restarting nginx..." -ForegroundColor Yellow
ssh $SERVER @"
cd /root && \
docker-compose -f docker-compose.prod.yml up -d frontend
"@

Write-Host ""
Write-Host "âœ… SSL Certificate renewal complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying certificate..." -ForegroundColor Yellow
ssh $SERVER @"
certbot certificates
"@

Write-Host ""
Write-Host "âœ… Done! Visit https://thynkr.ca to verify." -ForegroundColor Green
