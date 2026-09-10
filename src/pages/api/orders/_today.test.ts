import { describe, it, expect, beforeEach, vi } from 'vitest';

const holder = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('../../../lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/db')>();
  return { get db() { return holder.db ?? actual.db; }, createDb: actual.createDb };
});

import { GET } from './today';
import { createDb, type Db } from '../../../lib/db';
import { migrateDb } from '../../../lib/migrate';
import { createOrder } from '../../../lib/services/orders';
import { orders } from '../../../lib/schema';
import { todayStr } from '../../../lib/availability';

let db: Db;
beforeEach(async () => {
  db = createDb(':memory:');
  await migrateDb(db);
  holder.db = db;
});

describe('GET /api/orders/today', () => {
  it('returns today’s orders with their items and skips earlier ones', async () => {
    const created = await createOrder(db, {
      name: 'Today O.', phone: '555-0101', notes: '', items: [{ id: 'hummus', qty: 2 }],
    });
    expect(created.ok).toBe(true);
    await db.insert(orders).values({
      orderNumber: 'EO-OLDXYZ', name: 'Old O.', phone: '555-0100', notes: null,
      totalCents: 100, etaMinutes: 20, createdAt: Math.floor(Date.now() / 1000) - 2 * 86_400,
    });

    const res = await GET({} as Parameters<typeof GET>[0]);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.date).toBe(todayStr());
    expect(json.orders).toHaveLength(1);
    expect(json.orders[0]).toMatchObject({ name: 'Today O.', totalCents: 1700 });
    expect(json.orders[0].items).toHaveLength(1);
    expect(json.orders[0].items[0]).toMatchObject({ itemId: 'hummus', qty: 2 });
    expect(json.reservations).toEqual([]);
  });
});
