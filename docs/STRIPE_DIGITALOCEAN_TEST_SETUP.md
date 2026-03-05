# Stripe Test Mode Setup for DigitalOcean

This guide will help you set up Stripe **test mode** on your DigitalOcean deployment, allowing you to test subscriptions in production environment without real charges.

## ðŸŽ¯ Why Use Test Mode on DigitalOcean?

- Test the full subscription flow in production environment
- Verify webhook delivery to your live server
- Debug issues without affecting real customers
- Validate SSL/TLS certificate handling

## âš™ï¸ Prerequisites

- DigitalOcean droplet running Thynkr
- SSH access to your droplet
- Stripe account (test mode)

---

## ðŸ“‹ Step-by-Step Setup

### 1. Create Test Mode Products in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle to TEST mode** (top right - should show "Test mode" toggle)
3. Navigate to **Products** â†’ Click **"Add product"**

#### Product 1: Thynkr Pro
- **Name**: `Thynkr Pro`
- **Description**: `Pro tier with advanced AI features`
- Click **"Add pricing"**
  - **Monthly**: $9.99/month (Recurring)
  - **Yearly**: $99.99/year (Recurring)
- Click **"Save product"**
- **Copy the Price IDs** (start with `price_`) for both monthly and yearly

#### Product 2: Thynkr Premium
- **Name**: `Thynkr Premium`
- **Description**: `Premium tier with unlimited AI features`
- Click **"Add pricing"**
  - **Monthly**: $19.99/month (Recurring)
  - **Yearly**: $199.99/year (Recurring)
- Click **"Save product"**
- **Copy the Price IDs** (start with `price_`) for both monthly and yearly

### 2. Get Test Mode API Keys

1. Go to [API Keys](https://dashboard.stripe.com/test/apikeys)
2. Ensure you're in **TEST mode**
3. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### 3. Set Up Webhook Endpoint

This is the **critical step** that makes webhooks work without the CLI.

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. **Endpoint URL**: 
   ```
   https://thynkr.ca/api/webhooks/stripe
   ```
   (Replace `thynkr.ca` with your actual domain)

4. **Description**: `DigitalOcean Test Webhook`

5. **Events to send** - Select these events:
   - âœ… `checkout.session.completed`
   - âœ… `customer.subscription.created`
   - âœ… `customer.subscription.updated`
   - âœ… `customer.subscription.deleted`
   - âœ… `invoice.payment_succeeded`
   - âœ… `invoice.payment_failed`

6. Click **"Add endpoint"**

7. **Copy the Signing secret** (starts with `whsec_`) - you'll need this next

### 4. Configure Environment Variables on DigitalOcean

SSH into your DigitalOcean droplet:

```bash
ssh root@your-droplet-ip
```

Navigate to your project directory:

```bash
cd /root
```

Create or edit the `.env` file:

```bash
nano .env
```

Add/update these Stripe variables with your **TEST** keys:

```env
# Stripe Test Mode Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# Stripe Test Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_YOUR_PRO_MONTHLY_ID
STRIPE_PRICE_PRO_YEARLY=price_YOUR_PRO_YEARLY_ID
STRIPE_PRICE_PREMIUM_MONTHLY=price_YOUR_PREMIUM_MONTHLY_ID
STRIPE_PRICE_PREMIUM_YEARLY=price_YOUR_PREMIUM_YEARLY_ID

# URLs (should already be set)
FRONTEND_URL=https://thynkr.ca
BACKEND_URL=https://thynkr.ca
VITE_API_URL=https://thynkr.ca
```

Save and exit (Ctrl+X, then Y, then Enter)

### 5. Update GitHub Secrets for Frontend Build

The frontend needs Stripe price IDs at build time. Update these GitHub secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** â†’ **Secrets and variables** â†’ **Actions**
3. Update or create these secrets with your **TEST mode** values:

| Secret Name | Value | Example |
|------------|-------|---------|
| `VITE_STRIPE_PRICE_STANDARD_MONTHLY` | Pro Monthly Price ID | `price_1ABC...` |
| `VITE_STRIPE_PRICE_STANDARD_YEARLY` | Pro Yearly Price ID | `price_1DEF...` |
| `VITE_STRIPE_PRICE_PREMIUM_MONTHLY` | Premium Monthly Price ID | `price_1GHI...` |
| `VITE_STRIPE_PRICE_PREMIUM_YEARLY` | Premium Yearly Price ID | `price_1JKL...` |

4. Trigger a new deployment:
   - Go to **Actions** tab
   - Click on **"Deploy to Production"** workflow
   - Click **"Run workflow"** â†’ **"Run workflow"**

This will rebuild the frontend with the correct test price IDs baked in.

### 6. Deploy or Rebuild Backend

The backend environment variables are read at runtime from the `.env` file you updated.

**Option A: Wait for CI/CD (Recommended)**
After updating GitHub secrets and triggering the workflow, both frontend and backend will be deployed automatically.

**Option B: Manual Update (Faster)**
If you've already updated the `.env` file on the server and just need to restart:

```bash
cd /root
docker compose -f docker-compose.prod.yml restart backend
```

Or for a full rebuild if you want to be sure:

```bash
cd /root
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### 7. Verify Webhook Connection

After deployment, test the webhook endpoint:

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select **`checkout.session.completed`**
5. Click **"Send test webhook"**

Check your backend logs:

```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i stripe
```

You should see something like:
```
backend  | Received Stripe webhook: checkout.session.completed
```

---

## âœ… Testing the Integration

### 1. Health Check

```bash
curl https://thynkr.ca/api/health
```

Should return: `{"status":"ok"}`

### 2. Test Subscription Flow

1. Go to `https://thynkr.ca`
2. Create a new test account or login
3. Navigate to **Pricing** or **Settings/Billing**
4. Click **"Upgrade to Pro"** or **"Upgrade to Premium"**
5. Use Stripe test card: **`4242 4242 4242 4242`**
   - Expiry: Any future date (e.g., 12/30)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
6. Complete checkout
7. You should be redirected back to your app
8. Check your user settings - tier should be upgraded!

### 3. Monitor Webhook Events

In your Stripe Dashboard:
1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your endpoint
3. You should see successful deliveries with HTTP 200 responses

In your server logs:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Watch for webhook events being processed.

### 4. Test Billing Portal

1. Go to **Settings/Billing**
2. Click **"Manage Subscription"**
3. Should open Stripe Customer Portal
4. Try:
   - Updating payment method
   - Canceling subscription
   - Changing plan

### 5. Verify in Database

SSH into your droplet and connect to the database:

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma studio
```

This opens Prisma Studio in the browser. Check your user record:
- `tier`: Should be `PRO` or `PREMIUM`
- `stripeCustomerId`: Should start with `cus_`
- `stripePriceId`: Should match one of your price IDs
- `subscriptionStatus`: Should be `ACTIVE`

---

## ðŸ§ª Additional Test Cards

Stripe provides several test cards for different scenarios:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | âœ… Success |
| `4000 0000 0000 0002` | âŒ Card declined |
| `4000 0027 6000 3184` | ðŸ” Requires 3D Secure authentication |
| `4000 0000 0000 9995` | âŒ Insufficient funds |

---

## ðŸ”„ Switching to Live Mode Later

When you're ready to accept real payments:

1. Create the same products in **LIVE mode**
2. Get **LIVE API keys** (`pk_live_...` and `sk_live_...`)
3. Set up a **LIVE webhook** endpoint
4. Update the `.env` file on your droplet with live keys
5. Redeploy the frontend with the live publishable key
6. Remove or clearly label test mode indicators in your UI

---

## ðŸ› Troubleshooting

### Webhooks Not Being Received

**Check webhook signing secret:**
```bash
docker compose -f docker-compose.prod.yml exec backend printenv STRIPE_WEBHOOK_SECRET
```

Should start with `whsec_`

**Check backend logs for errors:**
```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i "webhook\|stripe"
```

**Test webhook endpoint directly:**
```bash
curl -X POST https://thynkr.ca/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Subscription Not Activating

1. Verify webhook was delivered in Stripe Dashboard
2. Check webhook response - should be HTTP 200
3. Look for backend errors in logs
4. Verify price IDs match between Stripe and your `.env`

### Frontend Shows Wrong Publishable Key

The frontend is built with the key at build time. You must:
1. Update GitHub secret `VITE_STRIPE_PUBLISHABLE_KEY`
2. Redeploy via GitHub Actions

Or rebuild manually:
```bash
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

---

## ðŸ“š Related Documentation

- [STRIPE_TESTING_GUIDE.md](./STRIPE_TESTING_GUIDE.md) - Local testing guide
- [STRIPE_PRODUCTION_DEPLOYMENT.md](./STRIPE_PRODUCTION_DEPLOYMENT.md) - Live mode guide
- [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) - Webhook details

---

## âœ… Checklist

- [ ] Created test products in Stripe Dashboard
- [ ] Copied all 4 price IDs
- [ ] Got test API keys (pk_test & sk_test)
- [ ] Created webhook endpoint in Stripe
- [ ] Copied webhook signing secret
- [ ] Updated `.env` on DigitalOcean
- [ ] Updated GitHub secret for publishable key
- [ ] Redeployed frontend
- [ ] Tested webhook delivery
- [ ] Completed test purchase with 4242 card
- [ ] Verified subscription activated
- [ ] Tested billing portal

ðŸŽ‰ **You're all set!** You can now test Stripe subscriptions on DigitalOcean without affecting real customers.
