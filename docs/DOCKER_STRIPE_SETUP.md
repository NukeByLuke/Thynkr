# Running Everything in Docker (Including Stripe Webhooks)

## ✅ Current Setup
All services are now running in Docker Desktop:

| Service | Container Name | Port | Status |
|---------|---------------|------|--------|
| **Backend API** | `thynkr-backend` | 3003 → 3001 | ✅ Running |
| **Frontend** | `thynkr-frontend` | 5175 → 80 | ✅ Running |
| **PostgreSQL** | `thynkr-postgres` | 5435 → 5432 | ✅ Running |
| **Redis** | `thynkr-redis` | 6380 → 6379 | ✅ Running |
| **Stripe CLI** | `thynkr-stripe-cli` | (internal) | ✅ Running |

## 🎯 How It Works

The **Stripe CLI** container listens for webhook events from Stripe and forwards them to the backend container at:
```
http://backend:3001/api/stripe/webhook
```

When you complete a purchase:
1. Stripe fires webhook events (e.g., `checkout.session.completed`)
2. Stripe CLI container receives them
3. Forwards to backend container on the internal Docker network
4. Backend processes the webhook and upgrades your account role
5. Your account page reflects the new tier!

## 🚀 Managing Services

### Start all services:
```powershell
docker-compose up -d
```

### Stop all services:
```powershell
docker-compose down
```

### Restart just Stripe CLI (if needed):
```powershell
docker-compose restart stripe-cli
```

### View Stripe webhook logs:
```powershell
docker logs thynkr-stripe-cli -f
```

### View backend logs (to see webhook processing):
```powershell
docker logs thynkr-backend -f
```

## 🧪 Testing Stripe Purchases

1. **Ensure all containers are running:**
   ```powershell
   docker ps
   ```

2. **Go to your pricing page:**
   http://localhost:5175/pricing

3. **Purchase a plan** using test card:
   - Card: `4242 4242 4242 4242`
   - Exp: Any future date
   - CVC: Any 3 digits

4. **Watch the Stripe CLI logs** (in real-time):
   ```powershell
   docker logs thynkr-stripe-cli -f
   ```
   You should see events like:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`

5. **Watch the backend logs** (in another terminal):
   ```powershell
   docker logs thynkr-backend -f
   ```
   You should see:
   - "Stripe webhook received"
   - "Processing checkout.session.completed"
   - "Successfully updated user role and subscription"

6. **Check your account page:**
   http://localhost:5175/account
   
   Your tier should now show **STANDARD** or **PREMIUM** instead of BASIC!

## 🔍 Troubleshooting

### Webhooks not being received?
```powershell
# Check if Stripe CLI is running
docker ps | Select-String "stripe"

# View Stripe CLI logs
docker logs thynkr-stripe-cli --tail 50

# Restart Stripe CLI
docker-compose restart stripe-cli
```

### Account not upgrading?
```powershell
# Check backend logs for errors
docker logs thynkr-backend --tail 100

# Verify webhook secret matches
docker exec thynkr-backend sh -c 'echo $STRIPE_WEBHOOK_SECRET'
# Should match: whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf
```

### Backend not responding?
```powershell
# Check backend health
docker exec thynkr-backend wget -qO- http://localhost:3001/health

# Restart backend
docker-compose restart backend
```

## 📝 Notes

- The Stripe CLI in Docker automatically uses your `STRIPE_SECRET_KEY` from `.env`
- Webhook signing secret is automatically generated and matches your backend config
- All services communicate on the internal `thynkr-network` Docker network
- Frontend → Backend: `http://localhost:3003/api`
- Stripe CLI → Backend: `http://backend:3001/api/stripe/webhook` (internal)

## 🌐 Production

For production deployment on DigitalOcean, you won't need the Stripe CLI container. Instead:
1. Remove the `stripe-cli` service from production docker-compose
2. Configure webhooks directly in Stripe Dashboard pointing to your production URL
3. Update `STRIPE_WEBHOOK_SECRET` with the production webhook signing secret
