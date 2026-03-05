# Stripe Webhook Setup

## Create Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://YOUR_DOMAIN/api/webhooks/stripe`
   (Replace YOUR_DOMAIN with your actual domain like thynkr.ca)

4. **Events to send** - Select these:
   - âœ… `checkout.session.completed`
   - âœ… `customer.subscription.created`
   - âœ… `customer.subscription.updated`
   - âœ… `customer.subscription.deleted`
   - âœ… `invoice.payment_succeeded`
   - âœ… `invoice.payment_failed`

5. Click **"Add endpoint"**

6. **Verify the webhook secret matches:**
   ```
   whsec_f9f4b41a1a6d68009841095f168c0bbebe59b09f746d08e14f45f42c5fca8daf
   ```

## Test Webhook

After creating, click "Send test webhook" and select `checkout.session.completed`.

Check your server logs:
```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i stripe
```

You should see: "Received Stripe webhook"
