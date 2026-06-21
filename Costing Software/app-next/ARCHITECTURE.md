# Array Metal Costing Software — System Architecture

## System Overview

```
Array Metal Costing Software
│
├── Browser (User's computer)        ← You open this in Chrome/Edge
│     └── Next.js Frontend           ← The UI: pages, tables, buttons
│
├── Next.js API Routes               ← Backend: handles calculations, DB queries
│     └── runs on your machine       ← started with "npx next dev"
│
└── Supabase (Cloud Database)        ← PostgreSQL: stores all 48,671 SKUs + prices
      └── hosted at supabase.co      ← accessed via internet
```

---

## Repository Structure

```
array-metal-costing/          ← root of the repo (what's on GitHub)
│
├── app/                      ← ALL PAGES AND API ROUTES (Next.js App Router)
│   ├── page.tsx              ← Dashboard (home page — SKU count, last recalc)
│   ├── layout.tsx            ← Shared layout: nav bar wrapping every page
│   │
│   ├── items/
│   │   └── page.tsx          ← Item Registry page (the big table of all SKUs)
│   │
│   ├── series/
│   │   └── [id]/
│   │       └── page.tsx      ← Series detail page (AML100 / AML125 / AML150)
│   │                           Has 4 tabs: General, Products, Scenarios, Audit
│   │
│   ├── export/
│   │   └── page.tsx          ← Export page (download filtered Excel file)
│   │
│   └── api/                  ← BACKEND (server-side code, never runs in browser)
│       ├── items/
│       │   └── route.ts      ← GET: list items, POST: create new item
│       ├── categories/
│       │   └── route.ts      ← GET: list series (AML100, AML125, AML150)
│       ├── prices/
│       │   └── route.ts      ← GET: fetch material/galv/markup rates from DB
│       ├── jobs/
│       │   └── recalculate/
│       │       └── route.ts  ← POST: re-run all 48K price calculations
│       ├── export/
│       │   └── route.ts      ← POST: generate Excel file for download
│       └── scenarios/
│           └── preview/
│               └── route.ts  ← POST: what-if scenario calculation (no DB write)
│
├── components/               ← REUSABLE UI PIECES (React components)
│   ├── items/
│   │   ├── ItemsTable.tsx    ← Virtualized table showing all SKUs (handles 48K rows)
│   │   ├── ItemDetailSheet.tsx ← Slide-out panel when you click a SKU row
│   │   └── AddItemSheet.tsx  ← Form to add a new item variant
│   │
│   └── series/
│       ├── SeriesDetailClient.tsx      ← Tab container for the series page
│       ├── GeneralSettings.tsx         ← Tab 1: edit material prices for a series
│       ├── ProductsTab.tsx             ← Tab 2: breakdown of item counts by type
│       ├── ScenarioPanel.tsx           ← Tab 3: create/edit scenarios, trigger preview
│       ├── ScenarioComparisonTable.tsx ← The side-by-side price comparison table
│       └── AuditTrail.tsx              ← Tab 4: log of all price changes
│
├── lib/                      ← CORE LOGIC (pure functions, no UI)
│   ├── engine.ts             ← THE CALCULATION ENGINE
│   │                            calcPrice(item, prices, finish) → PriceBreakdown
│   │                            Contains all weight + price formulas for every
│   │                            product type (ST, E90, IR30, RC, etc.)
│   ├── supabase.ts           ← Database connection (Supabase JS client)
│   ├── part-number.ts        ← Parses "AML100-E90-150-1.5-R300-G" into fields
│   ├── art-no.ts             ← ART number assignment helpers
│   └── validators.ts         ← Zod input validation schemas
│
├── store/
│   └── usePriceStore.ts      ← Global app state (Zustand)
│                                Holds: live prices, dirty flags, scenarios list
│                                Scenarios are saved to browser localStorage
│
├── types/
│   └── index.ts              ← TypeScript type definitions shared across the app
│                                Key types: ParsedPart, MaterialPrices,
│                                PriceBreakdown, ItemWithPrice, Scenario
│
├── prisma/
│   └── schema.prisma         ← Database schema definition (8 tables)
│                                NOTE: Prisma is NOT used at runtime — only
│                                for schema reference and migrations
│
├── __tests__/
│   └── engine.test.ts        ← Unit tests for the calculation engine (Vitest)
│
├── .env                      ← SECRET FILE — NOT on GitHub
│                                Contains database password, API keys
│                                NEVER commit this
│
├── .env.example              ← Safe template showing which variables are needed
├── .gitignore                ← Tells Git what NOT to upload (node_modules, .env)
├── package.json              ← Project dependencies and scripts
├── tailwind.config.ts        ← CSS styling configuration
└── tsconfig.json             ← TypeScript configuration
```

---

## How Data Flows (Example: Viewing Prices)

```
1. You open browser → localhost:3000/series/aml100

2. SeriesDetailClient.tsx renders → fetches GET /api/prices?finish=HDG
                                            GET /api/categories/aml100

3. API route (server) → queries Supabase → returns material rates

4. User clicks "Scenarios" tab → ScenarioPanel.tsx loads

5. User edits steel rate → clicks Preview
   → POST /api/scenarios/preview { categoryId, scenarioPrices }

6. Server: fetches all 48K items from Supabase
           runs calcPrice() for each item using the override prices
           returns side-by-side results

7. ScenarioComparisonTable.tsx renders 48K rows using virtual scrolling
   (only ~15 rows are actually in the DOM at any time — the rest are virtual)
```

---

## The 8 Database Tables (in Supabase)

```
product_categories   ← AML100, AML125, AML150 (series metadata)
art_no_blocks        ← tracks the next available ART number per series
items                ← every SKU (48,671 rows): part number, dimensions, type
material_prices      ← steel/galv rates per finish type (HDG, SS316, etc.)
price_records        ← calculated prices, append-only history (never deleted)
product_templates    ← (future use) templates for parametric generation
job_records          ← log of recalculation jobs run
audit_logs           ← history of every price or settings change
```

---

## Key Rules

1. **`lib/engine.ts` is the heart of the system.** Everything else is either showing data (components), moving data in/out of the database (API routes), or remembering state temporarily (store). The engine never touches the database — it takes numbers in and returns numbers out.

2. **No duplicate PART NOs or ART NOs.** ART NO assignment is atomic via `supabase.rpc('claim_next_art_no')` — never assigned manually.

3. **Price records are append-only.** Old records are marked `isCurrent=false`; new ones are inserted. Nothing is ever deleted or overwritten.

4. **Scenarios never write to the database.** They are computed on demand by the server and stored only in the browser (localStorage).

5. **Never use offset pagination.** All large queries use cursor pagination (`.range()` in a while-loop) to stay performant at 100K+ rows.
