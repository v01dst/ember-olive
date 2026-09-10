import { useCallback, useEffect, useState } from 'react';

type Reservation = { id: number; name: string; phone: string; partySize: number; date: string; time: string; notes: string | null };
type Order = { id: number; orderNumber: string; name: string; phone: string; totalCents: number; etaMinutes: number; items: { name: string; qty: number }[] };
type Data = { date: string; reservations: Reservation[]; orders: Order[] };

export default function AdminOrders() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/today');
      if (!res.ok) throw new Error('bad status');
      setData(await res.json());
    } catch {
      setError('Could not load today. Refresh to retry.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="text-sm text-charcoal-800">Loading…</p>;

  const covers = data.reservations.reduce((sum, r) => sum + r.partySize, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-charcoal-800">
          {data.date} · {data.reservations.length} reservations ({covers} covers) · {data.orders.length} pickup orders
        </p>
        <button type="button" onClick={load} className="rounded-full border border-cream-200 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-cream-100">Refresh</button>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Reservations</h2>
        <table className="w-full border-collapse rounded-xl bg-white text-sm shadow-sm">
          <thead><tr className="border-b border-cream-200 text-left">
            <th className="p-3">Time</th><th className="p-3">Party</th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Notes</th>
          </tr></thead>
          <tbody>
            {data.reservations.map((r) => (
              <tr key={r.id} className="border-b border-cream-100">
                <td className="p-3 font-semibold">{r.time}</td>
                <td className="p-3">{r.partySize}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.phone}</td>
                <td className="p-3 text-charcoal-800">{r.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.reservations.length === 0 && <p className="mt-2 text-sm text-charcoal-800">None yet today.</p>}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Pickup orders</h2>
        <table className="w-full border-collapse rounded-xl bg-white text-sm shadow-sm">
          <thead><tr className="border-b border-cream-200 text-left">
            <th className="p-3">Order</th><th className="p-3">Items</th><th className="p-3">Name</th><th className="p-3">Total</th><th className="p-3">ETA</th>
          </tr></thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id} className="border-b border-cream-100">
                <td className="p-3 font-mono font-semibold">{o.orderNumber}</td>
                <td className="p-3">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
                <td className="p-3">{o.name}</td>
                <td className="p-3">${(o.totalCents / 100).toFixed(2)}</td>
                <td className="p-3">{o.etaMinutes} min</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.orders.length === 0 && <p className="mt-2 text-sm text-charcoal-800">None yet today.</p>}
      </section>
    </div>
  );
}
