# Stripe Webhook Setup for Local Development

## Problem
When you complete a purchase in test mode, the order goes through but your account doesn't upgrade from BASIC. This is because **webhooks aren't being received by your local server**.

## Solution

### For Local Development:
You MUST run the Stripe CLI to forward webhook events from Stripe to your local server.

1. **Open a new PowerShell terminal**

2. **Navigate to project root:**
   ```powershell
   cd c:\Users\luked\OneDrive\Desktop\Projects\Thynkr
   ```

3. **Start the Stripe CLI webhook forwarding:**
   ```powershell
   .\stripe-cli\stripe listen --forward-to localhost:5000/api/stripe/webhook
   ```

4. **Keep this terminal running** while you test purchases

### What this does:
- Stripe CLI listens for events in your Stripe test account
- When you complete a checkout, Stripe fires webhooks
- The CLI forwards these webhooks to your local backend at `http://localhost:5000/api/stripe/webhook`
- Your webhook handler processes the event and upgrades your account

### Testing the fix:
1. Start the Stripe CLI (command above)
2. Start your backend server (`cd backend && pnpm dev`)
3. Go to your pricing page and purchase a plan
4. Watch the Stripe CLI terminal - you should see webhook events
5. Check your account page - your role should now be upgraded!

### Common Issues:

**"Webhook signature verification failed"**
- Make sure the `STRIPE_WEBHOOK_SECRET` in `backend/.env` matches the webhook signing secret shown when you run `stripe listen`

**No webhooks appearing**
- Ensure Stripe CLI is running
- Check that your backend is running on port 5000
- Make sure you're using test mode credit card (4242 4242 4242 4242)

### For Production:
In production on DigitalOcean, webhooks are configured directly in your Stripe Dashboard:
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy the signing secret to your production environment variables
