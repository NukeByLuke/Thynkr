# Troubleshooting Common Setup Issues

This guide helps you resolve common issues when setting up Thynkr for local development.

## 🔴 "database 'thynkr_db' does not exist"

**Problem:** Prisma migrations fail because the database hasn't been created yet.

**Solutions:**

### Option 1: Use the Setup Script (Easiest)

```bash
# Windows
.\setup.ps1

# Linux/macOS
./setup.sh
```

### Option 2: Manual Database Creation

**If using Docker:**

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait a few seconds, then create the database
docker-compose exec postgres psql -U thynkr -c "CREATE DATABASE thynkr_db;"

# Now run migrations
cd backend
pnpm prisma migrate dev
```

**If using local PostgreSQL:**

```bash
# Using psql
psql -U thynkr -c "CREATE DATABASE thynkr_db;"

# Or using createdb
createdb -U thynkr thynkr_db
```

### Option 3: Update DATABASE_URL

Make sure your `.env` file has the correct database name:

```env
DATABASE_URL="postgresql://thynkr:thynkr_dev_password@localhost:5432/thynkr_db"
```

---

## 🔴 "Port 5432 already in use"

**Problem:** Another PostgreSQL instance is running on port 5432.

**Solutions:**

### Option 1: Stop existing PostgreSQL

```bash
# Windows
Stop-Service postgresql-x64-XX

# Linux/macOS
sudo systemctl stop postgresql
# or
brew services stop postgresql
```

### Option 2: Use a different port

Edit `docker-compose.yml`:

```yaml
postgres:
  ports:
    - '5435:5432' # Use 5435 instead
```

Then update your `.env`:

```env
DATABASE_URL="postgresql://thynkr:thynkr_dev_password@localhost:5435/thynkr_db"
```

---

## 🔴 "pnpm: command not found"

**Problem:** pnpm is not installed.

**Solution:**

```bash
npm install -g pnpm
```

---

## 🔴 Prisma Migration Fails

**Problem:** Migration errors or schema conflicts.

**Solutions:**

### Reset the database (development only!)

```bash
cd backend
pnpm prisma migrate reset
```

### Regenerate Prisma Client

```bash
pnpm prisma generate
```

### Check connection

```bash
pnpm prisma db push
```

---

## 🔴 Docker containers won't start

**Problem:** Docker services fail to start or are unhealthy.

**Solutions:**

### Check logs

```bash
docker-compose logs postgres
docker-compose logs backend
```

### Restart services

```bash
docker-compose down
docker-compose up -d
```

### Clean restart

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

---

## 🔴 "Cannot connect to Redis"

**Problem:** Redis connection fails.

**Solutions:**

### Check if Redis is running

```bash
docker-compose ps redis
```

### Restart Redis

```bash
docker-compose restart redis
```

### Check Redis URL in .env

```env
REDIS_URL="redis://localhost:6379"
```

If using Docker, check the port mapping:

```yaml
redis:
  ports:
    - '6380:6379' # External:Internal
```

Then update `.env`:

```env
REDIS_URL="redis://localhost:6380"
```

---

## 🔴 Frontend can't connect to backend

**Problem:** API requests fail with CORS or connection errors.

**Solutions:**

### Check backend is running

```bash
curl http://localhost:3001/health
```

### Verify VITE_API_URL in frontend/.env

```env
VITE_API_URL="http://localhost:3001"
```

### Check FRONTEND_URL in backend .env

```env
FRONTEND_URL="http://localhost:5173"
```

### Restart development servers

```bash
pnpm dev
```

---

## 🔴 "OpenAI API key invalid"

**Problem:** AI features fail due to missing or invalid API key.

**Solution:**

1. Get an API key from https://platform.openai.com/api-keys
2. Add it to `.env`:

```env
OPENAI_API_KEY="sk-proj-..."
```

3. Restart the backend

---

## 🔴 Permission denied on Linux/macOS

**Problem:** Scripts fail with permission errors.

**Solution:**

```bash
# Make setup script executable
chmod +x setup.sh

# Make database init script executable
chmod +x backend/scripts/sql/init-db.sh
```

---

## 🔴 Build fails with TypeScript errors

**Problem:** TypeScript compilation errors.

**Solutions:**

### Clear cache and reinstall

```bash
# Remove node_modules
rm -rf node_modules frontend/node_modules backend/node_modules

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

### Generate Prisma types

```bash
pnpm --filter backend db:generate
```

---

## 🔴 Environment variables not loading

**Problem:** Configuration values are missing.

**Solutions:**

### Check .env files exist

```bash
ls -la .env
ls -la frontend/.env
```

### Copy from examples

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### Restart servers after changing .env

```bash
# Stop all processes
pnpm stop  # or Ctrl+C

# Start again
pnpm dev
```

---

## 🆘 Still Having Issues?

If none of these solutions work:

1. **Check the logs:**

   ```bash
   # Docker logs
   docker-compose logs -f backend

   # Development logs
   pnpm dev
   ```

2. **Open an issue:**
   - Go to https://github.com/NukeByLuke/Thynkr/issues
   - Use the "Bug Report" template
   - Include your error messages and logs

3. **Ask in Discussions:**
   - Visit https://github.com/NukeByLuke/Thynkr/discussions
   - Search for similar issues
   - Ask your question with details

---

## 📝 Quick Reference

### Common Commands

```bash
# Setup
./setup.sh  # or .\setup.ps1 on Windows

# Development
pnpm dev

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose restart
docker-compose down

# Database
cd backend
pnpm prisma migrate dev
pnpm prisma studio
pnpm prisma db push

# Clean restart
pnpm clean
pnpm install
docker-compose down -v
docker-compose up --build
```

### Environment File Locations

- Root: `.env`
- Frontend: `frontend/.env`
- Backend: Uses root `.env`

### Default Ports

| Service    | Port |
| ---------- | ---- |
| Frontend   | 5173 |
| Backend    | 3001 |
| PostgreSQL | 5432 |
| Redis      | 6379 |
