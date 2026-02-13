#!/bin/bash
# Stripe Test Configuration Deployment
# Run this on your DigitalOcean server

cd /root

# Backup existing .env
cp .env .env.backup.$(date +%Y%m%d-%H%M%S)

# Add Stripe configuration
cat >> .env << 'STRIPE_EOF'

# Stripe Test Mode - Deployed $(date)
STRIPE_SECRET_KEY=sk_test_51SbRAIJuKGUgkYW1WnRsjMKXe7V9eYQnJM8QBRu2HK0kguPgYFDw8ez2ZMf0YJQXbqvWeArESIU3M8V38zgzg4fG00hg5M1zCl
STRIPE_PUBLISHABLE_KEY=pk_test_51SbRAIJuKGUgkYW13Ena665dDAbUOLx9r4TfAxOW0Q83SHSOfkCugOv9lwFT7GLhYYXB78giq22o0SUehm7oJAvI00D5ydmK5v
STRIPE_WEBHOOK_SECRET=whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf
STRIPE_PRICE_PRO_MONTHLY=price_1SuJ87JuKGUgkYW14X35zJzB
STRIPE_PRICE_PRO_YEARLY=price_1SuJ8cJuKGUgkYW1XkO5aNjn
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SuJ8zJuKGUgkYW1gMUNkfFa
STRIPE_PRICE_PREMIUM_YEARLY=price_1SuJ9DJuKGUgkYW10azzNYPK
STRIPE_EOF

echo "✓ Stripe configuration added to .env"

# Pull latest images
echo "Pulling latest Docker images..."
docker compose -f docker-compose.prod.yml pull

# Deploy
echo "Deploying..."
docker compose -f docker-compose.prod.yml up -d

echo "Waiting for services to start..."
sleep 10

# Health check
echo "Checking health..."
curl https://thynkr.study/api/health

echo ""
echo "========================================" 
echo "Deployment Complete!"
echo "========================================" 
echo ""
echo "Next steps:"
echo "1. Set up Stripe webhook at: https://dashboard.stripe.com/test/webhooks"
echo "   - Endpoint URL: https://thynkr.study/api/webhooks/stripe"
echo "   - Events: checkout.session.completed, customer.subscription.*, invoice.payment_*"
echo ""
echo "2. Test at: https://thynkr.study"
echo "   - Test card: 4242 4242 4242 4242"
echo ""
