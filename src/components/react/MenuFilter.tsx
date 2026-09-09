import { useState } from 'react';
import type { MenuItem } from '../../lib/menu';

type Diet = 'all' | 'v' | 'gf';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Everything', mezze: 'Mezze', mains: 'From the coals', sides: 'Sides', desserts: 'Sweets', drinks: 'Drinks',
};
const CATEGORIES = ['all', 'mezze', 'mains', 'sides', 'desserts', 'drinks'] as const;

export default function MenuFilter({ items }: { items: MenuItem[] }) {
  const [cat, setCat] = useState<string>('all');
  const [diet, setDiet] = useState<Diet>('all');
  const filtered = items.filter(
    (i) => (cat === 'all' || i.category === cat) && (diet === 'all' || i.diet.includes(diet)),
  );
  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition border border-cream-200 ${active ? 'bg-olive-600 text-cream-50 border-olive-600' : 'bg-white text-charcoal-800 hover:bg-cream-100'}`;
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c: string) => (
          <button key={c} onClick={() => setCat(c)} className={pill(cat === c)}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {(['all', 'v', 'gf'] as Diet[]).map((d) => (
          <button key={d} onClick={() => setDiet(d)} className={pill(diet === d)}>
            {d === 'all' ? 'All diets' : d === 'v' ? 'Vegetarian' : 'Gluten-free'}
          </button>
        ))}
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="flex flex-col rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-lg font-semibold">{item.name}</h3>
              <span className="font-semibold text-olive-600">${item.price.toFixed(2)}</span>
            </div>
            <p className="mt-2 flex-1 text-sm text-charcoal-800">{item.description}</p>
            <div className="mt-3 flex gap-2">
              {item.diet.includes('v') && <span className="rounded-full bg-olive-500/10 px-2 py-0.5 text-xs font-medium text-olive-700">Vegetarian</span>}
              {item.diet.includes('gf') && <span className="rounded-full bg-saffron-400/15 px-2 py-0.5 text-xs font-medium text-saffron-500">Gluten-free</span>}
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-10 text-center text-charcoal-800">Nothing matches that combination — but ask us, we adapt most dishes.</p>
      )}
    </div>
  );
}
