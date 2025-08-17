import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

import { db } from '@/db/client';
import { customers, Subscription, subscriptions, users } from '@/db/schema';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { toDateTime } from '@/utils/to-date-time';
import { AddressParam } from '@stripe/stripe-js';

export async function upsertUserSubscription({
  subscriptionId,
  customerId,
  isCreateAction,
}: {
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
}) {
  // Get customer's userId from mapping table.
  const mapped = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.stripeCustomerId, customerId))
    .limit(1);
  const userId = mapped[0]?.id;
  if (!userId) throw new Error('Customer mapping not found');

  const subscription = await stripeAdmin.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  });

  // Upsert the latest status of the subscription object via Drizzle.
  const subscriptionData: Subscription = {
    id: subscription.id,
    quantity: subscription.items.data[0]?.quantity ?? 1,
    userId,
    metadata: subscription.metadata as any,
    status: subscription.status as any,
    priceId: subscription.items.data[0]?.price?.id ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? null,
    cancelAt: subscription.cancel_at ? toDateTime(subscription.cancel_at) : null,
    canceledAt: subscription.canceled_at ? toDateTime(subscription.canceled_at) : null,
    currentPeriodStart: toDateTime(subscription.current_period_start),
    currentPeriodEnd: toDateTime(subscription.current_period_end),
    created: toDateTime(subscription.created),
    endedAt: subscription.ended_at ? toDateTime(subscription.ended_at) : null,
    trialStart: subscription.trial_start ? toDateTime(subscription.trial_start) : null,
    trialEnd: subscription.trial_end ? toDateTime(subscription.trial_end) : null,
  };

  await db
    .insert(subscriptions)
    .values(subscriptionData)
    .onConflictDoUpdate({ target: subscriptions.id, set: subscriptionData });
  console.info(`Inserted/updated subscription [${subscription.id}] for user [${userId}]`);

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (isCreateAction && subscription.default_payment_method && userId) {
    await copyBillingDetailsToCustomer(userId, subscription.default_payment_method as Stripe.PaymentMethod);
  }
}

const copyBillingDetailsToCustomer = async (userId: string, paymentMethod: Stripe.PaymentMethod) => {
  const customer = paymentMethod.customer;
  if (typeof customer !== 'string') {
    throw new Error('Customer id not found');
  }

  const { name, phone, address } = paymentMethod.billing_details;
  if (!name || !phone || !address) return;

  await stripeAdmin.customers.update(customer, { name, phone, address: address as AddressParam });

  await db
    .update(users)
    .set({
      billingAddress: { ...address },
      paymentMethod: { ...paymentMethod[paymentMethod.type] },
    })
    .where(eq(users.id, userId));
};
