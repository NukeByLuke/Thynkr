# 🚀 Production Deployment Commands for thynkr.ca

## Initial Setup (One-Time)

### 1. Clone Repository on Server
```bash
ssh your-server
cd /opt  # or wherever you want the app
git clone https://github.com/NukeByLuke/Thynkr.git
cd Thynkr
```

### 2. Create .env File
```bash
nano .env
```

Copy this template and fill in your values:
```env
# Database
POSTGRES_USER=thynkr
POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
POSTGRES_DB=thynkr_db

# JWT Secrets (generate new ones or use existing)
JWT_ACCESS_SECRET=IX029TDLQnieAE6Wp8uBMhaR5odz4t3YSfCjVwKqkbgUmvyOZFJ7crGHs1xlPN
JWT_REFRESH_SECRET=VJvsYBGqekPRlSHOL0WCa6rdw8fEIN5x2K91XjyhocQziupFDtMUZAbnmg743

# Stripe Keys (TEST MODE for now)
STRIPE_SECRET_KEY=sk_test_51SbRASFLpibl0I1eHQFcj0OyxJkyIIYkL9gTUcIRYOFOXip8OG2lsmV8SVYknJVqwLmUzEOHj1obzxkzsLYVnDPq00z7sNomMj
STRIPE_PUBLISHABLE_KEY=pk_test_51SbRASFLpibl0I1epZW3cMoyLW0obD1Mmg3pNdEmCA3gaoBAwyCH420y1d0owiojk0hehip9MF5M7wChIqwAsuVR00AjvrbmiP
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_PRODUCTION_WEBHOOK_SECRET

# Stripe Price IDs (TEST MODE)
STRIPE_PRICE_PRO_MONTHLY=price_1SbTpjFLpibl0I1eT2bUQAyG
STRIPE_PRICE_PRO_YEARLY=price_1SbTpnFLpibl0I1eFWeJTCoH
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SbTprFLpibl0I1eYEEJYG9i
STRIPE_PRICE_PREMIUM_YEARLY=price_1SbTpvFLpibl0I1eMwaex7YR

# OpenAI
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4o-mini

# Frontend URL
FRONTEND_URL=https://thynkr.ca

# Feature Flags
ENABLE_EMAIL_VERIFICATION=false
ENABLE_ANALYTICS=false
```

### 3. Setup SSL Certificates (If Not Done)
```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Get certificates
sudo certbot certonly --standalone -d thynkr.ca -d www.thynkr.ca

# Certificates will be at: /etc/letsencrypt/live/thynkr.ca/
```

### 4. Initial Deploy
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
docker-compose -f docker-compose.prod.yml ps

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Regular Updates (Deploy New Code)

### Quick Update (Pull and Restart)
```bash
ssh your-server
cd /opt/Thynkr  # or your path

# Pull latest code
git pull origin main  # or develop

# Restart with new code (pulls latest images)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Full Rebuild (If Images Need Rebuilding)
```bash
ssh your-server
cd /opt/Thynkr

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Run any new migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Health Checks

### Check All Services
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Check Backend Health
```bash
# From server
docker-compose -f docker-compose.prod.yml exec backend wget -qO- http://localhost:3001/health

# From anywhere
curl https://thynkr.ca/api/health
```

### Check Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Check Resource Usage
```bash
docker stats
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common fixes:
# 1. Check .env file exists
cat .env

# 2. Verify database connection
docker-compose -f docker-compose.prod.yml logs postgres

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 4. Restart everything
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 502 Bad Gateway
```bash
# See full troubleshooting guide
cat TROUBLESHOOTING_502.md

# Quick checks:
docker-compose -f docker-compose.prod.yml ps  # All healthy?
docker-compose -f docker-compose.prod.yml logs backend --tail=50
docker-compose -f docker-compose.prod.yml exec backend wget -qO- http://localhost:3001/health
```

### Database Issues
```bash
# Access database
docker-compose -f docker-compose.prod.yml exec postgres psql -U thynkr -d thynkr_db

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Reset database (WARNING: DELETES ALL DATA)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Out of Disk Space
```bash
# Clean up Docker
docker system prune -a
docker volume prune

# Check space
df -h
```

---

## Monitoring

### View Logs in Real-Time
```bash
docker-compose -f docker-compose.prod.yml logs -f backend | grep -E "(error|Error|ERROR|warn|Warn|WARN)"
```

### Check Database Size
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U thynkr -d thynkr_db -c "SELECT pg_size_pretty(pg_database_size('thynkr_db'));"
```

### Check Stripe Webhooks
1. Go to https://dashboard.stripe.com/webhooks
2. Click your endpoint
3. View recent attempts

---

## Backup

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U thynkr thynkr_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U thynkr thynkr_db < backup_20241206_123456.sql
```

### Backup Uploads
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

---

## Update Environment Variables

### Add/Change Variables
```bash
# Edit .env
nano .env

# Restart to apply changes
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Update Stripe Keys (Switch to LIVE)
```bash
nano .env

# Change:
# STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
# STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
# STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
# STRIPE_PRICE_PRO_MONTHLY=price_live_YOUR_ID
# ... etc

# Restart
docker-compose -f docker-compose.prod.yml restart
```

---

## SSL Certificate Renewal

### Auto-Renewal (Recommended)
```bash
# Setup auto-renewal with cron
sudo crontab -e

# Add this line:
0 0 1 * * certbot renew --quiet && docker-compose -f /opt/Thynkr/docker-compose.prod.yml restart frontend
```

### Manual Renewal
```bash
sudo certbot renew
docker-compose -f docker-compose.prod.yml restart frontend
```

---

## Quick Commands Reference

```bash
# Start everything
docker-compose -f docker-compose.prod.yml up -d

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Check status
docker-compose -f docker-compose.prod.yml ps

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Access database
docker-compose -f docker-compose.prod.yml exec postgres psql -U thynkr -d thynkr_db

# Check health
curl https://thynkr.ca/api/health
```
