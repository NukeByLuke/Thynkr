# âœ… Docker Images Built & Pushed! (Updated with Debug Logging)

Both frontend and backend images have been built with Stripe test configuration and pushed to Docker Hub:
- âœ… `nukebyluke/thynkr-frontend:latest` (with price IDs baked in + debug logging)
- âœ… `nukebyluke/thynkr-backend:latest`

## Deploy to Your Server NOW

**Copy-paste these commands into your server:**

```bash
cd /root

# Add Stripe vars to .env
cat >> .env << 'STRIPE_EOF'

STRIPE_SECRET_KEY=sk_test_51SbRAIJuKGUgkYW1WnRsjMKXe7V9eYQnJM8QBRu2HK0kguPgYFDw8ez2ZMf0YJQXbqvWeArESIU3M8V38zgzg4fG00hg5M1zCl
STRIPE_PUBLISHABLE_KEY=pk_test_51SbRAIJuKGUgkYW13Ena665dDAbUOLx9r4TfAxOW0Q83SHSOfkCugOv9lwFT7GLhYYXB78giq22o0SUehm7oJAvI00D5ydmK5v
STRIPE_WEBHOOK_SECRET=whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf
STRIPE_PRICE_PRO_MONTHLY=price_1SuJ87JuKGUgkYW14X35zJzB
STRIPE_PRICE_PRO_YEARLY=price_1SuJ8cJuKGUgkYW1XkO5aNjn
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SuJ8zJuKGUgkYW1gMUNkfFa
STRIPE_PRICE_PREMIUM_YEARLY=price_1SuJ9DJuKGUgkYW10azzNYPK
STRIPE_EOF

# Pull and deploy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
sleep 10
curl https://thynkr.study/api/health
```

## Check the Browser Console

After deployment, open your site and check the browser console (F12). You should see:
```
Stripe Price IDs: { standard: { monthly: 'price_...', yearly: 'price_...' }, premium: { ... } }
```

If the price IDs show as `undefined`, the build args didn't work and we need to fix the Dockerfile.

## Final Step: Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://thynkr.study/api/webhooks/stripe`
4. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
5. Verify webhook secret matches: `whsec_f9f4b41a1a6d6800...`

## Test It!

1. Go to https://thynkr.study
2. Sign up or login
3. Go to Pricing
4. Upgrade to Pro
5. Use card: **4242 4242 4242 4242**
6. Verify upgrade worked!

---

**Everything is ready - just run the deployment script on your server!**
