import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, type Db } from '../db';
import { migrateDb } from '../migrate';
import { getAvailability, createReservation } from './reservations';

let db: Db;
beforeEach(async () => {
  db = createDb(':memory:');
  await migrateDb(db);
});

describe('getAvailability', () => {
  it('returns all slots fully open on an empty open day', async () => {
    const slots = await getAvailability(db, '2026-10-06'); // a Tuesday
    expect(slots[0]).toEqual({ time: '12:00', remaining: 42 });
    expect(slots.length).toBeGreaterThanOrEqual(19);
  });
  it('returns nothing on Mondays or bad dates', async () => {
    expect(await getAvailability(db, '2026-10-05')).toEqual([]); // Monday
    expect(await getAvailability(db, 'garbage')).toEqual([]);
    expect(await getAvailability(db, '1999-01-01')).toEqual([]);
  });
  it('reduces remaining as party sizes book in', async () => {
    await createReservation(db, { name: 'Group A', phone: '555-0102', partySize: 10, date: '2026-10-06', time: '19:00', notes: '' });
    const slot = (await getAvailability(db, '2026-10-06')).find((s) => s.time === '19:00');
    expect(slot?.remaining).toBe(32);
  });
});

describe('createReservation', () => {
  const base = { name: 'Lina M.', phone: '+1 555 010 3321', partySize: 4, date: '2026-10-06', time: '19:00', notes: '' };
  it('books a valid reservation and returns the row', async () => {
    const res = await createReservation(db, base);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.reservation.partySize).toBe(4);
  });
  it('rejects Mondays and unknown slots as INVALID', async () => {
    expect(await createReservation(db, { ...base, date: '2026-10-05' })).toMatchObject({ ok: false, code: 'INVALID' });
    expect(await createReservation(db, { ...base, time: '11:45' })).toMatchObject({ ok: false, code: 'INVALID' });
  });
  it('rejects a booking that would exceed 42 seats with SLOT_FULL', async () => {
    await createReservation(db, { ...base, name: 'Big group', partySize: 40 });
    const res = await createReservation(db, base);
    expect(res).toMatchObject({ ok: false, code: 'SLOT_FULL' });
  });
  it('allows adjacent slots independently', async () => {
    await createReservation(db, { ...base, partySize: 40 });
    const res = await createReservation(db, { ...base, time: '19:30' });
    expect(res.ok).toBe(true);
  });
});
