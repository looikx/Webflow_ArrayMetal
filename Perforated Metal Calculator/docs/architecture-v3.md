# embed_oa_v3 — Code Structure Breakdown

## Overview

A self-contained embeddable widget (HTML + CSS + JS) for calculating **open area percentage** and **hole density** of perforated metal sheets. Built for Array Metal (M) Sdn. Bhd., designed to be embedded in a Webflow site.

The widget is structured in three parts:
1. `<style>` — all CSS
2. `<div id="oa-top">` — the mount point for dynamic content
3. `<script>` — all JavaScript (IIFE)

---

## 1. CSS (`<style>`)

All styles are scoped with the `.oa-` prefix to avoid conflicts with the host page.

### Layout
- `#oa-top` — the root container; max-width 960px, centered with auto margins.
- `.oa-thumb-grid` — 3-column CSS grid for pattern thumbnail cards. Collapses to 2 columns on screens ≤640px.
- `.oa-calc-card` — 2-column grid (diagram | inputs). Collapses to 1 column on mobile.
- `.oa-results` — 2-column grid showing Open Area and Holes/m² result boxes side by side.

### Component Styles
| Class | Purpose |
|---|---|
| `.oa-hero` | Page title and subtitle block |
| `.oa-thumb-card` | Clickable pattern thumbnail with hover lift effect |
| `.oa-diagram-panel` | Square image panel (1:1 aspect ratio) for pattern diagram |
| `.oa-inputs-panel` | Vertical stack of input fields and results |
| `.oa-field-input` | Number input with focus highlight |
| `.oa-result-box` | Grey result tile with label + large value |
| `.oa-formula-note` | Monospace formula reference block |
| `.oa-btn` | Base button style; variants: `.oa-btn-reset`, `.oa-btn-inquiry` |
| `.oa-inquiry-msg` | Status message below buttons; variants: `.oa-ok` (green), `.oa-err` (red) |

### Result Value Color Classes
Open area percentage is color-coded by range:
| Class | Color | Range |
|---|---|---|
| `.oa-low` | Red | < 20% |
| `.oa-medium` | Orange | 20–39% |
| `.oa-good` | Green | 40–59% |
| `.oa-high` | Blue | ≥ 60% |

---

## 2. HTML Mount Point

```html
<div id="oa-top"></div>
```

This is the only static HTML. All content is built dynamically by the JavaScript.

---

## 3. JavaScript (`<script>`)

The entire script runs inside an **IIFE** (Immediately Invoked Function Expression) to avoid polluting the global scope.

---

### 3.1 Data: `IMGS`

A key-value map of pattern keys (`RT`, `RM`, etc.) to CDN image URLs. Each image is a diagram of the corresponding perforation pattern. Used in both the thumbnail grid and individual calculator sections.

---

### 3.2 Data: `PATTERNS`

The core data structure. Each key maps to a pattern object with the following properties:

| Property | Type | Description |
|---|---|---|
| `name` | string | Display name (e.g. `"R-T"`) |
| `desc` | string | Human-readable description (e.g. `"Round holes, 60° triangular pitch"`) |
| `fields` | array | Input field definitions — each has `id` and `label` |
| `openArea(v)` | function | Calculates open area % from input values `v` |
| `holesPerM2(v)` | function | Calculates hole density from input values `v` |
| `formula` | string | Human-readable open area formula |
| `holesFormula` | string | Human-readable holes/m² formula |
| `valid(v)` | function | Validates that inputs are geometrically sensible |

#### The 9 Patterns

| Key | Name | Hole Shape | Pitch Type |
|---|---|---|---|
| `RT` | R-T | Round | 60° triangular |
| `RM` | R-M | Round | 45° diagonal |
| `RU` | R-U | Round | 90° rectangular |
| `LRU` | LR-U | Oblong (slot) | Rectangular |
| `LRZ` | LR-Z×Z | Oblong (slot) | Staggered |
| `CT` | C-T | Square | 60° triangular |
| `CU` | C-U | Square | 90° rectangular |
| `CDM` | CD-M | Square (diagonal) | 45° diagonal |
| `HT` | H-T | Hexagon | 60° triangular |

#### Open Area Formulas

Each pattern uses a different geometric formula. Key multipliers:

- `× 90.69` — triangular pitch factor for round holes (`π√3/6 × 100`)
- `× 78.54` — square/diagonal pitch factor for round holes (`π/4 × 100`)
- `× 115.47` — triangular pitch factor for square holes
- `× 100` — rectangular pitch (no geometric correction needed)
- Oblong holes subtract `0.215 × R²` to account for the rounded end caps of the slot

---

### 3.3 Data: `GROUPS`

An array that groups pattern keys under display labels:
- **Round Holes** → RT, RM, RU
- **Oblong Holes** → LRU, LRZ
- **Square Holes** → CT, CU, CDM
- **Hexagon Holes** → HT

Used to render the labelled sections in the thumbnail grid.

---

### 3.4 `init()`

Entry point. Called on `DOMContentLoaded` (or immediately if DOM is already ready).

1. Finds `#oa-top` as the root element.
2. Creates and appends the **hero** block (title + subtitle).
3. Creates a `#oa-thumb-section` div and a `.oa-sections-wrap` div.
4. Calls `buildThumbs()` and `buildSections()` to populate both.

---

### 3.5 `buildThumbs(wrap)`

Builds the **pattern selection grid** at the top of the page.

- Iterates over `GROUPS`.
- For each group: renders a section header (`oa-grid-header`), then a 3-column grid of `<a>` thumbnail cards.
- Each card contains: the pattern image, the pattern name, and the description.
- **Click handler**: reads `data-target` attribute (set to `oa-section-<key>`), finds the corresponding calculator section, and smooth-scrolls to it — see section below for the full scroll implementation.

---

### Scroll Implementation (Thumbnail → Calculator Section)

This is the key fix in v3 that prevents the sticky navbar from covering the section title when a thumbnail is clicked.

**The problem in earlier versions:** Using a plain anchor (`href="#oa-section-RT"`) or `el.scrollIntoView()` without offset causes the browser to scroll the target element to the very top of the viewport. On pages with a sticky/fixed navbar, this means the navbar overlaps the section heading — the title is hidden behind it.

**v3's solution — manual scroll position calculation:**

```js
card.addEventListener('click', function(e) {
  e.preventDefault();
  var sec = document.getElementById(this.getAttribute('data-target'));
  if (!sec) return;
  var navEl = document.querySelector('.navbar.w-nav') || document.querySelector('.w-nav');
  var navH = navEl ? navEl.offsetHeight : 81;
  var top = sec.getBoundingClientRect().top + window.pageYOffset - navH - 16;
  window.scrollTo({ top: top, behavior: 'smooth' });
});
```

**Step-by-step breakdown:**

| Step | Code | What it does |
|---|---|---|
| 1 | `e.preventDefault()` | Blocks the default anchor jump (which would cause an instant, offset-free scroll) |
| 2 | `document.getElementById(data-target)` | Gets the target section element |
| 3 | `document.querySelector('.navbar.w-nav') \|\| document.querySelector('.w-nav')` | Finds the Webflow sticky navbar by its standard class names; tries the more specific selector first |
| 4 | `navEl ? navEl.offsetHeight : 81` | Reads the navbar's actual rendered height; falls back to 81px if no navbar is found |
| 5 | `sec.getBoundingClientRect().top` | Gets the element's current distance from the top of the **viewport** (changes as user scrolls) |
| 6 | `+ window.pageYOffset` | Converts viewport-relative position to absolute page position |
| 7 | `- navH - 16` | Subtracts navbar height + 16px breathing room, so the section title lands *below* the navbar |
| 8 | `window.scrollTo({ top: top, behavior: 'smooth' })` | Smoothly scrolls to the computed absolute position |

**Why `getBoundingClientRect().top + window.pageYOffset`?**
`getBoundingClientRect()` returns a position relative to the current viewport — it shifts as the user scrolls. Adding `window.pageYOffset` (the current scroll position) converts it to an absolute document position, which is what `window.scrollTo()` expects.

**The 16px extra offset** is additional padding so the section title has visual breathing room below the navbar, rather than sitting flush against it.

**"Back to patterns" link** (at the bottom of each section) uses `scrollIntoView({ behavior: 'smooth' })` on `#oa-top` instead — no navbar offset is needed because scrolling *up* to the hero at the very top of the page is never obstructed.

---

### 3.6 `buildSections(wrap)`

Builds the **individual calculator section** for each pattern.

For each pattern key:
1. Inserts a horizontal divider `<hr>` between sections (except before the first).
2. Creates a section `div` with id `oa-section-<key>`.
3. Adds a section heading with the pattern name and description.
4. Builds `.oa-calc-card` with two panels:
   - **Diagram panel** — pattern image + label caption.
   - **Inputs panel** — contains:
     - Input fields (one per `fields` entry, all `type="number"`, unit: mm)
     - Results block (Open Area %, Holes/m²)
     - Formula note (`<code>` blocks)
     - Button row (Send Inquiry + Reset)
     - Inquiry message element
5. Adds a `↑ Back to patterns` anchor link that smooth-scrolls to `#oa-top`.
6. After all sections are built: attaches `input` event listeners to all number fields, each calling `calculate(key)` on change.

> **Note on closure**: The `sendInquiry` and `resetCalc` button event handlers use an IIFE pattern `(function(k){...})(key)` to correctly capture the loop variable `key` at each iteration.

---

### 3.7 `calculate(key)`

Triggered on every `input` event on any field in a calculator.

1. Reads all field values for the given pattern into object `v`.
2. If any field is empty, NaN, or ≤ 0, resets results to `—` and returns.
3. Calls `p.valid(v)` — if geometrically invalid (e.g. hole diameter ≥ pitch), resets and returns.
4. Calls `p.openArea(v)` and `p.holesPerM2(v)`.
5. If open area is outside 0–100%, resets and returns.
6. Updates the Open Area display:
   - Renders value with 1 decimal place + `%` unit span.
   - Applies color class based on range (low / medium / good / high).
7. Updates the Holes/m² display with a locale-formatted integer + `/m²` unit span.

> **Bug note**: Line 265 contains a typo — `allFiled = false` (missing `d`) instead of `allFilled = false`. This means the `allFilled` check on line 270 will always be `true` (undefined is falsy but `allFilled` was initialized as `true` and never set to false), so the empty-field guard doesn't work. The `p.valid()` check is what actually prevents calculation with bad inputs.

---

### 3.8 `resetCalc(key)`

Clears all input fields for the given pattern and resets both result displays back to `—`.

---

### 3.9 `sendInquiry(key, btn, msgEl)`

Submits the current calculator state as an inquiry to Webflow's form API.

**Flow:**
1. Collects all filled-in field values into a `lines` array (e.g. `"R — Hole Diameter: 5 mm"`).
2. Reads the current Open Area and Holes/m² display text (strips any HTML tags via regex).
3. Disables the button and shows "Sending…".
4. Builds a JSON payload:
   ```json
   {
     "name": "Open Area Inquiry",
     "source": "<current page URL>",
     "test": false,
     "dolphin": false,
     "fields": {
       "Pattern": "<name> — <desc>",
       "Dimensions": "<field values>",
       "Open Area": "<oa value>",
       "Holes per m²": "<holes value>"
     }
   }
   ```
5. POSTs to `https://webflow.com/api/v1/form/<site-id>` with `Content-Type: application/json`.
6. On success (`r.ok`): shows green "Inquiry sent!" message.
7. On HTTP error: shows red error with status code.
8. On network failure (`.catch`): shows red "Could not send" message.
9. Re-enables the button in all cases after the request resolves.

---

### 3.10 Initialization Guard

```js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

Safely handles both cases: script loaded before DOM is ready (defers to `DOMContentLoaded`) and script loaded after DOM is already parsed (calls `init()` immediately). This makes the embed work whether it's placed in `<head>` or `<body>`.

---

## Data Flow Summary

```
User types in input field
        ↓
  input event fires
        ↓
  calculate(key)
        ↓
  reads all field values → validates → computes formulas
        ↓
  updates result boxes with value + color class
```

```
User clicks thumbnail card
        ↓
  reads data-target attribute
        ↓
  smooth-scrolls to matching section (offset by navbar height)
```

```
User clicks Send Inquiry
        ↓
  collects field values + result display text
        ↓
  POST to Webflow form API
        ↓
  shows success or error message
```
