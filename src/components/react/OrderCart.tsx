import { useEffect, useMemo, useState } from 'react';
import type { MenuItem } from '../../lib/menu';

const CART_KEY = 'eo-cart';
type Cart = Record<string, number>;

function loadCart(): Cart {
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? '{}'); } catch { return {}; }
}

const inputCls =
  'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-olive-500';

export default function OrderCart({ items }: { items: MenuItem[] }) {
  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [receipt, setReceipt] = useState<{ orderNumber: string; totalCents: number; etaMinutes: number } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { setCart(loadCart()); setReady(true); }, []);
  useEffect(() => { if (ready) localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, ready]);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const lines = Object.entries(cart)
    .filter(([id, qty]) => byId.has(id) && qty > 0)
    .map(([id, qty]) => ({ item: byId.get(id)!, qty }));
  const subtotalCents = lines.reduce((sum, l) => sum + Math.round(l.item.price * 100) * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  function add(id: string, delta: number) {
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, Math.min(10, (c[id] ?? 0) + delta)) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setServerError(''); setFieldErrors({});
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, notes, items: lines.map((l) => ({ id: l.item.id, qty: l.qty })) }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setReceipt(data);
        setCart({});
      } else if (res.status === 400 && data.fields) {
        setFieldErrors(data.fields);
        setServerError(data.error ?? '');
      } else {
        setServerError(data.error ?? 'Something went wrong. Try again.');
      }
    } catch {
      setServerError('Network hiccup — check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-olive-500/30 bg-white p-8 text-center">
        <p className="font-display text-2xl font-semibold text-olive-700">Order in.</p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-wider">{receipt.orderNumber}</p>
        <p className="mt-3 text-sm text-charcoal-800">
          ${(receipt.totalCents / 100).toFixed(2)} on pickup — pay at the counter. Ready in about {receipt.etaMinutes} minutes.
        </p>
        <button onClick={() => setReceipt(null)}
          className="mt-6 rounded-full bg-olive-600 px-5 py-2 text-sm font-semibold text-cream-50 hover:bg-olive-700">
          Start another order
        </button>
      </div>
    );
  }

  const err = (k: string) => fieldErrors[k]?.[0]
    ? <p className="mt-1 text-xs text-red-700">{fieldErrors[k][0]}</p>
    : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        {(['mezze', 'mains', 'sides', 'desserts', 'drinks'] as const).map((cat) => (
          <section key={cat} className="mb-10">
            <h3 className="mb-4 font-display text-xl font-semibold capitalize">{cat === 'mains' ? 'From the coals' : cat === 'mezze' ? 'Mezze' : cat === 'drinks' ? 'Drinks' : cat}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-cream-200 bg-white p-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-charcoal-800">${item.price.toFixed(2)}</p>
                  </div>
                  {cart[item.id] ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => add(item.id, -1)} aria-label="Remove one" className="h-8 w-8 rounded-full border border-cream-200 hover:bg-cream-100">−</button>
                      <span className="w-6 text-center font-semibold">{cart[item.id]}</span>
                      <button onClick={() => add(item.id, 1)} aria-label="Add one" className="h-8 w-8 rounded-full border border-cream-200 hover:bg-cream-100">+</button>
                    </div>
                  ) : (
                    <button onClick={() => add(item.id, 1)} className="rounded-full bg-cream-100 px-3 py-1.5 text-sm font-semibold text-olive-700 hover:bg-cream-200">Add</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-cream-200 bg-white p-6 lg:sticky lg:top-24">
        <h3 className="font-display text-xl font-semibold">Your order</h3>
        {lines.length === 0 && <p className="mt-2 text-sm text-charcoal-800">Nothing yet — add a few things from the left.</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.item.id} className="flex justify-between gap-2">
              <span>{l.qty} × {l.item.name}</span>
              $<span className="font-medium">{(Math.round(l.item.price * 100) * l.qty / 100).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-cream-200 pt-3 font-semibold">
          <span>Subtotal</span>
          <span>${(subtotalCents / 100).toFixed(2)}</span>
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          {err('name')}
          <input required placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          {err('phone')}
          <input placeholder="Notes (allergies, timing)" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} className={inputCls} />
          {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{serverError}</p>}
          <button disabled={count === 0 || count > 20 || sending}
            className="w-full rounded-full bg-olive-600 py-3 font-semibold text-cream-50 transition hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-40">
            {sending ? 'Sending…' : `Send order (${count})`}
          </button>
          <p className="text-center text-xs text-charcoal-800">Pay at the counter when you collect. Ready in ~20 min.</p>
        </form>
      </aside>
    </div>
  );
}
