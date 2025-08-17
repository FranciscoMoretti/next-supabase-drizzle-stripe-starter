import Stripe from 'stripe';

import { db } from '@/db/client';
import { products } from '@/db/schema';

type Product = typeof products.$inferInsert;

export async function upsertProduct(product: Stripe.Product) {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  await db.insert(products).values(productData).onConflictDoUpdate({ target: products.id, set: productData });
  console.info(`Product inserted/updated: ${product.id}`);
}
