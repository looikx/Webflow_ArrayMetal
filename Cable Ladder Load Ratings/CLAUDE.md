# CLAUDE.md — Cable Ladder Load Ratings

## Project Overview

This folder contains the Webflow custom code embed for Array Metal's cable ladder load ratings page. The embed displays Safe Working Load (SWL) tables for all tested cable ladder and cable tray series.

- **Company:** Array Metal (M) Sdn. Bhd.
- **Webflow Site ID:** `6082b34dc5995b3e8dc8c73b`
- **Live page:** arraymetal.com (load ratings section)

---

## Production File

**`embed_v2.txt` is the only file that gets deployed.** Do not deploy any other file to Webflow.

It is structured as two blocks:
1. `<style>` — all CSS scoped under `#load-ratings-tables` to avoid Webflow style conflicts
2. `<script>` — a single IIFE that writes the full page HTML into `document.getElementById('load-ratings-tables')`

To deploy: Webflow Designer → Page Settings → Custom Code → Before `</body>` → paste full contents of `embed_v2.txt` → Save → Publish.

---

## File Roles

| File | Purpose | Edit? |
|------|---------|-------|
| `embed_v2.txt` | Production Webflow embed | Yes — this is the source of truth |
| `load-ratings.html` | Standalone browser preview | Update to match embed_v2.txt after changes |
| `embed_content.txt` | Earlier draft (pre-v2) | No — archive only |
| `embed_content.json` | JSON payload variant | No — archive only |
| `page_payload.json` | Webflow API page payload | No — used for initial page creation only |
| `Cable Ladder Load Rating.xlsx` | Source SWL data | Yes — update here first before editing embed |
| `paths_detail.txt` | PDF extraction artifact | No — reference only |

---

## Series and Standards

| Series | Product Type | Standard | Safety Factor | Span Lengths |
|--------|-------------|----------|---------------|--------------|
| AML | Cable Ladder | NEMA VE1-2009 | ×1.5 | 3 m, 4.5 m, 6 m |
| APO | Cable Ladder | SIRIM / NEMA VE1-2009 | ×1.5 | 3 m, 4.5 m, 6 m |
| ACD | Cable Ladder | IEC 61537:2006 | ×1.7 | 3 m, 4.5 m, 6 m |
| ART | Cable Tray | NEMA VE1-2009 | ×1.5 | 1.5 m, 2 m, 3 m |
| AMT | Cable Tray | NEMA VE1-2009 | ×1.5 | 1.5 m, 2 m, 3 m |

NEMA load classes: **20AA** (light) < **20A** (medium) < **20B** (heavy).

IEC 61537 test certificate ref: `2018MA0594-ACD-IEC61537`

---

## How to Update Load Ratings

1. Verify the new values in `Cable Ladder Load Rating.xlsx`
2. Open `embed_v2.txt` and locate the relevant `<tr>` row by model name (e.g. `AML125`)
3. Update the `<td class="span-col">` values for the affected span columns
4. Update `load-ratings.html` to match (same data, different wrapper)
5. Test by opening `load-ratings.html` in a browser
6. Deploy `embed_v2.txt` to Webflow and publish

---

## CSS Scope Rule

All CSS in `embed_v2.txt` is scoped to `#load-ratings-tables`. Never use global selectors — they will conflict with Webflow's stylesheet. Class names use no prefix convention (e.g. `.series-block`, `.swl-table`, `.nema-pill`).

---

## Do Not

- Do not add external CSS frameworks or CDN dependencies — the embed must be fully self-contained
- Do not use `document.write()` — only `innerHTML` on the target element
- Do not rename or remove `id="load-ratings-tables"` — the script targets this ID
- Do not edit `embed_content.txt`, `embed_content.json`, or `page_payload.json` — these are archives
