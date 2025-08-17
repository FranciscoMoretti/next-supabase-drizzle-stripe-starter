import { eq, inArray } from 'drizzle-orm';

import type { Price, Product, Subscription } from '@/db/schema';
import { prices, products, subscriptions } from '@/db/schema';
import { withUserDb } from '@/db/with-user';
import { getAccessToken } from '@/libs/supabase/get-access-token';

export async function getSubscription(): Promise<(Subscription & { prices: Price & { products: Product } }) | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return withUserDb(token, async (db) => {
    const rows = await db
      .select({ sub: subscriptions, price: prices, product: products })
      .from(subscriptions)
      .innerJoin(prices, eq(prices.id, subscriptions.priceId))
      .innerJoin(products, eq(products.id, prices.productId))
      .where(inArray(subscriptions.status, ['trialing', 'active']))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    const sub: Subscription & { prices: Price & { products: Product } } = {
      ...row.sub,
      prices: { ...row.price, products: row.product },
    };
    return sub;
  });
}
