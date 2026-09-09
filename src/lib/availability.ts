export const RESTAURANT = {
  seats: 42,
  maxParty: 10,
  firstSlot: '12:00',
  lastSlot: '21:00',
  slotMinutes: 30,
  maxAdvanceDays: 60,
} as const;

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
export function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
export function slotsForDay(): string[] {
  const slots: string[] = [];
  for (let m = timeToMinutes(RESTAURANT.firstSlot); m <= timeToMinutes(RESTAURANT.lastSlot); m += RESTAURANT.slotMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}
/** Open Tuesday (2) through Sunday (0); closed Monday (1). */
export function isOpenDay(day: number): boolean {
  return day !== 1;
}
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const end = start + (RESTAURANT.maxAdvanceDays + 1) * 86_400_000;
  return d.getTime() >= start && d.getTime() <= end;
}
export function todayStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
