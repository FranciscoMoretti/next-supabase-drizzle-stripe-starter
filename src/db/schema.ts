import { bigint, boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Enums
export const pricingType = pgEnum('pricing_type', ['one_time', 'recurring']);
export const pricingPlanInterval = pgEnum('pricing_plan_interval', ['day', 'week', 'month', 'year']);
export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused',
]);

// Tables mirroring supabase/migrations/20240115041359_init.sql
export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  billingAddress: jsonb('billing_address'),
  paymentMethod: jsonb('payment_method'),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().notNull(),
  stripeCustomerId: text('stripe_customer_id'),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  active: boolean('active'),
  name: text('name'),
  description: text('description'),
  image: text('image'),
  metadata: jsonb('metadata'),
});

export const prices = pgTable('prices', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id),
  active: boolean('active'),
  description: text('description'),
  unitAmount: bigint('unit_amount', { mode: 'number' }),
  currency: text('currency'),
  type: pricingType('type'),
  interval: pricingPlanInterval('interval'),
  intervalCount: integer('interval_count'),
  trialPeriodDays: integer('trial_period_days'),
  metadata: jsonb('metadata'),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  status: subscriptionStatus('status'),
  metadata: jsonb('metadata'),
  priceId: text('price_id').references(() => prices.id),
  quantity: integer('quantity'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  created: timestamp('created', { withTimezone: true }).defaultNow().notNull(),
  currentPeriodStart: timestamp('current_period_start', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  currentPeriodEnd: timestamp('current_period_end', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  cancelAt: timestamp('cancel_at', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  trialStart: timestamp('trial_start', { withTimezone: true }),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
