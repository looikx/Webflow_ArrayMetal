# CMS Architecture — Systems Collection Reorg

**Status:** Decisions locked · CMS schema + Phase 1 draft content done · **templates scaffolded (2026-08-05)** · Designer “equals current” filters + staging publish remain  

### Template IDs

| Template | Page ID | Notes |
|----------|---------|--------|
| Systems | `6a72d851ab5b05191add4d11` | Hero + overview + components list (`am-cat-*`) |
| ProductArrays | `6082b9dcc5995b5b55c8f183` | New “Systems in this product group” section |
| Sub Products | `60add788ed4fb3052b6a479a` | Article layout; system dual-layout hidden; related list moved |

**API limitation:** Reference filters cannot use bound “current item” via MCP. In Designer set:

- Systems list → Sub Products: **System equals Current System**  
- ProductArrays list → Systems: **Family equals Current ProductArray**  
- Sub Products related list: **System equals Current item’s System**  

Interim filters: `catalogue-visible = On`, `system`/`family` **is set**, `is-system = Off` where relevant.

**Decision date:** 2026-08-05  
**Site:** Array Metal · `6082b34dc5995b3e8dc8c73b`  
**Deploy path:** Path A — native Webflow only (no catalogue HtmlEmbed SPA)

### Locked decisions (2026-08-05)

| Decision | Choice |
|----------|--------|
| Fittings ownership | **Per-system** (AML elbow under AML only; no global Other bucket) |
| Phase 1 content | **Minimal: AML + one tray (ART)** — expand APO/ACD/AMT later |
| Systems URL | **`/systems/{short-slug}`** e.g. `/systems/aml` |
| Production | Staging QA only until explicit sign-off |

### Live inventory snapshot (2026-08-05, post template scaffold)

| Item | Status | Notes |
|------|--------|-------|
| Systems collection | **Live** `6a72d851ab5b05191add4ce9` | AML + ART drafts |
| AML / APO / ACD / ART50 hubs (Sub Products) | **Published**, `is-system=true` | Still live; unpublish after Systems QA |
| AML100/125/150, elbow/cover/splice | **Draft**, System → AML | Wired |
| Old 2021 fittings | Published, `catalogue-visible=false` | Leave hidden |

Family item IDs: Cable Ladder `6082ba262c6616db16c2952b` · Cable Tray `6082ba2076a98ddf2a8fbf76`

**Related docs**

| Doc | Role |
|-----|------|
| [PLAN.md](./PLAN.md) | Overall phase plan |
| [NATIVE_WEBFLOW.md](./NATIVE_WEBFLOW.md) | Earlier native build notes (partially superseded by this reorg) |
| [data/cms-field-map.md](./data/cms-field-map.md) | Current field map (update after migration) |

---

## 1. Problem

Sub Products currently **mixes two entity types**:

1. **Series / system hubs** — AML, ACD, AZL (and tray series)  
2. **Components** — elbow, cover, splice, straight, height models (AML100…)

That was papered over with `is-system`. It is wrong for editors and for Øglænd-style IA:

- Each ladder/tray **series** has **its own** elbows, covers, splice plates, etc.  
- Series pages and component pages are different jobs  
- Filtering “same series” across one mixed collection is fragile  

**Do not extend the mixed Sub Products + `is-system` model further.** Next session implements this plan instead.

---

## 2. Goal (Øglænd-shaped)

```text
Family (group)     →  ProductArrays     e.g. Cable Ladder, Cable Tray
System (series)    →  Systems (NEW)     e.g. AML, ACD, AZL, ART…
Component (part)   →  Sub Products      e.g. elbow, cover, splice under AML only
```

Customer flow:

```text
Products overview → Group → System (design + filters) → Component (specs)
```

Positioning unchanged: technical library + RFQ later — not ecommerce checkout.

---

## 3. Target CMS model

### 3.1 ProductArrays (keep) — Level 1–2 families

**Role:** Product groups only.

| Keep / use | Notes |
|------------|--------|
| Name, slug, image, descriptions | Existing |
| Family code, standards/heights summaries | Optional group copy |
| Design details at group level | Optional; prefer system-level design |

**Do not** use ProductArrays as the system (AML) page.

### 3.2 Systems (NEW collection) — Level 3 series

**Suggested names**

| Setting | Value |
|---------|--------|
| Display name | Systems |
| Singular | System |
| Slug | `systems` |
| Template path | `/systems/{slug}` |

**One CMS item per series design** (not per fitting).

| Field | Type | Purpose |
|-------|------|---------|
| Name | PlainText | AML Cable Ladder |
| Slug | PlainText | `aml` |
| Family | Reference → ProductArrays | Cable Ladder / Cable Tray |
| Image | Image | Hero / card |
| Short description | PlainText | Card blurb |
| Overview | RichText | System intro |
| Design details | RichText | Øglænd-style design notes |
| Standards summary | PlainText | Badge line |
| Heights available | PlainText | e.g. 100 / 125 / 150 mm |
| Widths available | PlainText | e.g. 150–900 mm |
| Materials | MultiRef → Materials | Finishes |
| Load ratings link | Link | `/load-ratings` |
| Catalogues | MultiRef → Catalogues | PDFs |
| Sort order | Number | Card order on group page |
| Catalogue visible | Switch | Show in grids |

**Initial ladder systems (confirm in session):** AML, ACD, AZL, APO (if still used)  
**Initial tray systems:** ART, AMT (and others as needed)

### 3.3 Sub Products (repurpose) — Level 4 components only

**Every row is a part belonging to one System.**

| Field | Type | Purpose |
|-------|------|---------|
| Name, slug, image | Existing | |
| **System** | **Reference → Systems** | **Required** — parent series |
| Product type | Option | Elbow, Cover, Splice, Straight ladder/tray… |
| Base code, height, widths, standard, NEMA, materials… | Existing catalogue fields | Specs |
| Characteristics | PlainText `Name\|Value` lines | Detail table |
| Catalogue visible, sort order | Existing | Lists |
| Length config fields | Existing | Phase 2 inquiry only |

**Remove / stop using after migration**

| Field / pattern | Action |
|-----------------|--------|
| `is-system` | Deprecate; delete after cleanup |
| Series option as the only parent | Prefer **System** reference; option can remain for soft filters if useful |
| Hub rows (AML Cable Ladder as Sub Product) | Delete or archive after content moved to Systems |

**Straight height models** (AML100 / 125 / 150): stay as **components** under System = AML, product type Straight ladder (or equivalent) — **not** Systems items.

**Do not** create one CMS row per mm length.

### 3.4 Materials, Catalogues, Load Ratings

Keep as today. Systems and components link out; no structural change required for Phase 1.

---

## 4. URLs and templates (native Webflow)

```text
Level 1  /productscms
           Collection List → ProductArrays

Level 2  /products/{slug}              ProductArrays template
           Collection List → Systems
             filter: Family = Current ProductArray
             filter: Catalogue visible = on
             sort: Sort order

Level 3  /systems/{slug}               Systems template (NEW)
           Hero + overview + design + materials + downloads
           Collection List → Sub Products
             filter: System = Current System
             filter: Catalogue visible = on
             sort: Sort order
           Interactive filters (later): product type + search (Finsweet)

Level 4  /sub-products/{slug}          Sub Products template (simplify)
           Component only: image, specs, characteristics table, related
           Related list: same System, exclude current
```

**Path B later (optional):** prettier nested URLs under `/products/...` if Webflow structure allows; not required for v1.

---

## 5. What each system owns (content rule)

For **AML Cable Ladder** (example):

| Belongs on System page | Belongs as Sub Product under AML |
|------------------------|----------------------------------|
| Series story, NEMA/IEC overview | Straight sections (per height if needed) |
| Design details, heights/widths range | Elbows |
| Materials / certificates links | Covers, clips |
| Load ratings link for series | Splice plates |
| Component grid + type filters | Tees, crosses, risers, accessories… |

**ACD / AZL** get their **own** elbows, covers, splices (separate CMS items, System = ACD or AZL). Do not share one “global elbow” across series unless specs are truly identical and product policy allows it (default: **per-system items**).

---

## 6. Explicitly rejected

| Rejected | Why |
|----------|-----|
| Series hubs + components in one collection + `is-system` | Mixed types; bad CMS UX |
| Flat “all SKUs + filters” as main browse | Not industrial IA |
| Full-catalogue HtmlEmbed SPA as production | Not CMS-native |
| One row per cut length | Unmaintainable |
| Ecommerce Products/SKUs for RFQ path | Unused |

---

## 7. Migration plan (next session)

Do in order. Prefer **staging-only publish** until QA.

### Phase A — Schema

1. Create **Systems** collection + fields (§3.2)  
2. Add Sub Products field **System** → Reference Systems  
3. Do **not** delete old fields until data is re-linked  

### Phase B — Content

1. Create Systems items for each series (AML, ACD, AZL, tray series…)  
2. Copy overview/image/load link from old hub Sub Products where they exist  
3. For every component Sub Product: set **System** ref  
4. Publish systems + components needed for Cable Ladder (then Tray)  
5. Archive/unpublish/delete old hub Sub Products (AML Cable Ladder as Sub Product, etc.)  

### Phase C — Templates

1. **Systems template** — full Level 3 page (overview + Collection List of components)  
2. **ProductArrays template** — list **Systems** by family (not mixed Sub Products)  
3. **Sub Products template** — **component only** (remove dual system/article layout and `is-system` visibility hacks)  
4. Optional: Finsweet product-type filters on Systems template  

### Phase D — Cleanup

1. Deprecate `is-system`  
2. Update [data/cms-field-map.md](./data/cms-field-map.md)  
3. Split seed into systems + components (CSV or CMS export)  
4. Unpublish `/demo-product-catalogue` if still present  
5. Staging QA → production only after sign-off  

### Phase E — Phase 2 (later)

Inquiry list / configure length — still **after** browse hierarchy works on Systems + components.

---

## 8. Seed / data files (after reorg)

| File (planned) | Contents |
|----------------|----------|
| `data/systems-seed.csv` | AML, ACD, AZL, ART… |
| `data/components-seed.csv` | Parts with `system_slug` + product_type |
| `data/products-seed.csv` | Legacy mixed seed — replace after migration |

---

## 9. Open decisions (resolve next session)

| # | Decision | Default if undecided |
|---|----------|----------------------|
| 1 | Systems URL: `/systems/{slug}` vs nested under products | **`/systems/{slug}`** for speed |
| 2 | Full ladder series list | Start: **AML, ACD, AZL** (+ APO if still sold) |
| 3 | Full tray series list | Start: **ART, AMT** |
| 4 | Straight heights as separate components vs one “Straight” + height field | Prefer **per-height components** where SWL differs (AML100/125/150) |
| 5 | Keep Option field `series` on components after System ref exists | Optional soft filter; System ref is source of truth |
| 6 | Wipe vs keep experimental Sub Products template dual layout | **Replace** with component-only template |

---

## 10. Success criteria

- Editors never create a “series hub” inside Sub Products  
- Group page shows only Systems cards  
- System page shows only that system’s components  
- AML elbow ≠ ACD elbow (separate items, correct System)  
- Specs/characteristics on component pages come from CMS  
- Staging QA on `array-metal.webflow.io` before custom domain  
- No production catalogue HtmlEmbed SPA  

---

## 11. Session handoff checklist

Start next session with:

1. Read **this file** (`CMS_ARCHITECTURE.md`)  
2. Confirm open decisions §9  
3. Create Systems collection  
4. Migrate hubs → Systems; wire System ref on components  
5. Rebuild three templates (ProductArrays / Systems / Sub Products)  
6. Staging publish only  

**Do not** resume `is-system` dual-layout work as the long-term solution.

---

## 12. Site IDs (quick ref)

| Resource | ID |
|----------|-----|
| Site | `6082b34dc5995b3e8dc8c73b` |
| ProductArrays | `6082b9dcc5995bc2adc8f181` |
| Sub Products | `60add788ed4fb37a6e6a4798` |
| Materials | `60939ab96b35f30e93874050` |
| Sub Products template page | `60add788ed4fb3052b6a479a` |
| ProductArrays template page | `6082b9dcc5995b5b55c8f183` |
| Staging | https://array-metal.webflow.io |
| Production | https://www.arraymetal.com |
