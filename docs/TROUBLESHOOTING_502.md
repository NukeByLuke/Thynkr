# 🚨 Troubleshooting 502 Bad Gateway on thynkr.ca

## Problem
Your frontend loads but the backend API at `https://thynkr.ca/api/auth/login` returns 502 Bad Gateway.

## What 502 Means
The nginx frontend can't reach the backend service. The backend is either:
1. Not running
2. Can't connect to the database
3. Crashed during startup
4. Not on the same Docker network

---

## 🔍 Step 1: SSH to Your Server

```bash
ssh your-server
cd /path/to/thynkr
```

---

## 🔍 Step 2: Check Container Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

**Expected output:**
```
NAME                          STATUS                  PORTS
thynkr-backend-1             Up (healthy)            
thynkr-frontend-1            Up (healthy)            0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
thynkr-postgres-1            Up (healthy)            
thynkr-redis-1               Up (healthy)
```

**If backend shows "unhealthy" or "exited":**
- Backend is crashing - check logs (next step)

**If backend is not listed:**
- Backend container didn't start - check logs

---

## 🔍 Step 3: Check Backend Logs

```bash
docker-compose -f docker-compose.prod.yml logs backend --tail=100
```

**Common errors and solutions:**

### Error: "Missing required environment variable"
```
Error: Missing required environment variable: JWT_ACCESS_SECRET
```
**Solution:** Your `.env` file is missing variables
```bash
nano .env
# Add missing variables from .env.production template
```

### Error: "Can't reach database server"
```
Error: P1001: Can't reach database server at `postgres:5432`
```
**Solution:** Database isn't ready or password is wrong
```bash
# Check postgres logs
docker-compose -f docker-compose.prod.yml logs postgres

# Verify DATABASE_URL in .env
# Should be: postgresql://thynkr:YOUR_PASSWORD@postgres:5432/thynkr_db
```

### Error: "Stripe key invalid"
```
Error: Invalid API Key provided
```
**Solution:** Stripe keys are wrong or missing
```bash
nano .env
# Update STRIPE_SECRET_KEY with valid key from Stripe Dashboard
```

### Error: "Port 3001 already in use"
**Solution:** Another process is using the port
```bash
# Find and kill the process
sudo lsof -ti:3001 | xargs kill -9

# Restart containers
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 🔍 Step 4: Check Frontend Logs

```bash
docker-compose -f docker-compose.prod.yml logs frontend --tail=50
```

Look for nginx errors like:
```
connect() failed (111: Connection refused) while connecting to upstream
```
This confirms frontend can't reach backend.

---

## 🔍 Step 5: Test Backend Health Directly

```bash
# From your server, test backend directly
docker-compose -f docker-compose.prod.yml exec backend wget -qO- http://localhost:3001/health

# Should return: {"status":"ok"}
```

**If this works:** Backend is fine, nginx config issue
**If this fails:** Backend isn't responding on port 3001

---

## 🔍 Step 6: Verify Environment Variables

```bash
# Check if .env file exists
ls -la .env

# Check backend sees the variables
docker-compose -f docker-compose.prod.yml exec backend printenv | grep -E "(DATABASE_URL|JWT_|STRIPE_)"
```

**Should show:**
- DATABASE_URL (with your password)
- JWT_ACCESS_SECRET (long random string)
- JWT_REFRESH_SECRET (long random string)
- STRIPE_SECRET_KEY (sk_test_ or sk_live_)

---

## 🔍 Step 7: Check Docker Network

```bash
docker network ls
docker network inspect thynkr_thynkr-network
```

Backend should be in the same network as frontend.

---

## ✅ Quick Fixes

### Fix 1: Restart Everything
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
```

### Fix 2: Rebuild Backend
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build backend --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Fix 3: Check .env File
```bash
# Make sure .env exists in the project root
cat .env

# If missing, create it
nano .env
```

Required variables:
```env
# Database
POSTGRES_USER=thynkr
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=thynkr_db

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Stripe (use test keys for now)
STRIPE_SECRET_KEY=sk_test_51SbRASFLpibl0I1eHQFcj0OyxJkyIIYkL9gTUcIRYOFOXip8OG2lsmV8SVYknJVqwLmUzEOHj1obzxkzsLYVnDPq00z7sNomMj
STRIPE_PUBLISHABLE_KEY=pk_test_51SbRASFLpibl0I1epZW3cMoyLW0obD1Mmg3pNdEmCA3gaoBAwyCH420y1d0owiojk0hehip9MF5M7wChIqwAsuVR00AjvrbmiP
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_1SbTpjFLpibl0I1eT2bUQAyG
STRIPE_PRICE_PRO_YEARLY=price_1SbTpnFLpibl0I1eFWeJTCoH
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SbTprFLpibl0I1eYEEJYG9i
STRIPE_PRICE_PREMIUM_YEARLY=price_1SbTpvFLpibl0I1eMwaex7YR

# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Frontend URL
FRONTEND_URL=https://thynkr.ca
```

### Fix 4: Check Database Migration
```bash
# Run Prisma migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Fix 5: Check SSL Certificates
```bash
# Verify Let's Encrypt certificates exist
ls -la /etc/letsencrypt/live/thynkr.ca/

# Should show:
# fullchain.pem
# privkey.pem
```

---

## 🎯 Most Common Solution

**90% of the time, the issue is:**

1. **Missing .env file** - Create it from .env.production template
2. **Wrong database password** - Check POSTGRES_PASSWORD in .env
3. **Backend crashed** - Check logs and fix the error
4. **Migrations not run** - Run `docker-compose exec backend npx prisma migrate deploy`

---

## 📞 Debug Checklist

Run these commands and send me the output:

```bash
# 1. Container status
docker-compose -f docker-compose.prod.yml ps

# 2. Backend logs (last 50 lines)
docker-compose -f docker-compose.prod.yml logs backend --tail=50

# 3. Test backend health
docker-compose -f docker-compose.prod.yml exec backend wget -qO- http://localhost:3001/health

# 4. Check environment variables are loaded
docker-compose -f docker-compose.prod.yml exec backend printenv | grep -E "(DATABASE_URL|JWT_ACCESS_SECRET|STRIPE_SECRET_KEY)"

# 5. Check .env file exists
ls -la .env && echo "=== ENV FILE CONTENTS ===" && cat .env
```

---

## 🚀 After Fixing

Once backend is running:

1. Test health endpoint:
   ```bash
   curl https://thynkr.ca/api/health
   ```
   Should return: `{"status":"ok"}`

2. Try logging in again at https://thynkr.ca

3. Check browser console - should work without 502 error

---

## 💡 Pro Tips

- Always check logs first: `docker-compose logs backend`
- Test health endpoint: `/api/health` should always return 200
- Environment variables are loaded from `.env` in project root
- Backend needs postgres and redis to be healthy before starting
- Use `docker-compose down && docker-compose up -d` to fully restart
