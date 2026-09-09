export const prerender = false;
import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { getAvailability } from '../../lib/services/reservations';

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'Provide ?date= as yyyy-mm-dd' }, { status: 400 });
  }
  const slots = await getAvailability(db, date);
  return Response.json({ date, slots });
};
