# Array Metal — Webflow Embeds

Webflow custom code embeds for [arraymetal.com](https://arraymetal.com).

Each project lives in its own subfolder. All embeds are self-contained HTML/CSS/JS files — paste the production embed into Webflow's **Before `</body>`** custom code field to deploy.

---

## Projects

| Folder | Page | Description |
|--------|------|-------------|
| [Cable Ladder Load Ratings](./Cable%20Ladder%20Load%20Ratings/) | `/load-ratings` | SWL tables for AML, APO, ACD, ART/AMT series (NEMA VE1-2009, IEC 61537) |
| [Perforated Metal Calculator](./Perforated%20Metal%20Calculator/) | `/open-area-calculator` | Interactive open area % calculator for 9 perforation patterns |
| [catalogue](./catalogue/) | *(in progress)* | Oglaend-style product hierarchy — **[PLAN.md](./catalogue/PLAN.md)** · demo · CMS seed |

---

## Product catalogue plan

Full roadmap (overall + current phase, checklist, safety):

**[catalogue/PLAN.md](./catalogue/PLAN.md)**

- **Phase 1 (now):** Products → group → system (filters) → article specs  
- **Phase 2:** Multi-item inquiry list (RFQ, no payment)  
- **UX approved:** local demo `catalogue/demo/catalogue-demo.html`  
- **Live product pages:** not redesigned until draft Webflow prototype is signed off

---

## Webflow Site

- Site ID: `6082b34dc5995b3e8dc8c73b`
- CDN base: `https://cdn.prod.website-files.com/6082b34dc5995b3e8dc8c73b/`

---

> `webflow-skills-main/` is a third-party Webflow CLI skills repository and is not part of these projects.
