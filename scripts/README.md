# Scripts Directory

Automation scripts for Thynkr development and deployment workflows.

## ðŸ“¦ Deployment

### `deploy.ps1` - Main Deployment Script
Deploy your application to DigitalOcean with full control over what gets deployed.

**Usage:**
```powershell
# Deploy everything (recommended for production)
.\scripts\deploy.ps1

# Deploy only backend
.\scripts\deploy.ps1 -Component backend

# Deploy only frontend
.\scripts\deploy.ps1 -Component frontend

# Quick deploy (skip tests and use existing images)
.\scripts\deploy.ps1 -SkipTests -SkipBuild

# Fresh build without cache
.\scripts\deploy.ps1 -NoCache

# Deploy frontend with no cache
.\scripts\deploy.ps1 -Component frontend -NoCache
```

**Parameters:**
- `-Component`: Choose what to deploy (`all`, `frontend`, `backend`)
- `-SkipBuild`: Skip Docker build (use existing images)
- `-SkipTests`: Skip running tests before deployment
- `-NoCache`: Build Docker images without cache (fresh build)

**What it does:**
1. âœ… Checks prerequisites (Docker, SSH)
2. ðŸ§ª Runs tests (unless skipped)
3. ðŸ—ï¸ Builds Docker images
4. ðŸ“¤ Pushes images to Docker Hub
5. ðŸš€ Deploys to DigitalOcean
6. ðŸ—ƒï¸ Runs database migrations (for backend)
7. ðŸ§¹ Cleans up old images
8. ðŸ’š Performs health checks

### `rollback-deployment.ps1` - Rollback Mechanism
Quickly rollback to a previous deployment if something goes wrong.

**Usage:**
```powershell
.\scripts\rollback-deployment.ps1
```

## ðŸ”§ Development Workflow

### `new-feature.ps1` - Create Feature Branch
Start a new feature branch with proper naming convention.

**Usage:**
```powershell
# Create feature branch
.\scripts\new-feature.ps1 user-authentication

# Creates: feature/user-authentication
```

### `merge-feature.ps1` - Merge Feature Branch
Merge a completed feature back to develop branch.

**Usage:**
```powershell
# Merge current feature branch to develop
.\scripts\merge-feature.ps1
```

### `release.ps1` - Release Process
Create a new release with proper versioning and tagging.

**Usage:**
```powershell
# Create new release
.\scripts\release.ps1 1.2.0

# This will:
# - Run all checks (lint, typecheck, build, tests)
# - Merge develop â†’ main
# - Create git tag v1.2.0
# - Push to origin
```

## ðŸ’³ Configuration

### `setup-stripe.ps1` - Stripe Setup
Configure Stripe webhooks for your local or production environment.

**Usage:**
```powershell
.\scripts\setup-stripe.ps1
```

## ðŸŽ¯ Quick Reference

### Common Deployment Scenarios

**Full Production Deployment:**
```powershell
.\scripts\deploy.ps1
```

**Emergency Hotfix (Backend Only):**
```powershell
.\scripts\deploy.ps1 -Component backend -SkipTests
```

**UI Update (Frontend Only):**
```powershell
.\scripts\deploy.ps1 -Component frontend
```

**Something Went Wrong:**
```powershell
.\scripts\rollback-deployment.ps1
```

### Development Flow

1. **Start new feature:**
   ```powershell
   .\scripts\new-feature.ps1 my-feature
   ```

2. **Work on feature, commit changes**

3. **Merge feature when done:**
   ```powershell
   .\scripts\merge-feature.ps1
   ```

4. **Create release:**
   ```powershell
   .\scripts\release.ps1 1.2.0
   ```

5. **Deploy to production:**
   ```powershell
   .\scripts\deploy.ps1
   ```

## ðŸ” Prerequisites

- **Docker**: Required for building images
- **SSH Access**: Must have SSH key configured for DigitalOcean server
- **Docker Hub**: Must be logged in (`docker login`)
- **Git**: For version control operations
- **Node.js & pnpm**: For running tests and builds

## ðŸŒ Server Details

- **Server**: `root@138.197.208.81`
- **Docker Hub**: `nukebyluke/thynkr-*`
- **Production URL**: https://thynkr.ca

## ðŸ“ Notes

- All deployment scripts include error handling and rollback support
- Scripts are Windows PowerShell compatible
- Logs are generated for each deployment in project root
- Health checks run automatically after deployment
- Database migrations run automatically for backend deployments

## ðŸ†˜ Troubleshooting

**SSH Connection Failed:**
```powershell
# Test connection manually
ssh root@138.197.208.81
```

**Docker Build Failed:**
```powershell
# Try with no cache
.\scripts\deploy.ps1 -NoCache
```

**Deployment Failed:**
```powershell
# Rollback to previous version
.\scripts\rollback-deployment.ps1

# Check server logs
ssh root@138.197.208.81 'cd /root && docker compose -f docker-compose.prod.yml logs -f'
```

**Tests Failing:**
```powershell
# Deploy anyway (not recommended)
.\scripts\deploy.ps1 -SkipTests
```

## ðŸ”— Related Files

- `../docker-compose.prod.yml` - Production Docker Compose config
- `../nginx.prod.conf` - Nginx configuration for production
- `../.env` - Environment variables (not tracked in git)
