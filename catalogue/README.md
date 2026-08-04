# Catalogue — Array Metal

Oglaend-style product hierarchy for arraymetal.com.

## Plan (read this)

**→ [PLAN.md](./PLAN.md)** — overall strategy, phases, what’s done, what to do next, safety rules.

## Quick status

| Item | Status |
|------|--------|
| Hierarchy UX (Oglaend) | **Approved** |
| CMS fields + seed (ladder/tray series) | Done |
| Local demo | `demo/catalogue-demo.html` |
| Draft Webflow page | Not created yet |
| Live product page redesign | Not started (by design) |
| Inquiry list | Phase 2 |

## Demo

Open in browser:

```text
catalogue/demo/catalogue-demo.html
```

Flow: Products → Cable Ladders → AML system (filters) → article specs.

## Data

| File | Purpose |
|------|---------|
| [data/cms-field-map.md](./data/cms-field-map.md) | CMS slugs + option IDs |
| [data/products-seed.csv](./data/products-seed.csv) | Content seed for import |

## Safety

- **Draft Webflow page ≠ live products page** — separate URL, no automatic edit of `/productscms` or `/products/cable-ladder`.
- Do not publish live template changes until Phase 1 draft is signed off.
