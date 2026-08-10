# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Webflow custom-code embeds and CMS planning for [arraymetal.com](https://arraymetal.com) (Array Metal (M) Sdn. Bhd.). There is **no build system, package manager, linter, or test suite** — every deliverable is a self-contained HTML/CSS/JS file (an IIFE, no external dependencies) that gets pasted directly into a Webflow page's **Custom Code → Before `</body>`** field. "Testing" means opening the standalone preview HTML in a browser.

Webflow Site ID (shared across all projects): `6082b34dc5995b3e8dc8c73b`
CDN base: `https://cdn.prod.website-files.com/6082b34dc5995b3e8dc8c73b/`
Staging: `https://array-metal.webflow.io` · Production: `https://www.arraymetal.com`

Each top-level folder is an independent project with its own `CLAUDE.md`/`README.md` — **read the subfolder's own CLAUDE.md before working in it**, it has authoritative rules for that project (production file, do-not-touch archives, branch policy, etc.). This root file only covers what's common across the repo.

## Repo layout

| Folder | Live page | Status |
|--------|-----------|--------|
| `Cable Ladder Load Ratings/` | `/load-ratings` | Shipped. Production file: `embed_v2.txt` |
| `Perforated Metal Calculator/` | `/open-area-calculator` | Shipped (v3 live). v4 WIP on `feature/v4-ghost-form` branch |
| `website-platform/` | *(planning)* | **Current focus** — full replatform of arraymetal.com off Webflow. Read `website-platform/BUILD_PLAN.md` first |
| `catalogue/` | *(superseded)* | Native Webflow CMS rebuild — **stopped** per decision D-13. IA carried forward into `website-platform/` |
| `demo/` | — | Untracked inquiry-cart UX demos, draft-page only, not deployed |

`webflow-skills-main/` (gitignored) is a third-party Webflow CLI skills repo, not part of these projects.

## Common architecture pattern (both shipped embeds)

Both `Cable Ladder Load Ratings` and `Perforated Metal Calculator` follow the same shape:

- A single production **`.txt` file** containing `<style>` + `<script>` (or a pure IIFE) — this is the literal string pasted into Webflow. Never rename it to `.html` or split it; Webflow's custom-code field expects raw markup.
- All CSS is scoped under one root selector/prefix (`#load-ratings-tables`, `oa-` prefix) to avoid bleeding into Webflow's own stylesheet. Never add global selectors or external CSS/JS dependencies — the embed must stay fully self-contained.
- A matching standalone preview `.html` file in the repo lets you open the exact same markup in a browser without touching Webflow. Update the preview whenever you edit the production file, and test in-browser before deploying.
- Deployment is manual: Webflow Designer → target page → Page Settings → Custom Code → Before `</body>` → paste full file contents → Save → Publish. Old `deploy/*.py` API scripts exist in the calculator project for reference only — they are not part of the active workflow.

## website-platform/ — current focus

Planning for the replacement of arraymetal.com with a Next.js platform. **Read `website-platform/BUILD_PLAN.md` first** — it is the index, the decision log, and the phase plan. It links to `ARCHITECTURE.md` (the why), `DESIGN_SYSTEM.md` + `design-system.html` (the brand tokens the new site must keep), `catalogue-ux.html` (page-by-page visual spec) and `stack-and-subscriptions.html` (hosting and services).

Design continuity is locked by decisions D-14/D-15: the new site keeps arraymetal.com's existing look — the five brand colours (`#0c1b2b`, `#09318b`, `#5f6e7e`, `#dae5eb`, white), Maison Neue + Halyard Display, the white/Alice-Blue section banding, 1300 px container. Those values were extracted from the live Webflow stylesheet and must not be re-invented; read `website-platform/DESIGN_SYSTEM.md` before proposing any styling. Note `catalogue-ux.html` uses a *document* palette for readability — it is not the brand.

Key context: the SKU system of record is the **costing app** at `Software Projects/array-metal-costing` (574,609 items in Supabase). The website reads a price-free `catalog` projection from it — never the costing tables directly, and never anything from `price_records` except `weightKg`. Do not propose duplicating dimensions into a CMS.

## catalogue/ — superseded

Native Webflow catalogue work, **stopped** per decision D-13 in `website-platform/BUILD_PLAN.md`. Its information architecture (Family → System → Component) was validated and carried forward; the Designer template work is abandoned. Do not resume it. Retained for reference and as the source of editorial content to migrate. Read in this order:

1. `catalogue/CMS_ARCHITECTURE.md` — **source of truth**, the active migration plan (ProductArrays → Systems → Sub Products hierarchy, locked decisions, field schemas, site/collection IDs)
2. `catalogue/PLAN.md` — overall phased roadmap and safety rules
3. `catalogue/NATIVE_WEBFLOW.md` — earlier notes, partially superseded by CMS_ARCHITECTURE.md
4. `catalogue/data/cms-field-map.md` — field slugs / option IDs

Key constraints carried across all three docs:
- **Deploy path A: native Webflow only** — CMS collections + Designer templates + Collection Lists. No HtmlEmbed SPA as the production catalogue (that approach was tried and explicitly abandoned).
- Each product **System** (AML, ACD, ART, etc.) owns its own components (elbows, covers, splices) — never a shared/global component pool across systems.
- Stage changes on `array-metal.webflow.io` first; publish to production only after explicit sign-off.
- The `is-system` field / mixed Sub-Products model is **deprecated** — do not extend it further, it's being replaced by the dedicated Systems collection.
- `catalogue/demo/*.html` and the numerous `catalogue/demo/_*.js` build scripts are UX reference / one-off build tooling for an embed approach that was abandoned in favor of native templates — treat as historical, not something to extend.
- Webflow reference filters can't bind "current item" via the API/MCP — those filters (`System equals Current System`, etc.) must be set manually in the Designer UI.

## Working conventions

- Never commit API tokens (`TOKEN.txt`, `*.token`, `.env`) or proprietary client documents (client PDFs, extracted catalogue text/formulas) — check each subproject's CLAUDE.md for its specific list of forbidden files.
- Git identity for this repo: user `Kai`, email `kaixuan@arraymetal.com`.
- When editing a shipped embed, check for a feature branch first (e.g. `feature/v4-ghost-form` in the calculator project) — in-progress next-version work belongs on its branch, not on the file backing the live production page.