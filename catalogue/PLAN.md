# Array Metal — Product Catalogue Plan

**Last updated:** 2026-08-05  
**Site:** [arraymetal.com](https://www.arraymetal.com) · Webflow ID `6082b34dc5995b3e8dc8c73b`  
**Staging subdomain:** [array-metal.webflow.io](https://array-metal.webflow.io)  
**Deploy path:** **Path A — Native Webflow only** (CMS + Designer templates + Collection Lists)  
**Status:** Hierarchy UX approved · CMS schema + Phase 1 draft content done · **templates in progress** (Systems / ProductArrays / Sub Products)

| Doc | Role |
|-----|------|
| **[CMS_ARCHITECTURE.md](./CMS_ARCHITECTURE.md)** | **Next session:** Systems + components CMS reorg (source of truth) |
| [NATIVE_WEBFLOW.md](./NATIVE_WEBFLOW.md) | Earlier native notes; partially superseded by CMS reorg |

---

## 1. Overall goal

Build a **professional industrial product catalogue** (Øglænd-style), where customers:

1. **Browse** product groups  
2. **Open** a system and **filter** components  
3. **Read** specs / load data  
4. Later: **add interest items → send inquiry** (not payment checkout)

**Positioning:** technical library + RFQ list — **not** retail e‑commerce.

```text
Discover (hierarchy) → Evaluate (specs) → Select (inquiry list) → Request quote
```

---

## 2. UX model (approved)

### Reference

| Source | What we take |
|--------|----------------|
| **[Øglænd products](https://www.oglaend-system.com/products/)** | Primary IA — overview → group → system → article |
| **[Øglænd LOE system](https://www.oglaend-system.com/products/cableladders/loe/)** | Filters on **system page** + overview + design + materials + downloads |
| **[Atkore products](https://www.atkore.com/products)** | Clean category cards |
| **Array Metal today** | Deepen existing product CMS structure |

### Hierarchy (source of truth)

```text
Level 1  Products overview     →  /productscms              ProductArrays list
Level 2  Product group         →  /products/cable-ladder    ProductArrays template
Level 3  System / series       →  /systems/aml              Systems (NEW collection)
           ├── Filtered component grid (product type + search)
           ├── System overview · design · materials · load ratings
Level 4  Component / article   →  /sub-products/…           Sub Products (components only)
           └── Specs · characteristics · related (same system)
```

**Each series (AML, ACD, AZL…) owns its own elbows, covers, splices** — not a global mixed pile.

**Filters live on the system page** — not a global “all SKUs” marketplace.

Full reorg plan: **[CMS_ARCHITECTURE.md](./CMS_ARCHITECTURE.md)**

### Explicitly rejected

| Rejected | Why |
|----------|-----|
| Series hubs + components mixed in Sub Products + `is-system` | Wrong CMS model; superseded by Systems collection |
| Full-catalogue HtmlEmbed / SPA as production | Not maintainable in Webflow; not CMS-editable |
| Draft page `/demo-product-catalogue` as deliverable | Same as local HTML — abandoned for deploy |
| Flat “all products + filters” storefront as main UX | Wrong IA for Array Metal |
| Cart-first / retail checkout | Business is RFQ |
| One CMS row per length (100…6000 mm) | Use base product + length rules in Phase 2 |

---

## 3. Phases

### Phase 0 — Align *(done)*

- [x] Inquiry-only (no payment)  
- [x] Hierarchy = Oglaend-style  
- [x] Prefer staging over reckless live edits  
- [x] First families: **Cable Ladder + Cable Tray**  
- [x] UX hierarchy approved (local demo)  
- [x] **Decision: Path A native Webflow** (not embed)

### Phase 1 — Native catalogue

| # | Work | Status |
|---|------|--------|
| 1.1–1.5 | CMS fields, seed, local UX demo | **Done** (reference / foundation) |
| 1.6 | ~~Draft embed page~~ | **Cancelled** |
| 1.7 | Experimental `is-system` dual layout on Sub Products | **Superseded** — do not continue as final model |
| **1.8** | **CMS reorg: Systems collection + components only** | **Schema + AML/ART drafts done** |
| 1.9 | ProductArrays template → Systems list | **In progress** (section + cards; needs family=current filter in Designer) |
| 1.10 | Systems template + Sub Products component template | **In progress** (Systems built; Sub Products article-only + related list) |
| 1.11 | QA on `array-metal.webflow.io` | After 1.9–1.10 + publish drafts |
| 1.12 | Publish production after sign-off | Last |

**Phase 1 outcome:** Engineers drill Cable Ladder/Tray on **real Webflow URLs** with clean CMS (Family → System → Component).

### Phase 2 — Inquiry list *(after Phase 1)*

| # | Work | Status |
|---|------|--------|
| 2.1 | Configure-and-add (length / material / qty) | Pending |
| 2.2 | Header “My inquiry” + `/my-inquiry` | Pending |
| 2.3 | Multi-line RFQ to sales | Pending |

### Phase 3 — Scale & polish *(later)*

- Remaining product groups  
- More models via CSV  
- Optional PDF inquiry  

---

## 4. Safety: where we work

| Environment | Role | Edits live products? |
|-------------|------|----------------------|
| Local `catalogue/demo/*.html` | UX reference only | No |
| Designer templates (ProductArrays / Sub Products) | **Real build** | Yes — use staging publish first |
| CMS drafts | Content prep | No until publish |
| Staging `array-metal.webflow.io` | QA | Shared site |
| Live `arraymetal.com` | Production | **Only after approval** |

**One Webflow site.** Native templates affect all items in that collection — stage carefully.

---

## 5. Technical foundations

### CMS collections (target)

| Collection | Role |
|------------|------|
| ProductArrays | Level 1–2 families (Cable Ladder, Tray…) |
| **Systems** *(new)* | Level 3 series (AML, ACD, AZL, ART…) |
| Sub Products | Level 4 **components only** (ref → System) |
| Materials | Finishes |
| Catalogues | PDF downloads |
| Load Ratings | SWL data (`/load-ratings`) |
| Ecommerce | **Unused** for RFQ path |

See [CMS_ARCHITECTURE.md](./CMS_ARCHITECTURE.md) for fields and migration.

### Filters

- **Server/static:** Collection List filters (`series`, `is-system`, `catalogue-visible`, family ref)  
- **Interactive UI:** [Finsweet Attributes List Filter](https://finsweet.com/attributes/list-filter) on system pages  

### Configurable products rule

Store **base products + rules** (length min/max/step, materials). Customer configures on inquiry — **not** one CMS row per mm length.

### Repo map

| Path | Purpose |
|------|---------|
| [PLAN.md](./PLAN.md) | This plan |
| [NATIVE_WEBFLOW.md](./NATIVE_WEBFLOW.md) | **Designer + CMS build guide** |
| [README.md](./README.md) | Short status |
| [data/cms-field-map.md](./data/cms-field-map.md) | Field slugs + option IDs |
| [data/products-seed.csv](./data/products-seed.csv) | Content seed |
| `demo/*.html` | UX reference only — **not production** |

---

## 6. Current next actions

**Stop:** further work on mixed Sub Products + `is-system` as the long-term model.

**Execute [CMS_ARCHITECTURE.md](./CMS_ARCHITECTURE.md) with locked scope:**

1. [x] Confirm decisions: per-system fittings · AML + ART minimal · `/systems/{short-slug}`  
2. [x] Create **Systems** collection + fields (`6a72d851ab5b05191add4ce9`)  
3. [x] Add Sub Products → **System** reference; draft AML/ART Systems + wire AML components  
4. [~] Templates: ProductArrays / Systems / Sub Products — **structure + CMS binds built**; finish Designer filters (current item)  
5. [ ] Publish Phase 1 drafts (AML, ART + AML components) → staging subdomain only  
6. [ ] Unpublish old hub Sub Products after Systems templates work; deprecate `is-system`  
7. [ ] Production only after sign-off  

**Designer manual (MCP cannot bind “equals current item” on Reference filters):**

| Template | Collection List | Set filter in Designer |
|----------|-----------------|------------------------|
| Systems | Sub Products | `System` **equals** current System |
| ProductArrays | Systems | `Family` **equals** current ProductArray |
| Sub Products (related) | Sub Products | `System` **equals** current item’s System |

**Out of first ship:** APO, ACD, AZL, AMT (unless ART swapped), other families.

---

## 7. Decisions (locked 2026-08-05)

| Decision | Choice |
|----------|--------|
| Systems URL | `/systems/aml`, `/systems/art` (short slugs) |
| Phase 1 series | **AML** + **ART** only |
| Fittings | Per-system CMS items |
| Finsweet | After static System→component grid works |
| Live custom domain | After staging sign-off only |

---

## 8. Success criteria

**Phase 1 done when:**

- Hierarchy is real Webflow pages (not embed SPA)  
- Group → system → filter → article works on staging  
- Specs + characteristics come from CMS  
- Editors can add products in CMS and Publish  
- Live custom domain updated only after explicit approval  

---

## 9. Contacts / IDs

| Resource | ID / URL |
|----------|----------|
| Site | `6082b34dc5995b3e8dc8c73b` |
| ProductArrays | `6082b9dcc5995bc2adc8f181` |
| Sub Products | `60add788ed4fb37a6e6a4798` |
| Materials | `60939ab96b35f30e93874050` |
| Production | https://www.arraymetal.com |
| Staging | https://array-metal.webflow.io |
