import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    prices: {
      proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
      proYearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
      premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
      premiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY!,
    },
  },

  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@thynkr.com',
  },

  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
};

// Validate required config
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

export const redisUrl = config.redis.url;
