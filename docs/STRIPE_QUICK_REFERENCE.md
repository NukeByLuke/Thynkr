# 💳 Thynkr Payment System - Quick Reference

## Current Plan Structure

| Tier | Monthly Price | Yearly Price | Yearly Savings |
|------|--------------|--------------|----------------|
| **Basic** | $0 | $0 | - |
| **Standard** | $4.99 | $49.99/year (~$4.17/mo) | ~17% |
| **Premium** | $9.99 | $99.99/year (~$8.33/mo) | ~17% |

## Feature Breakdown

### Basic (FREE)
- ✅ AI-generated summaries
- ✅ Smart flashcards
- ✅ Basic notes & quizzes
- ✅ 5 file uploads per month
- ✅ 50 AI requests per month

### Standard ($4.99/mo or $49.99/yr)
- ✅ **Everything in Basic**
- ✅ Private courses with share links
- ✅ 50 file uploads per month
- ✅ 500 AI requests per month
- ✅ Faster AI processing
- ✅ Email support

### Premium ($9.99/mo or $99.99/yr)
- ✅ **Everything in Standard**
- ✅ Public course publishing
- ✅ Unlimited file uploads
- ✅ Unlimited AI requests
- ✅ Priority support
- ✅ Early access to new features
- ✅ Advanced study analytics
- ✅ Custom course branding

---

## Quick Commands

### Start Development Environment
```powershell
# Terminal 1: Backend
cd backend
pnpm dev

# Terminal 2: Frontend
cd frontend
pnpm dev

# Terminal 3: Stripe Webhooks
.\start-stripe-dev.ps1
# OR manually:
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

### Test Card Numbers
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- Use any future expiry, any CVC, any ZIP

---

## API Endpoints

### Create Checkout Session
```typescript
POST /api/stripe/create-checkout-session
Body: {
  priceId: string,
  successUrl?: string,
  cancelUrl?: string
}
```

### Create Billing Portal Session
```typescript
POST /api/stripe/create-portal-session
Returns: { url: string }
```

### Webhook Handler
```typescript
POST /api/stripe/webhook
Headers: { stripe-signature: string }
```

---

## Environment Variables Required

### Backend (.env)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_STANDARD_MONTHLY=price_...
STRIPE_PRICE_STANDARD_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
```

### Frontend (.env)
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...

VITE_STRIPE_PRICE_STANDARD_MONTHLY=price_...
VITE_STRIPE_PRICE_STANDARD_YEARLY=price_...
VITE_STRIPE_PRICE_PREMIUM_MONTHLY=price_...
VITE_STRIPE_PRICE_PREMIUM_YEARLY=price_...
```

---

## Database Models

### User
```prisma
model User {
  role                Role          // BASIC, STANDARD, PREMIUM, ADMIN
  stripeCustomerId    String?       @unique
  subscription        Subscription?
}
```

### Subscription
```prisma
model Subscription {
  stripeSubscriptionId String             @unique
  stripePriceId        String
  status               SubscriptionStatus // ACTIVE, INACTIVE, CANCELED, PAST_DUE, TRIALING
  planType             Role               // STANDARD, PREMIUM
  billingCycle         BillingCycle       // MONTHLY, YEARLY
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
}
```

### Payment
```prisma
model Payment {
  stripePaymentId String        @unique
  stripeInvoiceId String?
  amount          Int           // In cents
  currency        String        @default("usd")
  status          PaymentStatus // PENDING, SUCCEEDED, FAILED, REFUNDED
  planType        Role
  billingCycle    BillingCycle
}
```

---

## Webhook Events Handled

1. **checkout.session.completed**
   - Creates/updates subscription record
   - Updates user role
   - Creates customer if needed

2. **customer.subscription.updated**
   - Updates subscription details
   - Updates user role if plan changed
   - Handles cancellations

3. **customer.subscription.deleted**
   - Sets subscription status to CANCELED
   - Downgrades user to BASIC

4. **invoice.payment_succeeded**
   - Records successful payment
   - Updates subscription period

5. **invoice.payment_failed**
   - Records failed payment
   - Sets subscription to PAST_DUE

---

## Testing Checklist

- [ ] Products created in Stripe Dashboard
- [ ] All 4 price IDs configured in .env files
- [ ] Webhook listener running
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Can navigate to pricing page
- [ ] Can click upgrade button
- [ ] Redirected to Stripe Checkout
- [ ] Can complete payment with test card
- [ ] Redirected back to account page
- [ ] User role updated in database
- [ ] Subscription record created
- [ ] Payment record created
- [ ] Webhook events logged

---

## Common Issues & Solutions

### "Configuration error: Price ID not found"
**Solution:** Verify all 4 price IDs are set in both backend and frontend `.env` files

### "Webhook signature verification failed"
**Solution:** Copy the webhook secret from `stripe listen` output to `backend/.env`

### "User role not updating"
**Solution:** 
1. Check backend logs for errors
2. Verify webhook listener is running
3. Check Stripe Dashboard for webhook delivery status

### "Cannot create checkout session"
**Solution:**
1. Verify `STRIPE_SECRET_KEY` is correct
2. Check that price ID exists in Stripe Dashboard
3. Ensure user is authenticated

---

## File Locations

### Backend
- Routes: `backend/src/routes/stripe.routes.ts`
- Stripe lib: `backend/src/lib/stripe.ts`
- Config: `backend/src/config.ts`
- Schema: `backend/prisma/schema.prisma`

### Frontend
- Pricing page: `frontend/src/pages/Pricing.tsx`
- API client: `frontend/src/lib/api.ts`

### Documentation
- Setup guide: `STRIPE_COMPLETE_SETUP_GUIDE.md`
- Production deployment: `STRIPE_PRODUCTION_DEPLOYMENT.md`
- This reference: `STRIPE_QUICK_REFERENCE.md`

---

## Support Resources

- **Stripe Dashboard (Test):** https://dashboard.stripe.com/test/dashboard
- **Stripe Dashboard (Live):** https://dashboard.stripe.com/dashboard
- **Stripe Docs:** https://stripe.com/docs
- **Test Cards:** https://stripe.com/docs/testing#cards
- **Webhook Events:** https://stripe.com/docs/api/events/types

---

**Last Updated:** January 2026
