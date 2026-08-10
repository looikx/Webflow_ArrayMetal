# CMS Field Map — Phase 1 Catalogue

**Updated:** 2026-08-05 — Systems collection reorg started.

## Systems (`systems`) — Level 3 series — NEW

| Display name | slug | Type | Notes |
|--------------|------|------|-------|
| Name | `name` | PlainText | Required |
| Slug | `slug` | PlainText | Short: `aml`, `art` |
| Family | `family` | Ref → ProductArrays | Parent group |
| Image | `image` | Image | Card / hero |
| Short Description | `short-description` | PlainText | Card blurb |
| Overview | `overview` | RichText | System intro |
| Design Details | `design-details` | RichText | Design notes |
| Standards Summary | `standards-summary` | PlainText | Badge line |
| Heights Available | `heights-available` | PlainText | Range summary |
| Widths Available | `widths-available` | PlainText | Range summary |
| Materials | `materials` | MultiRef → Materials | Series finishes |
| Load Ratings Link | `load-ratings-link` | Link | `/load-ratings` |
| Catalogues | `catalogues` | MultiRef → Catalogues | PDFs |
| Sort Order | `sort-order` | Number | Group page order |
| Catalogue Visible | `catalogue-visible` | Switch | Show in grids |

**Collection ID:** `6a72d851ab5b05191add4ce9`  
**Template page ID:** `6a72d851ab5b05191add4d11` (`/systems/{slug}`)  
**Phase 1 draft items:** AML `6a72d8733fb49a264517a00a` · ART `6a72d8733fb49a264517a00c`

---

## Sub Products (`sub-products`) — components only

| Display name | Slug | Type | Filter? | Notes |
|--------------|------|------|---------|-------|
| Name | `name` | PlainText | search | Required |
| Slug | `slug` | PlainText | — | Required |
| Sub Description | `sub-description-2` | PlainText | — | Card subtitle |
| Image | `image` | Image | — | Card / detail |
| **Base Code** | `base-code` | PlainText | search | e.g. AML150 |
| **Series** | `series` | Option | yes | AML, APO, ACD, ART, AMT, Other |
| **Product Type** | `product-type` | Option | yes | Straight ladder, tray, elbow… |
| **Product Family** | `product-family` | Ref → ProductArrays | yes | Cable Ladder / Tray |
| **Materials** | `materials` | MultiRef → Materials | yes | HDG, SS304… |
| **Width Options** | `width-options` | PlainText | soft | `150,300,450,600` |
| **Height** | `height` | PlainText | soft | `150 mm` |
| **Loading Depth** | `loading-depth` | PlainText | — | From load tests |
| **Thickness** | `thickness` | PlainText | — | |
| **Standard** | `standard` | PlainText | yes* | NEMA / IEC |
| **NEMA Class** | `nema-class` | PlainText | soft | 20AA / 20A / 20B |
| **Safety Factor** | `safety-factor` | PlainText | — | ×1.5 / ×1.7 |
| **Unit** | `unit` | Option | — | pc / m / set |
| **Sort Order** | `sort-order` | Number | — | Ascending |
| **Catalogue Visible** | `catalogue-visible` | Switch | **required** | Only show if true |
| **System** | `system` | Ref → Systems | **parent** | **Source of truth** for series ownership after reorg |
| **Is System** | `is-system` | Switch | legacy | **Deprecate** after hubs moved to Systems |
| **Characteristics** | `characteristics` | PlainText | — | `Name\|Value` per line |
| **Long Description** | `long-description` | RichText | — | Detail body |
| **Load Ratings Link** | `load-ratings-link` | Link | — | `/load-ratings` |
| Length Configurable | `length-configurable` | Switch | — | Phase 2 inquiry |
| Length Min/Max/Step mm | `length-min-mm` etc. | Number | — | Phase 2 |
| Standard Lengths | `standard-lengths` | PlainText | — | `3000,6000` |

\*Standard can be filtered in custom JS via substring match.

### Series option IDs

| Name | Option ID |
|------|-----------|
| AML | `eb6e755c9d56531c6a8576d992faae25` |
| APO | `97dfcb6e321f3a031f219a02d8447986` |
| ACD | `684474360fee6efb460c5ac8a54dc7e9` |
| ART | `68ee4a0e0c7353671f6569c3e17b76b6` |
| AMT | `2f9f1b1c78e48d8c2afd1fec455cbb84` |
| Other | `9ac9f8e37a59f01683c62395056835f3` |

### Product type option IDs

| Name | Option ID |
|------|-----------|
| Straight ladder | `6ed4f3fdbde9940a2e389458edaef351` |
| Straight tray | `eff7fa3f45bf36bb03512f0bbe5bb06c` |
| Elbow | `90827a47e071fb092f84c8da45392110` |
| Tee | `edf8e8a2810eedb63a7bac319d3f8a3e` |
| Cross | `335c6fd099357c2ec4ce2fc299625284` |
| Riser | `a1101d8a3650f4156e44e8aa26996738` |
| Reducer | `4470d1978ac8e4374dc567d5ef4d4cff` |
| Splice | `ef8066c60613203b3fe737875c49a402` |
| Cover | `b53093b881d117fc89d1dd85acef2e4f` |
| Bracket | `c6e2ee8bb9008274fe5029e3eb97a016` |
| Support | `a1128b603de2e4e0ad62d60fbcd81398` |
| Accessory | `da18058891c755f76bdee82a6330a174` |
| Other | `087543ac0a3a20a907a0013caf4e4144` |

### Unit option IDs

| Name | Option ID |
|------|-----------|
| pc | `1584e8ad2722396ddf9565bfdb003c6f` |
| m | `003d72babce2d2707f3ea1bfc8e55150` |
| set | `bd88f9d0b31a6720e6d0f1db2c748805` |

---

## ProductArrays (`products`) — system pages

| Display name | slug | Type | Notes |
|--------------|------|------|-------|
| (existing) Image, System, Description, Long Description, Materials, Certificates, Sub Products… | | | Keep |
| **Family Code** | `family-code` | PlainText | `ladder`, `tray` |
| **Standards Summary** | `standards-summary` | PlainText | Badge line |
| **Heights Available** | `heights-available` | PlainText | |
| **Widths Available** | `widths-available` | PlainText | |
| **Design Details** | `design-details` | RichText | Øglænd-style system notes |
| **Load Ratings Link** | `load-ratings-link` | Link | |
| **Catalogues** | `catalogues` | MultiRef | PDF downloads |

---

## Characteristics format

```text
Model|AML150
Loading depth|125 mm
SWL @ 3 m|468 kg/m
```

One `Name|Value` pair per line. Render as a table on the product page.
