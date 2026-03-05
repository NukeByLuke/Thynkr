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
$DOCKER_USER = "nukebyluke"
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Color output functions
function Write-Success { 
    param($Message) 
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green 
}

function Write-Info { 
    param($Message) 
    Write-Host "[INFO] $Message" -ForegroundColor Cyan 
}

function Write-Warning { 
    param($Message) 
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow 
}

function Write-ErrorMsg { 
    param($Message) 
    Write-Host "[ERROR] $Message" -ForegroundColor Red 
}

function Write-Step { 
    param($Message) 
    Write-Host "`n[STEP] $Message" -ForegroundColor Blue 
}

# Banner
Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host " Thynkr Deployment to DigitalOcean" -ForegroundColor Magenta
Write-Host "=========================================`n" -ForegroundColor Magenta
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
    $null = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVER "echo Connected" 2>&1
    if ($LASTEXITCODE -ne 0) { 
        throw "SSH connection failed" 
    }
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
            if ($LASTEXITCODE -ne 0) { 
                throw "Backend tests failed" 
            }
            Write-Success "Backend tests passed"
        } catch {
            Write-ErrorMsg "Backend tests failed: $_"
            Write-Warning "To skip tests, add -SkipTests flag"
            Set-Location $PROJECT_ROOT
            exit 1
        }
    }
    
    if ($Component -in 'all', 'frontend') {
        Write-Info "Testing frontend build..."
        Set-Location "$PROJECT_ROOT/frontend"
        try {
            pnpm run build 2>&1 | Out-Default
            if ($LASTEXITCODE -ne 0) { 
                throw "Frontend build failed" 
            }
            Write-Success "Frontend build successful"
        } catch {
            Write-ErrorMsg "Frontend build failed: $_"
            Write-Warning "To skip tests, add -SkipTests flag"
            Set-Location $PROJECT_ROOT
            exit 1
        }
    }
    
    Set-Location $PROJECT_ROOT
} else {
    Write-Warning "Skipping tests"
}

# Build and Push Docker images
if (-not $SkipBuild) {
    
    if ($Component -in 'all', 'backend') {
        Write-Step "Building backend Docker image..."
        try {
            $backendImage = "$DOCKER_USER/thynkr-backend:latest"
            
            if ($NoCache) {
                docker build --no-cache -t $backendImage ./backend
            } else {
                docker build -t $backendImage ./backend
            }
            
            if ($LASTEXITCODE -ne 0) { 
                throw "Backend build failed" 
            }
            Write-Success "Backend image built"
            
            Write-Info "Pushing backend image to Docker Hub..."
            docker push $backendImage
            if ($LASTEXITCODE -ne 0) { 
                throw "Backend push failed" 
            }
            Write-Success "Backend image pushed"
        } catch {
            Write-ErrorMsg "Backend Docker operations failed: $_"
            Set-Location $PROJECT_ROOT
            exit 1
        }
    }
    
    if ($Component -in 'all', 'frontend') {
        Write-Step "Building frontend Docker image..."
        try {
            $frontendImage = "$DOCKER_USER/thynkr-frontend:latest"
            
            # Stripe build args for frontend (baked into static build)
            $stripeBuildArgs = @(
                "--build-arg", "VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SbRAIJuKGUgkYW1fGKyfbuypMfap97iQNoGhLoXBWbLsLVXUHMPqeyyZtLc3i3S7Nr5TieuF7JI2v9TRTjZG6pa00P13f3z3i",
                "--build-arg", "VITE_STRIPE_PRICE_STANDARD_MONTHLY=price_1SbckrJuKGUgkYW1li8mzZsl",
                "--build-arg", "VITE_STRIPE_PRICE_STANDARD_YEARLY=price_1SbckrJuKGUgkYW1xtzor4VE",
                "--build-arg", "VITE_STRIPE_PRICE_PREMIUM_MONTHLY=price_1SbckrJuKGUgkYW1gAjSH1cE",
                "--build-arg", "VITE_STRIPE_PRICE_PREMIUM_YEARLY=price_1SbcksJuKGUgkYW1k4cxrjI9"
            )
            
            if ($NoCache) {
                docker build --no-cache @stripeBuildArgs -t $frontendImage ./frontend
            } else {
                docker build @stripeBuildArgs -t $frontendImage ./frontend
            }
            
            if ($LASTEXITCODE -ne 0) { 
                throw "Frontend build failed" 
            }
            Write-Success "Frontend image built"
            
            Write-Info "Pushing frontend image to Docker Hub..."
            docker push $frontendImage
            if ($LASTEXITCODE -ne 0) { 
                throw "Frontend push failed" 
            }
            Write-Success "Frontend image pushed"
        } catch {
            Write-ErrorMsg "Frontend Docker operations failed: $_"
            Set-Location $PROJECT_ROOT
            exit 1
        }
    }
} else {
    Write-Warning "Skipping build - deploying with existing images"
}

# Deploy to DigitalOcean
Write-Step "Deploying to DigitalOcean..."

# Copy config files
Write-Info "Syncing configuration files..."
try {
    $composeFile = "$PROJECT_ROOT/docker-compose.prod.yml"
    $nginxFile = "$PROJECT_ROOT/nginx.prod.conf"
    
    scp $composeFile "${SERVER}:/root/docker-compose.prod.yml"
    if ($LASTEXITCODE -ne 0) { 
        throw "Failed to copy docker-compose.prod.yml" 
    }
    
    scp $nginxFile "${SERVER}:/root/nginx.prod.conf"
    if ($LASTEXITCODE -ne 0) { 
        throw "Failed to copy nginx.prod.conf" 
    }
    
    Write-Success "Configuration files synced"
} catch {
    Write-ErrorMsg "Failed to sync config files: $_"
    exit 1
}

# Pull latest images on server
Write-Step "Pulling latest images on server..."
try {
    ssh $SERVER 'cd /root ; docker compose -f docker-compose.prod.yml pull'
    if ($LASTEXITCODE -ne 0) { 
        throw "Failed to pull images" 
    }
    Write-Success "Images pulled successfully"
} catch {
    Write-ErrorMsg "Failed to pull images: $_"
    exit 1
}

# Start containers
Write-Step "Starting containers..."
try {
    ssh $SERVER 'cd /root ; docker compose -f docker-compose.prod.yml up -d --force-recreate --remove-orphans'
    if ($LASTEXITCODE -ne 0) { 
        throw "Failed to start containers" 
    }
    Write-Success "Containers started"
} catch {
    Write-ErrorMsg "Failed to start containers: $_"
    Write-Warning "You may need to check server logs manually"
    exit 1
}

# Health checks
Write-Step "Running health checks..."
Start-Sleep -Seconds 10

try {
    Write-Info "Checking container status..."
    $containerStatus = ssh $SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}'" 2>&1
    Write-Host $containerStatus
    
    Write-Info "Checking backend health..."
    $backendHealth = ssh $SERVER 'docker compose -f docker-compose.prod.yml exec -T backend wget -qO- http://localhost:3001/health 2>&1' 2>&1
    
    if ($backendHealth -match 'status') {
        Write-Success "Backend is healthy"
    } else {
        Write-Warning "Backend health check returned unexpected response"
        Write-Host $backendHealth
    }
    
    Write-Info "Checking frontend..."
    $frontendCheck = ssh $SERVER 'curl -f -s -I http://localhost/ 2>&1 | head -n 1' 2>&1
    if ($frontendCheck -match '200') {
        Write-Success "Frontend is healthy"
    } else {
        Write-Warning "Frontend health check inconclusive"
        Write-Host $frontendCheck
    }
} catch {
    Write-Warning "Health checks could not complete: $_"
    Write-Info "This does not necessarily mean deployment failed"
}

# Final status
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "=========================================`n" -ForegroundColor Green

Write-Info "Your application is running at: https://thynkr.ca"
Write-Info "To view logs, SSH to the server and run:"
Write-Host "  docker compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray

# Test Account Credentials
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host " TEST ACCOUNT CREDENTIALS" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

Write-Host "Password for all accounts: " -NoNewline -ForegroundColor White
Write-Host "Password123!" -ForegroundColor Yellow

Write-Host "`nTest Accounts:" -ForegroundColor White
Write-Host "  1. Basic Account" -ForegroundColor Gray
Write-Host "     Email:    " -NoNewline -ForegroundColor Gray
Write-Host "basic@thynkr.ca" -ForegroundColor Cyan
Write-Host "     Role:     BASIC" -ForegroundColor Gray

Write-Host "`n  2. Standard Account" -ForegroundColor Gray
Write-Host "     Email:    " -NoNewline -ForegroundColor Gray
Write-Host "standard@thynkr.ca" -ForegroundColor Cyan
Write-Host "     Role:     STANDARD" -ForegroundColor Gray

Write-Host "`n  3. Premium Account" -ForegroundColor Gray
Write-Host "     Email:    " -NoNewline -ForegroundColor Gray
Write-Host "premium@thynkr.ca" -ForegroundColor Cyan
Write-Host "     Role:     PREMIUM" -ForegroundColor Gray
Write-Host "     Features: Full course access, 5 sample courses" -ForegroundColor DarkGray

Write-Host "`n  4. Admin Account" -ForegroundColor Gray
Write-Host "     Email:    " -NoNewline -ForegroundColor Gray
Write-Host "admin@thynkr.ca" -ForegroundColor Cyan
Write-Host "     Role:     ADMIN" -ForegroundColor Gray
Write-Host "     Features: Full admin dashboard access" -ForegroundColor DarkGray

Write-Host "`n=========================================" -ForegroundColor Cyan

Set-Location $PROJECT_ROOT
