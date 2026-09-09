# Ember & Olive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship "Ember & Olive", a fictional Mediterranean grill restaurant website (Astro 5 + React islands + Tailwind 4 + libsql/Drizzle), deployed live, pushed to GitHub with a portfolio-grade README, followed by 3 real open-source issue fixes.

**Architecture:** Prerendered static Astro pages (~0 JS) with React islands (menu filter, reservation form, pickup-order cart, admin view). Four on-demand API routes (Netlify functions) talk to a libsql database through service modules. All pricing/availability logic lives server-side.

**Tech Stack:** Astro 5, React 19, Tailwind CSS 4 (`@tailwindcss/vite`), TypeScript strict, Zod, Drizzle ORM + @libsql/client (local `file:` DB in dev, Turso in prod), Vitest, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-09-ember-olive-design.md` — read it before starting; this plan implements it section by section.

## Global Constraints

- TypeScript strict everywhere; no `any`, no `@ts-ignore`.
- Money: dollars (number) in `menu.json`; integer **cents** in DB, services, and API responses.
- Never trust client prices/quantities — server recomputes from `menu.json`.
- Astro config: `output: 'static'` + Netlify adapter; every file under `src/pages/api/` starts with `export const prerender = false;`.
- DB access only inside `src/lib/services/*` — pages and API routes never import Drizzle tables directly (exception: the admin read-only route uses tables directly).
- Brand tokens exactly: charcoal `#2b2b26`/`#1c1c18`, olive `#6b7a4f`/`#55633c`, saffron `#e8a33d`/`#c9882a`, cream `#faf6ee`; fonts Fraunces (display) + Inter (body).
- Copy is written like a real owner/marketer wrote it. No lorem ipsum, no "AI voice" (no "seamless", "elevate", "delve", "unleash"). The developer's own contacts (Discord `9p.1`, LinkedIn) appear **only in README.md**, never on the restaurant site itself.
- Every Unsplash image URL is verified with `curl -sI` (expect `HTTP/2 200`) before commit; swap broken ones.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`), small and frequent.
- Tests: Vitest. Pure-logic modules and services ship with tests; services run against libsql `:memory:`.
- Intentional deviation from spec §5: menu data is a single Zod-validated `src/data/menu.json` + `src/lib/menu.ts` loader instead of a content collection — one source of truth shared by prerendered pages and serverless API bundles.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `astro.config.mjs`, `.gitignore`, `src/env.d.ts`, minimal `src/pages/index.astro`

**Interfaces:**
- Produces: runnable Astro app (`npm run dev` / `npm run build`), strict TS config, all dependencies installed.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "ember-olive",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm i astro @astrojs/react @astrojs/netlify react react-dom tailwindcss @tailwindcss/vite @libsql/client drizzle-orm zod
npm i -D @astrojs/check typescript @types/react @types/react-dom vitest tsx drizzle-kit
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  adapter: netlify(),
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "scripts/**/*"],
  "exclude": ["dist", "node_modules"],
  "compilerOptions": {
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

- [ ] **Step 5: Write `.gitignore` and `src/env.d.ts`**

```
node_modules/
dist/
.astro/
data/
.env
.netlify/
```

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 6: Write a minimal `src/pages/index.astro`**

```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>Ember &amp; Olive</title></head>
<body><h1>Ember &amp; Olive</h1></body></html>
```

- [ ] **Step 7: Verify**

Run: `npm run build`
Expected: build succeeds into `dist/`. (`npm test` will report "no test files found" yet — tolerated.)

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro 5 project with Tailwind, React, Netlify adapter"
```

---

### Task 2: Design tokens, global styles, base layout

**Files:**
- Create: `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `BaseLayout` with props `{ title: string; description?: string }`; Tailwind theme colors `olive-*`, `charcoal-*`, `saffron-*`, `cream-*`; fonts `font-display` (Fraunces) / `font-sans` (Inter).

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import "tailwindcss";

@theme {
  --font-display: "Fraunces", ui-serif, Georgia, serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --color-cream-50: #faf6ee;
  --color-cream-100: #f3ecdd;
  --color-cream-200: #e8dfc9;
  --color-olive-300: #a3b183;
  --color-olive-400: #8a9a6b;
  --color-olive-500: #6b7a4f;
  --color-olive-600: #55633c;
  --color-olive-700: #43502f;
  --color-charcoal-800: #3a3a33;
  --color-charcoal-900: #2b2b26;
  --color-charcoal-950: #1c1c18;
  --color-saffron-300: #f2c179;
  --color-saffron-400: #e8a33d;
  --color-saffron-500: #c9882a;
}

body {
  background: var(--color-cream-50);
  color: var(--color-charcoal-900);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Write `src/components/Header.astro`**

```astro
---
const links = [
  ['Menu', '/menu'], ['Reserve', '/reserve'], ['Order pickup', '/order'],
  ['About', '/about'], ['Contact', '/contact'],
];
---
<header class="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
    <a href="/" class="font-display text-xl font-semibold tracking-tight text-charcoal-950">
      Ember <span class="text-saffron-500">&amp;</span> Olive
    </a>
    <nav class="hidden gap-6 text-sm font-medium md:flex">
      {links.map(([label, href]) => (
        <a href={href} class="text-charcoal-800 hover:text-olive-600">{label}</a>
      ))}
    </nav>
    <a href="/reserve" class="hidden rounded-full bg-olive-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-olive-700 md:inline-block">
      Book a table
    </a>
    <details class="relative md:hidden">
      <summary class="cursor-pointer list-none rounded p-2 text-lg text-charcoal-900" aria-label="Open menu">☰</summary>
      <nav class="absolute left-0 right-0 top-full border-b border-cream-200 bg-cream-50 p-4">
        {links.map(([label, href]) => (
          <a href={href} class="block py-2 text-charcoal-800">{label}</a>
        ))}
      </nav>
    </details>
  </div>
</header>
```

- [ ] **Step 3: Write `src/components/Footer.astro`**

```astro
---
const days = [
  ['Tue – Thu', '12:00 – 22:00'], ['Fri – Sat', '12:00 – 23:00'], ['Sun', '12:00 – 21:00'], ['Mon', 'Closed'],
];
---
<footer class="mt-20 bg-charcoal-950 text-cream-100">
  <div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
    <div>
      <p class="font-display text-lg">Ember <span class="text-saffron-400">&amp;</span> Olive</p>
      <p class="mt-2 text-sm text-cream-200/80">Family-run Mediterranean grill. Charcoal, olive oil, and recipes from three generations.</p>
    </div>
    <div class="text-sm">
      <p class="font-semibold text-saffron-300">Find us</p>
      <p class="mt-2">14 Cardamom Lane, Riverside District</p>
      <p>(555) 014-2214 · hello@emberandolive.example</p>
    </div>
    <div class="text-sm">
      <p class="font-semibold text-saffron-300">Hours</p>
      <ul class="mt-2 space-y-1">
        {days.map(([d, h]) => <li class="flex justify-between gap-6"><span>{d}</span><span>{h}</span></li>)}
      </ul>
    </div>
  </div>
  <p class="border-t border-charcoal-800 py-4 text-center text-xs text-cream-200/60">© {new Date().getFullYear()} Ember &amp; Olive</p>
</footer>
```

- [ ] **Step 4: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props { title: string; description?: string }
const { title, description = 'Ember & Olive — family-run Mediterranean grill. Charcoal-fired shawarma, mezze, and wood-fire mains.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title} · Ember &amp; Olive</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body class="min-h-screen">
    <Header />
    <main><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5: Use it in `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Home">
  <section class="mx-auto max-w-6xl px-4 py-24"><h1 class="font-display text-5xl">Ember &amp; Olive</h1></section>
</BaseLayout>
```

- [ ] **Step 6: Verify**

Run: `npm run build`
Expected: success. Then `npm run dev`, open `http://localhost:4321` — header/footer render, fonts load, cream/olive palette visible. Kill the dev server after.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: design tokens and base layout with header/footer"
```

---

### Task 3: Menu data + loader

**Files:**
- Create: `src/data/menu.json`, `src/lib/menu.ts`
- Test: `src/lib/menu.test.ts`

**Interfaces:**
- Produces: `MenuItem` type `{ id, name, description, price, category, diet, featured }`; `MENU: MenuItem[]`; `CATEGORIES` const; `getItemById(id: string): MenuItem | undefined`; `getByCategory(c: Category): MenuItem[]`; `getFeatured(): MenuItem[]`. Consumed by Tasks 5, 8, 11, 13.

- [ ] **Step 1: Write the failing test `src/lib/menu.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { MENU, getItemById, getByCategory, getFeatured, CATEGORIES } from './menu';

describe('menu data', () => {
  it('has unique kebab-case ids', () => {
    const ids = MENU.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });
  it('has positive prices and substantive copy', () => {
    MENU.forEach((i) => {
      expect(i.price).toBeGreaterThan(0);
      expect(i.name.length).toBeGreaterThan(2);
      expect(i.description.length).toBeGreaterThan(10);
    });
  });
  it('only uses known categories', () => {
    MENU.forEach((i) => expect(CATEGORIES).toContain(i.category));
  });
  it('has exactly 3 featured items', () => {
    expect(getFeatured()).toHaveLength(3);
  });
  it('looks items up by id', () => {
    expect(getItemById('hummus')?.name).toContain('Hummus');
    expect(getItemById('nope')).toBeUndefined();
  });
  it('filters by category', () => {
    getByCategory('mains').forEach((i) => expect(i.category).toBe('mains'));
    expect(getByCategory('mains').length).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./menu`.

- [ ] **Step 3: Write `src/data/menu.json`**

```json
[
  { "id": "hummus", "name": "Classic Hummus", "description": "Chickpeas whipped with tahini, lemon, and our own olive oil. Warm pita alongside.", "price": 8.5, "category": "mezze", "diet": ["v", "gf"], "featured": false },
  { "id": "baba-ganoush", "name": "Baba Ganoush", "description": "Eggplant charred on the coals, folded with tahini and topped with pomegranate.", "price": 9, "category": "mezze", "diet": ["v", "gf"], "featured": false },
  { "id": "falafel-plate", "name": "Falafel Plate", "description": "Six herbed falafel, crisp outside and green within. Tahini, pickles, warm pita.", "price": 10.5, "category": "mezze", "diet": ["v"], "featured": false },
  { "id": "spanakopita", "name": "Spanakopita", "description": "Spinach and feta in phyllo we brush with butter by hand. Four pieces.", "price": 9.5, "category": "mezze", "diet": ["v"], "featured": false },
  { "id": "chicken-shawarma", "name": "Chicken Shawarma Plate", "description": "Marinated 24 hours, carved off the spit. Garlic toum, fries, salad, pita.", "price": 15.5, "category": "mains", "diet": [], "featured": true },
  { "id": "beef-shawarma", "name": "Beef Shawarma Plate", "description": "Spiced beef off the vertical spit with tahini, sumac onions, and fries.", "price": 16.5, "category": "mains", "diet": [], "featured": false },
  { "id": "lamb-kofta", "name": "Lamb Kofta Skewers", "description": "Hand-chopped lamb with parsley and onion, grilled over charcoal. Saffron rice and grilled tomato.", "price": 18.5, "category": "mains", "diet": ["gf"], "featured": false },
  { "id": "mixed-grill", "name": "Ember Mixed Grill", "description": "Kofta, chicken shish, and a lamb chop — the order for two that ends every argument.", "price": 34, "category": "mains", "diet": ["gf"], "featured": false },
  { "id": "zaatar-chicken", "name": "Za'atar Roast Chicken", "description": "Half bird under a za'atar and lemon crust, garlic jus on the side.", "price": 17, "category": "mains", "diet": [], "featured": true },
  { "id": "halloumi-bowl", "name": "Charred Halloumi Bowl", "description": "Freekeh, roasted seasonal vegetables, mint yogurt, honey-drizzled halloumi.", "price": 14.5, "category": "mains", "diet": ["v"], "featured": false },
  { "id": "saffron-rice", "name": "Saffron Rice", "description": "Long-grain rice steeped with saffron and toasted orzo.", "price": 4.5, "category": "sides", "diet": ["v", "gf"], "featured": false },
  { "id": "fattoush", "name": "Fattoush", "description": "Romaine, radish, tomato, and crispy pita in a sumac-lemon dressing.", "price": 7.5, "category": "sides", "diet": ["v"], "featured": false },
  { "id": "rosemary-fries", "name": "Rosemary Fries", "description": "Twice-fried, tossed with rosemary and flaky salt.", "price": 4.5, "category": "sides", "diet": ["v", "gf"], "featured": false },
  { "id": "baklava", "name": "Pistachio Baklava", "description": "Forty layers, made Tuesday mornings. Orange blossom syrup, Antep pistachios.", "price": 7, "category": "desserts", "diet": ["v"], "featured": false },
  { "id": "kunafa", "name": "Cheese Kunafa", "description": "Shredded pastry around stretchy sweet cheese, hit with orange blossom syrup.", "price": 8.5, "category": "desserts", "diet": ["v"], "featured": true },
  { "id": "mint-lemonade", "name": "Fresh Mint Lemonade", "description": "Pressed to order, heavy on the mint.", "price": 4.5, "category": "drinks", "diet": ["v", "gf"], "featured": false },
  { "id": "turkish-coffee", "name": "Turkish Coffee", "description": "Slow-brewed in copper, served with a piece of loukoumi.", "price": 3.5, "category": "drinks", "diet": ["v", "gf"], "featured": false }
]
```

- [ ] **Step 4: Write `src/lib/menu.ts`**

```ts
import { z } from 'zod';
import rawMenu from '../data/menu.json';

export const CATEGORIES = ['mezze', 'mains', 'sides', 'desserts', 'drinks'] as const;
export type Category = (typeof CATEGORIES)[number];

export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  category: z.enum(CATEGORIES),
  diet: z.array(z.enum(['v', 'gf'])).default([]),
  featured: z.boolean().default(false),
});
export type MenuItem = z.infer<typeof menuItemSchema>;

export const MENU: MenuItem[] = z.array(menuItemSchema).parse(rawMenu);

export function getItemById(id: string): MenuItem | undefined {
  return MENU.find((i) => i.id === id);
}
export function getByCategory(category: Category): MenuItem[] {
  return MENU.filter((i) => i.category === category);
}
export function getFeatured(): MenuItem[] {
  return MENU.filter((i) => i.featured);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (menu suite green).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: menu data and validated loader"
```

---

### Task 4: Availability pure logic

**Files:**
- Create: `src/lib/availability.ts`
- Test: `src/lib/availability.test.ts`

**Interfaces:**
- Produces: `RESTAURANT` const (`seats: 42, maxParty: 10, firstSlot: '12:00', lastSlot: '21:00', slotMinutes: 30, maxAdvanceDays: 60`); `slotsForDay(): string[]`; `isOpenDay(day: number): boolean` (closed Monday = day 1); `isValidDate(date: string): boolean` (today..+60d); `timeToMinutes(t: string): number`; `minutesToTime(m: number): string`; `todayStr(now?: Date): string`. Consumed by Tasks 5, 6, 7, 9, 12.

- [ ] **Step 1: Write the failing test `src/lib/availability.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { slotsForDay, isOpenDay, isValidDate, timeToMinutes, minutesToTime, todayStr, RESTAURANT } from './availability';

describe('availability logic', () => {
  it('generates 30-minute slots from first to last', () => {
    const slots = slotsForDay();
    expect(slots[0]).toBe(RESTAURANT.firstSlot);
    expect(slots.at(-1)).toBe(RESTAURANT.lastSlot);
    expect(slots).toContain('18:30');
    expect(new Set(slots).size).toBe(slots.length);
  });
  it('is open Tue–Sun and closed Monday', () => {
    expect(isOpenDay(0)).toBe(true);   // Sun
    expect(isOpenDay(1)).toBe(false);  // Mon
    expect(isOpenDay(2)).toBe(true);   // Tue
  });
  it('round-trips time <-> minutes', () => {
    expect(timeToMinutes('18:30')).toBe(1110);
    expect(minutesToTime(1110)).toBe('18:30');
    expect(minutesToTime(timeToMinutes('12:00'))).toBe('12:00');
  });
  it('rejects malformed, past, and too-far dates', () => {
    expect(isValidDate('2026-13-40')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('1999-01-01')).toBe(false);
    expect(isValidDate(todayStr())).toBe(true);
    const far = new Date(Date.now() + (RESTAURANT.maxAdvanceDays + 2) * 86_400_000);
    expect(isValidDate(far.toISOString().slice(0, 10))).toBe(false);
  });
  it('todayStr is yyyy-mm-dd', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./availability`.

- [ ] **Step 3: Write `src/lib/availability.ts`**

```ts
export const RESTAURANT = {
  seats: 42,
  maxParty: 10,
  firstSlot: '12:00',
  lastSlot: '21:00',
  slotMinutes: 30,
  maxAdvanceDays: 60,
} as const;

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
export function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
export function slotsForDay(): string[] {
  const slots: string[] = [];
  for (let m = timeToMinutes(RESTAURANT.firstSlot); m <= timeToMinutes(RESTAURANT.lastSlot); m += RESTAURANT.slotMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}
/** Open Tuesday (2) through Sunday (0); closed Monday (1). */
export function isOpenDay(day: number): boolean {
  return day !== 1;
}
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const end = start + (RESTAURANT.maxAdvanceDays + 1) * 86_400_000;
  return d.getTime() >= start && d.getTime() <= end;
}
export function todayStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: seating availability logic"
```

---
### Task 5: Database schema, client, migrations, seed

**Files:**
- Create: `src/lib/schema.ts`, `src/lib/db.ts`, `src/lib/migrate.ts`, `drizzle.config.ts`, `scripts/migrate.ts`, `scripts/seed.ts`

**Interfaces:**
- Consumes: `todayStr` (Task 4).
- Produces: Drizzle tables `reservations`, `orders`, `orderItems`; `createDb(url?, authToken?): Db`; `type Db`; singleton `db`; `migrateDb(db: Db): Promise<void>`; generated `drizzle/` migrations folder. Consumed by Tasks 7–10 and 15.

- [ ] **Step 1: Write `src/lib/schema.ts`**

```ts
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
```

- [ ] **Step 2: Write `src/lib/db.ts` and `src/lib/migrate.ts`**

```ts
// src/lib/db.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export function createDb(url = process.env.TURSO_DATABASE_URL ?? 'file:./data/ember.db', authToken = process.env.TURSO_AUTH_TOKEN) {
  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}
export type Db = ReturnType<typeof createDb>;
export const db = createDb();
```

```ts
// src/lib/migrate.ts
import { migrate } from 'drizzle-orm/libsql/migrator';
import type { Db } from './db';

export async function migrateDb(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder: './drizzle' });
}
```

- [ ] **Step 3: Write `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DB_PATH ?? 'file:./data/ember.db' },
});
```

- [ ] **Step 4: Generate migrations**

```bash
mkdir -p data && npm run db:generate
```
Expected: `drizzle/0000_*.sql` + `drizzle/meta/` created. Commit the `drizzle/` folder.

- [ ] **Step 5: Write `scripts/migrate.ts`**

```ts
import { mkdirSync } from 'node:fs';
import { createDb } from '../src/lib/db';
import { migrateDb } from '../src/lib/migrate';

const url = process.env.TURSO_DATABASE_URL ?? 'file:./data/ember.db';
if (url.startsWith('file:')) mkdirSync('data', { recursive: true });
await migrateDb(createDb(url, process.env.TURSO_AUTH_TOKEN));
console.log('migrations applied to', url);
```

- [ ] **Step 6: Write `scripts/seed.ts`**

```ts
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
```

- [ ] **Step 7: Verify**

```bash
npm run db:migrate && npm run db:seed
node -e "import('@libsql/client').then(async m => { const c = m.createClient({ url: 'file:./data/ember.db' }); console.log(await c.execute('SELECT COUNT(*) AS n FROM reservations')); })"
```
Expected: seed prints "seeded <date>"; count shows `n: 3`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: drizzle schema, libsql client, migrations and seed"
```

---

### Task 6: Shared Zod validation schemas

**Files:**
- Create: `src/lib/validation.ts`
- Test: `src/lib/validation.test.ts`

**Interfaces:**
- Consumes: `RESTAURANT` (Task 4).
- Produces: `reservationSchema`, `orderSchema`, `orderItemSchema` (Zod objects); types `ReservationInput`, `OrderInput`. Consumed by Tasks 7, 8, 9 and islands 12, 13.

- [ ] **Step 1: Write the failing test `src/lib/validation.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { reservationSchema, orderSchema } from './validation';

describe('reservationSchema', () => {
  const valid = { name: 'Sara H.', phone: '+1 555 010 9987', partySize: 4, date: '2026-09-12', time: '19:00', notes: '' };
  it('accepts a valid reservation', () => {
    expect(reservationSchema.safeParse(valid).success).toBe(true);
  });
  it('coerces partySize from string and bounds it', () => {
    expect(reservationSchema.safeParse({ ...valid, partySize: '4' }).success).toBe(true);
    expect(reservationSchema.safeParse({ ...valid, partySize: 11 }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...valid, partySize: 0 }).success).toBe(false);
  });
  it('rejects bad phone, date, and time formats', () => {
    expect(reservationSchema.safeParse({ ...valid, phone: 'hello' }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...valid, date: '12-09-2026' }).success).toBe(false);
    expect(reservationSchema.safeParse({ ...valid, time: '25:00' }).success).toBe(false);
  });
  it('requires a name of at least 2 chars', () => {
    expect(reservationSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });
});

describe('orderSchema', () => {
  const valid = { name: 'Tom W.', phone: '555-0101', items: [{ id: 'hummus', qty: 2 }], notes: '' };
  it('accepts a valid order', () => {
    expect(orderSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects empty carts and silly quantities', () => {
    expect(orderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(orderSchema.safeParse({ ...valid, items: [{ id: 'hummus', qty: 99 }] }).success).toBe(false);
  });
  it('rejects oversized carts', () => {
    const items = Array.from({ length: 21 }, () => ({ id: 'hummus', qty: 1 }));
    expect(orderSchema.safeParse({ ...valid, items }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./validation`.

- [ ] **Step 3: Write `src/lib/validation.ts`**

```ts
import { z } from 'zod';
import { RESTAURANT } from './availability';

export const reservationSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^[+\d][\d\s().-]{6,19}$/, 'Enter a real phone number'),
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
  phone: z.string().trim().regex(/^[+\d][\d\s().-]{6,19}$/, 'Enter a real phone number'),
  notes: z.string().trim().max(300).optional().default(''),
  items: z.array(orderItemSchema).min(1).max(20),
});
export type OrderInput = z.infer<typeof orderSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: shared zod schemas for reservations and orders"
```

---

### Task 7: Reservation service

**Files:**
- Create: `src/lib/services/reservations.ts`
- Test: `src/lib/services/reservations.test.ts`

**Interfaces:**
- Consumes: `createDb`/`Db`/`migrateDb` (Task 5), availability logic (Task 4), `ReservationInput` (Task 6).
- Produces: `getAvailability(db: Db, date: string): Promise<SlotAvailability[]>` where `SlotAvailability = { time: string; remaining: number }`; `createReservation(db: Db, input: ReservationInput): Promise<ReservationResult>` where `ReservationResult = { ok: true; reservation: ReservationRow } | { ok: false; code: 'INVALID' | 'SLOT_FULL'; message: string }`. Consumed by Task 9.

- [ ] **Step 1: Write the failing test `src/lib/services/reservations.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, type Db } from '../db';
import { migrateDb } from '../migrate';
import { getAvailability, createReservation } from './reservations';

let db: Db;
beforeEach(async () => {
  db = createDb(':memory:');
  await migrateDb(db);
});

describe('getAvailability', () => {
  it('returns all slots fully open on an empty open day', async () => {
    const slots = await getAvailability(db, '2026-10-06'); // a Tuesday
    expect(slots[0]).toEqual({ time: '12:00', remaining: 42 });
    expect(slots.length).toBeGreaterThanOrEqual(19);
  });
  it('returns nothing on Mondays or bad dates', async () => {
    expect(await getAvailability(db, '2026-10-05')).toEqual([]); // Monday
    expect(await getAvailability(db, 'garbage')).toEqual([]);
    expect(await getAvailability(db, '1999-01-01')).toEqual([]);
  });
  it('reduces remaining as party sizes book in', async () => {
    await createReservation(db, { name: 'Group A', phone: '555-0102', partySize: 10, date: '2026-10-06', time: '19:00', notes: '' });
    const slot = (await getAvailability(db, '2026-10-06')).find((s) => s.time === '19:00');
    expect(slot?.remaining).toBe(32);
  });
});

describe('createReservation', () => {
  const base = { name: 'Lina M.', phone: '+1 555 010 3321', partySize: 4, date: '2026-10-06', time: '19:00', notes: '' };
  it('books a valid reservation and returns the row', async () => {
    const res = await createReservation(db, base);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.reservation.partySize).toBe(4);
  });
  it('rejects Mondays and unknown slots as INVALID', async () => {
    expect((await createReservation(db, { ...base, date: '2026-10-05' })).code).toBe('INVALID');
    expect((await createReservation(db, { ...base, time: '11:45' })).code).toBe('INVALID');
  });
  it('rejects a booking that would exceed 42 seats with SLOT_FULL', async () => {
    await createReservation(db, { ...base, name: 'Big group', partySize: 40 });
    const res = await createReservation(db, base);
    expect(res).toMatchObject({ ok: false, code: 'SLOT_FULL' });
  });
  it('allows adjacent slots independently', async () => {
    await createReservation(db, { ...base, partySize: 40 });
    const res = await createReservation(db, { ...base, time: '19:30' });
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./reservations`.

- [ ] **Step 3: Write `src/lib/services/reservations.ts`**

```ts
import { eq } from 'drizzle-orm';
import type { Db } from '../db';
import { RESTAURANT, isOpenDay, isValidDate, slotsForDay } from '../availability';
import { reservations } from '../schema';
import type { ReservationInput } from '../validation';

export type SlotAvailability = { time: string; remaining: number };
export type ReservationRow = typeof reservations.$inferSelect;
export type ReservationResult =
  | { ok: true; reservation: ReservationRow }
  | { ok: false; code: 'INVALID' | 'SLOT_FULL'; message: string };

export async function getAvailability(db: Db, date: string): Promise<SlotAvailability[]> {
  if (!isValidDate(date)) return [];
  if (!isOpenDay(new Date(`${date}T12:00:00`).getDay())) return [];
  const rows = await db.select().from(reservations).where(eq(reservations.date, date));
  const booked = new Map<string, number>();
  for (const r of rows) booked.set(r.time, (booked.get(r.time) ?? 0) + r.partySize);
  return slotsForDay()
    .map((time) => ({ time, remaining: RESTAURANT.seats - (booked.get(time) ?? 0) }))
    .filter((s) => s.remaining > 0);
}

export async function createReservation(db: Db, input: ReservationInput): Promise<ReservationResult> {
  const invalid = (message: string) => ({ ok: false as const, code: 'INVALID' as const, message });
  if (!isValidDate(input.date)) return invalid('That date is outside our 60-day booking window.');
  if (!isOpenDay(new Date(`${input.date}T12:00:00`).getDay())) return invalid('We close on Mondays. Pick any other day.');
  if (!slotsForDay().includes(input.time)) return invalid('We do not seat at that time. Seatings run 12:00–21:00.');
  const dayRows = await db.select().from(reservations).where(eq(reservations.date, input.date));
  const booked = dayRows.filter((r) => r.time === input.time).reduce((sum, r) => sum + r.partySize, 0);
  if (booked + input.partySize > RESTAURANT.seats) {
    return { ok: false, code: 'SLOT_FULL', message: 'That seating just filled up. Choose another time and we will find you a table.' };
  }
  const [row] = await db
    .insert(reservations)
    .values({ ...input, notes: input.notes || null, createdAt: Math.floor(Date.now() / 1000) })
    .returning();
  return { ok: true, reservation: row };
}
```

(Known demo limitation: no transaction around the capacity check + insert; concurrent requests could theoretically overbook. Acceptable per spec scope.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: reservation service with per-slot capacity"
```

---

### Task 8: Order service

**Files:**
- Create: `src/lib/services/orders.ts`
- Test: `src/lib/services/orders.test.ts`

**Interfaces:**
- Consumes: `Db` (Task 5), `getItemById`/`MenuItem` (Task 3), `OrderInput` (Task 6).
- Produces: `generateOrderNumber(rand?: () => number): string` (format `EO-XXXXXX`, unambiguous alphabet); `priceOrder(items: { id: string; qty: number }[]): { totalCents: number; lines: OrderLine[] } | null` where `OrderLine = { itemId: string; name: string; qty: number; unitCents: number }`; `createOrder(db: Db, input: OrderInput): Promise<OrderResult>` where `OrderResult = { ok: true; order: { orderNumber: string; totalCents: number; etaMinutes: number } } | { ok: false; code: 'UNKNOWN_ITEM'; message: string }`. Consumed by Task 9.

- [ ] **Step 1: Write the failing test `src/lib/services/orders.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, type Db } from '../db';
import { migrateDb } from '../migrate';
import { generateOrderNumber, priceOrder, createOrder } from './orders';

let db: Db;
beforeEach(async () => {
  db = createDb(':memory:');
  await migrateDb(db);
});

describe('generateOrderNumber', () => {
  it('matches EO-XXXXXX with an unambiguous alphabet', () => {
    expect(generateOrderNumber()).toMatch(/^EO-[A-HJ-NP-Z2-9]{6}$/);
  });
  it('is deterministic from an injected rand', () => {
    let calls = 0;
    const rand = () => [0, 0.5, 0.999, 0.25, 0.75, 0.1][calls++ % 6];
    expect(generateOrderNumber(rand)).toBe(generateOrderNumber(rand));
  });
});

describe('priceOrder', () => {
  it('prices from menu data in cents', () => {
    const p = priceOrder([{ id: 'hummus', qty: 2 }, { id: 'turkish-coffee', qty: 1 }]);
    expect(p?.totalCents).toBe(850 * 2 + 350);
    expect(p?.lines).toHaveLength(2);
  });
  it('returns null for unknown items', () => {
    expect(priceOrder([{ id: 'hummus', qty: 1 }, { id: 'pineapple-pizza', qty: 1 }])).toBeNull();
  });
});

describe('createOrder', () => {
  it('stores an order with server-computed total and returns the number', async () => {
    const res = await createOrder(db, {
      name: 'Rita V.', phone: '555-0177', notes: 'Extra napkins',
      items: [{ id: 'lamb-kofta', qty: 2 }, { id: 'mint-lemonade', qty: 2 }],
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.order.totalCents).toBe(1850 * 2 + 450 * 2);
  });
  it('rejects unknown items', async () => {
    const res = await createOrder(db, { name: 'X Y', phone: '555-0199', notes: '', items: [{ id: 'ghost', qty: 1 }] });
    expect(res).toMatchObject({ ok: false, code: 'UNKNOWN_ITEM' });
  });
  it('stores line items joined to the order', async () => {
    const res = await createOrder(db, { name: 'A B', phone: '555-0100', notes: '', items: [{ id: 'hummus', qty: 1 }] });
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./orders`.

- [ ] **Step 3: Write `src/lib/services/orders.ts`**

```ts
import type { Db } from '../db';
import { getItemById } from '../menu';
import { orders, orderItems } from '../schema';
import type { OrderInput } from '../validation';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I, L, O, 0, 1 — nothing ambiguous read aloud

export function generateOrderNumber(rand: () => number = Math.random): string {
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return `EO-${suffix}`;
}

export type OrderLine = { itemId: string; name: string; qty: number; unitCents: number };

export function priceOrder(items: { id: string; qty: number }[]): { totalCents: number; lines: OrderLine[] } | null {
  let totalCents = 0;
  const lines: OrderLine[] = [];
  for (const item of items) {
    const menu = getItemById(item.id);
    if (!menu) return null;
    const unitCents = Math.round(menu.price * 100);
    totalCents += unitCents * item.qty;
    lines.push({ itemId: menu.id, name: menu.name, qty: item.qty, unitCents });
  }
  return { totalCents, lines };
}

export type OrderResult =
  | { ok: true; order: { orderNumber: string; totalCents: number; etaMinutes: number } }
  | { ok: false; code: 'UNKNOWN_ITEM'; message: string };

export async function createOrder(db: Db, input: OrderInput): Promise<OrderResult> {
  const priced = priceOrder(input.items);
  if (!priced) {
    return { ok: false, code: 'UNKNOWN_ITEM', message: 'Something in your cart is no longer on the menu. Refresh and try again.' };
  }
  const etaMinutes = 20;
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      const [order] = await db
        .insert(orders)
        .values({
          orderNumber,
          name: input.name,
          phone: input.phone,
          notes: input.notes || null,
          totalCents: priced.totalCents,
          etaMinutes,
          createdAt: Math.floor(Date.now() / 1000),
        })
        .returning();
      await db.insert(orderItems).values(priced.lines.map((l) => ({ ...l, orderId: order.id })));
      return { ok: true, order: { orderNumber, totalCents: priced.totalCents, etaMinutes } };
    } catch (err) {
      if (attempt === 4) throw err;
      // unique collision on orderNumber — retry with a new number
    }
  }
  throw new Error('unreachable');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: pickup order service with server-side pricing"
```

---

### Task 9: API routes

**Files:**
- Create: `src/pages/api/availability.ts`, `src/pages/api/reserve.ts`, `src/pages/api/order.ts`, `src/pages/api/orders/today.ts`

**Interfaces:**
- Consumes: `db` singleton (Task 5), services (Tasks 7–8), Zod schemas (Task 6), `todayStr` (Task 4).
- Produces (HTTP contract consumed by islands in Tasks 12–13, 15):
  - `GET /api/availability?date=YYYY-MM-DD` → `200 { date, slots: SlotAvailability[] }` | `400 { error }`
  - `POST /api/reserve` body = ReservationInput → `201 { reservation }` | `400 { error, fields? }` | `409 { error }`
  - `POST /api/order` body = OrderInput → `201 { orderNumber, totalCents, etaMinutes }` | `400 { error, fields? }` | `409 { error }`
  - `GET /api/orders/today` → `200 { date, reservations: ReservationRow[], orders: (OrderRow & { items: OrderLine[] })[] }`

- [ ] **Step 1: Write `src/pages/api/availability.ts`**

```ts
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
```

- [ ] **Step 2: Write `src/pages/api/reserve.ts`**

```ts
export const prerender = false;
import type { APIRoute } from 'astro';
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
    return Response.json({ error: 'Check the highlighted fields.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const result = await createReservation(db, parsed.data);
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: result.code === 'SLOT_FULL' ? 409 : 400 });
  }
  return Response.json({ reservation: result.reservation }, { status: 201 });
};
```

- [ ] **Step 3: Write `src/pages/api/order.ts`**

```ts
export const prerender = false;
import type { APIRoute } from 'astro';
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
    return Response.json({ error: 'Check the highlighted fields.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const result = await createOrder(db, parsed.data);
  if (!result.ok) return Response.json({ error: result.message }, { status: 409 });
  return Response.json(result.order, { status: 201 });
};
```

- [ ] **Step 4: Write `src/pages/api/orders/today.ts`**

```ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { todayStr } from '../../../lib/availability';
import { reservations, orders, orderItems } from '../../../lib/schema';

export const GET: APIRoute = async () => {
  const date = todayStr();
  const todaysReservations = await db.select().from(reservations).where(eq(reservations.date, date));
  const todaysOrders = await db.select().from(orders);
  const withItems = await Promise.all(
    todaysOrders.map(async (o) => ({
      ...o,
      items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    })),
  );
  return Response.json({ date, reservations: todaysReservations, orders: withItems });
};
```

- [ ] **Step 5: Verify against a running dev server**

```bash
npm run db:seed
npm run dev & sleep 4
curl -s "http://localhost:4321/api/availability?date=$(date +%F)" | head -c 300
curl -s -X POST http://localhost:4321/api/reserve -H 'content-type: application/json' \
  -d "{\"name\":\"Curl Test\",\"phone\":\"555-0111\",\"partySize\":2,\"date\":\"$(date +%F)\",\"time\":\"18:00\"}"
curl -s -X POST http://localhost:4321/api/reserve -H 'content-type: application/json' \
  -d '{"name":"C","phone":"nope","partySize":99,"date":"bad","time":"x"}'
curl -s -X POST http://localhost:4321/api/order -H 'content-type: application/json' \
  -d '{"name":"Curl Test","phone":"555-0111","items":[{"id":"baklava","qty":3}]}'
curl -s http://localhost:4321/api/orders/today | head -c 300
kill %1
```
Expected: availability returns slot JSON; first reserve → 201 with reservation; second → 400 with `fields`; order → 201 with `orderNumber` and `totalCents: 2100`; today → both arrays non-empty.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: reserve, order, availability and admin API routes"
```

---
### Task 10: Home page

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/components/SectionHeading.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 2), `getFeatured()` (Task 3).
- Produces: `SectionHeading` (props `kicker: string; title: string`) reused by Tasks 11, 14.

- [ ] **Step 1: Verify hero image URLs return 200**

```bash
for u in "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop" "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1600&auto=format&fit=crop" "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop"; do curl -sI "$u" | head -1; done
```
Expected: three `HTTP/2 200` lines. Swap any failure for another Unsplash food/restaurant photo verified the same way.

- [ ] **Step 2: Write `src/components/SectionHeading.astro`**

```astro
---
interface Props { kicker: string; title: string }
const { kicker, title } = Astro.props;
---
<div class="mb-10 text-center">
  <p class="text-xs font-semibold uppercase tracking-[0.25em] text-olive-600">{kicker}</p>
  <h2 class="mt-2 font-display text-3xl font-bold text-charcoal-950 md:text-4xl">{title}</h2>
</div>
```

- [ ] **Step 3: Write the full `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
import { getFeatured } from '../lib/menu';

const specials = getFeatured();
const reviews = [
  { text: "The kofta tastes like my aunt's in Beirut, which is the highest compliment I know.", who: 'Rania M.' },
  { text: 'We came for shawarma and stayed three hours. The mint lemonade is dangerous.', who: 'Josh & Petra' },
  { text: 'Finally a place where the mezze is not an afterthought. That baba ganoush is smoky perfection.', who: 'D. Okafor' },
];
const hours = [
  ['Tuesday – Thursday', '12:00 – 22:00'], ['Friday – Saturday', '12:00 – 23:00'], ['Sunday', '12:00 – 21:00'], ['Monday', 'Closed'],
];
---
<BaseLayout title="Mediterranean grill, done properly">
  <section class="relative isolate">
    <img
      src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop"
      alt="Skewers grilling over charcoal" class="h-[70vh] min-h-96 w-full object-cover" loading="eager"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/40 to-transparent"></div>
    <div class="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-14">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-saffron-300">Riverside District · family-run since 1987</p>
      <h1 class="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight text-cream-50 md:text-6xl">
        Charcoal, olive oil, and three generations of recipes.
      </h1>
      <div class="mt-6 flex flex-wrap gap-3">
        <a href="/reserve" class="rounded-full bg-saffron-400 px-6 py-3 font-semibold text-charcoal-950 hover:bg-saffron-300">Book a table</a>
        <a href="/order" class="rounded-full border border-cream-50/40 px-6 py-3 font-semibold text-cream-50 hover:bg-cream-50/10">Order pickup</a>
      </div>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-4 py-20">
    <SectionHeading kicker="From the coals" title="Today's specials" />
    <div class="grid gap-6 md:grid-cols-3">
      {specials.map((item) => (
        <article class="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <h3 class="font-display text-xl font-semibold">{item.name}</h3>
          <p class="mt-2 text-sm text-charcoal-800">{item.description}</p>
          <p class="mt-4 font-semibold text-olive-600">${item.price.toFixed(2)}</p>
        </article>
      ))}
    </div>
  </section>

  <section class="bg-charcoal-950 py-20 text-cream-100">
    <div class="mx-auto max-w-4xl px-4 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-saffron-300">Our story</p>
      <p class="mt-6 font-display text-2xl leading-relaxed md:text-3xl">
        Grandmother Samira started selling shawarma from a cart in 1987. Her son added the charcoal grill. Her granddaughter added the kunafa that people now drive across town for. Everything else — the freekeh, the toum, the forty-layer baklava — is the same recipe, made the slow way.
      </p>
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-4 py-20">
    <SectionHeading kicker="Regulars say it best" title="Word of mouth" />
    <div class="grid gap-6 md:grid-cols-3">
      {reviews.map((r) => (
        <blockquote class="rounded-2xl border border-cream-200 bg-white p-6">
          <p class="text-charcoal-900">“{r.text}”</p>
          <footer class="mt-4 text-sm font-semibold text-olive-600">— {r.who}</footer>
        </blockquote>
      ))}
    </div>
  </section>

  <section class="mx-auto max-w-6xl px-4 pb-20">
    <div class="grid gap-10 rounded-2xl border border-cream-200 bg-cream-100 p-8 md:grid-cols-2 md:p-12">
      <div>
        <SectionHeading kicker="Visit us" title="Hours &amp; location" />
        <ul class="space-y-2">
          {hours.map(([d, h]) => (
            <li class="flex justify-between border-b border-cream-200 pb-2 text-sm"><span>{d}</span><span class="font-medium">{h}</span></li>
          ))}
        </ul>
        <p class="mt-4 text-sm text-charcoal-800">14 Cardamom Lane, Riverside District · (555) 014-2214</p>
      </div>
      <img
        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop"
        alt="Inside the dining room" class="h-full min-h-64 w-full rounded-xl object-cover" loading="lazy"
      />
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: success. Dev server: home shows hero with image, 3 specials, story block, reviews, hours. Kill dev server.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: home page with hero, specials, story, reviews and hours"
```

---

### Task 11: Menu page + filter island

**Files:**
- Create: `src/components/react/MenuFilter.tsx`, `src/pages/menu.astro`

**Interfaces:**
- Consumes: `MENU`, `MenuItem` (Task 3), `BaseLayout` (Task 2), `SectionHeading` (Task 10).
- Produces: menu grid markup that Task 13's island mirrors for consistency.

- [ ] **Step 1: Write `src/components/react/MenuFilter.tsx`**

```tsx
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
```

(Note: `type Diet` must be declared before use — put `type Diet = 'all' | 'v' | 'gf';` above the component with the other type declarations.)

- [ ] **Step 2: Write `src/pages/menu.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';
import MenuFilter from '../components/react/MenuFilter';
import { MENU } from '../lib/menu';
---
<BaseLayout title="Menu" description="Mezze, charcoal-grilled mains, sides, sweets and drinks.">
  <section class="mx-auto max-w-6xl px-4 py-16">
    <SectionHeading kicker="Eat well" title="The menu" />
    <MenuFilter client:load items={MENU} />
  </section>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: success, no transform errors. Dev: category and diet pills reflow the grid instantly; empty state shows for a no-match combo (e.g. Drinks + Gluten-free still matches, try Desserts + Gluten-free → only baklava stays... verify count changes sensibly). Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: menu page with react filter island"
```

---

### Task 12: Reserve page + reservation form island

**Files:**
- Create: `src/components/react/ReservationForm.tsx`, `src/pages/reserve.astro`

**Interfaces:**
- Consumes: `GET /api/availability`, `POST /api/reserve` (Task 9 HTTP contract).
- Produces: nothing downstream.

- [ ] **Step 1: Write `src/components/react/ReservationForm.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `src/pages/reserve.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ReservationForm from '../components/react/ReservationForm';
---
<BaseLayout title="Reserve a table">
  <section class="mx-auto max-w-6xl px-4 py-16">
    <div class="mb-10 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-olive-600">Book with us</p>
      <h1 class="mt-2 font-display text-4xl font-bold">Reserve a table</h1>
      <p class="mt-3 text-sm text-charcoal-800">Seatings every half hour, 12:00–21:00. Closed Mondays.</p>
    </div>
    <ReservationForm client:load />
  </section>
</BaseLayout>
```

- [ ] **Step 3: Verify end-to-end**

`npm run dev` → `/reserve`:
1. Slots load for today.
2. Valid submission → confirmation panel; then `curl -s http://localhost:4321/api/orders/today | head -c 200` shows it.
3. Phone `hello` → inline field error from server.
4. A Monday date (check with `date -d "next monday" +%F`) → "No seatings open" message.
Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: reservation form island with live slot availability"
```

---

### Task 13: Order page + pickup cart island

**Files:**
- Create: `src/components/react/OrderCart.tsx`, `src/pages/order.astro`

**Interfaces:**
- Consumes: `MENU` items list (Task 3), `POST /api/order` (Task 9). Cart persisted in `localStorage` key `eo-cart` as `Record<itemId, qty>` (qty 0–10).
- Produces: nothing downstream.

- [ ] **Step 1: Write `src/components/react/OrderCart.tsx`**

```tsx
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
              <span>{(Math.round(l.item.price * 100) * l.qty / 100).toFixed(2)}</span>
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
```

Note: in the cart list price line, the `<span>` should keep `className="font-medium"`; the expression inside is `(Math.round(l.item.price * 100) * l.qty / 100).toFixed(2)`. The `$` sign renders as text before the span.

- [ ] **Step 2: Write `src/pages/order.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import OrderCart from '../components/react/OrderCart';
import { MENU } from '../lib/menu';
---
<BaseLayout title="Order pickup">
  <section class="mx-auto max-w-6xl px-4 py-16">
    <div class="mb-10 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-olive-600">Skip the wait</p>
      <h1 class="mt-2 font-display text-4xl font-bold">Order pickup</h1>
      <p class="mt-3 text-sm text-charcoal-800">Straight from the coals to your hands in about twenty minutes.</p>
    </div>
    <OrderCart client:load items={MENU} />
  </section>
</BaseLayout>
```

- [ ] **Step 3: Verify end-to-end**

`npm run dev` → `/order`: add 2×kunafa + 1×mint lemonade → subtotal shows $21.50; reload page → cart persists (localStorage); submit with valid name/phone → receipt with order number; `curl -s http://localhost:4321/api/orders/today | head -c 400` includes it; bad phone → field error. Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: pickup order island with localStorage cart"
```

---

### Task 14: About + Contact pages

**Files:**
- Create: `src/pages/about.astro`, `src/pages/contact.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 2), `SectionHeading` (Task 10).
- Produces: nothing downstream. Contact form uses Netlify Forms (`data-netlify="true"`) — works on the deployed site with zero backend.

- [ ] **Step 1: Write `src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeading from '../components/SectionHeading.astro';

const family = [
  { name: 'Samira', role: 'The founder', bio: 'Started with a cart and a recipe card in 1987. Still tastes every batch of toum.' },
  { name: 'Karim', role: 'The grill', bio: 'Samira\'s son. Has not been more than two meters from the charcoal since 2004.' },
  { name: 'Layla', role: 'The sweets', bio: 'Added the kunafa. Blamed whenever your belt stops fitting.' },
];
---
<BaseLayout title="About" description="Three generations of one family running one grill.">
  <section class="mx-auto max-w-4xl px-4 py-16">
    <SectionHeading kicker="Who we are" title="Three generations, one grill" />
    <p class="mx-auto mt-4 max-w-2xl text-center text-charcoal-800">
      We are not a chain and we do not want to be. What we have — the cart, the grill, the counter — all sits inside one dining room, and most nights somebody from the family is at the pass.
    </p>
    <div class="mt-12 grid gap-6 md:grid-cols-3">
      {family.map((f) => (
        <article class="rounded-2xl border border-cream-200 bg-white p-6 text-center">
          <p class="font-display text-xl font-semibold">{f.name}</p>
          <p class="mt-1 text-xs font-semibold uppercase tracking-widest text-saffron-500">{f.role}</p>
          <p class="mt-3 text-sm text-charcoal-800">{f.bio}</p>
        </article>
      ))}
    </div>
    <img
      src="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1600&auto=format&fit=crop"
      alt="A pan bubbling away in the kitchen" class="mt-12 h-72 w-full rounded-2xl object-cover" loading="lazy"
    />
  </section>
</BaseLayout>
```

Note: in the `family` array, `bio: 'Samira\'s son...'` uses an escaped apostrophe inside single quotes — keep that escaping (or switch that string to double quotes).

- [ ] **Step 2: Write `src/pages/contact.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Contact">
  <section class="mx-auto max-w-4xl px-4 py-16">
    <div class="mb-10 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-olive-600">Say hi</p>
      <h1 class="mt-2 font-display text-4xl font-bold">Contact</h1>
      <p class="mt-3 text-sm text-charcoal-800">Large orders, catering, lost jackets — we have seen it all.</p>
    </div>
    <div class="grid gap-10 md:grid-cols-2">
      <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="space-y-4 rounded-2xl border border-cream-200 bg-white p-6">
        <input type="hidden" name="form-name" value="contact" />
        <p class="hidden"><label>Leave empty: <input name="bot-field" /></label></p>
        <label class="block text-sm font-medium">
          Name
          <input required name="name" class="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm focus:border-olive-500" />
        </label>
        <label class="block text-sm font-medium">
          Email
          <input required type="email" name="email" class="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm focus:border-olive-500" />
        </label>
        <label class="block text-sm font-medium">
          Message
          <textarea required name="message" rows="5" class="mt-1 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm focus:border-olive-500"></textarea>
        </label>
        <button class="w-full rounded-full bg-olive-600 py-3 font-semibold text-cream-50 hover:bg-olive-700">Send message</button>
        <p class="text-center text-xs text-charcoal-800">We answer within a day, faster during prep hours.</p>
      </form>
      <div class="space-y-6">
        <div class="overflow-hidden rounded-2xl border border-cream-200">
          <iframe
            title="Map to Ember & Olive"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02%2C40.72%2C-73.98%2C40.75&layer=mapnik"
            class="h-72 w-full" loading="lazy"></iframe>
        </div>
        <div class="rounded-2xl border border-cream-200 bg-white p-6 text-sm">
          <p class="font-semibold">Ember &amp; Olive</p>
          <p class="mt-1">14 Cardamom Lane, Riverside District</p>
          <p>(555) 014-2214</p>
          <p class="mt-2 text-charcoal-800">Walk-ins always welcome; reservations recommended Fri–Sat.</p>
        </div>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: success; contact form appears in prerendered HTML (grep dist for `data-netlify`); dev server renders both pages correctly. Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: about and contact pages with netlify form and map"
```

---

### Task 15: Admin-lite orders page

**Files:**
- Create: `src/components/react/AdminOrders.tsx`, `src/pages/orders.astro`

**Interfaces:**
- Consumes: `GET /api/orders/today` (Task 9).
- Produces: nothing downstream. No auth (demo page, linked only from README — not from the public nav).

- [ ] **Step 1: Write `src/components/react/AdminOrders.tsx`**

```tsx
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
        <p className="text-sm text-charcoal-800">
          {data.date} · {data.reservations.length} reservations ({covers} covers) · {data.orders.length} pickup orders
        </p>
        <button onClick={load} className="rounded-full border border-cream-200 bg-white px-4 py-1.5 text-sm font-semibold hover:bg-cream-100">Refresh</button>
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
```

Fix before committing: sweep the whole component so every element uses JSX syntax — every `class=` attribute must be `className` (the tables, the summary `<p>`, and the two `<h2>`s above should already read `className` after this check).

- [ ] **Step 2: Write `src/pages/orders.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import AdminOrders from '../components/react/AdminOrders';
---
<BaseLayout title="Today at a glance">
  <section class="mx-auto max-w-6xl px-4 py-16">
    <h1 class="mb-8 font-display text-4xl font-bold">Today at a glance</h1>
    <AdminOrders client:load />
  </section>
</BaseLayout>
```

Note: this page is intentionally NOT added to `Header.astro` links. It is staff-facing; the README links to it.

- [ ] **Step 3: Verify**

Dev: `/orders` shows today's reservations from the seed plus any made in Task 12 verification. Refresh button re-fetches. Kill dev server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: staff view of today's reservations and orders"
```

---
### Task 16: QA pass

**Files:**
- Modify: any file where QA finds defects

**Interfaces:**
- Consumes: everything built so far.
- Produces: a build that passes the spec §7 manual checklist.

- [ ] **Step 1: Full test suite + typecheck**

```bash
npm test && npx astro check
```
Expected: all vitest suites pass; `astro check` reports 0 errors (warnings about unused vars: fix them, do not ignore).

- [ ] **Step 2: Full-build smoke test**

```bash
npm run build && npm run preview & sleep 4
curl -s http://localhost:4321/ | grep -o "<title>[^<]*" | head -1
curl -s http://localhost:4321/menu | grep -c "Classic Hummus"
kill %1
```
Expected: title contains "Ember"; menu page contains the dish.

- [ ] **Step 3: Manual checklist (dev server + browser at 1440px and 390px widths)**

Check each and fix what fails:
1. Home: hero image loads, CTAs link to /reserve and /order.
2. Menu: filters work; dietary badges correct.
3. Reserve: slot fetch works; happy path books; bad phone shows field error; Monday shows empty message.
4. Order: cart persists across reload; receipt shows after submit; `/api/orders/today` reflects it.
5. Contact: form renders with `data-netlify` attribute (grep dist HTML).
6. Nav links all resolve; mobile menu (☰) opens.
7. No console errors in the browser devtools on any page.

- [ ] **Step 4: Fix findings, re-run `npm test && npm run build`, commit**

```bash
git add -A && git commit -m "fix: QA pass findings across pages and forms"
```
(If nothing needed fixing, skip the commit.)

---

### Task 17: Screenshots, README, LICENSE

**Files:**
- Create: `scripts/screenshot.mjs`, `README.md`, `LICENSE`, `docs/screenshots/*.png`

**Interfaces:**
- Consumes: built site (Task 16).
- Produces: README with real demo placeholder that Task 19 fills in; screenshots embedded in README.

- [ ] **Step 1: Install Playwright and take screenshots**

```bash
npm i -D playwright && npx playwright install chromium --with-deps
npm run dev & sleep 4
node scripts/screenshot.mjs
kill %1
```

```js
// scripts/screenshot.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('docs/screenshots', { recursive: true });
const base = process.env.BASE_URL ?? 'http://localhost:4321';
const browser = await chromium.launch();

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [path, name] of [['/', 'home'], ['/menu', 'menu'], ['/reserve', 'reserve'], ['/order', 'order']]) {
  await desktop.goto(base + path, { waitUntil: 'networkidle' });
  await desktop.screenshot({ path: `docs/screenshots/${name}.png` });
}
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base + '/', { waitUntil: 'networkidle' });
await mobile.screenshot({ path: 'docs/screenshots/home-mobile.png' });
await browser.close();
console.log('screenshots saved');
```
Expected: 5 PNGs in `docs/screenshots/`. Eyeball each — re-shoot any that caught a loading state.

- [ ] **Step 2: Write `README.md`**

```markdown
# Ember & Olive

A complete website for a fictional family-run Mediterranean grill — built the way I would build it for a paying client, then open-sourced as a portfolio piece.

**Live demo:** https://ember-olive.netlify.app *(URL finalized at deploy)*

![Home](docs/screenshots/home.png)

## What it does

- **Menu** — 17 dishes across 5 courses, filterable by course and diet (React island, zero JS until you interact)
- **Reservations** — live 30-minute seatings with real capacity math (42 seats/slot), server-validated, stored in SQL
- **Pickup orders** — cart that survives reloads (localStorage), priced **server-side** from the menu, returns a real order number
- **Staff view** — `/orders` shows today's reservations and pickup tickets at a glance
- **Contact** — Netlify Forms, no backend needed

The interesting logic lives in [`src/lib/services/`](src/lib/services): per-slot capacity checks, server-recomputed prices (the client never gets to name a number), and order-number allocation with collision retry.

## Screenshots

| | |
|---|---|
| ![Menu](docs/screenshots/menu.png) | ![Reserve](docs/screenshots/reserve.png) |
| ![Order](docs/screenshots/order.png) | ![Mobile](docs/screenshots/home-mobile.png) |

## Stack

Astro 5 (static-first) · React 19 islands · Tailwind CSS 4 · TypeScript strict · Zod · Drizzle ORM + libsql (Turso in prod) · Vitest · Netlify

## Run it locally

```bash
git clone https://github.com/v01dst/ember-olive && cd ember-olive
npm install
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev        # http://localhost:4321
npm test           # vitest suites
```

Without a `TURSO_DATABASE_URL`, the app uses a local SQLite file in `data/` — no account needed for local dev.

## Project structure

```
src/
├── data/menu.json            # single source of truth for dishes + prices
├── lib/
│   ├── availability.ts       # slots, capacity, opening hours (pure, tested)
│   ├── menu.ts               # zod-validated menu loader
│   ├── validation.ts         # shared zod schemas (client + server)
│   ├── schema.ts             # drizzle tables
│   ├── db.ts                 # libsql client factory
│   └── services/             # all DB access lives here
├── components/react/         # the only client-side JS on the site
└── pages/api/                # on-demand Netlify functions
```

## Notes

- Food photos are from [Unsplash](https://unsplash.com). Everything else — code, copy, brand — is mine.
- This is a fictional business; the address, phone, and reviews are invented.

---

**Built by Mahmoud Ahmed** · open to freelance work

- Discord: `9p.1`
- LinkedIn: https://www.linkedin.com/in/mahmoud-ahmed-8a349842b

## License

[MIT](LICENSE)
```

- [ ] **Step 3: Write `LICENSE`**

Standard MIT text, `Copyright (c) 2026 Mahmoud Ahmed`. Use the canonical text from `npx license mit` or write it manually — must contain the MIT grant paragraph, the copyright line above, and the "THE SOFTWARE IS PROVIDED AS IS" disclaimer.

- [ ] **Step 4: Verify**

```bash
grep -n "9p.1" README.md && ls docs/screenshots/ && npm run build
```
Expected: Discord handle present, 5 screenshots, build still green.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: readme, screenshots, mit license"
```

---

### Task 18: Publish to GitHub + shorten LinkedIn

**Files:**
- Modify: `README.md` (LinkedIn link only)

**Interfaces:**
- Consumes: completed repo (Task 17).
- Produces: public repo `v01dst/ember-olive`; short LinkedIn URL in README.

- [ ] **Step 1: Create the public repo and push**

```bash
gh repo create v01dst/ember-olive --public --source . --push --description \
  "Ember & Olive — a fictional Mediterranean grill restaurant site. Astro 5 + React islands + Tailwind 4 + libsql. Real reservations and pickup-order logic, built like a client commission."
```
Expected: repo created, all commits pushed, default branch `main`.

- [ ] **Step 2: Shorten the LinkedIn URL (no account needed)**

```bash
curl -s "https://tinyurl.com/api-create.php?url=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fmahmoud-ahmed-8a349842b"
```
Expected: prints `https://tinyurl.com/<suffix>`. Note it down. Verify it resolves:
```bash
curl -sI "https://tinyurl.com/<suffix>" | head -3
```
Expected: a redirect (`HTTP/2 301`/`302` with `location:` to linkedin.com).

- [ ] **Step 3: Swap the long LinkedIn URL for the short one in README.md**

Replace `https://www.linkedin.com/in/mahmoud-ahmed-8a349842b` with the short URL (keep the long URL as an HTML comment next to it for reference: `<!-- linkedin: https://www.linkedin.com/in/mahmoud-ahmed-8a349842b -->`).

- [ ] **Step 4: Commit and push**

```bash
git add README.md && git commit -m "docs: shorten linkedin contact link" && git push
```

- [ ] **Step 5: Verify the repo page**

```bash
gh repo view v01dst/ember-olive --web 2>/dev/null || gh repo view v01dst/ember-olive --json url,description
```
Expected: README renders with badges-free clean layout, screenshots visible (GitHub renders images from the repo), contact section present.

---

### Task 19: Deploy to Netlify + Turso

**Files:**
- Modify: `README.md` (demo URL)
- Create: `.env` (git-ignored, local only)

**Interfaces:**
- Consumes: pushed repo (Task 18).
- Produces: live site with working reservations/orders; README demo link real.

- [ ] **Step 1: Create the production database (Turso free tier)**

Turso is libsql-as-a-service — same code path as local dev, works on serverless.

```bash
# review the installer script before running it:
curl -sSfL https://get.tur.so/install.sh -o /tmp/turso-install.sh && less /tmp/turso-install.sh
bash /tmp/turso-install.sh
turso auth signup        # opens browser; create free account
turso db create ember-olive
turso db show ember-olive --url          # → libsql://ember-olive-<who>.turso.io
turso db tokens create ember-olive       # → auth token (treat as secret)
```

- [ ] **Step 2: Apply migrations + seed to Turso**

```bash
TURSO_DATABASE_URL="libsql://ember-olive-<who>.turso.io" TURSO_AUTH_TOKEN="<token>" npm run db:migrate
TURSO_DATABASE_URL="libsql://ember-olive-<who>.turso.io" TURSO_AUTH_TOKEN="<token>" npm run db:seed
```

- [ ] **Step 3: Deploy to Netlify**

```bash
npm i -D netlify-cli
npx netlify login        # browser auth (or set NETLIFY_AUTH_TOKEN)
npx netlify init         # "Create & configure a new site", accept defaults
npx netlify env:set TURSO_DATABASE_URL "libsql://ember-olive-<who>.turso.io"
npx netlify env:set TURSO_AUTH_TOKEN "<token>"   # mark as secret when prompted
npx netlify deploy --build --prod
```
Expected: `Website URL: https://<name>.netlify.app`.

- [ ] **Step 4: Smoke-test the live site**

```bash
LIVE="https://<name>.netlify.app"
curl -s "$LIVE/api/availability?date=$(date +%F)" | head -c 200
curl -s -X POST "$LIVE/api/reserve" -H 'content-type: application/json' \
  -d "{\"name\":\"Live Test\",\"phone\":\"555-0123\",\"partySize\":2,\"date\":\"$(date +%F)\",\"time\":\"13:00\"}"
curl -s "$LIVE/api/orders/today" | head -c 300
```
Expected: slots JSON; 201 reservation; today's data. Also open the site in a browser: book a table through the UI, order pickup through the UI.

- [ ] **Step 5: Put the real URL in README, commit, push**

Replace the demo line's `*(URL finalized at deploy)*` with the live URL. Then:

```bash
git add README.md && git commit -m "docs: add live demo link" && git push
```

- [ ] **Step 6: Verify README renders with working demo link**

```bash
gh repo view v01dst/ember-olive --json url
```
Expected: repo page shows the live link; clicking it loads the site.

---

### Task 20: Monitoring handoff (30-minute GitHub check loop)

**Files:**
- Create: `scripts/gh-notify.sh`

**Interfaces:**
- Produces: a one-command check for mentions, review requests, and PR/issue comments across all of the user's repos.

- [ ] **Step 1: Write `scripts/gh-notify.sh`**

```bash
#!/usr/bin/env bash
# Run this any time: ./scripts/gh-notify.sh
# Shows unread GitHub notifications + PRs awaiting your review, newest first.
set -euo pipefail

echo "── Notifications (mentions, comments, CI) ──"
gh api notifications --jq '.[] | "\(.updated_at) [\(.reason)] \(.repository.full_name): \(.subject.title)"' || true

echo
echo "── PRs requesting your review ──"
gh search prs --review-requested=@me --state open --json repository,title,url \
  --jq '.[] | "\(.repository.nameWithOwner): \(.title) — \(.url)"' || true

echo
echo "── My open PRs (recent activity) ──"
gh search prs --author=@me --state open --json repository,title,updatedAt,url \
  --jq '.[] | "\(.repository.nameWithOwner): \(.title) — \(.url) (updated \(.updatedAt))"' || true
```

```bash
chmod +x scripts/gh-notify.sh
```

- [ ] **Step 2: Verify it runs**

```bash
./scripts/gh-notify.sh
```
Expected: three sections print (empty sections are fine). Commit it.

- [ ] **Step 3: Explain the loop to the user and commit**

While a session is active, the assistant runs `./scripts/gh-notify.sh` every ~30 minutes of work and reports anything needing a reply. Between sessions, the user runs it manually, or installs a cron line (optional):

```bash
(crontab -l 2>/dev/null; echo '*/30 * * * * cd /root/ember-olive && ./scripts/gh-notify.sh >> /tmp/gh-notify.log 2>&1') | crontab -
```

```bash
git add scripts/gh-notify.sh && git commit -m "chore: github notification check script" && git push
```

---

### Task 21: Open-source contributions (3 issues)

**Files:**
- None in this repo. Work happens as forks/PRs in other people's repos.

**Interfaces:**
- Consumes: `gh` CLI, the user's GitHub account.
- Produces: 3 claimed issues with human-toned comments, following each repo's own rules.

- [ ] **Step 1: Build the candidate list**

```bash
gh search issues --state open --label "good first issue" --language typescript --sort updated --limit 30 \
  --json repository,title,url,labels,updatedAt,comments \
  --jq '.[] | select(.comments >= 0) | "\(.repository.nameWithOwner) | \(.title) | \(.url)"'
```
Filter manually:
- Repo pushed/updated within the last month (check `gh repo view <owner/name> --json pushedAt`).
- Issue has no linked PR yet (`grep` the issue page for "linked pull request").
- Maintainer has responded to others recently — good sign the repo is alive.
- Prefer repos with a CONTRIBUTING.md (`gh api repos/<owner>/<repo>/contents/CONTRIBUTING.md --jq .name`).

Pick 3 candidates across 3 different repos.

- [ ] **Step 2: For each repo, read the rules first**

```bash
gh api repos/<owner>/<repo>/contents/CONTRIBUTING.md --jq .content | base64 -d | head -80
```
Note: claim keyword (`/claim`, `.take`, or "assign me a comment"), branch naming, commit style, test requirements.

- [ ] **Step 3: Claim each issue — repo's convention first, no asking for assignment**

Post a comment in the repo's claimed style, e.g.:

> /claim — happy to take this one. Planning to <one-line approach, e.g. "guard the empty-array case in formatResponse and add a test">.

If `/claim` gets no bot/maintainer response within the repo's stated window (or the repo has no convention), post once more asking directly:

> Want to make sure there's no double work before I start — is this one free to take?

Rules: first-person, plain, no flattery ("great project!"), no "I'd be honored", no emoji walls. One or two sentences. **Show each comment draft to the user before posting.**

- [ ] **Step 4: Fix, PR, humanize**

Per issue:
1. Fork, clone, branch (`fix/<slug>` or repo convention).
2. Reproduce first — write the failing test if the repo has tests.
3. Minimal fix. Match the repo's existing code style, not ours.
4. PR description template (complete every line with real content, keep it short):

```markdown
Closes #<issue>

<What was wrong, in one or two plain sentences.>

<What the fix does, one sentence.>

<How I tested it — e.g. "added a case to parse.test.ts; full suite passes locally">
```

No "This PR beautifully refactors…". No bullet-point essays. A maintainer should be able to read it in 20 seconds.

- [ ] **Step 5: Track all three**

Add each PR to the monitoring loop (Task 20's script already covers notifications). Report status to the user every session: comment activity, requested changes, merges.

- [ ] **Step 6: Report back**

Summarize in chat: repo, issue, approach, PR link, status for each of the 3. Update if maintainers request changes — that is normal, not failure.

---

## Completion checklist

- [ ] All 21 tasks checked off
- [ ] `npm test` and `npx astro check` green
- [ ] Live site up, forms verified through the UI
- [ ] Repo public with rendered README (screenshots, demo link, Discord `9p.1`, short LinkedIn)
- [ ] 3 OSS issues claimed with compliant, human-toned comments; PRs opened or in progress
- [ ] Monitoring loop agreed (in-session + `gh-notify.sh` for between sessions)
