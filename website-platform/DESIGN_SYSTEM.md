# Array Metal Design System — carrying the current brand onto the new platform

**The requirement:** the new arraymetal.com must look like Array Metal, not like a new company. This document is the contract that makes that happen — the tokens, the component mapping, and the short list of things we deliberately change.

| | |
|---|---|
| **Status** | Tokens extracted and verified · awaiting sign-off (see §7) |
| **Owner** | Kai (kaixuan@arraymetal.com) |
| **Last updated** | 2026-08-10 |
| **Visual sheet** | [design-system.html](./design-system.html) — open in a browser |

---

## 0. Provenance

Every value below was read out of the **live production stylesheet**, not eyeballed from screenshots or invented.

| | |
|---|---|
| Source | `https://cdn.prod.website-files.com/6082b34dc5995b3e8dc8c73b/css/array-metal.webflow.shared.5f802104d.min.css` |
| Size | 125,092 bytes |
| Page sampled | `https://www.arraymetal.com/` (200, 38,837 bytes) |
| Extracted | 2026-08-10 |

If the Webflow site is edited before cutover, re-extract — the hash in the filename changes on every publish, so a stale hash is the tell.

**Method:** frequency analysis of `font-family`, hex literals, `border-radius`, `font-size`, `box-shadow`, `transition` and `@media` across the whole stylesheet, then reading the rules that actually use them. The palette was not inferred — Webflow emits a real `:root` block (§1), which is the designer's own token set.

---

## 1. Colour — the authoritative palette

This is copied verbatim from the live stylesheet's `:root`. It is the brand, as defined by whoever built the current site:

```css
:root{
  --black:         #0c1b2b;   /* deep navy-black — headings, dark sections */
  --alice-blue:    #dae5eb;   /* pale blue — alternating section bands, hero */
  --white:         #ffffff;
  --midnight-blue: #09318b;   /* the primary brand blue — buttons, nav, links */
  --slate-grey:    #5f6e7e;   /* body copy */
}
```

Measured contrast, sRGB, against the surfaces they are actually used on:

| Pair | Ratio | WCAG |
|---|---:|---|
| `--midnight-blue` on `--white` | **11.5 : 1** | AAA |
| `--white` on `--midnight-blue` | 11.5 : 1 | AAA |
| `--slate-grey` on `--white` | **5.2 : 1** | AA (normal text) |
| `--black` on `--alice-blue` | 13.6 : 1 | AAA |
| `--alice-blue` on `--white` | **1.3 : 1** | ❌ fails — see §5, issue 4 |

**Five tokens is not enough to build a catalogue on.** The current site has no hover, focus, disabled, error, warning or success colour, and no dark mode. The new system keeps all five values unchanged and *extends* around them — the extension set is derived in [design-system.html](./design-system.html) and must be signed off before Phase 4.

Colours found in the stylesheet that are **not** brand and must not be carried over:

| Value | Where it came from | Action |
|---|---|---|
| `#3898ec` (×24) | Webflow's own default (`.w-button`, form focus rings) | Drop — replaced by `--midnight-blue` |
| `#1a1a2e`, `#c8a951`, `#f5f5f0` | The Load Ratings embed's private palette (`.lr-*`) | Re-skin to brand when porting to React (§5, issue 1) |
| `#17a651` (green) | A border colour on buttons that never renders (§5, issue 2) | Drop |
| `#333`, `#999`, `#666`, `#ddd`, `#f5f5f5` … | Webflow normalize + ad-hoc greys | Replace with one derived neutral ramp |

---

## 2. Typography

Two commercial faces, both self-hosted on the Webflow CDN today.

| Family | Weights shipped | Format | Used for |
|---|---|---|---|
| **Maison Neue** | Book 400, Demi 600 | `.woff` | `h1`, `h2`, nav links, buttons, most body classes (71 rules) |
| **Halyard Display** | Book 400, Regular 500, Semibold 600 | `.ttf` | `h3`–`h6`, form controls, nav menu (34 rules) |

Font files (re-host these, do not hotlink Webflow's CDN after cutover):

```
60a62a2dde9dde80cf3e83bf_MaisonNeue-Demi.woff          600
60a62a2da719788ac88ba8e6_MaisonNeue-Book.woff          400
6082b3afc18fc783518e94cc_…halyarddisbook-webfont.ttf   400
6082b37890140a6aafe4126d_HalyardRegular.ttf            500
6082b3d0a40b3b6dc20f8fd7_…halyarddissembd-webfont.ttf  600
```

⚠️ **Licensing is an open blocker — see §6.**

### Type scale, as shipped

| Element | Family | Size / line-height | Weight | Colour |
|---|---|---|---|---|
| `h1` | Maison Neue | 38 / 44 px | 600 | `--black` |
| `h2` | Maison Neue | 32 / 36 px | 600 | `--black` |
| `h3` | Halyard | 24 / 30 px | 500 | `--black` |
| `h4` | Halyard | 18 / 24 px | 500 | `--black` |
| `h5` | Halyard | 14 / 20 px | 500 | `--alice-blue` ⚠️ |
| `h6` | Halyard | 12 / 18 px | 500 | — |
| `p` | *(inherited Arial)* ⚠️ | 14 / 20 px | 400 | `--slate-grey` |
| body base | Arial ⚠️ | 14 / 20 px | 400 | `#333` |
| nav link | Maison Neue | 16 px | 600 | `--midnight-blue` |
| button | Maison Neue | 14 px | 400 | `#f5f5f5` |

Mobile override: `h2` drops to 25 px below 767 px. That is the **only** responsive type step in the entire stylesheet — everything else is fixed-px at all widths.

Most-used sizes by frequency: 14 px (25×), 16 px (23×), 12 px (11×), 18 px (10×), 25 px (9×), 20 px (9×), 30 px (7×), 32 px (5×), 60 px (4×). The new scale should be a clean ramp through those, not 30-odd arbitrary values.

---

## 3. Layout, shape and motion

| Token | Live value | Notes |
|---|---|---|
| Container max-width | **1300 px** (nav, sections, `.margin`) · 1280 px (footer) | Standardise on 1300 |
| Gutter | 15 px | |
| Section padding (y) | 60–65 px desktop · 30 px ≤767 px | Also 59 px, 80 px, 110 px in places — drift, see §5 |
| Breakpoints | 991 / 767 / 479 px | Webflow's defaults; keep them so the port is comparable |
| Radius — button | 5–6 px | Standardise on 6 |
| Radius — card / panel | 20 px (51 uses — the dominant shape) · 10 px, 8 px, 3 px elsewhere | |
| Elevation | Essentially none — 3 one-off shadows in 125 KB | The site is flat. Keep it flat |
| Motion | `.2s`–`.3s`, mostly `all`; one `cubic-bezier(.45,.182,.111,.989)` | Standardise duration + easing, never animate `all` |

**Signature layout move:** full-bleed sections alternating `--white` and `--alice-blue`, each with a 1300 px centred inner container and 60–65 px of vertical padding. Dark sections use `--black` at 99% over a photo. This banding *is* the site's visual rhythm — it is the single most important thing to reproduce, and it maps cleanly onto a `<Section tone="light|tint|dark">` component.

---

## 4. Component mapping — Webflow class → React component

The current markup has no design system; class names are Webflow's auto-generated counters (`button-9`, `div-block-4180`, `text-block-128`). We keep the *appearance* and throw away the *naming*.

| Live class | Appearance | New component |
|---|---|---|
| `.button-10`, `.button-11` | midnight-blue fill, `#f5f5f5` text, r6, 14 px Maison Neue | `<Button variant="primary">` |
| `.button-11.contact` | `--black` fill | `<Button variant="dark">` |
| `.button-9` | `--alice-blue` fill, `--black` text, r5 | `<Button variant="secondary">` |
| `.button-12` | full-width, 16 px vertical padding, Halyard | `<Button variant="primary" size="lg" block>` |
| `.button-15`, `.button-16` | `#f5f5f5` fill, `--slate-grey` text | `<Button variant="ghost">` |
| `.navbar` + `.div-block-399` | sticky, white, 1300 px, 10/15 px padding | `<SiteHeader>` |
| `.nav-link` | 16 px Maison Neue 600, midnight-blue | `<NavLink>` |
| `.section-2` (+ `.products`, `.logo`, `.projects-page` …) | the banding described in §3 | `<Section tone>` |
| `.section-4` | photo + `--black` 99% overlay, 80 px padding | `<Section tone="photo">` |
| `.margin`, `.margin-double-split` | 1300/1280 px centred, 15 px gutter | `<Container>` |
| `.div-block-4180` | flex row, space-between, hairline bottom rule, 60 px margin | `<SectionHeader>` |
| `.text-block-128` | 32/40 px Maison Neue 600 midnight-blue | `<Eyebrow>` / `<StatFigure>` |
| `.lr-*` (Load Ratings embed) | off-brand — see §5 | Re-skin into `<SpecTable>` |

Four near-identical primary buttons collapse to one component with variants. That is the whole point of the exercise.

---

## 5. Divergences — what we deliberately fix

These are defects in the current implementation, not brand decisions. Reproducing them faithfully would be the wrong kind of fidelity. Each one is a *change*, so each needs Kai's sign-off.

1. **The Load Ratings embed is off-brand.** `.lr-*` uses `#1a1a2e` navy, `#c8a951` gold and `#f5f5f0` cream — none of which are brand tokens. It reads as a different site. Fix when porting the calculators to React (BUILD_PLAN Phase 4).

2. **A dead border declaration.** `.button-10`, `.button-11` and `.nav-link.w--current` all carry `border:1px #17a651` — no `border-style`, so it renders nothing. Copy-paste drift across four rules. Drop it.

3. **Body text is Arial.** `body` sets `font-family:Arial,sans-serif` and no later rule overrides it; the brand faces are applied class-by-class (71 + 34 rules) instead of at the root. Any element without a class falls back to Arial — including CMS rich-text output. In the new system the brand face is set once on `:root`.

4. **`h5` is `--alice-blue` on white — 1.3 : 1.** Effectively invisible outside dark sections. Re-colour to `--slate-grey` (5.2 : 1) or scope it to dark sections only.

5. **Section padding drift.** 59 px, 60 px, 65 px, 80 px, 110 px for what is visually the same band. Collapse to a 3-step spacing scale.

6. **No focus-visible styling anywhere.** Keyboard users get Webflow's default `#3898ec` ring or nothing. The new system ships a `--midnight-blue` focus ring on every interactive element.

7. **No dark mode.** Not a defect, but a decision to make — see §7.

---

## 6. ⚠️ Font licensing — an open blocker

Maison Neue (Milieu Grotesque) and Halyard Display (Darden Studio) are **paid, licensed webfonts**. The current licence was bought for a Webflow-hosted site. Moving to Vercel means:

- serving the files from a different domain/CDN, and
- possibly a different pageview tier.

Before Phase 4 we need to know which of these is true:

| Outcome | Consequence |
|---|---|
| Existing licence covers self-hosting at our traffic | Re-host the five files on Vercel. Zero visual change. **Preferred** |
| Licence must be upgraded | Budget item; still zero visual change |
| Licence cannot be extended | Substitute — and the site's typographic identity changes |

Fallback stack if substitution is forced (closest free equivalents, in order): Maison Neue → **Inter** or **Söhne**-alike; Halyard Display → **Jost** or **Poppins**. Any substitution must be reviewed side-by-side before it is committed; it is the one change here that a customer would actually notice.

**Owner: Kai. Blocks: Phase 4.** This is why it is now Open Item 8 in BUILD_PLAN §10.

---

## 7. Decisions still needed

| # | Question | Recommendation |
|---|---|---|
| 1 | Same look, or a refresh on the same brand? | **Same look.** Keep the five palette tokens, both typefaces, the banding rhythm and the flat 20 px-radius card language exactly. Fix only §5 |
| 2 | Dark mode? | **Not at launch.** The brand has no dark palette and inventing one is a branding exercise, not an engineering one. But author every token as a CSS custom property so it stays a possibility |
| 3 | Extended palette (hover/focus/error/success/neutral ramp) | Needed regardless — a catalogue has states the current brochure site never had. Derive from `--midnight-blue` and `--slate-grey`; sign off from the visual sheet |
| 4 | Fluid type instead of fixed px? | Yes. The current site steps type exactly once (`h2` at 767 px). `clamp()` for `h1`/`h2` only; leave the rest fixed |

---

## 8. Acceptance gate

The design system is done when:

- [ ] `tokens.css` exists in `array-metal-web` with all five brand values **byte-identical** to §1
- [ ] Both typefaces load self-hosted, with licence confirmed (§6)
- [ ] `<Section>`, `<Container>`, `<Button>`, `<SiteHeader>`, `<SectionHeader>` implemented against §4
- [ ] An existing arraymetal.com page rebuilt on the new stack sits side-by-side with the Webflow original and reads as the same site
- [ ] Every §5 divergence either fixed or explicitly waived, in writing
- [ ] Every interactive element has a visible `:focus-visible` state
- [ ] No `#3898ec` and no `.lr-*` palette value anywhere in the new repo
- [ ] Contrast checked at AA for every token pair actually used together
