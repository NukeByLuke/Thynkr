/**
 * Stripe Payment Routes
 * Handles subscription checkout, billing portal, webhooks, and payment management.
 */

import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../db/client';
import { stripe, getPriceInfo } from '../lib/stripe';
import { config } from '../config';
import { checkoutSessionSchema } from '../schemas/validation.schemas';

/**
 * Register Stripe payment routes with the Fastify server
 * @param server - Fastify instance
 */
export default async function stripeRoutes(server: FastifyInstance) {
  // Create checkout session
  server.post(
    '/create-checkout-session',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const { priceId, successUrl, cancelUrl } = checkoutSessionSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;

        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl || `${config.frontendUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${config.frontendUrl}/pricing`,
        metadata: {
          userId: user.id,
        },
      });

      return reply.send({ sessionId: session.id, url: session.url });
    }
  );

  // Create customer portal session
  server.post(
    '/create-portal-session',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
      });

      if (!user || !user.stripeCustomerId) {
        return reply.code(400).send({ error: 'No subscription found' });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${config.frontendUrl}/account`,
      });

      return reply.send({ url: session.url });
    }
  );

  // Stripe webhook handler
  server.post(
    '/webhook',
    {
      config: {
        rawBody: true,
      },
    },
    async (request, reply) => {
      const sig = request.headers['stripe-signature'] as string;

      let event: any;

      try {
        event = stripe.webhooks.constructEvent(
          (request as any).rawBody as Buffer,
          sig,
          config.stripe.webhookSecret
        );
      } catch (err: any) {
        server.log.error(`Webhook signature verification failed: ${err.message}`);
        return reply.code(400).send({ error: 'Webhook signature verification failed' });
      }

      server.log.info({ type: event.type }, 'Stripe webhook received');

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object;
            await handleCheckoutSessionCompleted(session);
            break;
          }

          case 'customer.subscription.updated': {
            const subscription = event.data.object;
            await handleSubscriptionUpdated(subscription);
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            await handleSubscriptionDeleted(subscription);
            break;
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            await handleInvoicePaymentSucceeded(invoice);
            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object;
            await handleInvoicePaymentFailed(invoice);
            break;
          }
        }

        return reply.send({ received: true });
      } catch (error: any) {
        server.log.error({ error: error.message }, 'Webhook handler error');
        return reply.code(500).send({ error: 'Webhook handler failed' });
      }
    }
  );
}

async function handleCheckoutSessionCompleted(session: any) {
  const userId = session.metadata.userId;
  const customerId = session.customer;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const priceId = subscription.items.data[0].price.id;
  const priceInfo = getPriceInfo(priceId);

  if (!priceInfo) {
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  // Update user and create subscription record
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customerId,
        role: priceInfo.role as any,
      },
    }),
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status.toUpperCase() as any,
        planType: priceInfo.role as any,
        billingCycle: priceInfo.billingCycle as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status.toUpperCase() as any,
        planType: priceInfo.role as any,
        billingCycle: priceInfo.billingCycle as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    }),
  ]);
}

async function handleSubscriptionUpdated(subscription: any) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = (customer as any).metadata?.userId;

  if (!userId) return;

  const priceId = subscription.items.data[0].price.id;
  const priceInfo = getPriceInfo(priceId);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { userId },
      data: {
        stripePriceId: priceId,
        status: subscription.status.toUpperCase() as any,
        ...(priceInfo && {
          planType: priceInfo.role as any,
          billingCycle: priceInfo.billingCycle as any,
        }),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    }),
    ...(priceInfo
      ? [
          prisma.user.update({
            where: { id: userId },
            data: { role: priceInfo.role as any },
          }),
        ]
      : []),
  ]);
}

async function handleSubscriptionDeleted(subscription: any) {
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = (customer as any).metadata?.userId;

  if (!userId) return;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELED' },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: 'BASIC' },
    }),
  ]);
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const userId = (customer as any).metadata?.userId;

  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) return;

  // Record the payment
  const priceId = invoice.lines?.data?.[0]?.price?.id;
  const priceInfo = priceId ? getPriceInfo(priceId) : null;

  await prisma.payment.create({
    data: {
      userId,
      userEmail: user.email,
      stripePaymentId: invoice.payment_intent || invoice.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'SUCCEEDED',
      planType: (priceInfo?.role as any) || 'STANDARD',
      billingCycle: (priceInfo?.billingCycle as any) || 'MONTHLY',
      description: invoice.lines?.data?.[0]?.description || 'Subscription payment',
    },
  });

  // Update subscription if exists
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    await handleSubscriptionUpdated(subscription);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const customer = await stripe.customers.retrieve(invoice.customer);
  const userId = (customer as any).metadata?.userId;

  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (user) {
    // Record the failed payment
    const priceId = invoice.lines?.data?.[0]?.price?.id;
    const priceInfo = priceId ? getPriceInfo(priceId) : null;

    await prisma.payment.create({
      data: {
        userId,
        userEmail: user.email,
        stripePaymentId: invoice.payment_intent || invoice.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'FAILED',
        planType: (priceInfo?.role as any) || 'STANDARD',
        billingCycle: (priceInfo?.billingCycle as any) || 'MONTHLY',
        description: invoice.lines?.data?.[0]?.description || 'Subscription payment failed',
      },
    });
  }

  await prisma.subscription.update({
    where: { userId },
    data: { status: 'PAST_DUE' },
  });
}
