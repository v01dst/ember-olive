export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '../../lib/db';
import { createOrder } from '../../lib/services/orders';
import { orderSchema } from '../../lib/validation';

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Send JSON.' }, { status: 400 });
  }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Check the highlighted fields.', fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const result = await createOrder(db, parsed.data);
  if (!result.ok) return Response.json({ error: result.message }, { status: 409 });
  return Response.json(result.order, { status: 201 });
};
