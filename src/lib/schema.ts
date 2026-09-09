import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const reservations = sqliteTable('reservations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  partySize: integer('party_size').notNull(),
  date: text('date').notNull(),      // yyyy-mm-dd
  time: text('time').notNull(),      // HH:MM
  notes: text('notes'),
  createdAt: integer('created_at').notNull(), // unix seconds
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  notes: text('notes'),
  totalCents: integer('total_cents').notNull(),
  etaMinutes: integer('eta_minutes').notNull().default(20),
  createdAt: integer('created_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  itemId: text('item_id').notNull(),
  name: text('name').notNull(),
  qty: integer('qty').notNull(),
  unitCents: integer('unit_cents').notNull(),
});
