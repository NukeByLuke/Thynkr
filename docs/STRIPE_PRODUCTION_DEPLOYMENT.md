# Stripe Production Deployment Guide for thynkr.ca

## 🔧 Step 1: Create Production Stripe Products & Prices

You need to create **LIVE** products in Stripe (not test mode):

1. Go to https://dashboard.stripe.com and **toggle to LIVE mode** (top right)
2. Navigate to Products → Click "Add product"
3. Create two products:

### Product 1: Thynkr Pro
- Name: `Thynkr Pro`
- Description: `Pro tier with advanced AI features`
- Pricing:
  - Monthly: $9.99/month (recurring)
  - Yearly: $99.99/year (recurring)

### Product 2: Thynkr Premium
- Name: `Thynkr Premium`
- Description: `Premium tier with unlimited AI features`
- Pricing:
  - Monthly: $19.99/month (recurring)
  - Yearly: $199.99/year (recurring)

After creating, copy the **Price IDs** (they start with `price_`).

## 🔑 Step 2: Get Production API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Make sure you're in **LIVE mode**
3. Copy:
   - Publishable key (starts with `pk_live_`)
   - Secret key (starts with `sk_live_`) - Click "Reveal live key token"

## 🪝 Step 3: Set Up Production Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://thynkr.ca/api/webhooks/stripe`
4. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

## 🖥️ Step 4: Update Server Environment

SSH into your server and update the `.env` file:

```bash
cd /path/to/thynkr
nano .env
```

Update these values:
```env
# Replace with your LIVE Stripe keys
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# Replace with your LIVE price IDs
STRIPE_PRICE_PRO_MONTHLY=price_YOUR_ACTUAL_ID
STRIPE_PRICE_PRO_YEARLY=price_YOUR_ACTUAL_ID
STRIPE_PRICE_PREMIUM_MONTHLY=price_YOUR_ACTUAL_ID
STRIPE_PRICE_PREMIUM_YEARLY=price_YOUR_ACTUAL_ID

# Set production URL
FRONTEND_URL=https://thynkr.ca
```

## 🚀 Step 5: Deploy Updated Code & Restart Services

```bash
# Pull latest code
git pull origin main  # or develop

# Rebuild and restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

## ✅ Step 6: Test the Integration

### Test 1: Check Health
```bash
curl https://thynkr.ca/api/health
```

### Test 2: Test Subscription Flow
1. Go to https://thynkr.ca
2. Sign in or create an account
3. Navigate to Settings/Billing
4. Click "Upgrade to Pro" or "Upgrade to Premium"
5. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date, any CVC

### Test 3: Verify Webhook
1. Complete a test purchase
2. Check webhook logs in Stripe Dashboard
3. Verify user tier updated in database:
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma studio
```

### Test 4: Test Billing Portal
1. After subscribing, go to Settings/Billing
2. Click "Manage Subscription"
3. Should open Stripe Customer Portal
4. Try canceling/updating subscription

## 🔍 Monitoring & Debugging

### Check Backend Logs
```bash
docker-compose -f docker-compose.prod.yml logs backend | grep -i stripe
```

### Check Webhook Delivery in Stripe
https://dashboard.stripe.com/webhooks → Click your endpoint → View attempts

### Common Issues

**Issue: Webhook signature mismatch**
- Solution: Make sure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard

**Issue: Price not found**
- Solution: Verify price IDs in `.env` match those in Stripe Dashboard (LIVE mode)

**Issue: Customer not created**
- Solution: Check backend logs for errors, ensure `STRIPE_SECRET_KEY` is correct

## 📊 What to Monitor

1. **Stripe Dashboard**: https://dashboard.stripe.com/payments
   - Check successful payments
   - Monitor failed payments
   - Review customer subscriptions

2. **Backend Logs**: Look for:
   - `Stripe webhook received`
   - `Subscription created/updated/cancelled`
   - Any Stripe-related errors

3. **Database**: Verify users have correct:
   - `tier` (FREE, PRO, PREMIUM)
   - `stripeCustomerId`
   - `stripePriceId`
   - `subscriptionStatus`

## 🎉 Success Checklist

- [ ] Production products created in Stripe
- [ ] Live API keys configured
- [ ] Webhook endpoint created and verified
- [ ] Environment variables updated on server
- [ ] Docker containers restarted
- [ ] Test subscription completed successfully
- [ ] User tier updated in database
- [ ] Billing portal accessible
- [ ] Webhooks being received and processed

---

## 🧪 Current Test Environment Setup

For reference, your **test mode** is already configured with:

**Test Products:**
- Pro: `prod_TYb1KlgcyfrTDG`
- Premium: `prod_TYb1W8lhWXtX9f`

**Test Prices:**
- Pro Monthly: `price_1SbTpjFLpibl0I1eT2bUQAyG` ($9.99/mo)
- Pro Yearly: `price_1SbTpnFLpibl0I1eFWeJTCoH` ($99.99/yr)
- Premium Monthly: `price_1SbTprFLpibl0I1eYEEJYG9i` ($19.99/mo)
- Premium Yearly: `price_1SbTpvFLpibl0I1eMwaex7YR` ($199.99/yr)

**Test Keys (already in backend/.env):**
- Publishable: `pk_test_51SbRASFLpibl0I1ep...`
- Secret: `sk_test_51SbRASFLpibl0I1eH...`
- Webhook: `whsec_f119fcfb12ff930c...`

You can test locally with these before deploying to production!
