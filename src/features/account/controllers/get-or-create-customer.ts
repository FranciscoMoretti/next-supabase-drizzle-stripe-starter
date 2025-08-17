import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { customers } from '@/db/schema';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }): Promise<string> {
  const existing = await db
    .select({ stripeCustomerId: customers.stripeCustomerId })
    .from(customers)
    .where(eq(customers.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing?.stripeCustomerId) {
    // No customer record found, let's create one.
    const customerData = {
      email,
      metadata: {
        userId,
      },
    } as const;

    const customer = await stripeAdmin.customers.create(customerData);

    // Insert the customer ID into our Supabase mapping table.
    await db.insert(customers).values({ id: userId, stripeCustomerId: customer.id });

    return customer.id;
  }

  return existing.stripeCustomerId;
}
