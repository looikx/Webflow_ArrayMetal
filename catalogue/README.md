# Catalogue — Array Metal

Oglaend-style product hierarchy for arraymetal.com — **native Webflow CMS + templates**.

## Start next session here

**→ [CMS_ARCHITECTURE.md](./CMS_ARCHITECTURE.md)** — Systems collection reorg plan (Family → System → Component).

## Plan & build

| Doc | What |
|-----|------|
| **[CMS_ARCHITECTURE.md](./CMS_ARCHITECTURE.md)** | **Next work:** CMS model + migration |
| [PLAN.md](./PLAN.md) | Overall strategy, phases, safety |
| [NATIVE_WEBFLOW.md](./NATIVE_WEBFLOW.md) | Earlier native notes (partially superseded) |

## Quick status

| Item | Status |
|------|--------|
| Hierarchy UX | **Approved** |
| Deploy path | Path A native Webflow |
| Mixed Sub Products + `is-system` | **Superseded** — do not extend |
| **Systems + components CMS** | Schema + AML/ART drafts done |
| **Templates (native)** | Scaffolded — Systems / ProductArrays / Sub Products; finish current-item filters in Designer |
| Local demo HTML | Reference only |
| Embed demo page | Abandoned |

## Target architecture

```text
/productscms              → ProductArrays (families)
/products/cable-ladder    → Systems for that family (AML, ACD, AZL…)
/systems/aml              → Components for AML only (elbow, cover, splice…)
/sub-products/…           → Single component specs
```

Each series owns its own fittings — not one global pile of elbows.

## Data

| File | Purpose |
|------|---------|
| [data/cms-field-map.md](./data/cms-field-map.md) | Current field map (update after reorg) |
| [data/products-seed.csv](./data/products-seed.csv) | Legacy mixed seed |

## Safety

- Stage on `array-metal.webflow.io` first.  
- No HtmlEmbed SPA as the production catalogue.  
- Phase 2 inquiry only after browse hierarchy works.
