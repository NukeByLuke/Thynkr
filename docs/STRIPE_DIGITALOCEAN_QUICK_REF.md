# Quick Reference: Stripe Test Mode on DigitalOcean

## ðŸŽ¯ Goal
Set up Stripe test mode on your DigitalOcean production environment to test subscriptions without real charges.

## âš¡ Quick Setup (5 Steps)

### 1. Create Stripe Test Products
- Go to [Stripe Dashboard](https://dashboard.stripe.com) (TEST mode)
- Create "Thynkr Pro" with monthly ($9.99) and yearly ($99.99) prices
- Create "Thynkr Premium" with monthly ($19.99) and yearly ($199.99) prices
- Copy all 4 price IDs (start with `price_`)

### 2. Get API Keys
- [API Keys](https://dashboard.stripe.com/test/apikeys) (TEST mode)
- Copy secret key (`sk_test_...`)
- Copy publishable key (`pk_test_...`)

### 3. Set Up Webhook
- [Webhooks](https://dashboard.stripe.com/test/webhooks) (TEST mode)
- Add endpoint: `https://thynkr.study/api/webhooks/stripe`
- Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Copy webhook secret (`whsec_...`)

### 4. Update GitHub Secrets
Go to **Settings** â†’ **Secrets and variables** â†’ **Actions** and add:

```
VITE_STRIPE_PRICE_STANDARD_MONTHLY = price_... (Pro Monthly)
VITE_STRIPE_PRICE_STANDARD_YEARLY = price_... (Pro Yearly)
VITE_STRIPE_PRICE_PREMIUM_MONTHLY = price_... (Premium Monthly)
VITE_STRIPE_PRICE_PREMIUM_YEARLY = price_... (Premium Yearly)
```

### 5. Update Server Environment
SSH into server and edit `.env`:

```bash
ssh root@YOUR_DROPLET_IP
cd /root
nano .env
```

Add:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
```

Restart:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

Deploy frontend via GitHub Actions.

---

## ðŸ§ª Testing

**Test Card:** `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Test Flow:**
1. Go to `https://thynkr.study`
2. Sign up/login
3. Navigate to Pricing
4. Click "Upgrade to Pro"
5. Use test card
6. Verify upgrade worked

**Check Logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f backend | grep -i stripe
```

**Check Webhooks:**
- Stripe Dashboard â†’ Webhooks â†’ Your endpoint
- Should see successful deliveries (HTTP 200)

---

## ðŸ“š Full Guides

- **Complete Setup:** [STRIPE_DIGITALOCEAN_TEST_SETUP.md](./STRIPE_DIGITALOCEAN_TEST_SETUP.md)
- **Local Testing:** [STRIPE_TESTING_GUIDE.md](./STRIPE_TESTING_GUIDE.md)
- **Production (Live):** [STRIPE_PRODUCTION_DEPLOYMENT.md](./STRIPE_PRODUCTION_DEPLOYMENT.md)

---

## ðŸ”§ Helper Script

Run the interactive setup script:
```powershell
.\scripts\setup-stripe-digitalocean.ps1
```

This will guide you through collecting all the keys and generate the commands you need.

---

## âœ… Checklist

- [ ] Created 2 products (Pro & Premium) in Stripe TEST mode
- [ ] Got 4 price IDs
- [ ] Got API keys (sk_test & pk_test)
- [ ] Created webhook endpoint
- [ ] Got webhook secret
- [ ] Updated 4 GitHub secrets
- [ ] Updated `.env` on server with 7 Stripe variables
- [ ] Restarted backend
- [ ] Deployed frontend via Actions
- [ ] Tested webhook delivery
- [ ] Completed test purchase
- [ ] Verified user upgraded

---

## ðŸ› Common Issues

**"Webhook signature failed"**
- Check `STRIPE_WEBHOOK_SECRET` in server `.env` matches Stripe Dashboard

**Subscription not activating**
- Check webhook delivery in Stripe Dashboard
- Check backend logs for errors
- Verify price IDs match

**Frontend showing wrong prices**
- GitHub secrets must be updated
- Frontend must be rebuilt via Actions
- Verify build args in [deploy.yml](../.github/workflows/deploy.yml)

**Can't connect to server**
- Verify SSL certificate is valid
- Check nginx is running: `docker compose -f docker-compose.prod.yml ps`
- Check health: `curl https://thynkr.study/api/health`
