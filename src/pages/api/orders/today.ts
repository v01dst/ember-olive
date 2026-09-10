export const prerender = false;
import type { APIRoute } from 'astro';
import { eq, gte } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { todayStr } from '../../../lib/availability';
import { reservations, orders, orderItems } from '../../../lib/schema';

export const GET: APIRoute = async () => {
  const now = new Date();
  const date = todayStr(now);
  const midnightSec = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
  const todaysReservations = await db.select().from(reservations).where(eq(reservations.date, date));
  const todaysOrders = await db.select().from(orders).where(gte(orders.createdAt, midnightSec));
  const withItems = await Promise.all(
    todaysOrders.map(async (o) => ({
      ...o,
      items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    })),
  );
  return Response.json({ date, reservations: todaysReservations, orders: withItems });
};
