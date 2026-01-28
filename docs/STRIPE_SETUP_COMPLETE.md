# ✅ Stripe Setup Complete for Thynkr

## 🎉 What's Been Done

### Local Development (TEST MODE) ✅
Your local environment is fully configured and ready to test:

**Products Created:**
- Thynkr Pro - $9.99/month or $99.99/year
- Thynkr Premium - $19.99/month or $199.99/year

**API Keys Configured:**
- Backend: `backend/.env`
- Frontend: `frontend/.env`

**Webhook Listener:**
- Running in background terminal
- Secret: `whsec_f119fcfb12ff930c6627c0554d6eddc0dd6f22cf5368dabc286414657e9060a9`

**Price IDs (Test Mode):**
```
Pro Monthly:     price_1SbTpjFLpibl0I1eT2bUQAyG  ($9.99/mo)
Pro Yearly:      price_1SbTpnFLpibl0I1eFWeJTCoH  ($99.99/yr)
Premium Monthly: price_1SbTprFLpibl0I1eYEEJYG9i  ($19.99/mo)
Premium Yearly:  price_1SbTpvFLpibl0I1eMwaex7YR  ($199.99/yr)
```

---

## 🧪 Test Locally RIGHT NOW

1. **Start your backend** (if not running):
   ```powershell
   cd backend
   npm run dev
   ```

2. **Start your frontend** (in another terminal):
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Open browser**: http://localhost:5173

4. **Test the flow**:
   - Sign up / Login
   - Go to Pricing
   - Click "Upgrade to Pro"
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify your tier changed to PRO

5. **Test cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future date, any CVC

---

## 🚀 Deploy to Production (thynkr.ca)

### Step 1: Create LIVE Stripe Products

Go to https://dashboard.stripe.com (toggle to **LIVE mode**):

1. **Products → Add Product**
   - Create "Thynkr Pro" with monthly ($9.99) and yearly ($99.99) prices
   - Create "Thynkr Premium" with monthly ($19.99) and yearly ($199.99) prices
   - Copy all 4 Price IDs (start with `price_`)

2. **API Keys → Reveal live key**
   - Copy Publishable key (`pk_live_...`)
   - Copy Secret key (`sk_live_...`)

3. **Webhooks → Add endpoint**
   - URL: `https://thynkr.ca/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy Signing secret (`whsec_...`)

### Step 2: Update Production Environment

SSH to your server and edit `.env`:

```bash
# SSH to server
ssh your-server

# Edit environment file
cd /path/to/thynkr
nano .env
```

Update these values:
```env
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

STRIPE_PRICE_PRO_MONTHLY=price_YOUR_ID
STRIPE_PRICE_PRO_YEARLY=price_YOUR_ID
STRIPE_PRICE_PREMIUM_MONTHLY=price_YOUR_ID
STRIPE_PRICE_PREMIUM_YEARLY=price_YOUR_ID

FRONTEND_URL=https://thynkr.ca
```

Also create/update `frontend/.env.production`:
```env
VITE_API_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
VITE_STRIPE_PRICE_STANDARD_MONTHLY=price_YOUR_ID
VITE_STRIPE_PRICE_STANDARD_YEARLY=price_YOUR_ID
VITE_STRIPE_PRICE_PREMIUM_MONTHLY=price_YOUR_ID
VITE_STRIPE_PRICE_PREMIUM_YEARLY=price_YOUR_ID
```

### Step 3: Deploy

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Check it's running
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Step 4: Test Production

1. Go to https://thynkr.ca
2. Sign up / Login
3. Try to subscribe (use a real card - you'll be charged!)
4. Verify in Stripe Dashboard: https://dashboard.stripe.com/payments
5. Cancel the test subscription if you don't want to keep it

---

## 📚 Documentation

I've created three guides for you:

1. **`STRIPE_TESTING_GUIDE.md`**
   - Complete testing instructions
   - Test card numbers
   - Debugging tips
   - Checklist for local and production

2. **`STRIPE_PRODUCTION_DEPLOYMENT.md`**
   - Step-by-step production setup
   - Webhook configuration
   - Monitoring and debugging
   - Common issues and solutions

3. **`.env.production`**
   - Template for production environment variables
   - Copy to server and fill in real values

---

## 🔑 Key URLs

**Local Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Backend Health: http://localhost:3001/health
- Webhook Endpoint: http://localhost:3001/api/webhooks/stripe

**Production:**
- Frontend: https://thynkr.ca
- Backend: https://thynkr.ca/api
- Backend Health: https://thynkr.ca/api/health
- Webhook Endpoint: https://thynkr.ca/api/webhooks/stripe

**Stripe Dashboard:**
- Test Mode: https://dashboard.stripe.com/test/dashboard
- Live Mode: https://dashboard.stripe.com/dashboard
- Webhooks: https://dashboard.stripe.com/webhooks
- API Keys: https://dashboard.stripe.com/apikeys
- Payments: https://dashboard.stripe.com/payments

---

## ⚠️ Important Notes

1. **Webhook Listener** (Local Dev):
   - Keep this running while testing locally: `.\stripe-cli\stripe.exe listen --forward-to localhost:3001/api/webhooks/stripe`
   - The webhook secret in your `.env` must match the one from the listener

2. **Test vs Live Mode**:
   - Test mode: Use test cards, no real charges
   - Live mode: Real cards, real charges - be careful!

3. **Price IDs**:
   - Test and Live price IDs are different
   - Make sure you're using the right ones for each environment

4. **Security**:
   - Never commit `.env` files with real keys
   - Keep webhook secrets private
   - Rotate keys if they're exposed

---

## ✅ Success Checklist

**Local (Test Mode):**
- [x] Stripe CLI installed and authenticated
- [x] Test products and prices created
- [x] Backend `.env` configured with test keys
- [x] Frontend `.env` configured with test keys
- [x] Webhook listener running
- [ ] Backend and frontend running
- [ ] Completed test subscription
- [ ] Verified user tier updated
- [ ] Tested billing portal
- [ ] Tested subscription cancellation

**Production (Live Mode):**
- [ ] Live products created in Stripe
- [ ] Live prices created with correct amounts
- [ ] Production webhook endpoint configured
- [ ] Live API keys obtained
- [ ] Server `.env` updated with live keys
- [ ] Code deployed to server
- [ ] Docker containers restarted
- [ ] Health check passes
- [ ] Test subscription completed with real card
- [ ] Webhooks being received
- [ ] User tier updated in production

---

## 🎯 Next Steps

1. **Test Locally First** - Make sure everything works in test mode
2. **Create Live Products** - Set up real products in Stripe Dashboard (live mode)
3. **Deploy to Production** - Update environment variables and deploy
4. **Test Production** - Complete one real transaction to verify

Need help? Check the detailed guides or Stripe's documentation!
