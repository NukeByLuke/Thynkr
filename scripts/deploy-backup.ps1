#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Production deployment script for Thynkr to DigitalOcean
    
.DESCRIPTION
    Builds Docker images, pushes to Docker Hub, and deploys to DigitalOcean server.
    Includes health checks, rollback capability, and proper error handling.

.PARAMETER Component
    Which component(s) to deploy: 'all', 'frontend', 'backend'

.PARAMETER SkipBuild
    Skip the Docker build step (use existing images)

.PARAMETER SkipTests
    Skip running tests before deployment

.PARAMETER NoCacherebuild
    Build Docker images without using cache

.EXAMPLE
    .\scripts\deploy.ps1
    Deploy everything (backend + frontend)

.EXAMPLE
    .\scripts\deploy.ps1 -Component backend
    Deploy only the backend

.EXAMPLE
    .\scripts\deploy.ps1 -Component frontend -NoCache
    Deploy frontend with fresh build (no cache)

.EXAMPLE
    .\scripts\deploy.ps1 -SkipTests -SkipBuild
    Quick deploy with existing images (no tests, no build)
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
    [switch]$NoCache
)

# Configuration
$ErrorActionPreference = "Stop"
$SERVER = "root@138.197.208.81"
$DOCKER_HUB_USERNAME = "nukebyluke"
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Color output functions
function Write-Success { param($Message) Write-Host "âœ… $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "â„¹ï¸  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "âš ï¸  $Message" -ForegroundColor Yellow }
function Write-ErrorMsg { param($Message) Write-Host "âŒ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "`nðŸ”¹ $Message" -ForegroundColor Blue }

# Banner
Write-Host "`nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Magenta
Write-Host "â•‘         ðŸš€ Thynkr Deployment to DigitalOcean               â•‘" -ForegroundColor Magenta
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Magenta
Write-Info "Timestamp: $TIMESTAMP"
Write-Info "Component: $Component"
Write-Info "Skip Build: $SkipBuild"
Write-Info "Skip Tests: $SkipTests"
Write-Info "No Cache: $NoCache"

# Prerequisites check
Write-Step "Checking prerequisites..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { 
    Write-ErrorMsg "Docker not found. Please install Docker."
    exit 1 
}
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { 
    Write-ErrorMsg "SSH not found. Please install OpenSSH."
    exit 1 
}
Write-Success "Prerequisites verified"

# Test SSH connection
Write-Step "Testing SSH connection..."
try {
    $sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVER "echo 'Connected'" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "SSH connection failed" }
    Write-Success "Connected to $SERVER"
} catch {
    Write-ErrorMsg "Cannot connect to server: $_"
    exit 1
}

Set-Location $PROJECT_ROOT

# Run tests
if (-not $SkipTests) {
    Write-Step "Running tests..."
    
    if ($Component -in 'all', 'backend') {
        Write-Info "Testing backend..."
        Set-Location "$PROJECT_ROOT/backend"
        try {
            npm test 2>&1 | Out-Default
            if ($LASTEXITCODE -ne 0) { throw "Backend tests failed" }
            Write-Success "Backend tests passed"
        } catch {
            Write-ErrorMsg "Backend tests failed: $_"
            Write-Warning "To skip tests, use -SkipTests flag"
            Set-Location $PROJECT_ROOT
            exit 1
        }
    }
    
    if ($Component -in 'all', 'frontend') {
        Write-Info "Testing frontend build..."
        Set-Location "$PROJECT_ROOT/frontend"
        try {
            pnpm run build 2>&1 | Out-Default
            if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
            Write-Success "Frontend build successful"
        } catch {
            Write-ErrorMsg "Frontend build failed: $_"
            Write-Warning "To skip tests, use -SkipTests flag"
            Set-Location $PROJECT_ROOT
            exit 1
        }
    }
    
    Set-Location $PROJECT_ROOT
} else {
    Write-Warning "Skipping tests (use at your own risk)"
}

# Build and Push Docker images
if (-not $SkipBuild) {
    $cacheFlag = if ($NoCache) { "--no-cache" } else { "" }
    
    if ($Component -in 'all', 'backend') {
        Write-Step "Building backend Docker image..."
        try {
            docker build $cacheFlag -t ${DOCKER_HUB_USERNAME}/thynkr-backend:latest ./backend
            if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
            Write-Success "Backend image built successfully"
            
            Write-Info "Pushing backend to Docker Hub..."
            docker push ${DOCKER_HUB_USERNAME}/thynkr-backend:latest
            if ($LASTEXITCODE -ne 0) { throw "Backend push failed" }
            Write-Success "Backend image pushed successfully"
        } catch {
            Write-ErrorMsg "Backend Docker operation failed: $_"
            exit 1
        }
    }
    
    if ($Component -in 'all', 'frontend') {
        Write-Step "Building frontend Docker image..."
        try {
            docker build $cacheFlag -t ${DOCKER_HUB_USERNAME}/thynkr-frontend:latest ./frontend
            if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
            Write-Success "Frontend image built successfully"
            
            Write-Info "Pushing frontend to Docker Hub..."
            docker push ${DOCKER_HUB_USERNAME}/thynkr-frontend:latest
            if ($LASTEXITCODE -ne 0) { throw "Frontend push failed" }
            Write-Success "Frontend image pushed successfully"
        } catch {
            Write-ErrorMsg "Frontend Docker operation failed: $_"
            exit 1
        }
    }
} else {
    Write-Warning "Skipping build (using existing images)"
}

# Deploy to DigitalOcean
Write-Step "Deploying to DigitalOcean..."

# Copy config files
Write-Info "Syncing configuration files..."
try {
    scp ./docker-compose.prod.yml ${SERVER}:/root/docker-compose.prod.yml
    if ($LASTEXITCODE -ne 0) { throw "Failed to copy docker-compose.prod.yml" }
    
    scp ./nginx.prod.conf ${SERVER}:/root/nginx.prod.conf
    if ($LASTEXITCODE -ne 0) { throw "Failed to copy nginx.prod.conf" }
    
    Write-Success "Configuration files synced"
} catch {
    Write-ErrorMsg "Failed to sync config files: $_"
    exit 1
}

# Build deployment commands based on component
$deployCommands = @(
    "cd /root",
    "echo 'ðŸ“¥ Pulling latest images...'",
    "docker compose -f docker-compose.prod.yml pull $Component"
)

if ($Component -eq 'all') {
    $deployCommands += @(
        "echo 'ðŸ”„ Recreating all services...'",
        "docker compose -f docker-compose.prod.yml down",
        "docker compose -f docker-compose.prod.yml up -d",
        "echo 'â³ Waiting for services to start...'",
        "sleep 10"
    )
} else {
    $deployCommands += @(
        "echo 'ðŸ”„ Recreating $Component service...'",
        "docker compose -f docker-compose.prod.yml up -d --force-recreate $Component",
        "echo 'â³ Waiting for service to start...'",
        "sleep 5"
    )
}

# Add migration step for backend
if ($Component -in 'all', 'backend') {
    $deployCommands += @(
        "echo 'ðŸ—ƒï¸  Running database migrations...'",
        "docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy"
    )
}

$deployCommands += @(
    "echo 'ðŸ§¹ Cleaning up...'",
    "docker system prune -f",
    "echo 'ðŸ“Š Service status:'",
    "docker compose -f docker-compose.prod.yml ps",
    "echo 'âœ… Deployment complete!'"
)

# Execute deployment
$deployScript = $deployCommands -join '; '
Write-Info "Executing deployment commands..."

try {
    ssh $SERVER $deployScript
    if ($LASTEXITCODE -ne 0) { throw "Deployment commands failed" }
} catch {
    Write-ErrorMsg "Deployment failed: $_"
    Write-Warning "You may need to manually check the server status"
    Write-Info "To rollback, run: .\scripts\rollback-deployment.ps1"
    exit 1
}

# Health check
Write-Step "Running health checks..."
Start-Sleep -Seconds 5

try {
    Write-Info "Checking backend health..."
    $backendHealth = ssh $SERVER 'docker compose -f docker-compose.prod.yml exec -T backend wget -qO- http://localhost:3001/health 2>&1 || echo FAILED' 2>&1
    if ($backendHealth -match 'FAILED' -or $LASTEXITCODE -ne 0) {
        Write-Warning "Backend health check failed"
    } else {
        Write-Success "Backend is healthy"
    }
    
    Write-Info "Checking frontend health..."
    $frontendHealth = ssh $SERVER 'curl -f -s http://localhost/ 2>&1 && echo OK || echo FAILED' 2>&1
    if ($frontendHealth -match 'FAILED') {
        Write-Warning "Frontend health check failed"
    } else {
        Write-Success "Frontend is healthy"
    }
} catch {
    Write-Warning "Health checks could not complete: $_"
}

# Final status
Write-Host "`nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Green
Write-Host "â•‘              âœ… DEPLOYMENT SUCCESSFUL                       â•‘" -ForegroundColor Green
Write-Host "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`n" -ForegroundColor Green

Write-Info "Your application should now be running at:"
Write-Host "  ðŸŒ https://thynkr.ca" -ForegroundColor Cyan
Write-Info "`nTo view logs:"
Write-Host "  ssh $SERVER 'cd /root && docker compose -f docker-compose.prod.yml logs -f'" -ForegroundColor Gray
Write-Info "`nTo rollback if needed:"
Write-Host "  .\scripts\rollback-deployment.ps1" -ForegroundColor Gray

Set-Location $PROJECT_ROOT
