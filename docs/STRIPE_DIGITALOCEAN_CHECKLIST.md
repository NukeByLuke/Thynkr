# Stripe DigitalOcean Test Setup Checklist

Print this and check off as you go! ✅

---

## Phase 1: Stripe Dashboard Setup

### Products & Pricing
- [ ] Logged into https://dashboard.stripe.com
- [ ] Toggled to **TEST mode** (top right corner)
- [ ] Navigated to **Products**
- [ ] Created **Thynkr Pro** product
  - [ ] Added Monthly price: $9.99/month
  - [ ] Copied Pro Monthly Price ID: `price_________________`
  - [ ] Added Yearly price: $99.99/year
  - [ ] Copied Pro Yearly Price ID: `price_________________`
- [ ] Created **Thynkr Premium** product
  - [ ] Added Monthly price: $19.99/month
  - [ ] Copied Premium Monthly Price ID: `price_________________`
  - [ ] Added Yearly price: $199.99/year
  - [ ] Copied Premium Yearly Price ID: `price_________________`

### API Keys
- [ ] Went to https://dashboard.stripe.com/test/apikeys
- [ ] Copied Secret Key: `sk_test_________________`
- [ ] Copied Publishable Key: `pk_test_________________`

### Webhook Setup
- [ ] Went to https://dashboard.stripe.com/test/webhooks
- [ ] Clicked "Add endpoint"
- [ ] Entered URL: `https://________________/api/webhooks/stripe`
- [ ] Selected events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Clicked "Add endpoint"
- [ ] Copied Webhook Secret: `whsec_________________`

---

## Phase 2: GitHub Secrets

- [ ] Went to GitHub repo: **Settings** → **Secrets and variables** → **Actions**
- [ ] Added/Updated: `VITE_STRIPE_PRICE_STANDARD_MONTHLY`
- [ ] Added/Updated: `VITE_STRIPE_PRICE_STANDARD_YEARLY`
- [ ] Added/Updated: `VITE_STRIPE_PRICE_PREMIUM_MONTHLY`
- [ ] Added/Updated: `VITE_STRIPE_PRICE_PREMIUM_YEARLY`

---

## Phase 3: Server Configuration

### SSH Access
- [ ] Connected to server: `ssh root@________________`
- [ ] Navigated to project: `cd /root`

### Environment Variables
- [ ] Backed up existing .env: `cp .env .env.backup`
- [ ] Edited .env: `nano .env`
- [ ] Added `STRIPE_SECRET_KEY=sk_test_...`
- [ ] Added `STRIPE_PUBLISHABLE_KEY=pk_test_...`
- [ ] Added `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Added `STRIPE_PRICE_PRO_MONTHLY=price_...`
- [ ] Added `STRIPE_PRICE_PRO_YEARLY=price_...`
- [ ] Added `STRIPE_PRICE_PREMIUM_MONTHLY=price_...`
- [ ] Added `STRIPE_PRICE_PREMIUM_YEARLY=price_...`
- [ ] Saved file (Ctrl+X, Y, Enter)

### Restart Backend
- [ ] Restarted backend: `docker compose -f docker-compose.prod.yml restart backend`
- [ ] Checked health: `curl https://________________/api/health`
- [ ] Backend returned `{"status":"ok"}`

---

## Phase 4: Deploy Frontend

- [ ] Went to GitHub → **Actions** tab
- [ ] Clicked **"Deploy to Production"** workflow
- [ ] Clicked **"Run workflow"** → **"Run workflow"**
- [ ] Waited for deployment to complete (~3-5 min)
- [ ] Deployment succeeded (green checkmark)

---

## Phase 5: Testing

### Webhook Verification
- [ ] Went to Stripe Dashboard → Webhooks → My Endpoint
- [ ] Clicked "Send test webhook"
- [ ] Selected `checkout.session.completed`
- [ ] Sent test webhook
- [ ] Response was HTTP 200 ✅

### Backend Logs
- [ ] Checked logs: `docker compose -f docker-compose.prod.yml logs backend | grep -i stripe`
- [ ] Saw webhook received message

### Test Purchase
- [ ] Opened site: `https://________________`
- [ ] Created test account or logged in
- [ ] Went to **Pricing** page
- [ ] Clicked **"Upgrade to Pro"** (or Premium)
- [ ] Used test card: `4242 4242 4242 4242`
- [ ] Entered expiry: `12/30` (any future date)
- [ ] Entered CVC: `123` (any 3 digits)
- [ ] Entered ZIP: `12345` (any 5 digits)
- [ ] Completed checkout
- [ ] Redirected back to site successfully
- [ ] Checked user settings/profile
- [ ] Tier shows **PRO** (or **PREMIUM**) ✅

### Database Verification (Optional)
- [ ] SSH'd into server
- [ ] Ran: `docker compose -f docker-compose.prod.yml exec backend npx prisma studio`
- [ ] Opened Prisma Studio in browser
- [ ] Found my user record
- [ ] Verified `tier` field is correct
- [ ] Verified `stripeCustomerId` exists (starts with `cus_`)
- [ ] Verified `stripePriceId` matches what I selected
- [ ] Verified `subscriptionStatus` is `ACTIVE`

### Billing Portal Test
- [ ] Went to **Settings/Billing** on site
- [ ] Clicked **"Manage Subscription"**
- [ ] Stripe Customer Portal opened
- [ ] Can see current subscription
- [ ] Can update payment method
- [ ] Can cancel subscription (optional - try it!)

---

## Phase 6: Monitoring

### Stripe Dashboard
- [ ] Bookmarked: https://dashboard.stripe.com/test/dashboard
- [ ] Can see test customer
- [ ] Can see test subscription
- [ ] Can see webhook events

### Server Monitoring
- [ ] Know how to check logs: `docker compose -f docker-compose.prod.yml logs -f backend`
- [ ] Know how to check health: `curl https://my-domain/api/health`
- [ ] Know how to restart if needed

---

## 🎉 Complete!

### Test Cards for Future Testing
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

### Important URLs
- **Stripe Test Dashboard**: https://dashboard.stripe.com/test/dashboard
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **Your Site**: https://________________
- **API Health**: https://________________/api/health

### Next Steps
- [ ] Test with different plans
- [ ] Test subscription cancellation
- [ ] Test subscription upgrades/downgrades
- [ ] Test failed payment scenarios
- [ ] Review logs for any errors

### When Ready for Live Mode
- [ ] Read: [STRIPE_PRODUCTION_DEPLOYMENT.md](./STRIPE_PRODUCTION_DEPLOYMENT.md)
- [ ] Create products in **LIVE mode**
- [ ] Get **LIVE** API keys
- [ ] Update environment variables
- [ ] Test with small real charge first

---

**Date Completed**: _______________
**Tested By**: _______________
**Notes**: _______________

---

Keep this for reference! 📋
