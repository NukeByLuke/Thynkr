#!/usr/bin/env pwsh
# Thynkr Setup Script for Windows
# This script automates the initial setup for contributors

param(
    [switch]$SkipDocker,
    [switch]$SkipDependencies
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔════════════════════════════════════════════════════╗
║                                                    ║
║              🧠 THYNKR SETUP                      ║
║                                                    ║
║   AI-Powered Learning Platform - Setup Wizard     ║
║                                                    ║
╚════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command($command) {
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Function to display status
function Write-Status($message, $status = "info") {
    switch ($status) {
        "success" { Write-Host "✓ $message" -ForegroundColor Green }
        "error" { Write-Host "✗ $message" -ForegroundColor Red }
        "warning" { Write-Host "⚠ $message" -ForegroundColor Yellow }
        default { Write-Host "→ $message" -ForegroundColor Cyan }
    }
}

# 1. Check Prerequisites
Write-Host "`n[1/8] Checking Prerequisites..." -ForegroundColor Yellow

$missingTools = @()

if (-not (Test-Command "node")) {
    $missingTools += "Node.js (v18+)"
}
if (-not (Test-Command "pnpm")) {
    $missingTools += "pnpm (v8+)"
}
if (-not $SkipDocker -and -not (Test-Command "docker")) {
    $missingTools += "Docker"
}
if (-not (Test-Command "git")) {
    $missingTools += "Git"
}

if ($missingTools.Count -gt 0) {
    Write-Status "Missing required tools:" "error"
    $missingTools | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`nPlease install the missing tools and try again." -ForegroundColor Yellow
    Write-Host "  • Node.js: https://nodejs.org/" -ForegroundColor Gray
    Write-Host "  • pnpm: npm install -g pnpm" -ForegroundColor Gray
    Write-Host "  • Docker: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    exit 1
}

Write-Status "All prerequisites found" "success"

# 2. Setup Environment Files
Write-Host "`n[2/8] Setting up environment files..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Status "Created root .env file" "success"
} else {
    Write-Status "Root .env already exists" "warning"
}

if (-not (Test-Path "frontend/.env")) {
    Copy-Item "frontend/.env.example" "frontend/.env"
    Write-Status "Created frontend .env file" "success"
} else {
    Write-Status "Frontend .env already exists" "warning"
}

# 3. Install Dependencies
if (-not $SkipDependencies) {
    Write-Host "`n[3/8] Installing dependencies..." -ForegroundColor Yellow
    
    try {
        pnpm install --frozen-lockfile
        Write-Status "Dependencies installed successfully" "success"
    } catch {
        Write-Status "Failed to install dependencies" "error"
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n[3/8] Skipping dependency installation" -ForegroundColor Gray
}

# 4. Start Docker Services
if (-not $SkipDocker) {
    Write-Host "`n[4/8] Starting Docker services (PostgreSQL & Redis)..." -ForegroundColor Yellow
    
    try {
        docker-compose up -d postgres redis
        Write-Status "Docker services started" "success"
        
        # Wait for PostgreSQL to be ready
        Write-Host "   Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
        
        # Check if PostgreSQL is healthy
        $maxRetries = 30
        $retryCount = 0
        $isHealthy = $false
        
        while ($retryCount -lt $maxRetries -and -not $isHealthy) {
            try {
                $result = docker-compose exec -T postgres pg_isready -U thynkr 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $isHealthy = $true
                    Write-Status "PostgreSQL is ready" "success"
                } else {
                    Start-Sleep -Seconds 1
                    $retryCount++
                }
            } catch {
                Start-Sleep -Seconds 1
                $retryCount++
            }
        }
        
        if (-not $isHealthy) {
            Write-Status "PostgreSQL failed to start in time" "warning"
            Write-Host "   You may need to manually check Docker logs" -ForegroundColor Gray
        }
    } catch {
        Write-Status "Failed to start Docker services" "error"
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n[4/8] Skipping Docker services (manual mode)" -ForegroundColor Gray
}

# 5. Create Database (if it doesn't exist)
Write-Host "`n[5/8] Initializing database..." -ForegroundColor Yellow

if (-not $SkipDocker) {
    try {
        # Check if database exists
        $dbExists = docker-compose exec -T postgres psql -U thynkr -lqt 2>&1 | Select-String -Pattern "thynkr_db"
        
        if (-not $dbExists) {
            Write-Host "   Creating database 'thynkr_db'..." -ForegroundColor Gray
            docker-compose exec -T postgres psql -U thynkr -c "CREATE DATABASE thynkr_db;" 2>&1 | Out-Null
            Write-Status "Database created" "success"
        } else {
            Write-Status "Database already exists" "success"
        }
    } catch {
        Write-Status "Note: Database creation skipped (may already exist)" "warning"
    }
} else {
    Write-Host "   Ensure your PostgreSQL database 'thynkr_db' exists" -ForegroundColor Yellow
}

# 6. Run Prisma Migrations
Write-Host "`n[6/8] Running database migrations..." -ForegroundColor Yellow

try {
    Set-Location backend
    pnpm prisma migrate dev --name init
    Write-Status "Database migrations completed" "success"
    Set-Location ..
} catch {
    Write-Status "Migration failed (may be normal if already migrated)" "warning"
    Set-Location ..
}

# 7. Generate Prisma Client
Write-Host "`n[7/8] Generating Prisma Client..." -ForegroundColor Yellow

try {
    pnpm --filter backend db:generate
    Write-Status "Prisma Client generated" "success"
} catch {
    Write-Status "Failed to generate Prisma Client" "error"
    exit 1
}

# 8. Summary
Write-Host "`n[8/8] Setup Complete! 🎉" -ForegroundColor Green

Write-Host @"

╔════════════════════════════════════════════════════╗
║                  NEXT STEPS                        ║
╚════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "1. Configure your .env file with API keys:" -ForegroundColor White
Write-Host "   • OPENAI_API_KEY (required for AI features)" -ForegroundColor Gray
Write-Host "   • GEMINI_API_KEY (optional, for additional AI features)" -ForegroundColor Gray
Write-Host "   • STRIPE_SECRET_KEY (optional, for payment testing)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the development servers:" -ForegroundColor White
Write-Host "   pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access the application:" -ForegroundColor White
Write-Host "   • Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • Backend:   http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Create an admin user (optional):" -ForegroundColor White
Write-Host "   cd backend && node create-admin.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more information, see:" -ForegroundColor White
Write-Host "   • docs/CONTRIBUTING.md" -ForegroundColor Gray
Write-Host "   • README.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Need help? Open an issue at:" -ForegroundColor White
Write-Host "   https://github.com/NukeByLuke/Thynkr/issues" -ForegroundColor Cyan
Write-Host ""
