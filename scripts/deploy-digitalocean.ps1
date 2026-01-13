#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete DigitalOcean deployment script for thynkr application
.DESCRIPTION
    Builds Docker images, pushes to Docker Hub, and deploys to DigitalOcean droplet
    Handles both frontend and backend deployment with health checks
.PARAMETER Component
    Which component to deploy: 'all', 'frontend', 'backend'
.PARAMETER SkipBuild
    Skip Docker build step (use existing images)
.PARAMETER SkipTests
    Skip running tests before deployment
.EXAMPLE
    .\deploy-digitalocean.ps1 -Component all
    .\deploy-digitalocean.ps1 -Component backend -SkipBuild
#>

param(
    [Parameter()]
    [ValidateSet('all', 'frontend', 'backend')]
    [string]$Component = 'all',
    
    [Parameter()]
    [switch]$SkipBuild,
    
    [Parameter()]
    [switch]$SkipTests,

    [Parameter()]
    [switch]$Force
)

# Configuration
$SERVER = "root@138.197.208.81"
$DOCKER_HUB_USERNAME = "nukebyluke"
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$LOG_FILE = "$PROJECT_ROOT/deployment-$TIMESTAMP.log"

# Color output functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "`n🔹 $Message" -ForegroundColor Blue }

# Log function
function Write-Log {
    param($Message, $Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [$Level] $Message" | Out-File -Append -FilePath $LOG_FILE
    
    switch ($Level) {
        "ERROR" { Write-Error $Message }
        "WARN"  { Write-Warning $Message }
        "SUCCESS" { Write-Success $Message }
        default { Write-Info $Message }
    }
}

# Error handling
$ErrorActionPreference = "Continue"
# trap {
#     Write-Log "Deployment failed: $_" "ERROR"
#     Write-Error "Deployment failed! Check log: $LOG_FILE"
#     exit 1
# }

# Start deployment
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║      🚀 DigitalOcean Deployment - Thynkr Platform      ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Log "Starting deployment - Component: $Component" "INFO"
Write-Info "Log file: $LOG_FILE"

# Check prerequisites
Write-Step "Checking prerequisites..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Log "Docker is not installed or not in PATH" "ERROR"
    exit 1
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Log "SSH is not installed or not in PATH" "ERROR"
    exit 1
}

# Test SSH connection
Write-Info "Testing SSH connection to $SERVER..."
$sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes $SERVER "echo 'Connected'" 2>&1
$sshExitCode = $LASTEXITCODE

if ($sshExitCode -ne 0) {
    Write-Log "Cannot connect to server. Check SSH keys and server availability." "ERROR"
    exit 1
}
Write-Success "SSH connection verified"

# Confirm deployment
if (-not $Force) {
    Write-Warning "You are about to deploy to PRODUCTION server: $SERVER"
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "Deployment cancelled by user"
        exit 0
    }
}

Set-Location $PROJECT_ROOT

# Run tests
if (-not $SkipTests) {
    Write-Step "Running tests..."
    
    if ($Component -eq 'all' -or $Component -eq 'backend') {
        Write-Info "Running backend tests..."
        Set-Location "$PROJECT_ROOT/backend"
        $testResult = npm test 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Backend tests failed" "WARN"
            $continue = Read-Host "Tests failed. Continue anyway? (yes/no)"
            if ($continue -ne "yes") { exit 1 }
        } else {
            Write-Success "Backend tests passed"
        }
        Set-Location $PROJECT_ROOT
    }
    
    if ($Component -eq 'all' -or $Component -eq 'frontend') {
        Write-Info "Running frontend build test..."
        Set-Location "$PROJECT_ROOT/frontend"
        $buildResult = pnpm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Frontend build failed" "ERROR"
            exit 1
        }
        Write-Success "Frontend build successful"
        Set-Location $PROJECT_ROOT
    }
} else {
    Write-Warning "Skipping tests (-SkipTests flag used)"
}

# Build and push Docker images
if (-not $SkipBuild) {
    if ($Component -eq 'all' -or $Component -eq 'backend') {
        Write-Step "Building backend Docker image..."
        Write-Log "Building backend image" "INFO"
        
        docker build -t ${DOCKER_HUB_USERNAME}/thynkr-backend:latest `
                     -t ${DOCKER_HUB_USERNAME}/thynkr-backend:$(git rev-parse --short HEAD) `
                     ./backend
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Backend Docker build failed" "ERROR"
            exit 1
        }
        Write-Success "Backend image built successfully"
        
        Write-Info "Pushing backend image to Docker Hub..."
        docker push ${DOCKER_HUB_USERNAME}/thynkr-backend:latest
        docker push ${DOCKER_HUB_USERNAME}/thynkr-backend:$(git rev-parse --short HEAD)
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to push backend image" "ERROR"
            exit 1
        }
        Write-Success "Backend image pushed successfully"
    }
    
    if ($Component -eq 'all' -or $Component -eq 'frontend') {
        Write-Step "Building frontend Docker image..."
        Write-Log "Building frontend image" "INFO"
        
        docker build -t ${DOCKER_HUB_USERNAME}/thynkr-frontend:latest `
                     -t ${DOCKER_HUB_USERNAME}/thynkr-frontend:$(git rev-parse --short HEAD) `
                     ./frontend
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Frontend Docker build failed" "ERROR"
            exit 1
        }
        Write-Success "Frontend image built successfully"
        
        Write-Info "Pushing frontend image to Docker Hub..."
        docker push ${DOCKER_HUB_USERNAME}/thynkr-frontend:latest
        docker push ${DOCKER_HUB_USERNAME}/thynkr-frontend:$(git rev-parse --short HEAD)
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Failed to push frontend image" "ERROR"
            exit 1
        }
        Write-Success "Frontend image pushed successfully"
    }
} else {
    Write-Warning "Skipping Docker build (-SkipBuild flag used)"
}

# Create backup on server
Write-Step "Creating backup on server..."
$backupScript = @'
mkdir -p /root/backups
timestamp=$(date +%Y%m%d_%H%M%S)
echo "Creating database backup..."
docker compose -f /root/docker-compose.prod.yml exec -T postgres pg_dump -U thynkr thynkr_db > /root/backups/db_backup_${timestamp}.sql
echo "Backup saved to /root/backups/db_backup_${timestamp}.sql"
ls -lh /root/backups/ | tail -5
'@

ssh $SERVER $backupScript
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backup created successfully"
} else {
    Write-Warning "Backup creation failed - continuing anyway"
}

# Deploy to DigitalOcean
Write-Step "Deploying to DigitalOcean droplet..."

# Copy production configs
Write-Info "Syncing production configs..."
scp ./nginx.prod.conf ${SERVER}:/root/nginx.prod.conf
scp ./docker-compose.prod.yml ${SERVER}:/root/docker-compose.prod.yml

if ($LASTEXITCODE -ne 0) {
    Write-Log "Failed to copy config files" "ERROR"
    exit 1
}
Write-Success "Config files synced"

# Deploy based on component
if ($Component -eq 'all') {
    Write-Info "Deploying all services..."
    
    $deployScript = @'
cd /root
echo "Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

echo "Stopping services..."
docker compose -f docker-compose.prod.yml down

echo "Starting all services..."
docker compose -f docker-compose.prod.yml up -d

echo "Waiting for services to start..."
sleep 10

echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "Cleaning up old images..."
docker system prune -f

echo "Service status:"
docker compose -f docker-compose.prod.yml ps

echo "Checking backend health..."
curl -f http://localhost:3001/health || echo "Backend health check failed"

echo "Deployment complete!"
'@
    
    ssh $SERVER $deployScript
    
} elseif ($Component -eq 'backend') {
    Write-Info "Deploying backend only..."
    
    $deployScript = @'
cd /root
echo "Pulling backend image..."
docker pull nukebyluke/thynkr-backend:latest

echo "Recreating backend service..."
docker compose -f docker-compose.prod.yml up -d --force-recreate backend

echo "Waiting for backend to start..."
sleep 8

echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "Cleaning up..."
docker system prune -f

echo "Service status:"
docker compose -f docker-compose.prod.yml ps

echo "Checking backend health..."
curl -f http://localhost:3001/health || echo "Backend health check failed"
'@
    
    ssh $SERVER $deployScript
    
} elseif ($Component -eq 'frontend') {
    Write-Info "Deploying frontend only..."
    
    $deployScript = @'
cd /root
echo "Pulling frontend image..."
docker pull nukebyluke/thynkr-frontend:latest

echo "Recreating frontend service..."
docker compose -f docker-compose.prod.yml up -d --force-recreate frontend

echo "Cleaning up..."
docker system prune -f

echo "Service status:"
docker compose -f docker-compose.prod.yml ps

echo "Checking frontend availability..."
curl -f http://localhost:80 > /dev/null 2>&1 && echo "Frontend is up" || echo "Frontend check failed"
'@
    
    ssh $SERVER $deployScript
}

if ($LASTEXITCODE -ne 0) {
    Write-Log "Deployment commands failed" "ERROR"
    exit 1
}

# Health check
Write-Step "Performing health checks..."

Start-Sleep -Seconds 5

if ($Component -eq 'all' -or $Component -eq 'backend') {
    Write-Info "Checking backend health..."
    $healthCheck = ssh $SERVER "curl -f -s http://localhost:3001/health"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend is healthy"
    } else {
        Write-Warning "Backend health check failed"
    }
}

if ($Component -eq 'all' -or $Component -eq 'frontend') {
    Write-Info "Checking frontend availability..."
    $frontendCheck = ssh $SERVER "curl -f -s -o /dev/null -w '%{http_code}' http://localhost:80"
    if ($frontendCheck -eq "200" -or $frontendCheck -eq "304") {
        Write-Success "Frontend is available"
    } else {
        Write-Warning "Frontend availability check returned: $frontendCheck"
    }
}

# Get final service status
Write-Step "Final service status:"
ssh $SERVER 'cd /root && docker compose -f docker-compose.prod.yml ps'

# Show logs
Write-Info "`nRecent logs (last 20 lines):"
if ($Component -eq 'backend' -or $Component -eq 'all') {
    Write-Host "`n--- Backend Logs ---" -ForegroundColor Yellow
    ssh $SERVER "docker compose -f /root/docker-compose.prod.yml logs --tail=20 backend"
}
if ($Component -eq 'frontend' -or $Component -eq 'all') {
    Write-Host "`n--- Frontend Logs ---" -ForegroundColor Yellow
    ssh $SERVER "docker compose -f /root/docker-compose.prod.yml logs --tail=20 frontend"
}

# Success summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✅ Deployment Completed Successfully!          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Success "Component: $Component"
Write-Success "Server: $SERVER"
Write-Success "Timestamp: $TIMESTAMP"
Write-Log "Deployment completed successfully" "SUCCESS"

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  View logs:    ssh $SERVER 'docker compose -f /root/docker-compose.prod.yml logs -f'" -ForegroundColor Gray
Write-Host "  Restart:      ssh $SERVER 'docker compose -f /root/docker-compose.prod.yml restart'" -ForegroundColor Gray
Write-Host "  Status:       ssh $SERVER 'docker compose -f /root/docker-compose.prod.yml ps'" -ForegroundColor Gray
Write-Host "  Shell access: ssh $SERVER" -ForegroundColor Gray

Write-Host "`nApplication URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: https://thynkr.ca" -ForegroundColor Gray
Write-Host "  Backend:  https://thynkr.ca/api" -ForegroundColor Gray

exit 0
