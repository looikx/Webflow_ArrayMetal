# Changelog

## v4.0.0 — In Progress (`feature/v4-ghost-form` branch)

- Replace direct Webflow API form POST with a hidden "ghost" Webflow FormBlock
- Form submissions now go through Webflow's native form pipeline (CRM, email notifications)
- Added unit test harness (`preview/ghost-form-test.html`) for ghost form submission

## v3.0.0 — Current Production

- Added modal inquiry form: pre-fills pattern name, dimensions, and calculated results
- Modal submits to Webflow form API (`wf-inquiry-form`)
- Color-coded results: low (red), medium (orange), good (green), high (blue)
- Responsive 2-column grid collapses to 1 column on mobile
- Fixed scroll offset for Webflow sticky navbar (81px, queried at click time)

## v2.0.0

- Replaced base64-encoded images with Webflow CDN URLs
- Added deployment script (`deploy_oa_calculator.py`) for Webflow API automation
- Embed split into head/body for Webflow Custom Code fields

## v1.0.0

- Initial standalone calculator (single HTML file)
- 9 perforation patterns: Round (R-T, R-M, R-U), Oblong (LR-U, LR-Z×Z), Square (C-T, C-U, CD-M), Hexagon (H-T)
- Thumbnail grid with click-to-scroll navigation
- Real-time open area % and holes/m² calculations
- Images embedded as base64 (no CDN dependency)
