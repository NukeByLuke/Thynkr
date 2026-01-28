# 🐳 Docker Quick Start Guide

This guide will get you up and running with Thynkr using Docker in under 5 minutes.

## Prerequisites

- **Docker** and **Docker Compose** installed
- **OpenAI API key** (get one at https://platform.openai.com/api-keys)

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NukeByLuke/Thynkr.git
cd Thynkr
```

### 2. Create Environment File

```bash
# Copy the Docker environment template
cp .env.docker.example .env
```

### 3. Add Your OpenAI API Key

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

**That's it!** All other values have safe defaults.

### 4. Start the Application

```bash
docker-compose up --build
```

Wait for all services to start (about 1-2 minutes on first run).

### 5. Access the Application

Open your browser:
- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:3003

## Default Ports

| Service    | Internal Port | External Port | URL |
|------------|---------------|---------------|-----|
| Frontend   | 80           | 5175         | http://localhost:5175 |
| Backend    | 3001         | 3003         | http://localhost:3003 |
| PostgreSQL | 5432         | 5435         | localhost:5435 |
| Redis      | 6379         | 6380         | localhost:6380 |

## Optional Configuration

### Enable Gemini AI (Optional)

If you want to use Google's Gemini AI in addition to OpenAI:

1. Get a Gemini API key from https://makersuite.google.com/app/apikey
2. Add it to `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### Enable Stripe Payments (Optional)

Only needed if you're testing payment features:

1. Get test keys from https://dashboard.stripe.com/test/apikeys
2. Add to `.env`:
```env
STRIPE_SECRET_KEY="sk_test_your_real_key_here"
```

3. Start with Stripe CLI webhook forwarding:
```bash
docker-compose --profile stripe up
```

## Common Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# View running containers
docker-compose ps
```

## Troubleshooting

### Backend crashes with "GEMINI_API_KEY required"

**Solution**: Make sure you're using the latest code. GEMINI_API_KEY is now optional. If you still see this error:

```bash
# Rebuild the backend
docker-compose build backend
docker-compose up
```

### "Database 'thynkr' does not exist"

**Solution**: The database should auto-create. If it doesn't:

```bash
# Stop everything and remove volumes
docker-compose down -v

# Start fresh
docker-compose up --build
```

### Stripe CLI keeps restarting

**Solution**: This is normal if you don't have a valid Stripe key. The Stripe CLI is optional:

```bash
# Run without Stripe CLI
docker-compose up postgres redis backend frontend
```

Or set a placeholder in `.env`:
```env
STRIPE_SECRET_KEY="sk_test_placeholder"
```

### Port already in use

**Solution**: Change the external port in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - '3000:80'  # Change 5175 to 3000 or any free port
```

## Next Steps

1. **Create an admin user**:
```bash
docker-compose exec backend node create-admin.js
```

2. **View backend logs**:
```bash
docker-compose logs -f backend
```

3. **Access the database**:
```bash
docker-compose exec postgres psql -U thynkr -d thynkr_db
```

4. **Run database migrations** (if needed):
```bash
docker-compose exec backend npx prisma migrate dev
```

## Development vs Production

This setup is for **local development only**. For production deployment:

1. Use `docker-compose.prod.yml`
2. Set `NODE_ENV=production`
3. Use strong JWT secrets
4. Configure SSL/TLS
5. Use production Stripe keys
6. Enable email verification

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup.

## Need Help?

- 📚 [Full documentation](README.md)
- 🐛 [Report an issue](https://github.com/NukeByLuke/Thynkr/issues)
- 💬 [Ask a question](https://github.com/NukeByLuke/Thynkr/discussions)
- 🔧 [Troubleshooting guide](docs/TROUBLESHOOTING.md)
