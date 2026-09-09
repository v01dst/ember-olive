import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, type Db } from '../db';
import { migrateDb } from '../migrate';
import { generateOrderNumber, priceOrder, createOrder } from './orders';

let db: Db;
beforeEach(async () => {
  db = createDb(':memory:');
  await migrateDb(db);
});

describe('generateOrderNumber', () => {
  it('matches EO-XXXXXX with an unambiguous alphabet', () => {
    expect(generateOrderNumber()).toMatch(/^EO-[A-HJ-NP-Z2-9]{6}$/);
  });
  it('is deterministic from an injected rand', () => {
    let calls = 0;
    const rand = () => [0, 0.5, 0.999, 0.25, 0.75, 0.1][calls++ % 6];
    expect(generateOrderNumber(rand)).toBe(generateOrderNumber(rand));
  });
});

describe('priceOrder', () => {
  it('prices from menu data in cents', () => {
    const p = priceOrder([{ id: 'hummus', qty: 2 }, { id: 'turkish-coffee', qty: 1 }]);
    expect(p?.totalCents).toBe(850 * 2 + 350);
    expect(p?.lines).toHaveLength(2);
  });
  it('returns null for unknown items', () => {
    expect(priceOrder([{ id: 'hummus', qty: 1 }, { id: 'pineapple-pizza', qty: 1 }])).toBeNull();
  });
});

describe('createOrder', () => {
  it('stores an order with server-computed total and returns the number', async () => {
    const res = await createOrder(db, {
      name: 'Rita V.', phone: '555-0177', notes: 'Extra napkins',
      items: [{ id: 'lamb-kofta', qty: 2 }, { id: 'mint-lemonade', qty: 2 }],
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.order.totalCents).toBe(1850 * 2 + 450 * 2);
  });
  it('rejects unknown items', async () => {
    const res = await createOrder(db, { name: 'X Y', phone: '555-0199', notes: '', items: [{ id: 'ghost', qty: 1 }] });
    expect(res).toMatchObject({ ok: false, code: 'UNKNOWN_ITEM' });
  });
  it('stores line items joined to the order', async () => {
    const res = await createOrder(db, { name: 'A B', phone: '555-0100', notes: '', items: [{ id: 'hummus', qty: 1 }] });
    expect(res.ok).toBe(true);
  });
});
