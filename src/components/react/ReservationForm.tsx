import { useCallback, useEffect, useState } from 'react';

type Slot = { time: string; remaining: number };

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => iso(new Date());
const maxISO = () => iso(new Date(Date.now() + 60 * 86_400_000));

const inputCls =
  'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-olive-500';

export default function ReservationForm() {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState('');
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);
  const [sending, setSending] = useState(false);

  const loadSlots = useCallback(async (d: string) => {
    setLoadingSlots(true);
    setTime('');
    try {
      const res = await fetch(`/api/availability?date=${d}`);
      const data = await res.json();
      setSlots(res.ok ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => { loadSlots(date); }, [date, loadSlots]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setServerError(''); setFieldErrors({});
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, partySize, date, time, notes }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setConfirmed({ date, time });
      } else if (res.status === 400 && data.fields) {
        setFieldErrors(data.fields);
        setServerError(data.error ?? '');
      } else {
        setServerError(data.error ?? 'Something went wrong. Try again.');
        if (res.status === 409) loadSlots(date);
      }
    } catch {
      setServerError('Network hiccup — check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-olive-500/30 bg-white p-8 text-center">
        <p className="font-display text-2xl font-semibold text-olive-700">See you soon, {name.split(' ')[0]}.</p>
        <p className="mt-3 text-sm text-charcoal-800">
          Table for {partySize} on {confirmed.date} at {confirmed.time}. We hold tables for 15 minutes.
        </p>
        <button onClick={() => { setConfirmed(null); loadSlots(date); }}
          className="mt-6 rounded-full bg-olive-600 px-5 py-2 text-sm font-semibold text-cream-50 hover:bg-olive-700">
          Book another table
        </button>
      </div>
    );
  }

  const err = (k: string) => fieldErrors[k]?.[0]
    ? <p className="mt-1 text-xs text-red-700">{fieldErrors[k][0]}</p>
    : null;

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-cream-200 bg-white p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium">
          Date
          <input type="date" required min={todayISO()} max={maxISO()} value={date}
            onChange={(e) => setDate(e.target.value)} className={`${inputCls} mt-1`} />
        </label>
        <label className="block text-sm font-medium">
          Party size
          <select value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} className={`${inputCls} mt-1`}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-charcoal-800">More than 10? Call (555) 014-2214.</span>
        </label>
        <label className="block text-sm font-medium">
          Phone
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 010-0000" className={`${inputCls} mt-1`} />
          {err('phone')}
        </label>
      </div>

      <fieldset className="rounded-xl border border-cream-200 bg-cream-50 p-4">
        <legend className="px-2 text-sm font-medium">Available seatings{loadingSlots ? ' · checking…' : ''}</legend>
        {slots.length === 0 && !loadingSlots && (
          <p className="text-sm text-charcoal-800">
            No seatings open that day — we are closed Mondays, and other days book out. Try another date.
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {slots.map((s) => (
            <button type="button" key={s.time} onClick={() => setTime(s.time)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${time === s.time ? 'border-olive-600 bg-olive-600 text-cream-50' : 'border-cream-200 bg-white hover:border-olive-500'}`}>
              {s.time} <span className="text-xs opacity-60">({s.remaining} left)</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} mt-1`} />
          {err('name')}
        </label>
        <label className="block text-sm font-medium">
          Anything we should know? <span className="font-normal text-charcoal-800">(allergies, occasion)</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} className={`${inputCls} mt-1`} />
        </label>
      </div>

      {serverError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{serverError}</p>}
      <button disabled={!time || sending}
        className="w-full rounded-full bg-olive-600 py-3 font-semibold text-cream-50 transition hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-40">
        {sending ? 'Booking…' : 'Reserve my table'}
      </button>
    </form>
  );
}
