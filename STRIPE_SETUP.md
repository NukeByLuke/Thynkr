# 🎯 Stripe Setup Guide for Thynkr

## Quick Setup Steps

### 1. Get Your Stripe API Keys

1. Go to **[Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/apikeys)**
2. Copy your **Secret Key** (starts with `sk_test_...`)
3. Copy your **Publishable Key** (starts with `pk_test_...`)
4. Update your `.env` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
   ```

### 2. Create Your Subscription Products

Go to **[Stripe Products](https://dashboard.stripe.com/test/products)** and create two products:

#### Product 1: Standard Plan
- **Name**: `Standard Plan`
- **Description**: `Enhanced AI tools and private courses`
- **Pricing**:
  - Monthly: **$4.99/month** (or $8/month as originally planned)
  - Yearly: **$49.99/year** (or $60/year)
- After creating, copy the **Price IDs** (starts with `price_...`) and update `.env`:
  ```env
  STRIPE_PRICE_STANDARD_MONTHLY=price_xxxxx
  STRIPE_PRICE_STANDARD_YEARLY=price_xxxxx
  ```

#### Product 2: Premium Plan
- **Name**: `Premium Plan`
- **Description**: `Unlimited AI access and personal tutoring`
- **Pricing**:
  - Monthly: **$9.99/month** (or $12/month)
  - Yearly: **$99.99/year** (or $100/year)
- Copy the **Price IDs** and update `.env`:
  ```env
  STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx
  STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxx
  ```

### 3. Set Up Webhook (For Local Development)

**Option A: Using Stripe CLI** (Recommended)
1. Install Stripe CLI from [stripe.com/docs/stripe-cli](https://docs.stripe.com/stripe-cli)
2. Restart your terminal
3. Login: `stripe login`
4. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
5. Copy the webhook signing secret (starts with `whsec_...`) to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

**Option B: Manual Webhook (For Production)**
1. Go to **[Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)**
2. Click **Add Endpoint**
3. Enter URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to `.env`

### 4. Test Your Setup

1. Start your backend:
   ```bash
   cd backend
   pnpm dev
   ```

2. Start your frontend:
   ```bash
   cd frontend
   pnpm dev
   ```

3. Go to `http://localhost:5173/pricing`
4. Click **Upgrade to Standard** or **Upgrade to Premium**
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC
   - Any ZIP code

### 5. Verify Payment Flow

After a successful test payment:
1. Check the Stripe Dashboard for the payment
2. Check your database - user role should be upgraded
3. Check the webhook logs in terminal (if using Stripe CLI)

---

## 🔍 Troubleshooting

### "Missing required environment variable: STRIPE_SECRET_KEY"
- Make sure you've copied your keys from Stripe Dashboard
- Restart your backend after updating `.env`

### Webhook not receiving events
- Ensure `stripe listen` is running in a separate terminal
- Check that the webhook secret in `.env` matches the one from `stripe listen`

### Payment succeeds but user role doesn't update
- Check backend logs for errors
- Verify the Price IDs in `.env` match those in Stripe Dashboard
- Ensure webhook events are being received

---

## 📚 Additional Resources

- [Stripe Testing](https://docs.stripe.com/testing)
- [Stripe Webhook Events](https://docs.stripe.com/webhooks)
- [Stripe CLI Documentation](https://docs.stripe.com/stripe-cli)

---

**Need Help?** Contact the DVLPR Team or check the backend logs for detailed error messages.
