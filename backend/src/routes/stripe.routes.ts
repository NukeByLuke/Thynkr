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

      server.log.info({ type: event.type, eventId: event.id }, 'Stripe webhook received');

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object;
            server.log.info({ sessionId: session.id, userId: session.metadata?.userId }, 'Processing checkout.session.completed');
            await handleCheckoutSessionCompleted(session, server);
            break;
          }

          case 'customer.subscription.updated': {
            const subscription = event.data.object;
            server.log.info({ subscriptionId: subscription.id }, 'Processing customer.subscription.updated');
            await handleSubscriptionUpdated(subscription, server);
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            server.log.info({ subscriptionId: subscription.id }, 'Processing customer.subscription.deleted');
            await handleSubscriptionDeleted(subscription, server);
            break;
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            server.log.info({ invoiceId: invoice.id }, 'Processing invoice.payment_succeeded');
            await handleInvoicePaymentSucceeded(invoice, server);
            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object;
            server.log.info({ invoiceId: invoice.id }, 'Processing invoice.payment_failed');
            await handleInvoicePaymentFailed(invoice, server);
            break;
          }

          default:
            server.log.info({ type: event.type }, 'Unhandled webhook event type');
        }

        return reply.send({ received: true });
      } catch (error: any) {
        server.log.error({ 
          error: error.message, 
          stack: error.stack,
          eventType: event.type,
          eventId: event.id 
        }, 'Webhook handler error');
        return reply.code(500).send({ error: 'Webhook handler failed' });
      }
    }
  );
}

async function handleCheckoutSessionCompleted(session: any, server: FastifyInstance) {
  const userId = session.metadata.userId;
  const customerId = session.customer;

  if (!userId) {
    server.log.error({ sessionId: session.id }, 'Missing userId in checkout session metadata');
    throw new Error('Missing userId in session metadata');
  }

  if (!session.subscription) {
    server.log.error({ sessionId: session.id, userId }, 'No subscription ID in checkout session');
    throw new Error('No subscription found in checkout session');
  }

  server.log.info({ userId, subscriptionId: session.subscription }, 'Retrieving subscription details');
  
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const priceId = subscription.items.data[0].price.id;
  const priceInfo = getPriceInfo(priceId);

  if (!priceInfo) {
    server.log.error({ priceId, userId }, 'Unknown price ID from subscription');
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  server.log.info({ 
    userId, 
    role: priceInfo.role, 
    billingCycle: priceInfo.billingCycle,
    priceId 
  }, 'Updating user role and subscription');

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

  server.log.info({ userId, role: priceInfo.role }, 'Successfully updated user role and subscription');
}

async function handleSubscriptionUpdated(subscription: any, server: FastifyInstance) {
  server.log.info({ subscriptionId: subscription.id, customerId: subscription.customer }, 'Retrieving customer for subscription update');
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = (customer as any).metadata?.userId;

  if (!userId) {
    server.log.warn({ subscriptionId: subscription.id, customerId: subscription.customer }, 'No userId found in customer metadata for subscription update');
    return;
  }

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

async function handleSubscriptionDeleted(subscription: any, server: FastifyInstance) {
  server.log.info({ subscriptionId: subscription.id }, 'Processing subscription deletion');
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = (customer as any).metadata?.userId;

  if (!userId) {
    server.log.warn({ subscriptionId: subscription.id }, 'No userId found for subscription deletion');
    return;
  }

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

  server.log.info({ userId }, 'Successfully downgraded user to BASIC after subscription deletion');
}

async function handleInvoicePaymentSucceeded(invoice: any, server: FastifyInstance) {
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
    await handleSubscriptionUpdated(subscription, server);
  }
}

async function handleInvoicePaymentFailed(invoice: any, server: FastifyInstance) {
  server.log.warn({ invoiceId: invoice.id }, 'Processing failed invoice payment');
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
