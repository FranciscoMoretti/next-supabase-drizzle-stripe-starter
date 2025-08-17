import { eq } from 'drizzle-orm';

import { users } from '@/db/schema';
import { withUserDb } from '@/db/with-user';
import { getAccessToken } from '@/libs/supabase/get-access-token';

export async function getUser() {
  const token = await getAccessToken();
  if (!token) return null;
  return withUserDb(token, async (db) => {
    // auth.uid() = id policy is enforced by RLS via jwt claims we set in withUserDb
    const rows = await db.select().from(users).limit(1);
    return rows[0] ?? null;
  });
}
