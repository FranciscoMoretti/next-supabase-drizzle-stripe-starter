import Stripe from 'stripe';

import { db } from '@/db/client';
import { Price, prices } from '@/db/schema';

export async function upsertPrice(price: Stripe.Price) {
  const priceData: Price = {
    id: price.id,
    productId:
      typeof price.product === 'string'
        ? price.product
        : price.product && 'id' in price.product
        ? price.product.id
        : null,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unitAmount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    intervalCount: price.recurring?.interval_count ?? null,
    trialPeriodDays: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };

  await db.insert(prices).values(priceData).onConflictDoUpdate({ target: prices.id, set: priceData });
  console.info(`Price inserted/updated: ${price.id}`);
}
