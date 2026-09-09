import { mkdirSync } from 'node:fs';
import { createDb } from '../src/lib/db';
import { migrateDb } from '../src/lib/migrate';

const url = process.env.TURSO_DATABASE_URL ?? 'file:./data/ember.db';
if (url.startsWith('file:')) mkdirSync('data', { recursive: true });
await migrateDb(createDb(url, process.env.TURSO_AUTH_TOKEN));
console.log('migrations applied to', url);
