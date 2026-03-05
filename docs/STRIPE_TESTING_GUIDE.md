# Stripe Testing Guide - Local & Production

## ðŸ§ª LOCAL TESTING (Test Mode)

Your local environment is configured with Stripe test keys. Test it before deploying to production.

### Prerequisites
- Backend running on `localhost:3001`
- Frontend running on `localhost:5173`
- Stripe webhook listener running: `.\stripe-cli\stripe.exe listen --forward-to localhost:3001/api/webhooks/stripe`

### Test Cards (Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0027 6000 3184`
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code

### Test Steps

#### 1. Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
```
Should return: `{"status":"ok"}`

#### 2. Create Test Account
1. Go to http://localhost:5173
2. Sign up with a new account
3. Login

#### 3. Test Pro Subscription (Monthly)
1. Navigate to Pricing page
2. Click "Upgrade to Pro" (Monthly - $9.99/mo)
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Should redirect back with success
6. Check user settings - tier should be "PRO"

#### 4. Verify in Database
```powershell
# If using Docker
docker-compose exec backend npx prisma studio

# Or connect to PostgreSQL directly
# Check the User table for your test user
# Should see:
# - tier: PRO
# - stripeCustomerId: cus_xxxxx
# - stripePriceId: price_1SbTpjFLpibl0I1eT2bUQAyG
# - subscriptionStatus: ACTIVE
```

#### 5. Test Billing Portal
1. Go to Settings/Billing
2. Click "Manage Subscription"
3. Should open Stripe Customer Portal
4. Try canceling subscription
5. Check user tier reverted to FREE

#### 6. Test Premium Subscription (Yearly)
1. Navigate to Pricing page again
2. Toggle to "Yearly" billing
3. Click "Upgrade to Premium" (Yearly - $199.99/yr)
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify tier is now "PREMIUM"

#### 7. Check Webhook Events
Look at your webhook listener terminal - should see events like:
```
2024-12-06 12:34:56 --> checkout.session.completed [evt_xxxxx]
2024-12-06 12:34:57 --> customer.subscription.created [evt_xxxxx]
2024-12-06 12:34:58 --> invoice.payment_succeeded [evt_xxxxx]
```

#### 8. Check Backend Logs
```powershell
# Look for Stripe-related logs
docker-compose logs backend | Select-String "stripe"
```

Should see:
- "Stripe webhook received"
- "Processing checkout.session.completed"
- "Subscription activated for user"

---

## ðŸš€ PRODUCTION TESTING (thynkr.ca)

After deploying to production with LIVE Stripe keys:

### Prerequisites
- Production Stripe products created
- Live API keys configured
- Webhook endpoint configured in Stripe Dashboard
- Code deployed to server

### Test Steps

#### 1. Health Check
```powershell
Invoke-WebRequest -Uri "https://thynkr.ca/api/health" -UseBasicParsing
```

#### 2. Test with Real Card (Small Amount)
âš ï¸ **WARNING**: This will create a REAL charge!

1. Go to https://thynkr.ca
2. Sign up/login
3. Choose Pro Monthly ($9.99)
4. Use a REAL credit card
5. Complete purchase
6. Immediately cancel subscription if you don't want recurring charges:
   - Go to Settings â†’ Billing â†’ Manage Subscription
   - Cancel subscription

#### 3. Verify in Stripe Dashboard
1. Go to https://dashboard.stripe.com/payments (LIVE mode)
2. Check for the payment
3. Go to https://dashboard.stripe.com/customers
4. Find your customer
5. Verify subscription is active

#### 4. Verify Webhook Delivery
1. Go to https://dashboard.stripe.com/webhooks
2. Click your production endpoint
3. Check "Webhook attempts" - should see successful deliveries

#### 5. Test Subscription Cancellation
1. In Stripe Dashboard, cancel the test subscription
2. Check that webhook fires: `customer.subscription.deleted`
3. Verify user tier reverted to FREE in your app

---

## ðŸ” DEBUGGING TIPS

### If checkout doesn't work:
1. Check browser console for errors
2. Check backend logs: `docker-compose logs backend`
3. Verify environment variables are loaded
4. Check Stripe Dashboard for failed payment attempts

### If webhook doesn't fire:
1. Verify webhook secret matches
2. Check webhook URL is correct
3. Look at "Webhook attempts" in Stripe Dashboard for error details
4. Ensure backend endpoint `/api/webhooks/stripe` is accessible

### If user tier doesn't update:
1. Check webhook delivery in Stripe Dashboard
2. Check backend logs for webhook processing errors
3. Verify database connection
4. Check Prisma schema matches database

---

## ðŸ“‹ CHECKLIST

### Local Testing (Before Production)
- [ ] Backend starts without errors
- [ ] Frontend loads pricing page
- [ ] Webhook listener is running
- [ ] Can create checkout session
- [ ] Payment succeeds with test card
- [ ] User tier updates to PRO/PREMIUM
- [ ] Webhook events are received
- [ ] Billing portal opens
- [ ] Can cancel subscription
- [ ] Tier reverts to FREE after cancel

### Production Testing
- [ ] Live products created in Stripe
- [ ] Live API keys configured
- [ ] Webhook endpoint created
- [ ] Environment variables updated on server
- [ ] Docker containers restarted
- [ ] Health endpoint responds
- [ ] Can access pricing page
- [ ] Checkout session creates successfully
- [ ] Test payment completes (with real card)
- [ ] Webhooks are delivered
- [ ] User tier updates in production DB
- [ ] Can access billing portal
- [ ] Subscription shows in Stripe Dashboard

---

## ðŸŽ¯ QUICK SMOKE TEST

Run these commands to verify everything is working:

### Local
```powershell
# 1. Check backend
Invoke-WebRequest -Uri "http://localhost:3001/health"

# 2. Check webhook listener
# Should see: "Ready! You are using Stripe API Version..."
```

### Production
```powershell
# 1. Check backend
Invoke-WebRequest -Uri "https://thynkr.ca/api/health"

# 2. Check frontend
Invoke-WebRequest -Uri "https://thynkr.ca"

# 3. Check webhook endpoint (should return 400 or 405, not 404)
Invoke-WebRequest -Uri "https://thynkr.ca/api/webhooks/stripe" -Method POST
```

---

## ðŸ“ž Need Help?

If something's not working:
1. Check the deployment guide: `STRIPE_PRODUCTION_DEPLOYMENT.md`
2. Review Stripe docs: https://stripe.com/docs
3. Check Stripe Dashboard logs
4. Review backend application logs
