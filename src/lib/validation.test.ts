import { describe, it, expect } from 'vitest';
import { reservationSchema, orderSchema } from './validation';

describe('reservationSchema', () => {
  const valid = { name: 'Sara H.', phone: '+1 555 010 9987', partySize: 4, date: '2026-09-12', time: '19:00', notes: '' };
  it('accepts a valid reservation', () => {
    expect(reservationSchema.safeParse(valid).success).toBe(true);
  });
  it('accepts a parenthesized phone number', () => {
    expect(reservationSchema.safeParse({ ...valid, phone: '(555) 010-0000' }).success).toBe(true);
  });
  it('coerces partySize from string and bounds it', () => {
    expect(reservationSchema.safeParse({ ...valid, partySize: '4' }).success).toBe(true);
    expect(reservationSchema.safeParse({ ...valid, partySize: 11 }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...valid, partySize: 0 }).success).toBe(false);
  });
  it('rejects bad phone, date, and time formats', () => {
    expect(reservationSchema.safeParse({ ...valid, phone: 'hello' }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...valid, date: '12-09-2026' }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...valid, time: '25:00' }).success).toBe(false);
  });
  it('requires a name of at least 2 chars', () => {
    expect(reservationSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });
});

describe('orderSchema', () => {
  const valid = { name: 'Tom W.', phone: '555-0101', items: [{ id: 'hummus', qty: 2 }], notes: '' };
  it('accepts a valid order', () => {
    expect(orderSchema.safeParse(valid).success).toBe(true);
  });
  it('accepts a parenthesized phone number', () => {
    expect(orderSchema.safeParse({ ...valid, phone: '(555) 010-0000' }).success).toBe(true);
  });
  it('rejects empty carts and silly quantities', () => {
    expect(orderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(orderSchema.safeParse({ ...valid, items: [{ id: 'hummus', qty: 99 }] }).success).toBe(false);
  });
  it('rejects oversized carts', () => {
    const items = Array.from({ length: 21 }, () => ({ id: 'hummus', qty: 1 }));
    expect(orderSchema.safeParse({ ...valid, items }).success).toBe(false);
  });
});
