# Email Setup Guide (Resend)

## Overview
Thynkr uses **Resend** for transactional emails (email verification, password reset).

**Free Tier**: 3,000 emails/month, 100/day - perfect for getting started!

## Setup Steps

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up (no credit card required for free tier)
3. Verify your email

### 2. Get API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `thynkr-production`
4. Copy the key (starts with `re_`)

### 3. Configure Domain (Optional but Recommended)
For production, you should verify your domain to send from `@thynkr.study`:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter: `thynkr.study`
4. Add the DNS records they provide to your DigitalOcean DNS
5. Wait for verification (usually < 5 minutes)

**Default**: If you skip this step, emails will come from `onboarding@resend.dev` (works fine for testing)

### 4. Add Environment Variables

#### Backend (.env)
```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Thynkr <noreply@thynkr.study>
RESEND_ENABLED=true

# Frontend URL (for email links)
FRONTEND_URL=https://thynkr.study
```

#### DigitalOcean Server
SSH into your server and add to `/root/.env`:
```bash
echo 'RESEND_API_KEY=re_your_key_here' >> /root/.env
echo 'RESEND_FROM_EMAIL=Thynkr <noreply@thynkr.study>' >> /root/.env
echo 'RESEND_ENABLED=true' >> /root/.env
```

### 5. Deploy
Build and deploy the updated backend:
```powershell
# From project root
cd backend
docker build -t nukebyluke/thynkr-backend:latest .
docker push nukebyluke/thynkr-backend:latest

# SSH and restart
ssh root@138.197.208.81
cd /root
docker compose -f docker-compose.prod.yml pull backend
docker compose -f docker-compose.prod.yml up -d backend
```

Build and deploy frontend (has new pages):
```powershell
cd frontend
docker build `
  --build-arg VITE_API_URL=/api `
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SbRAIJuKGUgkYW13Ena665dDAbUOLx9r4TfAxOW0Q83SHSOfkCugOv9lwFT7GLhYYXB78giq22o0SUehm7oJAvI00D5ydmK5v `
  --build-arg VITE_STRIPE_PRICE_STANDARD_MONTHLY=price_1SuJ87JuKGUgkYW14X35zJzB `
  --build-arg VITE_STRIPE_PRICE_STANDARD_YEARLY=price_1SuJ8cJuKGUgkYW1XkO5aNjn `
  --build-arg VITE_STRIPE_PRICE_PREMIUM_MONTHLY=price_1SuJ8zJuKGUgkYW1gMUNkfFa `
  --build-arg VITE_STRIPE_PRICE_PREMIUM_YEARLY=price_1SuJ9DJuKGUgkYW10azzNYPK `
  -t nukebyluke/thynkr-frontend:latest .
docker push nukebyluke/thynkr-frontend:latest

ssh root@138.197.208.81 "cd /root && docker compose -f docker-compose.prod.yml pull frontend && docker compose -f docker-compose.prod.yml up -d frontend"
```

## Email Features

### Email Verification
- **When**: Sent immediately on user registration
- **Link**: `https://thynkr.study/verify-email?token=...`
- **Expires**: Never (token stored until used)
- **Design**: Gradient brand colors with THYNKR logo

### Password Reset
- **When**: User clicks "Forgot Password" on login page
- **Link**: `https://thynkr.study/reset-password?token=...`
- **Expires**: 1 hour
- **Security**: Doesn't reveal if email exists
- **Design**: Includes expiration warning

## Testing

### Test Email Verification
1. Create new account at `https://thynkr.study/register`
2. Check email inbox
3. Click "Verify Email Address"
4. Should redirect to login with success message

### Test Password Reset
1. Go to `https://thynkr.study/forgot-password`
2. Enter your email
3. Check email inbox
4. Click "Reset Password"
5. Enter new password
6. Should redirect to login

## Troubleshooting

### Emails Not Sending
1. Check backend logs: `ssh root@138.197.208.81 'docker logs root-backend-1'`
2. Verify `RESEND_ENABLED=true` in server .env
3. Check Resend dashboard for errors/logs

### Emails Going to Spam
- Verify your domain in Resend (adds SPF/DKIM records)
- This significantly improves deliverability

### Wrong "From" Address
- Make sure `RESEND_FROM_EMAIL` uses your verified domain
- Format: `Name <email@domain.com>`

## Monitoring

Check Resend dashboard for:
- **Delivery rate** (should be >99%)
- **Open rate** (typical: 20-40%)
- **Bounce rate** (should be <2%)
- **Daily/monthly usage** (free tier: 100/day, 3,000/month)

## Upgrade Path

When you hit the free tier limit:
- **$20/month**: 50,000 emails/month
- **$80/month**: 250,000 emails/month

Much cheaper than SendGrid/Mailgun!

## Cost Estimate

With current user growth:
- **<1,000 users**: Free forever
- **1,000-5,000 users**: Still free (assuming 2 emails per user)
- **5,000+ users**: $20/month

## Security Notes

- âœ… Email tokens are cryptographically random (32 bytes)
- âœ… Password reset tokens expire in 1 hour
- âœ… Email verification tokens are single-use
- âœ… No user enumeration (same message whether email exists or not)
- âœ… All tokens invalidated on password reset
