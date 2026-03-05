# âœ… Stripe Payment Integration Checklist

Use this checklist to ensure your Stripe payment system is fully set up and tested.

## ðŸ“‹ Pre-Setup Checklist

- [ ] Have a Stripe account ([Sign up here](https://dashboard.stripe.com/register))
- [ ] Node.js and pnpm installed
- [ ] PostgreSQL database running
- [ ] Project dependencies installed (`pnpm install` in both backend and frontend)

---

## ðŸ”§ Setup Steps

### 1. Environment Configuration

#### Backend Environment (.env)
- [ ] Created `backend/.env` file
- [ ] Set `STRIPE_SECRET_KEY` (from [Stripe Dashboard â†’ API Keys](https://dashboard.stripe.com/test/apikeys))
- [ ] Set `STRIPE_PUBLISHABLE_KEY`
- [ ] Set `STRIPE_WEBHOOK_SECRET` (from `stripe listen` output)
- [ ] Set `STRIPE_PRICE_STANDARD_MONTHLY`
- [ ] Set `STRIPE_PRICE_STANDARD_YEARLY`
- [ ] Set `STRIPE_PRICE_PREMIUM_MONTHLY`
- [ ] Set `STRIPE_PRICE_PREMIUM_YEARLY`
- [ ] Set `DATABASE_URL` (PostgreSQL connection string)
- [ ] Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `FRONTEND_URL=http://localhost:5173`

#### Frontend Environment (.env)
- [ ] Created `frontend/.env` file
- [ ] Set `VITE_STRIPE_PUBLIC_KEY` (same as backend's publishable key)
- [ ] Set `VITE_STRIPE_PRICE_STANDARD_MONTHLY`
- [ ] Set `VITE_STRIPE_PRICE_STANDARD_YEARLY`
- [ ] Set `VITE_STRIPE_PRICE_PREMIUM_MONTHLY`
- [ ] Set `VITE_STRIPE_PRICE_PREMIUM_YEARLY`
- [ ] Set `VITE_API_URL=/api` (for local dev)

### 2. Stripe Dashboard Setup

#### Products & Prices
- [ ] Created "Standard Plan" product in Stripe
- [ ] Added monthly price ($4.99/month) to Standard Plan
- [ ] Added yearly price ($49.99/year) to Standard Plan
- [ ] Created "Premium Plan" product in Stripe
- [ ] Added monthly price ($9.99/month) to Premium Plan
- [ ] Added yearly price ($99.99/year) to Premium Plan
- [ ] Copied all 4 Price IDs to environment files

#### Webhook Setup (Local Development)
- [ ] Installed Stripe CLI
- [ ] Ran `stripe login` to authenticate
- [ ] Started webhook listener: `stripe listen --forward-to localhost:3001/api/stripe/webhook`
- [ ] Copied webhook signing secret to `backend/.env`

---

## ðŸ§ª Testing Checklist

### Local Testing Setup
- [ ] Backend server running (`cd backend && pnpm dev`)
- [ ] Frontend server running (`cd frontend && pnpm dev`)
- [ ] Stripe webhook listener running (`stripe listen --forward-to localhost:3001/api/stripe/webhook`)
- [ ] Database schema synced (`cd backend && pnpm prisma db push`)

### User Flow Testing
- [ ] Can access pricing page at http://localhost:5173/pricing
- [ ] Pricing page shows three tiers (Basic, Standard, Premium)
- [ ] Can toggle between monthly and yearly billing
- [ ] Yearly prices show "Save ~17%" badge

### Authentication Testing
- [ ] Can register a new account
- [ ] Can log in with existing account
- [ ] New users default to BASIC role
- [ ] User info displays correctly in nav/header

### Payment Flow Testing

#### Standard Plan - Monthly
- [ ] Clicked "Upgrade to Standard" button
- [ ] Redirected to Stripe Checkout page
- [ ] Checkout page shows correct price ($4.99/month)
- [ ] Can enter test card: `4242 4242 4242 4242`
- [ ] Can complete checkout successfully
- [ ] Redirected back to account page with `session_id` parameter
- [ ] User role updated to STANDARD in database
- [ ] Subscription record created in database
- [ ] Payment record created in database
- [ ] User can see updated tier in UI

#### Standard Plan - Yearly
- [ ] Clicked "Upgrade to Standard" (yearly billing)
- [ ] Checkout shows $49.99/year
- [ ] Successfully completed payment
- [ ] Subscription created with YEARLY billing cycle

#### Premium Plan - Monthly
- [ ] Clicked "Go Premium" button
- [ ] Checkout shows $9.99/month
- [ ] Successfully completed payment
- [ ] User upgraded to PREMIUM role

#### Premium Plan - Yearly
- [ ] Clicked "Go Premium" (yearly billing)
- [ ] Checkout shows $99.99/year
- [ ] Successfully completed payment
- [ ] Subscription created with YEARLY billing cycle

### Webhook Event Testing
- [ ] `checkout.session.completed` event received
- [ ] User role updated after checkout
- [ ] Subscription record created/updated
- [ ] Customer ID stored on user record
- [ ] Webhook logs show successful processing

### Edge Case Testing
- [ ] Clicking "Current Plan" button is disabled
- [ ] Cannot upgrade to same tier
- [ ] Clicking upgrade while not logged in redirects to /register
- [ ] Using declined test card (`4000 0000 0000 0002`) shows error
- [ ] Invalid price ID shows error message
- [ ] Network errors handled gracefully

### Database Verification
- [ ] User table has `stripeCustomerId` populated
- [ ] User `role` updated to STANDARD or PREMIUM
- [ ] Subscription record exists with correct:
  - [ ] `stripeSubscriptionId`
  - [ ] `stripePriceId`
  - [ ] `status` (ACTIVE)
  - [ ] `planType` (STANDARD or PREMIUM)
  - [ ] `billingCycle` (MONTHLY or YEARLY)
  - [ ] `currentPeriodStart` and `currentPeriodEnd` dates
- [ ] Payment record exists with:
  - [ ] `stripePaymentId`
  - [ ] Correct `amount` (in cents)
  - [ ] `status` (SUCCEEDED)

### Billing Portal Testing
- [ ] Can access billing/account management (if implemented)
- [ ] Billing portal redirects to Stripe
- [ ] Can view subscription details in Stripe portal
- [ ] Can update payment method
- [ ] Can cancel subscription
- [ ] Cancellation updates database correctly

---

## ðŸš€ Production Deployment Checklist

### Stripe Production Setup
- [ ] Switched Stripe Dashboard to LIVE mode
- [ ] Created products with LIVE prices
- [ ] Copied LIVE Price IDs
- [ ] Created LIVE webhook endpoint
- [ ] Configured webhook URL: `https://thynkr.ca/api/stripe/webhook`
- [ ] Added all 5 webhook events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Copied LIVE webhook signing secret
- [ ] Copied LIVE API keys (publishable and secret)

### Production Environment
- [ ] Updated production backend `.env` with LIVE keys
- [ ] Updated production frontend `.env` with LIVE publishable key
- [ ] Updated all 4 price IDs to LIVE values
- [ ] Set `FRONTEND_URL=https://thynkr.ca`
- [ ] Set `NODE_ENV=production`

### Production Deployment
- [ ] Deployed updated code to production
- [ ] Restarted backend service
- [ ] Restarted frontend service
- [ ] Verified health endpoint responds
- [ ] SSL certificate valid and working

### Production Testing
- [ ] Accessed https://thynkr.ca/pricing
- [ ] Completed test payment with real card
- [ ] Received payment confirmation email
- [ ] Subscription active in Stripe Dashboard
- [ ] User role updated correctly
- [ ] Webhook events delivered successfully
- [ ] No errors in production logs

### Production Monitoring
- [ ] Stripe Dashboard notifications enabled
- [ ] Email alerts for failed payments configured
- [ ] Error tracking/logging enabled (Sentry, etc.)
- [ ] Regular backup of database
- [ ] Subscription metrics tracked

---

## ðŸ” Verification Commands

### Check Environment Variables
```powershell
# Backend
cat backend\.env | grep STRIPE

# Frontend
cat frontend\.env | grep STRIPE
```

### Check Database
```powershell
cd backend
pnpm prisma studio
# Navigate to User, Subscription, and Payment tables
```

### Check Stripe Dashboard
- [Test Payments](https://dashboard.stripe.com/test/payments)
- [Test Subscriptions](https://dashboard.stripe.com/test/subscriptions)
- [Test Customers](https://dashboard.stripe.com/test/customers)
- [Webhook Logs](https://dashboard.stripe.com/test/webhooks)

### Test Backend API
```powershell
# Health check
curl http://localhost:3001/api/health

# Check if Stripe route is registered
# (Requires authentication token)
curl -X POST http://localhost:3001/api/stripe/create-checkout-session `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"priceId":"price_test_xxx","successUrl":"http://localhost:5173/account","cancelUrl":"http://localhost:5173/pricing"}'
```

---

## ðŸ†˜ Troubleshooting Guide

### "Configuration error: Price ID not found"
**Solution:** Verify price IDs in both `.env` files match exactly what's in Stripe Dashboard

### "Webhook signature verification failed"
**Solution:** 
1. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
2. For local dev, copy secret from `stripe listen` output
3. For production, copy from webhook settings in Stripe Dashboard

### User role not updating after payment
**Solution:**
1. Check backend logs for webhook processing errors
2. Verify webhook listener is running (local) or endpoint is accessible (production)
3. Check Stripe Dashboard webhook logs for delivery status
4. Ensure database connection is working

### Checkout session creation fails
**Solution:**
1. Verify `STRIPE_SECRET_KEY` is correct
2. Ensure price ID exists and is active
3. Check that user is authenticated
4. Look for errors in backend logs

### Redirect after checkout doesn't work
**Solution:**
1. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
2. Check success/cancel URLs in checkout session creation
3. Ensure no CORS issues

---

## ðŸ“ž Support Resources

- **Documentation:** `STRIPE_COMPLETE_SETUP_GUIDE.md`
- **Quick Reference:** `STRIPE_QUICK_REFERENCE.md`
- **Test Script:** Run `.\test-stripe-setup.ps1`
- **Stripe Docs:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com

---

## âœ¨ Post-Setup Recommendations

- [ ] Review and test subscription cancellation flow
- [ ] Set up email notifications for payment events
- [ ] Configure Stripe tax settings (if applicable)
- [ ] Add terms of service and privacy policy links
- [ ] Implement subscription upgrade/downgrade logic
- [ ] Add proration handling for plan changes
- [ ] Create admin dashboard for subscription management
- [ ] Set up analytics to track conversion rates
- [ ] Document customer support procedures
- [ ] Create runbook for common payment issues

---

**Last Updated:** January 2026

**Status:** âœ… Ready for testing
