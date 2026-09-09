import { describe, it, expect } from 'vitest';
import { slotsForDay, isOpenDay, isValidDate, timeToMinutes, minutesToTime, todayStr, RESTAURANT } from './availability';

describe('availability logic', () => {
  it('generates 30-minute slots from first to last', () => {
    const slots = slotsForDay();
    expect(slots[0]).toBe(RESTAURANT.firstSlot);
    expect(slots.at(-1)).toBe(RESTAURANT.lastSlot);
    expect(slots).toContain('18:30');
    expect(new Set(slots).size).toBe(slots.length);
  });
  it('is open Tue–Sun and closed Monday', () => {
    expect(isOpenDay(0)).toBe(true);   // Sun
    expect(isOpenDay(1)).toBe(false);  // Mon
    expect(isOpenDay(2)).toBe(true);   // Tue
  });
  it('round-trips time <-> minutes', () => {
    expect(timeToMinutes('18:30')).toBe(1110);
    expect(minutesToTime(1110)).toBe('18:30');
    expect(minutesToTime(timeToMinutes('12:00'))).toBe('12:00');
  });
  it('rejects malformed, past, and too-far dates', () => {
    expect(isValidDate('2026-13-40')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('1999-01-01')).toBe(false);
    expect(isValidDate(todayStr())).toBe(true);
    const far = new Date(Date.now() + (RESTAURANT.maxAdvanceDays + 2) * 86_400_000);
    expect(isValidDate(far.toISOString().slice(0, 10))).toBe(false);
  });
  it('todayStr is yyyy-mm-dd', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
