# Array Metal — Product Catalogue Plan

**Last updated:** 2026-08-04  
**Site:** [arraymetal.com](https://www.arraymetal.com) · Webflow ID `6082b34dc5995b3e8dc8c73b`  
**Staging subdomain:** [array-metal.webflow.io](https://array-metal.webflow.io)  
**Status:** Phase 1 in progress — hierarchy approved; live product pages not redesigned yet

---

## 1. Overall goal

Build a **professional industrial product catalogue** (like Øglænd System / Atkore category depth), where customers:

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
| **[Øglænd LOE system](https://www.oglaend-system.com/products/cableladders/loe/)** | Filters on **system page** (System, Product type, counts) + overview + design + materials + downloads |
| **[Atkore products](https://www.atkore.com/products)** | Clean category cards / professional industrial presentation |
| **Array Metal today** | Already closest to Oglaend — deepen it, don’t replace with a flat shop |

### Hierarchy (source of truth)

```text
Level 1  Products overview     →  /productscms
Level 2  Product group         →  /products/cable-ladder , /products/cable-tray-system , …
Level 3  System page           →  AML / APO / ACD (ladder) · ART / AMT (tray)
           ├── Filtered article grid  (System + Product type + search)
           ├── System overview
           ├── Design details
           ├── Materials / certifications
           └── Downloads + load ratings link
Level 4  Article / component   →  straight, elbow, splice, AML150, …
           └── Characteristics table + related items
```

**Filters live on the system page** — not a global “all SKUs” marketplace.

### Explicitly rejected

| Rejected | Why |
|----------|-----|
| Flat “all products + filters” storefront as main UX | Unprofessional for Array Metal; wrong IA |
| Cart-first / retail checkout | Business is RFQ, not online payment |
| One CMS row per length (100…6000 mm) | Unmaintainable — use base product + config rules later |
| Editing live product templates before draft approval | Risk to production |

---

## 3. Phases

### Phase 0 — Align *(done)*

- [x] Confirm inquiry-only (no payment)  
- [x] Confirm hierarchy = Oglaend-style (not flat marketplace)  
- [x] Prefer draft / staging over live product edits  
- [x] First families: **Cable Ladder + Cable Tray**  

### Phase 1 — Spec-rich catalogue hierarchy *(current)*

**Goal:** Professional browse → system → filter → specs. No inquiry list yet.

| # | Work | Status |
|---|------|--------|
| 1.1 | CMS fields on Sub Products (series, type, family, specs, characteristics, load link, length rules, catalogue-visible) | **Done** |
| 1.2 | CMS fields on ProductArrays (design details, standards, heights/widths, load link, family-code) | **Done** |
| 1.3 | Seed Cable Ladder / Tray families + AML / APO / ACD / ART50 series (published) | **Done** |
| 1.4 | Draft model/fitting items (AML100/125/150, AMT100, elbow, splice, cover) | **Done** (still drafts) |
| 1.5 | Field map + seed CSV in repo | **Done** |
| 1.6 | Local Oglaend-style hierarchy demo | **Done** — approved UX |
| 1.7 | Draft Webflow page for catalogue prototype (does **not** edit live products) | **Todo** |
| 1.8 | Wire system pages in Designer (AML/APO/ACD filtered grid + overview blocks) | **Todo** |
| 1.9 | Article / characteristics template | **Todo** |
| 1.10 | Enrich Level 1–2 templates (overview + system cards) without breaking live | **Todo** |
| 1.11 | QA on staging subdomain; publish only when approved | **Todo** |

**Phase 1 outcome:** Engineers can drill down Cable Ladder/Tray like Oglaend and see real specs + load ratings links.

### Phase 2 — Inquiry list *(after Phase 1)*

| # | Work | Status |
|---|------|--------|
| 2.1 | Configure-and-add (length / material / qty from CMS rules) | Pending |
| 2.2 | Header “My inquiry” badge + `/my-inquiry` page | Pending |
| 2.3 | Multi-line RFQ form payload to sales | Pending |
| 2.4 | Optional Sheet / notification automation | Pending |

**Labeling:** “Add to inquiry” / “My inquiry” — not cart / checkout.

### Phase 3 — Scale & polish *(later)*

- Remaining product groups (trunking, cleats, perforated, …)  
- More models via CSV  
- Project groups in inquiry list  
- Optional PDF of inquiry  
- Optional load-class helpers from Load Ratings data  

### Deferred indefinitely

- Webflow Ecommerce payment checkout  
- Customer accounts / multi-device saved lists  
- Full ERP sync  
- One CMS item per length variant  

---

## 4. Safety: where we work

| Environment | Role | Edits live products? |
|-------------|------|----------------------|
| Local demo `catalogue/demo/catalogue-demo.html` | UX review | No |
| **Draft Webflow page** (e.g. `/demo-product-catalogue`) | Webflow prototype | **No** — separate page |
| CMS drafts (unpublished items) | Content prep | No until publish |
| Staging subdomain `array-metal.webflow.io` | Optional preview publish | Shared site; be careful with CMS publish |
| Live `arraymetal.com` product pages/templates | Production | **Only after approval** |

**Important:** A draft page does **not** change `/productscms` or `/products/cable-ladder`. Only editing those pages/templates (or publishing bound CMS/styles) affects them.

**No separate demo Webflow site exists** — only one site (Array Metal). Full site duplicate is optional isolation, not required if we use drafts.

---

## 5. Technical foundations

### CMS collections

| Collection | Role |
|------------|------|
| ProductArrays | Level 1–2 groups |
| Sub Products | Systems + articles (series, type, specs) |
| Materials | Finishes (filter + display) |
| Catalogues | PDF downloads |
| Load Ratings | SWL data (also embed on `/load-ratings`) |
| Ecommerce Products/SKUs | **Unused** for RFQ path |

### Key Sub Products fields (added)

`base-code`, `series`, `product-type`, `product-family`, `materials`, `width-options`, `height`, `loading-depth`, `thickness`, `standard`, `nema-class`, `safety-factor`, `unit`, `sort-order`, `catalogue-visible`, `characteristics` (Name\|Value lines), `long-description`, `load-ratings-link`, length config fields for Phase 2.

### Configurable products rule

Store **base products + rules** (length min/max/step, materials). Customer configures on inquiry — do **not** create one CMS row per mm length.

### Repo map

| Path | Purpose |
|------|---------|
| `catalogue/PLAN.md` | **This plan** (overall + current) |
| `catalogue/README.md` | Phase 1 short status |
| `catalogue/demo/catalogue-demo.html` | **Approved** hierarchy UX demo |
| `catalogue/data/cms-field-map.md` | Field slugs + option IDs |
| `catalogue/data/products-seed.csv` | Content seed spreadsheet |
| `demo/inquiry-cart-demo.html` | Older RFQ cart prototype (Phase 2 reference only) |
| `Cable Ladder Load Ratings/` | Live load ratings embed |
| `Perforated Metal Calculator/` | Live OA calculator embed |

---

## 6. Current next actions (checklist)

Do these in order:

1. [ ] **Create draft Webflow page** for catalogue prototype (e.g. `/demo-product-catalogue`) — no live product edits  
2. [ ] Embed or rebuild Oglaend-style hierarchy on that draft (match approved local demo)  
3. [ ] Review on draft / optional staging publish — get sign-off  
4. [ ] Design system pages for **AML → APO → ACD** (filters + overview + design + materials + load ratings)  
5. [ ] Article characteristics layout  
6. [ ] Promote approved structure to live Cable Ladder / Tray templates carefully  
7. [ ] Publish remaining draft CMS models when images/content ready  
8. [ ] Only then start **Phase 2** inquiry list  

---

## 7. Open decisions (still free)

| Decision | Notes |
|----------|--------|
| Draft page slug name | Suggested: `demo-product-catalogue` |
| Publish draft models (AML100…) now or after images | Currently drafts without images |
| When to touch live Cable Ladder template | After draft demo sign-off |
| Inquiry form recipients | Confirm email/inbox for Phase 2 |
| Full site duplicate vs draft-only | Draft-only recommended unless isolation required |

---

## 8. Success criteria

**Phase 1 done when:**

- Hierarchy matches Oglaend (overview → group → system with filters → article specs)  
- Cable Ladder + Cable Tray feel professional (real images, specs, load links)  
- Live site only updated after explicit approval  
- No payment / no cart as primary UX  

**Phase 2 done when:**

- Multi-line inquiry from configured products reaches sales cleanly  

---

## 9. Contacts / IDs (quick ref)

| Resource | ID / URL |
|----------|----------|
| Site | `6082b34dc5995b3e8dc8c73b` |
| ProductArrays | `6082b9dcc5995bc2adc8f181` |
| Sub Products | `60add788ed4fb37a6e6a4798` |
| Materials | `60939ab96b35f30e93874050` |
| Cable Ladder item | `6082ba262c6616db16c2952b` |
| Cable Tray item | `6082ba2076a98ddf2a8fbf76` |
| Production | https://www.arraymetal.com |
| Staging subdomain | https://array-metal.webflow.io |
