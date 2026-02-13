# Stripe DigitalOcean Test Setup - Summary

## âœ… What Was Done

I've set up everything you need to configure Stripe test mode on your DigitalOcean deployment. Here's what changed:

### 1. Documentation Created
- **[STRIPE_DIGITALOCEAN_TEST_SETUP.md](./STRIPE_DIGITALOCEAN_TEST_SETUP.md)** - Complete step-by-step guide
- **[STRIPE_DIGITALOCEAN_QUICK_REF.md](./STRIPE_DIGITALOCEAN_QUICK_REF.md)** - Quick reference/checklist
- **[setup-stripe-digitalocean.ps1](../scripts/setup-stripe-digitalocean.ps1)** - Interactive setup script

### 2. CI/CD Updated
- Modified [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)
- Added Stripe price IDs as build args for frontend
- Frontend will now receive test price IDs at build time

### 3. Key Differences: Local vs DigitalOcean

| Aspect | Local | DigitalOcean |
|--------|-------|--------------|
| **Webhook Delivery** | Stripe CLI forwards | Direct from Stripe to server |
| **Setup Command** | `stripe listen --forward-to localhost:3001/...` | Webhook configured in Dashboard |
| **Frontend Build** | Uses `.env` file | Uses GitHub secrets |
| **Environment** | Test mode only | Can use test or live mode |

---

## ðŸš€ Next Steps (What You Need To Do)

### Step 1: Create Stripe Test Products (5 min)
1. Go to https://dashboard.stripe.com
2. Toggle to **TEST mode** (top right)
3. Go to Products â†’ Create two products:
   - **Thynkr Pro**: $9.99/mo and $99.99/yr
   - **Thynkr Premium**: $19.99/mo and $199.99/yr
4. Copy all 4 price IDs (they start with `price_`)

### Step 2: Get API Keys (2 min)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy:
   - Secret key (`sk_test_...`)
   - Publishable key (`pk_test_...`)

### Step 3: Set Up Webhook (3 min)
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://thynkr.study/api/webhooks/stripe` (or your domain)
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the webhook signing secret (`whsec_...`)

### Step 4: Run Setup Script (5 min)
Run the interactive script that will guide you:

```powershell
cd c:\Users\luked\OneDrive\Desktop\Projects\Thynkr
.\scripts\setup-stripe-digitalocean.ps1
```

This will:
- Ask you for all the keys/IDs you collected
- Generate SSH commands for your server
- Show you what GitHub secrets to update
- Save everything to a file for reference

### Step 5: Update GitHub Secrets (3 min)
1. Go to your repo: **Settings** â†’ **Secrets and variables** â†’ **Actions**
2. Add/update these 4 secrets:
   - `VITE_STRIPE_PRICE_STANDARD_MONTHLY`
   - `VITE_STRIPE_PRICE_STANDARD_YEARLY`
   - `VITE_STRIPE_PRICE_PREMIUM_MONTHLY`
   - `VITE_STRIPE_PRICE_PREMIUM_YEARLY`

### Step 6: SSH and Update Server (5 min)
Use the commands from the setup script output, or manually:

```bash
ssh root@YOUR_DROPLET_IP
cd /root
nano .env
```

Add these lines:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
```

Restart backend:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Step 7: Deploy Frontend (2 min)
1. Go to GitHub â†’ **Actions** tab
2. Run **"Deploy to Production"** workflow
3. Wait for deployment to complete (~3-5 minutes)

### Step 8: Test! (5 min)
1. Go to your site (e.g., `https://thynkr.study`)
2. Sign up or login
3. Go to Pricing page
4. Click "Upgrade to Pro"
5. Use test card: **4242 4242 4242 4242**
6. Complete checkout
7. Verify your tier upgraded!

Check backend logs:
```bash
docker compose -f docker-compose.prod.yml logs -f backend | grep -i stripe
```

Check webhook delivery in Stripe Dashboard.

---

## ðŸŽ¯ Why This Approach?

**Local Development:**
- Stripe CLI forwards webhooks from Stripe to your laptop
- Works great for development but requires CLI to be running

**DigitalOcean (Production):**
- Webhook endpoint is publicly accessible
- Stripe sends webhooks directly to your server
- No CLI needed - it's a permanent configuration
- Allows testing in production environment before going live

**Test Mode on Production Benefits:**
- Test full deployment infrastructure
- Verify SSL/TLS handling
- Test webhook reliability
- Debug issues in production-like environment
- Switch to live mode easily when ready

---

## ðŸ“Š Environment Variables Overview

### Backend (Runtime - from `.env` file)
These are read when the backend starts:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
```

### Frontend (Build-time - from GitHub Secrets)
These are baked into the JavaScript bundle during build:
```
VITE_STRIPE_PRICE_STANDARD_MONTHLY=price_...
VITE_STRIPE_PRICE_STANDARD_YEARLY=price_...
VITE_STRIPE_PRICE_PREMIUM_MONTHLY=price_...
VITE_STRIPE_PRICE_PREMIUM_YEARLY=price_...
```

**Why separate?**
- Backend needs secret key (must stay secret!)
- Frontend needs price IDs (public, shown in checkout UI)
- Frontend is static files, so values are embedded at build time

---

## ðŸ”„ Switching to Live Mode Later

When ready to accept real payments:

1. Create same products in **LIVE mode** in Stripe
2. Get **LIVE** API keys (`sk_live_...`, `pk_live_...`)
3. Create **LIVE** webhook endpoint
4. Update GitHub secrets with live price IDs
5. Update server `.env` with live keys
6. Redeploy both frontend and backend
7. Test with real card (start with small amount!)

---

## ðŸ“ž Need Help?

- **Complete Guide**: [STRIPE_DIGITALOCEAN_TEST_SETUP.md](./STRIPE_DIGITALOCEAN_TEST_SETUP.md)
- **Quick Reference**: [STRIPE_DIGITALOCEAN_QUICK_REF.md](./STRIPE_DIGITALOCEAN_QUICK_REF.md)
- **Local Testing**: [STRIPE_TESTING_GUIDE.md](./STRIPE_TESTING_GUIDE.md)
- **Production Guide**: [STRIPE_PRODUCTION_DEPLOYMENT.md](./STRIPE_PRODUCTION_DEPLOYMENT.md)

---

## â±ï¸ Total Time: ~30 minutes

- Stripe setup: 10 min
- Script + SSH: 10 min
- Deployment: 5 min
- Testing: 5 min

Good luck! ðŸš€
