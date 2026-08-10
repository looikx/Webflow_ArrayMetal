# Array Metal Website Platform — Build Plan

**The single reference for building the new arraymetal.com.** Read this first; it links to everything else.

| | |
|---|---|
| **Status** | Architecture agreed · D-0 resolved for AML · Phase 2 unblocked for AML · design continuity locked (D-14/D-15), font licence outstanding |
| **Owner** | Kai (kaixuan@arraymetal.com) |
| **Last updated** | 2026-08-10 |

---

## 0. The document set

| Document | What it answers | When to read it |
|---|---|---|
| **BUILD_PLAN.md** *(this file)* | What we're building, in what order, under what rules | Start here. Refer to it during every phase |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Why the architecture is shaped this way; full data model, ERPNext strategy, search, SEO, risks | Before Phase 2, and whenever a design question comes up |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | **How the new site keeps looking like Array Metal.** Brand tokens extracted from the live stylesheet, component mapping, the divergences we fix | Before Phase 3.5. Governs every page we build |
| [design-system.html](./design-system.html) | The same thing, visually — swatches, real-font specimens, banding demo, before/after | With DESIGN_SYSTEM.md. Open it in a browser |
| [catalogue-ux.html](./catalogue-ux.html) | What every page looks like, block by block, with data provenance | Before Phase 4. Open it in a browser |
| [stack-and-subscriptions.html](./stack-and-subscriptions.html) | The Webflow verdict, the services to subscribe to, costs | Before Phase 3 |

> **Note on `catalogue-ux.html`:** its palette is a *document* palette for reading the spec, not the brand.
> Where the two disagree, [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) wins — it carries the layout structure,
> not the colours.

Supporting material in other repos and folders:

| Source | Role |
|---|---|
| `Software Projects/array-metal-costing` | **Upstream system of record.** Read `GROK.md` before touching anything in it |
| `catalogue/CMS_ARCHITECTURE.md` | The superseded native-Webflow plan. Its *information architecture* is correct and carried forward; its Designer template work is abandoned |
| `Cable Ladder Load Ratings/` | Source of the SWL / NEMA / standards data |
| `Perforated Metal Calculator/` | Existing calculator to port to React |

---

## 1. Ground truth

Every sizing decision in this plan derives from these numbers. Measured from the live costing database on 2026-08-10 — re-measure before Phase 2, not from memory.

```
items                        574,609   (574,605 active)
product_categories                42
distinct series                   59
distinct product types            73
distinct grade codes              15
product_templates                512    ← the configurator source
```

| Grouping | Distinct | Becomes |
|---|---:|---|
| Item groups / families | ~10 | Level 1 + 2 pages |
| series × grade | 258 | *not* pages — finish is a facet |
| **series × productType** | **718** | Level 4 pages (~400 after collapsing heights) |
| series × productType × grade | 3,045 | *not* pages — near-duplicates |
| Dual-width fittings `UT`/`UCP`/`UT-LC`/`UCP-LC` | **314,662 (54.8%)** | Configurator only. Never listed |

**Benchmark** (competitor sitemaps, measured 2026-08-10):

| | Product pages | Published item codes |
|---|---:|---:|
| Øglænd System | 1,215 | **11,244** (each with its own URL) |
| Atkore | 537 | capped at 1,000 per page, no SKU URLs |
| **Array Metal target** | **~400** | **~3,000–8,000** |

---

## 2. What we are building

Five levels of page. Full visual spec in [catalogue-ux.html](./catalogue-ux.html).

| Level | URL | Count | Purpose |
|---|---|---:|---|
| 1 | `/products` | ~9 | Family grid |
| 2 | `/products/cable-ladder` | ~9 | **System comparison table** — the highest-value page, currently missing from the site |
| 3 | `/products/cable-ladder/aml` | ~20 | System hero: spec strip, SWL table, finishes, component grid |
| 4 | `/products/cable-ladder/aml/straight` | ~400 | **The workhorse.** Drawing, characteristics, published item codes, configurator |
| 5 | `/p/AML100-ST-300-1.5-3-G` | ~3,000–8,000 | Item code page. Optional, after Level 4 works |

Plus: `/applications`, `/industries`, `/projects`, `/resources`, `/materials`, `/tools/*` (the two existing calculators), `/news`, `/about`, `/contact`.

---

## 3. Decision log

Decisions are **locked** unless explicitly reopened here. Add new rows; do not edit old ones.

| ID | Date | Decision | Rationale |
|---|---|---|---|
| **D-0** | 2026-08-10 | **AML v1 publish programme: 1,557 item codes** — HDG (`G`) only · all 3 heights (AML100/125/150) · all 27 non-dual-width, non-reducer component types (ST, LC, E90, T, E30/E30-LC, E45/E45-LC, E90-LC, CP/CP-LC, IR90/IR90-LC, IR45/IR45-LC, OR90/OR90-LC, OR45/OR45-LC, T-LC, IR30, OR30, SP, HSP, VSP, ESP, HDCA, HDCB) · standard dimensions only: bends at R300 (R450 for the two 30° risers, their only offered radius), straights/covers at 3 m, both thicknesses (1.5/2mm), full published width range per type. Excludes: reducers (RC/RR/RL + `-LC`, held on the `thicknessMm` data-quality issue below) and dual-width `UT`/`UCP`/`UT-LC`/`UCP-LC` (never listed, Rule 8) | Measured live against `items` (61,429 active AML rows, Supabase project `gddvmxtxqfiupsbgjebb`). Finish was the largest single lever (4x: all-finish→HDG-only); width range was deliberately left uncapped since it's the primary spec parameter buyers search by. Other systems (ACD, ART, …) get the same 4-lever exercise before Phase 2 starts for them — this row only resolves AML |
| D-1 | 2026-08-10 | **Leave Webflow.** Rebuild as Next.js | Not an item-count limit (5,400 items would fit Premium's 20,000). Blockers are: nested `/products/{family}/{system}/{type}` URLs are impossible in Webflow; the configurator needs live template queries; live sync would make Webflow a second copy of product data |
| D-2 | 2026-08-10 | **Costing DB stays the system of record** for every dimension, item code and weight | It already is. Never duplicate dimensions into a CMS |
| D-3 | 2026-08-10 | **Website reads a price-free `catalog` projection**, never the costing tables directly | `price_records` mixes publishable `weightKg` with confidential `unitPrice` / `markupPct` / `pricesSnapshot` |
| D-4 | 2026-08-10 | **Same Supabase project, new `catalog` schema, dedicated `web_reader` role** | A separate project costs +$25/mo and a sync job to solve what a DB grant solves. Revisit if an audit requires physical separation |
| D-5 | 2026-08-10 | **Sanity** as the CMS | Schema-as-code means marketing cannot break the structure. Free tier (20 seats / 10,000 docs) covers launch. Storyblok's realistic plan is $349/mo |
| D-6 | 2026-08-10 | **Vercel hosts the public site; Railway keeps the costing app** | Blast radius: a traffic spike on the marketing site must never slow the tool used to price jobs. Railway + Cloudflare is a legitimate alternative (~$5–20/mo, one vendor, Singapore region is closer to SEA customers) — if chosen, run the website as its **own Railway service**, never the costing service |
| D-7 | 2026-08-10 | **The costing app cannot move to Vercel** | `railway.worker.toml` runs a persistent BullMQ `Worker` with `restartPolicyType = "always"`. Vercel has no always-on process. Jobs page through 121,231 SKUs in a single run (ART50) and track `progress`/`processed` in `job_records`; Vercel's ceiling is 800s GA / 30 min beta |
| D-8 | 2026-08-10 | **Deepest indexable browse level is System × Component type**; finish is a facet | 3,045 series×type×grade pages would be near-duplicates |
| D-9 | 2026-08-10 | **Published item codes get indexable URLs; unpublished ones are `noindex`** | Øglænd indexes all 11,244 of theirs successfully. The rule is "no page per *generated* SKU", not "no page per SKU" |
| D-10 | 2026-08-10 | **No prices anywhere on the public site.** Enquiry list is the conversion point | Neither Øglænd nor Atkore shows a price. Both run an RFQ list |
| D-11 | 2026-08-10 | **Drawings are parametric per component type**, not per SKU | ~400 SVGs with placeholder callouts, not 574,609 drawings |
| D-12 | 2026-08-10 | **No dedicated search engine at launch** | Under 10,000 indexed documents. Postgres FTS + `pg_trgm` is enough. Add Meilisearch only if search stops feeling instant |
| D-13 | 2026-08-10 | **Stop the native-Webflow catalogue rebuild** after Phase B of `catalogue/CMS_ARCHITECTURE.md` | Don't build Designer templates for a platform we're leaving. Keep the IA and the written content |
| **D-14** | 2026-08-10 | **Carry the current visual design forward unchanged.** The new site keeps arraymetal.com's five brand colours byte-identical (`--black #0c1b2b`, `--midnight-blue #09318b`, `--slate-grey #5f6e7e`, `--alice-blue #dae5eb`, `--white`), both typefaces (Maison Neue + Halyard Display), the white/Alice-Blue section banding, the 1300 px container, the 6 px button / 20 px card radii and the flat, shadow-free surface language. We are replatforming the **technology**, not rebranding the company. Full spec in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md); tokens extracted from the live stylesheet, not eyeballed | A visitor must not be able to tell the stack changed. The palette is not inferred — Webflow emits a real `:root` block, which is the designer's own token set, so "the same design" is a copyable fact rather than a matter of taste |
| **D-15** | 2026-08-10 | **Six named exceptions to D-14**, each an implementation defect rather than a brand decision: (1) re-skin the `.lr-*` Load Ratings palette to brand · (2) set the brand typeface on `:root` instead of per-class, so unclassed and CMS rich-text output stops falling back to Arial · (3) re-colour `h5` off `--alice-blue` (1.3:1 on white) · (4) drop the dead `border:1px #17a651` · (5) add a `--midnight-blue` `:focus-visible` ring site-wide · (6) collapse 59/60/65/80/110 px section padding to a 3-step scale. Plus an **extension** set — hover/active/wash, a 10-step neutral ramp interpolated between `--slate-grey` and `--black`, and success/warning/danger — because a catalogue has states a brochure site never had | Reproducing these faithfully would be the wrong kind of fidelity. None of them changes how the site *looks* to a customer; (2), (3) and (5) are accessibility fixes. Each still needs written sign-off (§10 item 9) |

---

## 4. Rules that must not be broken

These are the invariants. A change to any of them is an architecture change, not an implementation detail.

1. **No cost or price column ever reaches the website.** The projection carries `weightKg` and nothing else from `price_records`. There is a CI test for this (§8, Phase 9) — it must stay green.
2. **The website never queries `public` schema tables.** Only `catalog`. The `web_reader` role must not be granted anything else.
3. **The CMS stores no numbers with units.** No widths, no thicknesses, no weights. If an editor can type "300 mm" into a field, that field is wrong.
4. **CMS and Postgres join on business codes, never on IDs.** `family_key`, `system_code`, `product_type`, `grade_code`. No Sanity document ID in Postgres; no Postgres row ID in Sanity.
5. **Never write to the costing database from the website.** Read-only, always.
6. **Never modify the costing app's engine, part-number or ART-number logic** to suit the website. If the website needs a different shape, transform it in the projection.
7. **Data is normalized once, in the publish job** — never in a React component. See the known data-quality issues in §7.
8. **Dual-width fittings are never listed.** `UT`, `UCP`, `UT-LC`, `UCP-LC` render a configurator only.
9. **No colour, font size, radius or spacing is ever hardcoded in a component.** Everything resolves through a token in `tokens.css`. If a hex literal appears in a `.tsx` file, it is a bug — that is exactly how the current site ended up with 90+ ad-hoc greys and a second palette inside the Load Ratings embed.
10. **The five brand values in `tokens.css` are byte-identical to [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) §1.** Changing one is a branding decision, not an implementation detail — it needs a new decision row in §3.

---

## 5. Accounts to create

Full reasoning in [stack-and-subscriptions.html](./stack-and-subscriptions.html).

| Service | Plan | Cost/mo | When | Status |
|---|---|---:|---|---|
| Vercel | Pro (Hobby forbids commercial use) | $20 | Phase 4 | new |
| Sanity | Free — 20 seats, 10,000 docs | $0 | Phase 3 | new |
| Resend | Free — 3,000 emails/mo | $0 | Phase 4 | new |
| Supabase | existing project, new schema | $0 extra | Phase 2 | have |
| Cloudflare R2 | pay-as-you-go | ~$5 | Phase 4 | have |
| Cloudflare DNS | free | $0 | Phase 10 | new |
| Railway | costing app unchanged | $0 extra | — | have |
| GitHub, Search Console, Sentry | free | $0 | Phase 2 / 8 / 4 | — |
| ~~Webflow~~ | **cancel after cutover** | −$29 to −$49 | Phase 10 | cancel |

**Net new spend ≈ $25/mo**, roughly offset by cancelling Webflow.

---

## 6. Repository and environment

New repository: **`array-metal-web`** (separate from `array-metal-costing` and from this Webflow repo).

```
array-metal-web/
├── app/
│   ├── (marketing)/              home, about, contact, news
│   ├── products/
│   │   ├── page.tsx                                    L1 family grid
│   │   └── [family]/
│   │       ├── page.tsx                                L2 system comparison
│   │       └── [system]/
│   │           ├── page.tsx                            L3 system hero
│   │           └── [componentType]/page.tsx            L4 product page
│   ├── p/[partNumber]/page.tsx                         L5 item code
│   ├── applications/ industries/ projects/ resources/
│   ├── tools/                    ported calculators
│   └── api/
│       ├── configure/            resolve a part number from dimensions
│       ├── enquiry/              submit enquiry list → Resend
│       └── revalidate/           webhook from Sanity + the publish job
├── lib/
│   ├── catalog.ts                all catalog-schema queries (single entry point)
│   ├── sanity.ts                 CMS client + GROQ queries
│   ├── codes.ts                  slug ⇄ code mapping (product_type ⇄ slug)
│   └── seo.ts                    metadata, schema.org, sitemap helpers
├── components/
│   ├── catalogue/                SkuTable, Configurator, SpecStrip, Drawing
│   └── ui/                       Section, Container, Button, SiteHeader, SectionHeader
├── styles/
│   └── tokens.css                ⚠️ brand tokens — must match DESIGN_SYSTEM.md §1 (Rule 10)
├── public/fonts/                 self-hosted Maison Neue + Halyard (licence — §10 item 8)
├── sanity/schemas/               CMS schema-as-code
└── __tests__/
    └── price-boundary.test.ts    ⚠️ must always pass — see Rule 1
```

**Environment variables** (`array-metal-web`):

```bash
# Catalogue projection — READ ONLY, web_reader role
CATALOG_DATABASE_URL=            # pooler :6543, web_reader, catalog schema only
NEXT_PUBLIC_SUPABASE_URL=
# NOTE: do NOT reuse SUPABASE_SERVICE_KEY from the costing app — it can read prices

# CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_REVALIDATE_SECRET=

# Files
R2_PUBLIC_URL=                   # public bucket/CDN base for PDFs, DWG, STEP

# Enquiries
RESEND_API_KEY=
ENQUIRY_TO_EMAIL=

NEXT_PUBLIC_SITE_URL=https://www.arraymetal.com
```

**Changes to `array-metal-costing`** (small and additive):

- New BullMQ job type `PUBLISH_CATALOG` in `workers/index.ts`
- New `/website` admin section (reuses existing Supabase auth + `ALLOWED_EMAILS` middleware + `audit_logs`)
- New env: none required — reuses `SUPABASE_SERVICE_KEY` and `REDIS_URL`

---

## 7. Known data-quality issues — fix in the publish job

Verified in live data. These will produce nonsense filters if passed through raw.

| Issue | Evidence | Fix in projection |
|---|---|---|
| `gradeCode` polluted with radius tokens | `R30` ×775, `R45` ×534, `R60` ×425 — **1,734 rows** | Quarantine; never expose as a finish. Already noted in `GROK.md` §9 |
| `thicknessMm` overloaded three ways | sheet gauge 0.8–3.0 · wire Ø 3.9–5.9 (AWT) · metal-framing profile dims 100–900 | Split into `thickness_mm` and `wire_dia_mm`; exclude MF from the thickness facet |
| `lengthM` overloaded | 237 distinct values because MF cut lengths (100–6000 mm) are stored as metres | Separate `length_mm` for metal framing; tray/ladder keep 2.44 / 3 / 6 |
| `heightMm` null on tray items | height is implied by series (`ALT25` = 25 mm) | Derive from series in the projection |
| Reducer rows show widths in the thickness column | `RL`/`RR` thickness sets include 100–750 | Investigate before publishing reducers; do not publish until clean |

**Add assertions to the publish job** so bad rows fail the publish rather than reaching the website.

---

## 8. Build phases

Each phase has an acceptance gate. Do not start the next phase until the gate passes.

### Phase 0 — Publish programme *(AML done; other systems pending)*
Sales defines which item codes appear publicly. Output: a rule list per system — grades, widths, thicknesses, lengths.
**Gate:** a written list exists for at least AML. ✅ **Met 2026-08-10** — see D-0. Repeat the same 4-lever exercise (component types × finish × height × standard dimensions) for ACD, ART and the remaining systems before their Phase 2 work starts.

### Phase 1 — Architecture sign-off
Review this plan + ARCHITECTURE.md. Confirm D-5 (Sanity) and D-6 (Vercel).
**Gate:** decisions confirmed in writing.

### Phase 2 — Data projection · 2–3 weeks
- `catalog` schema: `family`, `system`, `component_type`, `sku`, `dimension_template`
- `web_reader` role: `USAGE` on `catalog` only, `SELECT` on its tables, nothing on `public`
- `PUBLISH_CATALOG` job in the existing Railway worker
- Normalization + assertions per §7
- Publish-programme rules from Phase 0 → `is_published`
**Gate:** projection row counts reconcile against costing; `web_reader` provably cannot read `price_records`; published-code count is within the expected band.

### Phase 3 — CMS · 2–3 weeks
- Sanity schemas: `family`, `system`, `componentType`, `material`, `document`, `application`, `industry`, `project`, `standard`, `page`, `post`, `navigation`, `redirect`, `siteSettings`
- Code fields rendered read-only; section library for `page.sections[]`
- Seed AML + ART; migrate editorial from Webflow via the Data API (field map in `catalogue/data/cms-field-map.md`)
- Train marketing
**Gate:** a marketing user edits and publishes an AML page unaided.

### Phase 3.5 — Design system · 1–2 weeks *(runs alongside Phase 3)*
Per D-14/D-15. Nothing in Phase 4 gets built before this exists — every catalogue component consumes it.
Spec: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · visual sheet: [design-system.html](./design-system.html)

- **Resolve the font licence first** (§10 item 8). It is the only item here that can change the outcome
- `tokens.css` — the five brand values verbatim, plus the D-15 extension (states, neutral ramp, spacing/radius/motion scales)
- Self-host the five font files; convert Halyard's `.ttf` → `woff2` (~60% payload cut, zero visual change)
- Primitives: `<Section tone>`, `<Container>`, `<Button variant|size>`, `<SiteHeader>`, `<SectionHeader>`
- Apply the six D-15 fixes; log any waiver in writing
- **Fidelity check:** rebuild one existing arraymetal.com page on the new stack and put it side-by-side with the Webflow original

**Gate:** the side-by-side reads as the same site; `tokens.css` matches DESIGN_SYSTEM.md §1 byte-for-byte; no hex literal in any component; every interactive element has a visible focus ring. Full checklist in DESIGN_SYSTEM.md §8.

### Phase 4 — Catalogue · 5–7 weeks
Levels 1–4 for **Cable Ladder only**, end to end. **Every component is built from the Phase 3.5 primitives — no new colours, no new type sizes.**
- `SkuTable` (server-rendered), `Configurator` (from `dimension_template`), `SpecStrip`, parametric `Drawing`
- Enquiry list + `/api/enquiry` → Resend
- Port the two calculators to React — **re-skinned to brand**, dropping the `.lr-*` palette (D-15 item 1)
- Drawings inherit brand tokens too: `--black` strokes, `--slate-grey` callouts, `--midnight-blue` for the dimension being configured
**Gate:** Cable Ladder complete and reviewed. **Do not start other families before this gate.**

### Phase 5 — Search & filtering · 2 weeks
Postgres FTS over pages; `pg_trgm` part-number lookup across **all** rows so unpublished configurations still resolve.
**Gate:** `APO 300`, `SS316 cable ladder`, `IEC 61537` and a full part number each return the right page.

### Phase 6 — Marketing pages · 3–4 weeks
Home, about, applications, industries, projects, resources, news, navigation.
**Gate:** marketing owns all copy.

### Phase 7 — Remaining families · 3–4 weeks
Cable Tray, Trunking, Wire Mesh, Covers, Metal Framing, Perforated, Grating, Accessories.
**Gate:** all families live.

### Phase 8 — SEO · 1–2 weeks
Metadata, schema.org (`Organization`, `BreadcrumbList`, `Product` without `offers`, `ItemList`), sitemaps split by section, redirect map built from Search Console top pages.
**Gate:** every old URL with traffic has a 301.

### Phase 9 — Testing · 2 weeks
- ⚠️ **`price-boundary.test.ts`** — asserts no cost/price column is reachable from `web_reader`. Blocking.
- Projection integrity, Lighthouse, accessibility, cross-browser, load
**Gate:** all green; price-boundary test in CI.

### Phase 10 — Launch · 1 week
Cloudflare DNS, parallel run, cutover, monitor, then cancel Webflow.
**Gate:** redirects verified in production; Search Console clean.

**Total ≈ 5–7 months at one developer.** Phases 4–7 parallelize with a content lead; Phase 3.5 runs alongside Phase 3 and adds no calendar time.

### ERPNext (deferred)
No integration needed at launch — the costing app already exports Item variants to ERPNext. Later: ERPNext becomes master for `active/discontinued` and UOM, written back nightly. Field-ownership table in [ARCHITECTURE.md](./ARCHITECTURE.md) §8.2.

---

## 9. Definition of done — a component-type page

Use this checklist per Level 4 page before calling it complete.

- [ ] Renders from `catalog` only — no hardcoded dimensions anywhere in the component
- [ ] SKU table server-rendered in the initial HTML (view source shows the part numbers)
- [ ] Filter chips reflect the dimensions actually present, not a hardcoded list
- [ ] Configurator offers only manufacturable combinations, validated against `catalog.sku`
- [ ] Drawing renders with callouts bound to the selected SKU; generic fallback if no system-specific SVG
- [ ] Characteristics table populated from the CMS
- [ ] At least one document attached (datasheet)
- [ ] Breadcrumb + `BreadcrumbList` + `Product` schema
- [ ] Canonical URL set; filtered states `noindex, follow`
- [ ] Enquiry add works from both the table and the configurator
- [ ] No price, cost or margin appears in the HTML or any API response
- [ ] Renders correctly at 360 px wide, and at the 991 / 767 / 479 px breakpoints
- [ ] **Every colour, size, radius and space resolves through a token** — no hex literal in the component (Rule 9)
- [ ] **Built only from the Phase 3.5 primitives** — no bespoke button, no new type size
- [ ] Section banding follows the white / `--alice-blue` alternation (DESIGN_SYSTEM.md §3)
- [ ] Every interactive element — filter chip, sort control, configurator input, enquiry button — has a visible `:focus-visible` ring
- [ ] Placed beside the equivalent Webflow page, it reads as the same site

---

## 10. Open items

| # | Item | Owner | Blocks |
|---|---|---|---|
| 1 | Published programme for ACD, ART and remaining systems (D-0 covers AML only) | Sales + Kai | Phase 2 for those systems |
| 2 | Drawing production — in-house or outsourced? ~400 parametric SVGs | Kai | Phase 4 |
| 3 | Confirm Vercel vs Railway + Cloudflare (D-6) | Kai | Phase 4 |
| 4 | Reducer thickness-column data issue (§7) | Costing | publishing reducers |
| 5 | ETIM classification codes per component type | Engineering | nice-to-have |
| 6 | Which finishes are commercially marketed vs internal-only | Sales | Phase 0 |
| 7 | CAD/STEP coverage — what exists today? | Engineering | Phase 4 |
| 8 | ⚠️ **Webfont licences** — do the Maison Neue (Milieu Grotesque) and Halyard Display (Darden Studio) licences cover self-hosting on Vercel at our traffic? Bought for a Webflow-hosted site. If they cannot be extended, the typographic identity changes and D-14 needs reopening | Kai | **Phase 3.5 → Phase 4** |
| 9 | Sign off the six D-15 divergences and the extended palette, from [design-system.html](./design-system.html) | Kai | Phase 3.5 |
| 10 | Source the **logo as vector** — the live site serves a raster PNG (`6082b498c5995bf2afc8ca75_…@2x.png`) in the navbar | Kai | Phase 3.5 |
| 11 | Confirm the new primary nav. Live is `About · Catalogues · Projects · Contact`; the new IA needs `Products` as the primary entry | Kai + marketing | Phase 6 |

---

## 11. Glossary

For anyone joining who hasn't worked on the costing system.

**Hierarchy**

| Term | Meaning | Example |
|---|---|---|
| Family | Commercial product group | Cable Ladder |
| System | A series design | AML |
| Model | A height variant of a system (`items.series`) | AML100 = AML at 100 mm |
| Component type | A shape within a system (`items.productType`) | E90 = 90° elbow |
| SKU / item code | One orderable part (`items.partNumber`) | `AML100-E90-300-1.5-R30-G` |
| ART no | Internal article number, atomically assigned | 10 402 118 |

**Part number grammar** — `{SERIES}-{TYPE}-{WIDTH}-{THICKNESS}-{LENGTH_OR_RADIUS}-{GRADE}`
Tray adds a fabrication token: `ART50-ST-100-1.5-2.44-PP-G`. Radius token `R30` = 300 mm.

**Common product types**

| Code | Meaning | | Code | Meaning |
|---|---|---|---|---|
| `ST` | Straight | | `RC`/`RL`/`RR` | Reducer centre / left / right |
| `E30`–`E90` | Horizontal elbow | | `LC` | Lipped cover |
| `IR*` / `OR*` | Inside / outside riser | | `SP`,`HSP`,`VSP`,`ESP` | Splice plates |
| `T` / `CP` | Equal tee / cross | | `DI` / `EP` | Divider / end plate |
| `UT` / `UCP` | **Unequal** tee / cross | | `*-LC` | Cover for that fitting |

**Grade codes**

| Code | Finish | | Code | Finish |
|---|---|---|---|---|
| `G` | Hot-dip galvanized | | `A4` | SS316L |
| `G85` | HDG 85 µm | | `A2` | SS304 |
| `GE` | HDG + epoxy | | `A4-TSA` | SS316 + thermal spray aluminium |
| `E` | Epoxy on mild steel | | `A4-VCI` | SS316 + VCI |
| `EG` | Electrogalvanized | | `B5` / `B1` | Aluminium AA5052 / AA1101 |
| `GI` | Galvanized iron | | | |

**Systems** — Ladder: AML (roll-formed), ACD (outward C), AZL (Z-type), APO (perforated rail), ASL (rail-in). Tray: ALT15/25, ART50/75, AMT100/150/200. Also AWT (wire mesh), SCT (trunking), LC (ladder cover), metal framing profiles (AS*, VP*, CB, CF, CJ).

---

## 12. How to keep this current

- New architectural choice → add a row to §3, never edit an old one
- Numbers change → re-query and update §1, note the date
- Phase complete → tick its gate here; detail lives in the phase's own notes
- This file is the index. If a new document is added to `website-platform/`, list it in §0
