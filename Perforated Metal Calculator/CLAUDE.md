# CLAUDE.md — Perforated Metal Open Area Calculator

## Project Overview

A self-contained Webflow embed that calculates open area percentage and hole density for perforated metal sheets. Live at https://arraymetal.com/open-area-calculator.

**Client:** Array Metal (arraymetal.com)
**GitHub email:** kaixaun@arraymetal.com
**Current production version:** v3 — `embed/calculator-embed.txt`

---

## Critical Rules

- **Never commit `TOKEN.txt`, `*.token`, `.env`** — Webflow API token must stay in env var `WEBFLOW_TOKEN`
- **Never commit `[Final]*.pdf`, `catalogue_text.txt`, `catalogue_diagrams.txt`, `catalogue_formulas.txt`** — proprietary client documents
- **Never commit `assets/b64/`** — large base64 blobs (v1 only), gitignored
- **Never modify `embed/calculator-embed.txt` for v4 features** — v4 work belongs on the `feature/v4-ghost-form` branch only

---

## Repository Structure

```
embed/
  calculator-embed.txt      ← PRODUCTION embed (paste into Webflow custom code)
  calculator-embed-v4.txt   ← v4 WIP (feature/v4-ghost-form branch only)
deploy/
  deploy_oa_v3.py           ← Webflow API deployment script (current)
  deploy_oa_calculator.py   ← v2 script (reference only)
  README-deploy.md
preview/
  calculator-v3.html        ← standalone v3 preview (open in browser to test)
  ghost-form-test.html      ← v4 unit test harness (feature branch)
  scroll-test.html
  archive/
    calculator-v1.html
    calculator-v2.html
assets/
  diagrams/                 ← 9 full-res PNGs (uploaded to Webflow CDN)
  thumbs/                   ← 9 thumbnail PNGs (referenced in embed)
  reference/                ← generic hole-shape diagrams
  b64/                      ← gitignored; v1 base64 blobs
docs/
  architecture-v3.md        ← full technical breakdown of v3 embed
archive/                    ← old embed versions for reference
v4/                         ← untracked on main; source for feature branch
```

---

## Architecture

The production embed (`embed/calculator-embed.txt`) is a **single IIFE** — no build step, no external dependencies.

Key structures inside the IIFE:
- `PATTERNS` — one entry per pattern; each has field definitions and the open area formula function
- `GROUPS` — groups patterns by hole shape for the thumbnail grid
- `IMGS` — CDN URL map for the 9 thumbnail images (hosted on Webflow Assets)
- `calculate(key)` — reads inputs, runs the formula, colour-codes the result
  - Red < 20%, Orange 20–35%, Green 35–50%, Blue > 50%
- Scroll uses `getBoundingClientRect() + pageYOffset` (not anchor links) to offset Webflow's sticky 81px navbar

All CSS is scoped with `oa-` prefix to avoid conflicts with Webflow styles.

---

## Perforation Patterns

| JS Key | Pattern | Shape | Pitch |
|--------|---------|-------|-------|
| RT | R-T | Round | 60° triangular |
| RM | R-M | Round | 45° diagonal |
| RU | R-U | Round | 90° rectangular |
| LRU | LR-U | Oblong | Rectangular |
| LRZ | LR-Z×Z | Oblong | Staggered |
| CT | C-T | Square | 60° triangular |
| CU | C-U | Square | 90° rectangular |
| CDM | CD-M | Square diagonal | 45° pitch |
| HT | H-T | Hexagon | 60° triangular |

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production (v3) — what's live on arraymetal.com |
| `feature/v4-ghost-form` | WIP: replace direct API form POST with Webflow native FormBlock |

---

## Deployment

Deploy via script (uploads images + injects embed):
```bash
export WEBFLOW_TOKEN=your_token_here
python deploy/deploy_oa_v3.py
```

For content-only edits: paste `embed/calculator-embed.txt` directly into Webflow Designer → Page Settings → Custom Code → Before `</body>` tag.

CDN base URL: `https://cdn.prod.website-files.com/6082b34dc5995b3e8dc8c73b/`

---

## Git Setup

```bash
# Local git identity for this repo
git config user.name "Kai"
git config user.email "kaixaun@arraymetal.com"
```

Tags: `v3.0.0` on main
GitHub topics: `webflow`, `javascript`, `calculator`, `embed`, `perforated-metal`

---

## Pending

- [ ] Git repo needs re-init inside project folder (outer `.git` at `Desktop/Claude/` must be deleted first)
- [ ] Push main + feature/v4-ghost-form to GitHub
- [ ] Rename folder `Perforated Metal Calculator` → `perforated-metal-calculator` (do in File Explorer when no terminal is open inside it)
- [ ] Revoke old Webflow API token from TOKEN.txt in Webflow Account Settings → Integrations
