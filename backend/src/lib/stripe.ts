import Stripe from 'stripe';
import { config } from '../config';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Map Stripe price IDs to roles and billing cycles
export interface PriceInfo {
  role: 'STANDARD' | 'PREMIUM';
  billingCycle: 'MONTHLY' | 'YEARLY';
}

export function getPriceInfo(priceId: string): PriceInfo | null {
  const priceMap: { [key: string]: PriceInfo } = {
    [config.stripe.prices.standardMonthly]: { role: 'STANDARD', billingCycle: 'MONTHLY' },
    [config.stripe.prices.standardYearly]: { role: 'STANDARD', billingCycle: 'YEARLY' },
    [config.stripe.prices.premiumMonthly]: { role: 'PREMIUM', billingCycle: 'MONTHLY' },
    [config.stripe.prices.premiumYearly]: { role: 'PREMIUM', billingCycle: 'YEARLY' },
  };

  return priceMap[priceId] || null;
}

// Legacy function for backwards compatibility
export function getPriceRole(priceId: string): string | null {
  const info = getPriceInfo(priceId);
  return info ? info.role : null;
}

export function getPlanName(priceId: string): string {
  const nameMap: { [key: string]: string } = {
    [config.stripe.prices.standardMonthly]: 'Standard Monthly',
    [config.stripe.prices.standardYearly]: 'Standard Yearly',
    [config.stripe.prices.premiumMonthly]: 'Premium Monthly',
    [config.stripe.prices.premiumYearly]: 'Premium Yearly',
  };

  return nameMap[priceId] || 'Unknown Plan';
}

// Price amounts for reference (in cents)
export const PLAN_PRICES = {
  standard: {
    monthly: 800, // $8/mo
    yearly: 6000, // $5/mo * 12 = $60/year
  },
  premium: {
    monthly: 1200, // $12/mo
    yearly: 12000, // $10/mo * 12 = $120/year
  },
};
