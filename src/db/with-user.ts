import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || `postgresql://postgres:postgres@127.0.0.1:54322/postgres`;

function decodeJwt(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('Invalid JWT');
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json);
}

export async function withUserDb<T>(
  accessToken: string,
  fn: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  const client = postgres(connectionString, { max: 1, no_prepare: true });
  try {
    const claims = JSON.stringify(decodeJwt(accessToken));
    // Set Supabase-compatible RLS context for this session
    await client`select set_config('request.jwt.claims', ${claims}, true)`;
    await client`select set_config('role', 'authenticated', true)`;

    const db = drizzle(client, { schema });
    const result = await fn(db);
    return result;
  } finally {
    await client.end();
  }
}
