import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL || `postgresql://postgres:postgres@127.0.0.1:54322/postgres`;

// Use a global to prevent creating multiple clients in dev HMR
const globalForDb = global as unknown as {
  __pg?: ReturnType<typeof postgres>;
  __db?: ReturnType<typeof drizzle>;
};

export const pg =
  globalForDb.__pg ??
  postgres(connectionString, {
    max: 1,
    no_prepare: true,
  });

export const db = globalForDb.__db ?? drizzle(pg, { schema });

if (!globalForDb.__pg) globalForDb.__pg = pg;
if (!globalForDb.__db) globalForDb.__db = db;

export type DbClient = typeof db;
