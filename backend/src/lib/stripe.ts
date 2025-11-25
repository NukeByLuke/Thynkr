import Stripe from 'stripe';
import { config } from '../config';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Map Stripe price IDs to roles
export function getPriceRole(priceId: string): string | null {
  const priceMap: { [key: string]: string } = {
    [config.stripe.prices.proMonthly]: 'PRO',
    [config.stripe.prices.proYearly]: 'PRO',
    [config.stripe.prices.premiumMonthly]: 'PREMIUM',
    [config.stripe.prices.premiumYearly]: 'PREMIUM',
  };

  return priceMap[priceId] || null;
}

export function getPlanName(priceId: string): string {
  const nameMap: { [key: string]: string } = {
    [config.stripe.prices.proMonthly]: 'Pro Monthly',
    [config.stripe.prices.proYearly]: 'Pro Yearly',
    [config.stripe.prices.premiumMonthly]: 'Premium Monthly',
    [config.stripe.prices.premiumYearly]: 'Premium Yearly',
  };

  return nameMap[priceId] || 'Unknown Plan';
}
