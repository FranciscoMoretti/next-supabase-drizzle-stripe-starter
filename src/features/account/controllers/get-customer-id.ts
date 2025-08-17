import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { customers } from '@/db/schema';

export async function getCustomerId({ userId }: { userId: string }): Promise<string> {
  const rows = await db
    .select({ stripeCustomerId: customers.stripeCustomerId })
    .from(customers)
    .where(eq(customers.id, userId))
    .limit(1);
  const stripeCustomerId = rows[0]?.stripeCustomerId ?? null;
  if (!stripeCustomerId) throw new Error('Error fetching stripe_customer_id');
  return stripeCustomerId;
}
