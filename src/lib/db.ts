import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export function createDb(url = process.env.TURSO_DATABASE_URL ?? 'file:./data/ember.db', authToken = process.env.TURSO_AUTH_TOKEN) {
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}
export type Db = ReturnType<typeof createDb>;
export const db = createDb();
