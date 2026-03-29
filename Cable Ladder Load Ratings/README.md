# Cable Ladder Load Ratings

Webflow embed for Array Metal's cable ladder load ratings page at [arraymetal.com](https://arraymetal.com).

Displays Safe Working Load (SWL) tables for all tested cable ladder and cable tray series, tested to NEMA VE1-2009 and IEC 61537:2006.

Webflow Site ID: `6082b34dc5995b3e8dc8c73b`

---

## Folder Structure

```
Cable Ladder Load Ratings/
│
├── embed_v2.txt                    ← LIVE EMBED — paste into Webflow (production)
├── embed_content.txt               ← Earlier draft with standalone page styling
├── embed_content.json              ← JSON variant (Webflow API payload format)
├── load-ratings.html               ← Standalone browser preview (open locally)
├── page_payload.json               ← Webflow API payload for page creation/update
├── Cable Ladder Load Rating.xlsx   ← Source data spreadsheet
└── paths_detail.txt                ← PDF path extraction artifact (reference only)
```

---

## Key File: embed_v2.txt

This is the single file that runs the entire load ratings display on Webflow. It contains:

1. **`<style>` block** — all scoped CSS using `#load-ratings-tables` as the root selector to avoid conflicts with Webflow's own styles.

2. **`<script>` block** — a self-contained IIFE (`(function() { ... })()`) that:
   - Targets the element with `id="load-ratings-tables"` on the page
   - Writes the full HTML structure (hero, series tables, test conditions, footer) into that element via `innerHTML`

### Series Covered

| Series | Type | Standard | Safety Factor | Span Lengths |
|--------|------|----------|---------------|--------------|
| AML | Cable Ladder | NEMA VE1-2009 | ×1.5 | 3 m, 4.5 m, 6 m |
| APO | Cable Ladder | SIRIM / NEMA VE1-2009 | ×1.5 | 3 m, 4.5 m, 6 m |
| ACD | Cable Ladder | IEC 61537:2006 | ×1.7 | 3 m, 4.5 m, 6 m |
| ART / AMT | Cable Tray | NEMA VE1-2009 | ×1.5 | 1.5 m, 2 m, 3 m |

### NEMA Load Classes

| Class | Capacity |
|-------|----------|
| 20AA | Light |
| 20A  | Medium |
| 20B  | Heavy |

### Test Certificate

- IEC 61537 ref: `2018MA0594-ACD-IEC61537`
- NEMA VE1-2009 tested by: SIRIM (Malaysia)

---

## How to Deploy

The entire page lives in a single Webflow **Custom Code** field:

1. Open Webflow Designer → select the load ratings page
2. Page Settings → **Custom Code** tab → **Before `</body>` tag**
3. Paste the full contents of `embed_v2.txt`
4. Save → Publish

The page must have a `<div id="load-ratings-tables"></div>` element (or the embed creates the anchor point). The embed attaches itself to this element and writes all content into it.

---

## Standalone Preview

Open `load-ratings.html` directly in a browser to preview the full page without deploying to Webflow. This is a complete `<html>` document with all styles and content inlined — no server required.

---

## Source Data

`Cable Ladder Load Rating.xlsx` contains the raw SWL test data that was used to produce the values in `embed_v2.txt`. If load ratings are updated, edit the spreadsheet first, then update the corresponding values in `embed_v2.txt`.
