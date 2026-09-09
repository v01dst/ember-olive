import type { Db } from '../db';
import { getItemById } from '../menu';
import { orders, orderItems } from '../schema';
import type { OrderInput } from '../validation';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I, L, O, 0, 1 — nothing ambiguous read aloud

export function generateOrderNumber(rand: () => number = Math.random): string {
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return `EO-${suffix}`;
}

export type OrderLine = { itemId: string; name: string; qty: number; unitCents: number };

export function priceOrder(items: { id: string; qty: number }[]): { totalCents: number; lines: OrderLine[] } | null {
  let totalCents = 0;
  const lines: OrderLine[] = [];
  for (const item of items) {
    const menu = getItemById(item.id);
    if (!menu) return null;
    const unitCents = Math.round(menu.price * 100);
    totalCents += unitCents * item.qty;
    lines.push({ itemId: menu.id, name: menu.name, qty: item.qty, unitCents });
  }
  return { totalCents, lines };
}

export type OrderResult =
  | { ok: true; order: { orderNumber: string; totalCents: number; etaMinutes: number } }
  | { ok: false; code: 'UNKNOWN_ITEM'; message: string };

export async function createOrder(db: Db, input: OrderInput): Promise<OrderResult> {
  const priced = priceOrder(input.items);
  if (!priced) {
    return { ok: false, code: 'UNKNOWN_ITEM', message: 'Something in your cart is no longer on the menu. Refresh and try again.' };
  }
  const etaMinutes = 20;
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      const [order] = await db
        .insert(orders)
        .values({
          orderNumber,
          name: input.name,
          phone: input.phone,
          notes: input.notes || null,
          totalCents: priced.totalCents,
          etaMinutes,
          createdAt: Math.floor(Date.now() / 1000),
        })
        .returning();
      await db.insert(orderItems).values(priced.lines.map((l) => ({ ...l, orderId: order.id })));
      return { ok: true, order: { orderNumber, totalCents: priced.totalCents, etaMinutes } };
    } catch (err) {
      if (attempt === 4) throw err;
      // unique collision on orderNumber — retry with a new number
    }
  }
  throw new Error('unreachable');
}
