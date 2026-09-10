import { z } from 'zod';
import { RESTAURANT } from './availability';

export const reservationSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^[+(\d][\d\s().-]{6,19}$/, 'Enter a real phone number'),
  partySize: z.coerce.number().int().min(1).max(RESTAURANT.maxParty),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().trim().max(300).optional().default(''),
});
export type ReservationInput = z.infer<typeof reservationSchema>;

export const orderItemSchema = z.object({
  id: z.string().min(1),
  qty: z.coerce.number().int().min(1).max(10),
});

export const orderSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^[+(\d][\d\s().-]{6,19}$/, 'Enter a real phone number'),
  notes: z.string().trim().max(300).optional().default(''),
  items: z.array(orderItemSchema).min(1).max(20),
});
export type OrderInput = z.infer<typeof orderSchema>;
