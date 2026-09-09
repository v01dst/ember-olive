import { eq } from 'drizzle-orm';
import type { Db } from '../db';
import { RESTAURANT, isOpenDay, isValidDate, slotsForDay } from '../availability';
import { reservations } from '../schema';
import type { ReservationInput } from '../validation';

export type SlotAvailability = { time: string; remaining: number };
export type ReservationRow = typeof reservations.$inferSelect;
export type ReservationResult =
  | { ok: true; reservation: ReservationRow }
  | { ok: false; code: 'INVALID' | 'SLOT_FULL'; message: string };

export async function getAvailability(db: Db, date: string): Promise<SlotAvailability[]> {
  if (!isValidDate(date)) return [];
  if (!isOpenDay(new Date(`${date}T12:00:00`).getDay())) return [];
  const rows = await db.select().from(reservations).where(eq(reservations.date, date));
  const booked = new Map<string, number>();
  for (const r of rows) booked.set(r.time, (booked.get(r.time) ?? 0) + r.partySize);
  return slotsForDay()
    .map((time) => ({ time, remaining: RESTAURANT.seats - (booked.get(time) ?? 0) }))
    .filter((s) => s.remaining > 0);
}

export async function createReservation(db: Db, input: ReservationInput): Promise<ReservationResult> {
  const invalid = (message: string) => ({ ok: false as const, code: 'INVALID' as const, message });
  if (!isValidDate(input.date)) return invalid('That date is outside our 60-day booking window.');
  if (!isOpenDay(new Date(`${input.date}T12:00:00`).getDay())) return invalid('We close on Mondays. Pick any other day.');
  if (!slotsForDay().includes(input.time)) return invalid('We do not seat at that time. Seatings run 12:00–21:00.');
  const dayRows = await db.select().from(reservations).where(eq(reservations.date, input.date));
  const booked = dayRows.filter((r) => r.time === input.time).reduce((sum, r) => sum + r.partySize, 0);
  if (booked + input.partySize > RESTAURANT.seats) {
    return { ok: false, code: 'SLOT_FULL', message: 'That seating just filled up. Choose another time and we will find you a table.' };
  }
  const [row] = await db
    .insert(reservations)
    .values({ ...input, notes: input.notes || null, createdAt: Math.floor(Date.now() / 1000) })
    .returning();
  return { ok: true, reservation: row };
}
