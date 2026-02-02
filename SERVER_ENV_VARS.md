# Server Environment Variables

SSH into your DigitalOcean server and add these to `/root/.env`

```bash
ssh root@YOUR_DROPLET_IP
cd /root
nano .env
```

Add these lines to the end of your .env file:

```env
# Stripe Test Mode Configuration
STRIPE_SECRET_KEY=sk_test_51SbRAIJuKGUgkYW1WnRsjMKXe7V9eYQnJM8QBRu2HK0kguPgYFDw8ez2ZMf0YJQXbqvWeArESIU3M8V38zgzg4fG00hg5M1zCl
STRIPE_PUBLISHABLE_KEY=pk_test_51SbRAIJuKGUgkYW13Ena665dDAbUOLx9r4TfAxOW0Q83SHSOfkCugOv9lwFT7GLhYYXB78giq22o0SUehm7oJAvI00D5ydmK5v
STRIPE_WEBHOOK_SECRET=whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf
STRIPE_PRICE_PRO_MONTHLY=price_1SuJ87JuKGUgkYW14X35zJzB
STRIPE_PRICE_PRO_YEARLY=price_1SuJ8cJuKGUgkYW1XkO5aNjn
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SuJ8zJuKGUgkYW1gMUNkfFa
STRIPE_PRICE_PREMIUM_YEARLY=price_1SuJ9DJuKGUgkYW10azzNYPK
```

Save (Ctrl+X, Y, Enter) and restart backend:

```bash
docker compose -f docker-compose.prod.yml restart backend
sleep 5
curl https://YOUR_DOMAIN/api/health
```

Should return: `{"status":"ok"}`
