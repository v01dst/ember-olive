export const prerender = false;
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { todayStr } from '../../../lib/availability';
import { reservations, orders, orderItems } from '../../../lib/schema';

export const GET: APIRoute = async () => {
  const date = todayStr();
  const todaysReservations = await db.select().from(reservations).where(eq(reservations.date, date));
  const todaysOrders = await db.select().from(orders);
  const withItems = await Promise.all(
    todaysOrders.map(async (o) => ({
      ...o,
      items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    })),
  );
  return Response.json({ date, reservations: todaysReservations, orders: withItems });
};
