import { defineConfig } from 'drizzle-kit';

console.log(process.env.POSTGRES_URL);

export default defineConfig({
  // Use service role to allow full introspection/generation
  schema: './src/db/schema.ts',
  // Keep Drizzle's generated SQL separate to avoid clashes with Supabase CLI migrations
  out: './drizzle',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
  dbCredentials: {
    // Prefer local dev; fall back to env var for remote
    url: process.env.POSTGRES_URL || `postgresql://postgres:postgres@127.0.0.1:54322/postgres`,
  },
});
