# ðŸŽ¯ Thynkr Stripe Payment Setup Guide

## Quick Start: Local Development Setup

### Step 1: Install Stripe CLI

**Windows (PowerShell as Administrator):**
```powershell
# Using Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

Or download from: https://github.com/stripe/stripe-cli/releases/latest

**Verify installation:**
```powershell
stripe --version
```

### Step 2: Login to Stripe

```powershell
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Step 3: Get Your Stripe API Keys

1. Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 4: Update Environment Files

**Backend `.env`:**
```env
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

**Frontend `.env`:**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

### Step 5: Create Products & Prices in Stripe

Go to [Stripe Products Dashboard (Test Mode)](https://dashboard.stripe.com/test/products) and create:

#### Product 1: Standard Plan
- **Name:** `Standard Plan`
- **Description:** `Enhanced AI tools and private courses`

**Add two prices:**
1. **Monthly:** $4.99/month (recurring)
2. **Yearly:** $49.99/year (recurring)

After creating, copy the **Price IDs** (start with `price_`).

#### Product 2: Premium Plan
- **Name:** `Premium Plan`
- **Description:** `Unlimited AI access and premium features`

**Add two prices:**
1. **Monthly:** $9.99/month (recurring)
2. **Yearly:** $99.99/year (recurring)

Copy the **Price IDs**.

### Step 6: Update Price IDs in Environment Files

**Backend `.env`:**
```env
STRIPE_PRICE_STANDARD_MONTHLY=price_xxxxx_from_stripe
STRIPE_PRICE_STANDARD_YEARLY=price_xxxxx_from_stripe
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx_from_stripe
STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxx_from_stripe
```

**Frontend `.env`:**
```env
VITE_STRIPE_PRICE_STANDARD_MONTHLY=price_xxxxx_from_stripe
VITE_STRIPE_PRICE_STANDARD_YEARLY=price_xxxxx_from_stripe
VITE_STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx_from_stripe
VITE_STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxx_from_stripe
```

### Step 7: Set Up Webhook Listener (Local Development)

**Start the webhook listener in a new terminal:**
```powershell
cd backend
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

**Important:** Copy the webhook signing secret (starts with `whsec_`) and update your backend `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx_from_stripe_cli
```

**Keep this terminal running** while testing locally.

### Step 8: Start Your Application

**Terminal 1 - Backend:**
```powershell
cd backend
pnpm install
pnpm dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
pnpm install
pnpm dev
```

**Terminal 3 - Stripe Webhook Listener:**
```powershell
cd backend
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

### Step 9: Test the Payment Flow

1. Open http://localhost:5173 in your browser
2. Register or login to your account
3. Navigate to the **Pricing** page
4. Click **"Upgrade to Standard"** or **"Go Premium"**
5. Use Stripe's test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any billing ZIP code (e.g., 12345)
6. Complete the checkout
7. Verify you're redirected back to your account
8. Check that your tier has been upgraded

### Step 10: Verify in Stripe Dashboard

1. Go to [Stripe Payments (Test Mode)](https://dashboard.stripe.com/test/payments)
2. You should see your test payment
3. Check [Subscriptions](https://dashboard.stripe.com/test/subscriptions) to see the active subscription

---

## ðŸ§ª Test Cards

| Card Number         | Description       |
|---------------------|-------------------|
| 4242 4242 4242 4242 | Success           |
| 4000 0000 0000 0002 | Card declined     |
| 4000 0000 0000 9995 | Insufficient funds|
| 4000 0025 0000 3155 | Requires 3D Secure|

Use any future date, any CVC, and any ZIP.

---

## ðŸš€ Production Deployment

### Step 1: Create Production Products in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) and **toggle to LIVE mode** (top right)
2. Navigate to [Products](https://dashboard.stripe.com/products)
3. Create the same products with live prices:
   - **Standard Plan:** $4.99/month and $49.99/year
   - **Premium Plan:** $9.99/month and $99.99/year
4. Copy all 4 **LIVE** Price IDs

### Step 2: Get Production API Keys

1. Go to [API Keys (LIVE mode)](https://dashboard.stripe.com/apikeys)
2. Copy:
   - Publishable key (starts with `pk_live_`)
   - Secret key (starts with `sk_live_`) - Click "Reveal live key"

### Step 3: Create Production Webhook

1. Go to [Webhooks (LIVE mode)](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://thynkr.study/api/stripe/webhook`
4. **Events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 4: Update Production Environment Variables

Update your production `.env` file (on DigitalOcean server) with LIVE keys:

```env
# Stripe LIVE keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# Stripe LIVE Price IDs
STRIPE_PRICE_STANDARD_MONTHLY=price_YOUR_LIVE_ID
STRIPE_PRICE_STANDARD_YEARLY=price_YOUR_LIVE_ID
STRIPE_PRICE_PREMIUM_MONTHLY=price_YOUR_LIVE_ID
STRIPE_PRICE_PREMIUM_YEARLY=price_YOUR_LIVE_ID

# Production URL
FRONTEND_URL=https://thynkr.study
```

Also update frontend production environment variables.

### Step 5: Deploy & Test

1. Deploy your updated code to production
2. Test the full payment flow on https://thynkr.study
3. Monitor the [Stripe Dashboard (LIVE mode)](https://dashboard.stripe.com/dashboard) for real payments

---

## ðŸ“Š Monitoring & Troubleshooting

### Check Backend Logs
```powershell
# Local
cd backend
pnpm dev

# Production
docker logs -f thynkr-backend
```

### Check Webhook Events
```powershell
# Local with Stripe CLI
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Production - Check Stripe Dashboard
# https://dashboard.stripe.com/webhooks
```

### Common Issues

**1. Webhook signature verification failed**
- Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook signing secret
- For local dev, use the secret from `stripe listen` command output
- For production, use the secret from Stripe Dashboard webhook settings

**2. Price ID not found**
- Double-check all 4 price IDs in both backend and frontend `.env` files
- Ensure you're using TEST mode price IDs locally and LIVE mode in production

**3. User role not updating**
- Check backend logs for errors
- Verify webhook events are being received (check Stripe Dashboard or CLI output)
- Ensure database connection is working

**4. Checkout session creation fails**
- Verify `STRIPE_SECRET_KEY` is correct
- Check that the price ID exists and is active in Stripe Dashboard
- Ensure user has valid email address

---

## ðŸ” Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for test and production
3. **Verify webhook signatures** (already implemented in backend)
4. **Monitor failed payments** in Stripe Dashboard
5. **Set up email notifications** for failed payments
6. **Regularly review** active subscriptions and payments

---

## ðŸ“š Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

## âœ… Quick Checklist

### Local Development
- [ ] Stripe CLI installed
- [ ] Logged into Stripe account
- [ ] Test API keys in `.env` files
- [ ] Products and prices created in TEST mode
- [ ] Price IDs in `.env` files
- [ ] Webhook listener running (`stripe listen`)
- [ ] Backend running
- [ ] Frontend running
- [ ] Test payment successful

### Production Deployment
- [ ] Products and prices created in LIVE mode
- [ ] Live API keys configured
- [ ] Webhook endpoint configured at `https://thynkr.study/api/stripe/webhook`
- [ ] All 5 webhook events selected
- [ ] Webhook signing secret configured
- [ ] Production deployment successful
- [ ] Test payment in production successful
- [ ] Monitoring setup
