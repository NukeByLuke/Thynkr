#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Rollback deployment on DigitalOcean
.DESCRIPTION
    Rolls back to previous Docker images and restores database backup if needed
.PARAMETER Component
    Which component to rollback: 'all', 'frontend', 'backend'
.PARAMETER RestoreDB
    Restore database from backup
.PARAMETER BackupFile
    Specific backup file to restore (leave empty to use latest)
.EXAMPLE
    .\rollback-deployment.ps1 -Component backend
    .\rollback-deployment.ps1 -Component all -RestoreDB
#>

param(
    [Parameter()]
    [ValidateSet('all', 'frontend', 'backend')]
    [string]$Component = 'all',
    
    [Parameter()]
    [switch]$RestoreDB,
    
    [Parameter()]
    [string]$BackupFile = "",

    [Parameter()]
    [switch]$Force
)

$SERVER = "root@138.197.208.81"
$DOCKER_HUB_USERNAME = "nukebyluke"

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "`n🔹 $Message" -ForegroundColor Blue }

$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║           ⚠️  ROLLBACK - Thynkr Platform ⚠️            ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Red

Write-Warning "This will rollback the deployment on PRODUCTION!"

if (-not $Force) {
    $confirm = Read-Host "Are you sure? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "Rollback cancelled"
        exit 0
    }
}

# List available backups
Write-Step "Available database backups:"
ssh $SERVER "ls -lh /root/backups/ | tail -10"

# Restore database if requested
if ($RestoreDB) {
    Write-Step "Restoring database..."
    
    if ($BackupFile -eq "") {
        Write-Info "Using most recent backup..."
        $restoreScript = @"
latest_backup=\$(ls -t /root/backups/db_backup_*.sql | head -1)
echo "Restoring from: \$latest_backup"
docker compose -f /root/docker-compose.prod.yml exec -T postgres psql -U thynkr -d thynkr_db < "\$latest_backup"
echo "Database restored successfully"
"@
    } else {
        $restoreScript = @"
echo "Restoring from: /root/backups/$BackupFile"
docker compose -f /root/docker-compose.prod.yml exec -T postgres psql -U thynkr -d thynkr_db < "/root/backups/$BackupFile"
echo "Database restored successfully"
"@
    }
    
    ssh $SERVER $restoreScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database restored successfully"
    } else {
        Write-Error "Database restore failed"
        exit 1
    }
}

# Get previous image tags
Write-Step "Fetching previous image versions..."
$images = ssh $SERVER "docker images ${DOCKER_HUB_USERNAME}/thynkr-backend --format '{{.Tag}}' | grep -v latest | head -5"
Write-Info "Recent backend images: $images"

# Rollback to previous image
Write-Step "Rolling back Docker images..."

if ($Component -eq 'all' -or $Component -eq 'backend') {
    Write-Info "Rolling back backend to previous version..."
    $rollbackScript = @"
cd /root
# Get the second most recent image (not latest)
previous_tag=\$(docker images ${DOCKER_HUB_USERNAME}/thynkr-backend --format '{{.Tag}}' | grep -v latest | head -1)
if [ -z "\$previous_tag" ]; then
    echo "No previous image found, keeping latest"
else
    echo "Rolling back to tag: \$previous_tag"
    docker tag ${DOCKER_HUB_USERNAME}/thynkr-backend:\$previous_tag ${DOCKER_HUB_USERNAME}/thynkr-backend:latest
    docker compose -f docker-compose.prod.yml up -d --force-recreate backend
    sleep 5
    docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
fi
"@
    ssh $SERVER $rollbackScript
    Write-Success "Backend rollback complete"
}

if ($Component -eq 'all' -or $Component -eq 'frontend') {
    Write-Info "Rolling back frontend to previous version..."
    $rollbackScript = @"
cd /root
previous_tag=\$(docker images ${DOCKER_HUB_USERNAME}/thynkr-frontend --format '{{.Tag}}' | grep -v latest | head -1)
if [ -z "\$previous_tag" ]; then
    echo "No previous image found, keeping latest"
else
    echo "Rolling back to tag: \$previous_tag"
    docker tag ${DOCKER_HUB_USERNAME}/thynkr-frontend:\$previous_tag ${DOCKER_HUB_USERNAME}/thynkr-frontend:latest
    docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
fi
"@
    ssh $SERVER $rollbackScript
    Write-Success "Frontend rollback complete"
}

# Health check
Write-Step "Checking service health..."
Start-Sleep -Seconds 5

ssh $SERVER "cd /root && docker compose -f docker-compose.prod.yml ps"

if ($Component -eq 'all' -or $Component -eq 'backend') {
    $health = ssh $SERVER "curl -f -s http://localhost:3001/health"
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend is healthy"
    } else {
        Write-Warning "Backend health check failed"
    }
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║              Rollback Complete - Check Logs!              ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow

Write-Info "View logs with: ssh $SERVER 'docker compose -f /root/docker-compose.prod.yml logs -f'"

exit 0
