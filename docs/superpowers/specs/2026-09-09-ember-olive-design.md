# Ember & Olive — Design Spec

Date: 2026-09-09
Owner: v01dst (Mahmoud Ahmed)
Status: Approved

## 1. Purpose

A portfolio project built to look like a real client commission: a complete website for a fictional family-run Mediterranean grill restaurant. It demonstrates frontend craft, real backend logic, and deployment — the missing "client work" category next to the existing dev-tool repos on the v01dst GitHub profile.

Success criteria:

- Live deployed site linked from the README
- Looks like paid client work at a glance (real copy, real photos, coherent brand)
- Real interactive logic (reservations, pickup orders) backed by a database
- README is portfolio-grade and lists Discord `9p.1` and a shortened LinkedIn URL
- After launch, 3 real open-source issues fixed with human-toned PRs following each repo's contribution rules

## 2. Brand

- Name: Ember & Olive — Mediterranean Grill
- Concept: family-run grill; shawarma, mezze, wood-fire mains
- Palette: warm charcoal, olive green, saffron accents on a cream base
- Typography: a display serif for headings, clean sans for body
- Copy: written like a real owner wrote it; no lorem ipsum
- Photography: Unsplash food/interior photos, credited in the README

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 5 | Pages prerendered to ~0 JS; Netlify adapter enables on-demand API routes via `prerender = false` |
| Interactivity | React islands | Menu filter, reservation form, order cart only |
| Styling | Tailwind CSS 4 | Fast, consistent, job-market relevant |
| Language | TypeScript (strict) | Matches existing profile repos |
| Validation | Zod | Shared schemas between forms and API |
| Database | SQLite via Drizzle ORM | Zero-infra persistence for reservations/orders |
| Testing | Vitest | Booking/order logic and API handlers |
| Deploy | Netlify (free tier) | Live demo URL; adapter for API routes; free static form handling for `/contact` |

## 4. Pages

| Route | Type | Content |
|---|---|---|
| `/` | static | Hero, today's specials, story strip, reviews, hours/location |
| `/menu` | static + island | Full menu with categories, dietary badges; React filter island |
| `/reserve` | island | Reservation form: party size, date, time slots, contact; posts to API |
| `/order` | island | Pickup order: menu items, cart in localStorage, posts to API, shows order number |
| `/about` | static | Team story, values, gallery |
| `/contact` | static | Map embed, contact form (static form handler), hours |
| `/orders` | island | Admin-lite: today's reservations and pickup orders from the DB |

## 5. Backend

- `POST /api/reserve` — validates with Zod, checks party size and opening hours, rejects double-booked slots per table capacity, stores reservation
- `GET /api/availability?date=` — returns remaining slots for the picker
- `POST /api/order` — validates items against the menu, prices server-side (never trusts client totals), stores order, returns order number
- `GET /api/orders/today` — drives the admin-lite page
- SQLite file DB; schema and seed script in the repo; menu data lives in a typed content collection, seeded into the DB

## 6. Error Handling

- Forms: inline field errors, disabled submit while pending, friendly failure message with retry
- APIs: 400 with field-level messages, 409 for full slots, 500 with generic message; all errors logged server-side
- No client-trusted prices or quantities

## 7. Testing

- Unit: slot availability logic, price calculation, Zod schemas
- Integration: API routes against a temp SQLite DB
- Manual checklist before deploy: forms end-to-end, mobile layout, Lighthouse pass

## 8. README

Sections: project title with one-line pitch, live demo link, screenshots (desktop + mobile), features, tech stack badges, architecture overview, local development setup, project structure, license. Contact footer: Discord `9p.1` and LinkedIn link shortened with the TinyURL free API (`https://tinyurl.com/api-create.php?url=...`, no account needed) after the repo is created.

## 9. Open-Source Contribution Workflow (post-launch)

1. Find 3 real open issues in active TypeScript/JavaScript repos (labels: `good first issue`, `help wanted`; recent maintainer activity required)
2. Read each repo's CONTRIBUTING.md and follow it exactly
3. Claim per repo convention: comment `/claim` (or the repo's own command) without asking for assignment; only ask directly if the convention is unclear or `/claim` gets no response
4. Comments and PR descriptions written in a natural first-person voice: short, direct, no AI-sounding phrasing
5. Wait for maintainer acknowledgment before starting work when the repo's rules require it
6. PRs: small, focused, linked to the issue, tests included where the repo has tests

## 10. Monitoring (30-minute loop)

- While a working session is active: every ~30 minutes run a `gh` check for mentions, review requests, issue comments, and PR feedback; report anything needing a reply
- Between sessions: a one-line shell script the user can run on demand (provided at handoff)

## 11. Out of Scope

- Payments (orders are pay-on-pickup)
- Authentication for the admin-lite page (portfolio demo only)
- Email/SMS notifications
- CMS (menu is code/content-collection managed)
