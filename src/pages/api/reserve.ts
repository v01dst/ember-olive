export const prerender = false;
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { db } from '../../lib/db';
import { createReservation } from '../../lib/services/reservations';
import { reservationSchema } from '../../lib/validation';

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Send JSON.' }, { status: 400 });
  }
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Check the highlighted fields.', fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  }
  const result = await createReservation(db, parsed.data);
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: result.code === 'SLOT_FULL' ? 409 : 400 });
  }
  return Response.json({ reservation: result.reservation }, { status: 201 });
};
