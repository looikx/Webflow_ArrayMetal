# Native Webflow Catalogue — Path A

**Decision:** No HtmlEmbed prototypes. Catalogue ships as **CMS collections + Designer templates + Collection Lists**. Content is edited in Webflow; Publish deploys it.

**Site:** `6082b34dc5995b3e8dc8c73b` · Staging: https://array-metal.webflow.io  

> **Superseded structure (2026-08-05):** Do **not** continue mixed Sub Products + `is-system` as the final model.  
> **Next session source of truth:** [CMS_ARCHITECTURE.md](./CMS_ARCHITECTURE.md) — Family → **Systems** → components.  
> This file remains historical notes for styles/scripts/Finsweet; IA and migration live in CMS_ARCHITECTURE.

---

## 1. Information architecture (live URLs)

```text
Level 1  /productscms
           Collection List → ProductArrays (all groups)

Level 2  /products/{slug}          e.g. /products/cable-ladder
           ProductArrays template
           → system cards (Sub Products where is-system = true, same family)

Level 3  /sub-products/{slug}      e.g. /sub-products/aml-cable-ladder
           Sub Products template · SYSTEM layout (is-system = true)
           → filter UI + article Collection List (same series)
           → overview · design · materials · load ratings · downloads

Level 4  /sub-products/{slug}      e.g. /sub-products/aml150-cable-ladder
           Sub Products template · ARTICLE layout (is-system = false)
           → image · meta · characteristics table · related · load link
```

Same collection template for Levels 3–4; **two conditional sections** driven by CMS field `is-system`.

---

## 2. CMS model (keep + one addition)

### ProductArrays (`products`) — Level 2 groups

| Field | Use |
|-------|-----|
| Name, slug, image, descriptions | Existing |
| Sub Products (MultiRef) | Optional; prefer filter-by-family lists instead of hand-picking |
| Family Code `family-code` | `ladder` / `tray` |
| Standards / heights / widths / design / load link / catalogues | Group-level copy if needed |

### Sub Products (`sub-products`) — systems + articles

| Field | Use |
|-------|-----|
| **Is System** `is-system` | **ADD** Switch — true = Level 3 hub (AML/APO/ACD/ART…) |
| Series `series` | AML, APO, ACD, ART, AMT… (filter + grouping) |
| Product Type `product-type` | Straight ladder, elbow, splice… |
| Product Family `product-family` | Ref → ProductArrays |
| Catalogue Visible `catalogue-visible` | Only true items in grids |
| Base Code, height, widths, standard, NEMA, materials… | Cards + filters |
| Characteristics `characteristics` | `Name\|Value` lines → table on article |
| Long description, image, load-ratings-link | Body content |
| Sort Order | List sort ascending |

**System hub items (examples):** AML Cable Ladder, APO Cable Ladder, ACD Cable Ladder, ART50 Cable Tray  
**Article items (examples):** AML100, AML150, Elbow, Splice, Cover  

Set `is-system = true` only on hubs. Articles keep `is-system = false` (or empty).

### Do not use for catalogue path

- Ecommerce Products / SKUs  
- Static HtmlEmbed of full catalogue SPA  

---

## 3. Template build (Designer)

### 3.1 ProductArrays template — group page

**Goal:** Cable Ladder page lists systems (AML / APO / ACD), not a flat dump of every fitting.

1. Keep hero + existing group copy.
2. Section **Systems**
   - Collection List → **Sub Products**
   - Filter: `product-family` = Current ProductArrays item  
   - Filter: `is-system` = Yes  
   - Filter: `catalogue-visible` = Yes  
   - Sort: `sort-order` ascending  
   - Card: image, name, sub-description, series badge → link to Sub Product
3. Optional secondary list later: “Featured fittings” (not required for v1).
4. Materials / certificates blocks can stay as today.

### 3.2 Sub Products template — dual layout

#### A. SYSTEM layout (conditional: `is-system` = Yes)

```text
[ Breadcrumb: Products / {family} / {name} ]
[ H1 name · short description · hero image ]
[ Layout: sidebar filters | results ]
   Filters (static UI + Finsweet Attributes — see §4):
     - Product type (checkboxes from list or manual labels)
     - Search
     - Clear
   Results: Collection List → Sub Products
     Filter: series = Current item series
     Filter: is-system = No
     Filter: catalogue-visible = Yes
     Sort: sort-order
     Card: image, name, base-code, product-type, height
[ Overview ] long-description
[ Design details ] rich text or design-details if present
[ Materials ] multi-ref chips
[ Downloads / Load ratings ] link field
```

#### B. ARTICLE layout (conditional: `is-system` ≠ Yes)

```text
[ Breadcrumb: Products / {family} / {series hub if known} / {name} ]
[ Media | body ]
   Image
   Name, base-code, series, product-type pills
   Specs: height, loading-depth, thickness, widths, standard, NEMA, safety factor
   Characteristics table (see §5)
   Long description
   Load ratings link
[ Related ] Collection List same series, exclude current, limit 8
```

---

## 4. Filters (native CMS list + Finsweet)

Webflow’s built-in Collection List filters are **static** (set in Designer). Interactive “Product type + search” needs **Finsweet Attributes List Filter** (standard for native Webflow catalogues).

### Site-wide script (Project Settings → Custom Code → Footer)

```html
<script async src="https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js"
  fs-list></script>
```

### On system layout

| Element | Attribute | Value |
|---------|-----------|--------|
| Collection List (wrapper) | `fs-list-element` | `list` |
| Each filter checkbox (product type) | `fs-list-element` | `filter` |
| | `fs-list-field` | `product-type` |
| | `fs-list-value` | e.g. `Straight ladder` (must match CMS option label) |
| Search input | `fs-list-element` | `search` |
| Clear control | `fs-list-element` | `clear` |
| Empty state div | `fs-list-element` | `empty` |

On each **card root**, ensure the filterable fields exist as plain text in the CMS bindings (name, product-type, base-code) so search/filter can match.

**Counts per filter option:** optional Finsweet count attributes later; not required for v1.

Reference: https://finsweet.com/attributes/list-filter

---

## 5. Characteristics table (native)

`characteristics` is multi-line plain text:

```text
Model|AML150
SWL @ 3 m|468 kg/m
```

**Option A (preferred for editors):** keep plain text; small page script splits lines into a table (only on article template). No embed catalogue — just a table renderer for one field.

**Option B:** migrate to a nested collection later (heavier).

Minimal footer script (article pages only is fine):

```html
<script>
document.querySelectorAll('[data-am-characteristics]').forEach(function (el) {
  var raw = (el.textContent || '').trim();
  if (!raw) return;
  var table = document.createElement('table');
  table.className = 'am-char-table';
  raw.split(/\n+/).forEach(function (line) {
    var p = line.split('|');
    if (p.length < 2) return;
    var tr = document.createElement('tr');
    tr.innerHTML = '<th>' + p[0].trim() + '</th><td>' + p.slice(1).join('|').trim() + '</td>';
    table.appendChild(tr);
  });
  el.replaceWith(table);
});
</script>
```

In Designer: bind a Text block to `characteristics`, add attribute `data-am-characteristics` (empty value).

---

## 6. Content ops (before publish)

1. Add CMS field **Is System** (`is-system`) on Sub Products.  
2. Set `is-system = true` on: AML / APO / ACD / ART50 / AMT hubs (and any other series hubs).  
3. Confirm articles: series + product-type + catalogue-visible + images.  
4. Publish **CMS items** then **site** to `array-metal.webflow.io` only until signed off.  
5. Delete or unpublish draft page `/demo-product-catalogue` (no longer needed).

Seed reference: `catalogue/data/products-seed.csv`  
Field IDs: `catalogue/data/cms-field-map.md`

---

## 7. Safety

| Do | Don’t |
|----|--------|
| Build on ProductArrays + Sub Products templates | Paste full SPA HtmlEmbed as the catalogue |
| Stage on `array-metal.webflow.io` first | Publish half-broken template to custom domain |
| Filter lists by `catalogue-visible` | Show draft/incomplete SKUs |
| Keep inquiry/cart for Phase 2 | Ecommerce checkout |

---

## 8. Implementation order / progress (2026-08-05)

| Step | Status |
|------|--------|
| CMS field `is-system` + flag hubs AML/APO/ACD/ART50 (published) | **Done** |
| Sub Products template native section + styles | **Done** (Designer, unpublished) |
| Bind name, intro, characteristics, height/standard/NEMA/SF | **Done** |
| System layout visibility → `is-system` | **Done** |
| Collection List → Sub Products; filters `is-system isOff`, `catalogue-visible isOn`; sort order asc | **Done** |
| Series equals **current** page (AML list only AML articles) | **Todo** — set in Designer Collection List filter UI |
| Article cards (name, base-code, type, collection link) | **Done** |
| Characteristics table script | **Done** |
| ProductArrays: systems-only list (`is-system isOn`) | **Todo** |
| Finsweet product-type UI filters | **Todo** |
| Publish **staging only** → QA | **Todo** |
| Drop `/demo-product-catalogue` | **Todo** |

### Template page IDs

| Template | Page ID |
|----------|---------|
| Sub Products | `60add788ed4fb3052b6a479a` |
| ProductArrays | `6082b9dcc5995b5b55c8f183` |

### Designer: series filter (required once)

On Sub Products template → system Collection List → Filters:

1. Series **equals** Current Sub Product → Series  
2. Keep existing: Is System **is off**, Catalogue Visible **is on**

Without (1), the grid shows all non-system catalogue items across series.

---

## 9. What the abandoned embed was

| Old | New |
|-----|-----|
| `catalogue/demo/*.html` + draft page | Local UX reference only |
| Hardcoded JS product graph | CMS items |
| Hash routes `#/aml` | Real Webflow URLs |
| Not in site nav / SEO | Full site IA |

Local HTML may stay for design reference; it is **not** the deploy path.
