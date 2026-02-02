# Complete Stripe DigitalOcean Setup Checklist

## ✅ Step-by-Step Instructions

### Step 1: Update GitHub Secrets (5 min)
- [ ] Open: `GITHUB_SECRETS.md`
- [ ] Go to GitHub repo settings
- [ ] Add all 4 secrets with the exact values provided
- [ ] Confirm all 4 secrets are saved

### Step 2: Update Server Environment (5 min)
- [ ] Open: `SERVER_ENV_VARS.md`
- [ ] SSH into your DigitalOcean droplet
- [ ] Edit `/root/.env` file
- [ ] Add all Stripe environment variables
- [ ] Save and restart backend
- [ ] Verify health check returns OK

### Step 3: Configure Stripe Webhook (3 min)
- [ ] Open: `WEBHOOK_SETUP_INSTRUCTIONS.md`
- [ ] Go to Stripe Dashboard (test mode)
- [ ] Create webhook endpoint
- [ ] Select all required events
- [ ] Verify webhook secret matches
- [ ] Test webhook delivery

### Step 4: Deploy Frontend (5 min)
- [ ] Go to GitHub Actions
- [ ] Run "Deploy to Production" workflow
- [ ] Wait for deployment to complete
- [ ] Verify no errors in workflow

### Step 5: Test the Integration (5 min)
- [ ] Open your website
- [ ] Create test account or login
- [ ] Navigate to Pricing page
- [ ] Click "Upgrade to Pro"
- [ ] Use test card: **4242 4242 4242 4242**
  - Expiry: 12/30
  - CVC: 123
  - ZIP: 12345
- [ ] Complete checkout
- [ ] Verify tier upgraded in settings

## 📝 Files Created

All instructions are in these files:
- **GITHUB_SECRETS.md** - GitHub secrets to add
- **SERVER_ENV_VARS.md** - Server environment variables
- **WEBHOOK_SETUP_INSTRUCTIONS.md** - Webhook configuration
- **THIS_FILE.md** - Complete checklist

## 🔧 Your Stripe Test Configuration

**Secret Key:** `sk_test_51SbRAIJuKGUgkYW1...` (truncated for security)
**Publishable Key:** `pk_test_51SbRAIJuKGUgkYW13...`
**Webhook Secret:** `whsec_f9f4b41a1a6d6800...`

**Price IDs:**
- Pro Monthly: `price_1SuJ87JuKGUgkYW14X35zJzB`
- Pro Yearly: `price_1SuJ8cJuKGUgkYW1XkO5aNjn`
- Premium Monthly: `price_1SuJ8zJuKGUgkYW1gMUNkfFa`
- Premium Yearly: `price_1SuJ9DJuKGUgkYW10azzNYPK`

## 🧪 Test Card

**Card Number:** 4242 4242 4242 4242
**Expiry:** Any future date (12/30)
**CVC:** Any 3 digits (123)
**ZIP:** Any 5 digits (12345)

## 📚 Additional Resources

- Full guide: `docs/STRIPE_DIGITALOCEAN_TEST_SETUP.md`
- Quick reference: `docs/STRIPE_DIGITALOCEAN_QUICK_REF.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`

## ⏱️ Total Time: ~25 minutes

Good luck! 🚀

---

**Date:** February 1, 2026
**Status:** Ready to deploy
