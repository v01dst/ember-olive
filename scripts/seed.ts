import { createDb } from '../src/lib/db';
import { migrateDb } from '../src/lib/migrate';
import { reservations, orders, orderItems } from '../src/lib/schema';
import { todayStr } from '../src/lib/availability';

const db = createDb();
await migrateDb(db);
const d = todayStr();
const created = Math.floor(Date.now() / 1000);
await db.insert(reservations).values([
  { name: 'Dana R.', phone: '+1 555 010 4432', partySize: 4, date: d, time: '19:00', notes: 'Anniversary', createdAt: created },
  { name: 'Omar K.', phone: '+1 555 010 1188', partySize: 2, date: d, time: '19:00', notes: null, createdAt: created },
  { name: 'Priya S.', phone: '+1 555 010 7701', partySize: 6, date: d, time: '20:30', notes: 'One high chair', createdAt: created },
]);
const [order] = await db.insert(orders).values({ orderNumber: 'EO-DEMO01', name: 'Walk-in demo', phone: '+1 555 010 0000', notes: null, totalCents: 2400, createdAt: created }).returning();
await db.insert(orderItems).values([
  { orderId: order.id, itemId: 'chicken-shawarma', name: 'Chicken Shawarma Plate', qty: 1, unitCents: 1550 },
  { orderId: order.id, itemId: 'mint-lemonade', name: 'Fresh Mint Lemonade', qty: 1, unitCents: 450 },
  { orderId: order.id, itemId: 'saffron-rice', name: 'Saffron Rice', qty: 1, unitCents: 400 },
]);
console.log('seeded', d);
