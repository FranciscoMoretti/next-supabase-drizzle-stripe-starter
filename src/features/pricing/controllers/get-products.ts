import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { Price, prices, Product, products } from '@/db/schema';
import type { Price as SPrice, Product as SProduct, ProductWithPrices } from '@/features/pricing/types';

export async function getProducts(): Promise<ProductWithPrices[]> {
  // Get active products with active prices, ordered by metadata->index and unit_amount
  const rows = await db
    .select({ product: products, price: prices })
    .from(products)
    .innerJoin(prices, eq(prices.productId, products.id))
    .where(and(eq(products.active, true), eq(prices.active, true)))
    .orderBy(
      // order by metadata->>'index' ascending then by unit_amount ascending
      sql`(products.metadata->>'index')::int NULLS LAST`,
      prices.unitAmount
    );

  // Shape similar to Supabase join: product row with nested prices[]
  const byProduct = new Map<string, ProductWithPrices>();

  const mapProduct = (p: Product): SProduct => ({
    id: p.id,
    active: p.active ?? null,
    name: p.name ?? null,
    description: p.description ?? null,
    image: p.image ?? null,
    metadata: (p.metadata as any) ?? null,
  });

  const mapPrice = (pr: Price): SPrice => ({
    id: pr.id,
    active: pr.active ?? null,
    currency: pr.currency ?? null,
    description: pr.description ?? null,
    type: pr.type,
    unit_amount: pr.unitAmount ?? null,
    interval: pr.interval,
    interval_count: pr.intervalCount ?? null,
    trial_period_days: pr.trialPeriodDays ?? null,
    metadata: (pr.metadata as any) ?? null,
    product_id: pr.productId ?? null,
  });

  for (const { product, price } of rows) {
    const key = product.id;
    if (!byProduct.has(key)) byProduct.set(key, { ...mapProduct(product), prices: [] });
    if (price) byProduct.get(key)!.prices.push(mapPrice(price));
  }

  return Array.from(byProduct.values());
}
