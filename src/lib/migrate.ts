import { migrate } from 'drizzle-orm/libsql/migrator';
import type { Db } from './db';

export async function migrateDb(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder: './drizzle' });
}
