"""
deploy_oa_calculator.py
Deploy Open Area Calculator v2 to arraymetal.com Webflow site.

Steps:
  1. Upload 18 PNG images (9 full + 9 thumbnails) to Webflow assets
  2. Build a lean HTML embed using CDN URLs (no base64)
  3. Create /open-area-calculator page with site symbols
  4. Inject embed as page custom code (footer)
  5. Publish the site

Usage:
  python deploy_oa_calculator.py --token YOUR_WEBFLOW_API_TOKEN
"""

import argparse
import json
import os
import sys
import requests

SITE_ID   = '6082b34dc5995b3e8dc8c73b'
API_BASE  = 'https://api.webflow.com/v2'

# Symbol IDs (same as load-ratings page)
SYM_TOP_HEADER = '8753aa2e'
SYM_NAVBAR     = 'f1afe9f0'
SYM_CTA        = '832c7d10'
SYM_FOOTER     = '8d702a96'

DIAGRAMS_DIR = r'C:\Users\zhaoy\Desktop\Claude\Perforated Metal Calculator\diagrams'
THUMBS_DIR   = os.path.join(DIAGRAMS_DIR, 'thumbs')

PATTERN_KEYS = ['R-T', 'R-M', 'R-U', 'LR-U', 'LR-ZxZ', 'C-T', 'C-U', 'CD-M', 'H-T']

# Map pattern key -> JS key used in PATTERNS object
JS_KEY_MAP = {
    'R-T':    'RT',
    'R-M':    'RM',
    'R-U':    'RU',
    'LR-U':   'LRU',
    'LR-ZxZ': 'LRZ',
    'C-T':    'CT',
    'C-U':    'CU',
    'CD-M':   'CDM',
    'H-T':    'HT',
}


def headers(token):
    return {
        'Authorization': f'Bearer {token}',
        'accept': 'application/json',
        'content-type': 'application/json',
    }


def upload_image(token, filepath, display_name):
    """Upload a single image to Webflow assets, return CDN URL."""
    # Step 1: Get upload URL
    filename = os.path.basename(filepath)
    r = requests.post(
        f'{API_BASE}/sites/{SITE_ID}/assets',
        headers=headers(token),
        json={
            'fileName': display_name + '.png',
            'fileHash': _file_md5(filepath),
        }
    )
    if r.status_code not in (200, 201):
        print(f'  ERROR getting upload URL for {display_name}: {r.status_code} {r.text[:200]}')
        return None

    data = r.json()
    upload_url    = data['uploadUrl']
    upload_fields = data.get('uploadDetails', {})
    asset_id      = data.get('id') or data.get('_id')

    # Step 2: POST to S3 upload URL
    with open(filepath, 'rb') as f:
        file_bytes = f.read()

    # Build multipart form
    form_data = {k: (None, v) for k, v in upload_fields.items()}
    form_data['file'] = (filename, file_bytes, 'image/png')

    s3r = requests.post(upload_url, files=form_data)
    if s3r.status_code not in (200, 201, 204):
        print(f'  ERROR uploading to S3 for {display_name}: {s3r.status_code} {s3r.text[:200]}')
        return None

    # The CDN URL is typically: uploadUrl base + uploadDetails['key']
    cdn_url = data.get('hostedUrl') or data.get('url')
    if not cdn_url:
        key = upload_fields.get('key', '')
        # Construct from S3 bucket URL
        cdn_url = f"https://uploads-ssl.webflow.com/{key}"

    print(f'  Uploaded {display_name}: {cdn_url}')
    return cdn_url


def _file_md5(filepath):
    import hashlib
    with open(filepath, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def upload_all_images(token):
    """Upload all 18 images, return two dicts: full_urls, thumb_urls keyed by JS key."""
    full_urls  = {}
    thumb_urls = {}

    print('\n── Uploading full diagram images ──')
    for key in PATTERN_KEYS:
        js_key = JS_KEY_MAP[key]
        path = os.path.join(DIAGRAMS_DIR, key + '.png')
        if not os.path.exists(path):
            print(f'  MISSING: {path}')
            continue
        url = upload_image(token, path, f'oa-full-{key}')
        if url:
            full_urls[js_key] = url

    print('\n── Uploading thumbnail images ──')
    for key in PATTERN_KEYS:
        js_key = JS_KEY_MAP[key]
        path = os.path.join(THUMBS_DIR, key + '.png')
        if not os.path.exists(path):
            print(f'  MISSING: {path}')
            continue
        url = upload_image(token, path, f'oa-thumb-{key}')
        if url:
            thumb_urls[js_key] = url

    return full_urls, thumb_urls


def build_embed(full_urls, thumb_urls):
    """Build the lean HTML embed (no base64) referencing CDN URLs."""

    full_js  = json.dumps(full_urls,  indent=2)
    thumb_js = json.dumps(thumb_urls, indent=2)

    return f"""<style>
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
.oa-page {{ max-width: 960px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }}

/* Hero */
.oa-hero {{ margin-bottom: 2.5rem; }}
.oa-hero-label {{ font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #888; margin-bottom: .5rem; }}
.oa-hero h1 {{ font-size: 28px; font-weight: 600; color: #1a1a1a; margin-bottom: .5rem; }}
.oa-hero p {{ font-size: 14px; color: #555; max-width: 560px; }}

/* Thumbnail Grid */
.oa-grid-header {{ font-size: 11px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: #888; margin-bottom: .75rem; margin-top: 1.5rem; }}
.oa-grid-header:first-of-type {{ margin-top: 0; }}
.oa-thumb-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: .875rem; margin-bottom: .5rem; }}
.oa-thumb-card {{
  background: #fff;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  padding: .625rem .625rem .6rem;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s, transform .1s;
  text-align: center;
  text-decoration: none;
  display: block;
}}
.oa-thumb-card:hover {{
  border-color: #185FA5;
  box-shadow: 0 4px 14px rgba(24,95,165,.13);
  transform: translateY(-2px);
}}
.oa-thumb-card img {{
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
  margin-bottom: .5rem;
}}
.oa-thumb-name {{ font-size: 13px; font-weight: 600; color: #1a1a1a; }}
.oa-thumb-desc {{ font-size: 11px; color: #888; margin-top: 2px; line-height: 1.4; }}

/* Sections */
.oa-sections-wrap {{ margin-top: 3rem; }}
.oa-pattern-section {{ margin-bottom: 2.5rem; scroll-margin-top: 1.5rem; }}
.oa-pattern-section.highlight {{ animation: oaSectionFlash .7s ease-out; }}
@keyframes oaSectionFlash {{
  0%   {{ outline: 3px solid #185FA5; outline-offset: 6px; border-radius: 12px; }}
  100% {{ outline: 3px solid transparent; }}
}}
.oa-section-heading {{
  display: flex; align-items: baseline; gap: .6rem;
  margin-bottom: 1rem; padding-bottom: .6rem;
  border-bottom: 1px solid #e8e8e8;
}}
.oa-section-heading .oa-pat-name {{ font-size: 17px; font-weight: 700; color: #185FA5; }}
.oa-section-heading .oa-pat-desc {{ font-size: 13px; color: #555; }}

.oa-calc-card {{
  background: #fff; border: 1px solid #ddd; border-radius: 12px;
  padding: 1.75rem; display: grid;
  grid-template-columns: 1fr 1fr; gap: 1.75rem; align-items: start;
}}
.oa-diagram-panel img {{ width: 100%; border-radius: 8px; border: 1px solid #eee; display: block; }}
.oa-diagram-label {{ font-size: 11px; color: #aaa; text-align: center; margin-top: .5rem; letter-spacing: .04em; }}
.oa-inputs-panel {{ display: flex; flex-direction: column; gap: 1rem; }}
.oa-field-row {{ display: flex; flex-direction: column; gap: .3rem; }}
.oa-field-label {{ font-size: 12px; font-weight: 500; color: #444; }}
.oa-field-input-wrap {{ display: flex; align-items: center; gap: .5rem; }}
.oa-field-input {{
  flex: 1; border: 1.5px solid #ddd; border-radius: 7px;
  padding: .5rem .7rem; font-size: 14px; color: #1a1a1a;
  outline: none; transition: border-color .15s;
}}
.oa-field-input:focus {{ border-color: #185FA5; }}
.oa-field-unit {{ font-size: 12px; color: #aaa; white-space: nowrap; }}

.oa-results {{ display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-top: .5rem; }}
.oa-result-box {{
  background: #f7f7f5; border-radius: 9px; padding: .9rem 1rem;
  display: flex; flex-direction: column; gap: .2rem;
}}
.oa-result-label {{ font-size: 11px; color: #888; font-weight: 500; text-transform: uppercase; letter-spacing: .05em; }}
.oa-result-value {{ font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.1; }}
.oa-result-value.low    {{ color: #c0392b; }}
.oa-result-value.medium {{ color: #e67e22; }}
.oa-result-value.good   {{ color: #27ae60; }}
.oa-result-value.high   {{ color: #185FA5; }}
.oa-result-unit  {{ font-size: 14px; font-weight: 400; color: #888; }}
.oa-holes-unit   {{ font-size: 13px; font-weight: 400; color: #888; }}

.oa-formula-note {{
  font-size: 11px; color: #aaa; background: #f9f9f7;
  border-radius: 6px; padding: .5rem .75rem; line-height: 1.8;
}}
.oa-formula-note code {{ font-family: 'SF Mono', Menlo, monospace; font-size: 11px; color: #555; }}
.oa-back-link {{ font-size: 12px; color: #185FA5; text-decoration: none; display: inline-block; margin-top: .75rem; }}
.oa-back-link:hover {{ text-decoration: underline; }}
.oa-section-divider {{ border: none; border-top: 1px solid #f0f0f0; margin: 2rem 0; }}

@media (max-width: 640px) {{
  .oa-thumb-grid {{ grid-template-columns: repeat(2, 1fr); }}
  .oa-calc-card {{ grid-template-columns: 1fr; }}
}}
</style>

<div class="oa-page" id="oa-top">
  <div class="oa-hero">
    <div class="oa-hero-label">Array Metal (M) Sdn. Bhd.</div>
    <h1>Open Area Calculator</h1>
    <p>Select a perforation pattern to calculate open area percentage and hole density for your perforated metal sheet.</p>
  </div>
  <div id="oa-thumb-section"></div>
  <div class="oa-sections-wrap" id="oa-sections"></div>
</div>

<script>
(function() {{
  var FULL_URLS  = {full_js};
  var THUMB_URLS = {thumb_js};

  var PATTERNS = {{
    RT: {{
      name: 'R-T', desc: 'Round holes, 60° triangular pitch',
      fields: [
        {{ id: 'R', label: 'R — Hole Diameter' }},
        {{ id: 'T', label: 'T — Pitch' }},
      ],
      openArea:   function(v) {{ return (v.R*v.R / v.T/v.T) * 90.69; }},
      holesPerM2: function(v) {{ return 1154700 / (v.T*v.T); }},
      formula: 'Open Area = (R² / T²) × 90.69%',
      holesFormula: 'Holes/m² = 1,154,700 / T²',
      valid: function(v) {{ return v.R > 0 && v.T > 0 && v.R < v.T; }},
    }},
    RM: {{
      name: 'R-M', desc: 'Round holes, 45° diagonal pitch',
      fields: [
        {{ id: 'R', label: 'R — Hole Diameter' }},
        {{ id: 'M', label: 'M — Pitch' }},
      ],
      openArea:   function(v) {{ return (v.R*v.R / (v.M*v.M)) * 78.54; }},
      holesPerM2: function(v) {{ return 1000000 / (v.M*v.M); }},
      formula: 'Open Area = (R² / M²) × 78.54%',
      holesFormula: 'Holes/m² = 1,000,000 / M²',
      valid: function(v) {{ return v.R > 0 && v.M > 0 && v.R < v.M; }},
    }},
    RU: {{
      name: 'R-U', desc: 'Round holes, 90° rectangular pitch',
      fields: [
        {{ id: 'R',  label: 'R — Hole Diameter' }},
        {{ id: 'U1', label: 'U₁ — Pitch (row)' }},
        {{ id: 'U2', label: 'U₂ — Pitch (column)' }},
      ],
      openArea:   function(v) {{ return (v.R*v.R / (v.U1*v.U2)) * 78.54; }},
      holesPerM2: function(v) {{ return 1000000 / (v.U1*v.U2); }},
      formula: 'Open Area = (R² / (U₁ × U₂)) × 78.54%',
      holesFormula: 'Holes/m² = 1,000,000 / (U₁ × U₂)',
      valid: function(v) {{ return v.R > 0 && v.U1 > 0 && v.U2 > 0; }},
    }},
    LRU: {{
      name: 'LR-U', desc: 'Oblong holes, rectangular pitch',
      fields: [
        {{ id: 'R',  label: 'R — Slot Width' }},
        {{ id: 'L',  label: 'L — Slot Length' }},
        {{ id: 'U1', label: 'U₁ — Pitch (row)' }},
        {{ id: 'U2', label: 'U₂ — Pitch (column)' }},
      ],
      openArea:   function(v) {{ return (v.R*v.L - 0.215*v.R*v.R) * 100 / (v.U1*v.U2); }},
      holesPerM2: function(v) {{ return 1000000 / (v.U1*v.U2); }},
      formula: 'Open Area = (R × L − 0.215 × R²) × 100 / (U₁ × U₂)',
      holesFormula: 'Holes/m² = 1,000,000 / (U₁ × U₂)',
      valid: function(v) {{ return v.R > 0 && v.L > 0 && v.U1 > 0 && v.U2 > 0 && v.L >= v.R; }},
    }},
    LRZ: {{
      name: 'LR-Z×Z', desc: 'Oblong holes, staggered pitch',
      fields: [
        {{ id: 'R',  label: 'R — Slot Width' }},
        {{ id: 'L',  label: 'L — Slot Length' }},
        {{ id: 'Z1', label: 'Z₁ — Pitch 1' }},
        {{ id: 'Z2', label: 'Z₂ — Pitch 2' }},
      ],
      openArea:   function(v) {{ return (v.R*v.L - 0.215*v.R*v.R) * 100 / (v.Z1*v.Z2); }},
      holesPerM2: function(v) {{ return 1000000 / (v.Z1*v.Z2); }},
      formula: 'Open Area = (R × L − 0.215 × R²) × 100 / (Z₁ × Z₂)',
      holesFormula: 'Holes/m² = 1,000,000 / (Z₁ × Z₂)',
      valid: function(v) {{ return v.R > 0 && v.L > 0 && v.Z1 > 0 && v.Z2 > 0 && v.L >= v.R; }},
    }},
    CT: {{
      name: 'C-T', desc: 'Square holes, 60° triangular pitch',
      fields: [
        {{ id: 'C', label: 'C — Hole Side Length' }},
        {{ id: 'T', label: 'T — Pitch' }},
      ],
      openArea:   function(v) {{ return (v.C*v.C / (v.T*v.T)) * 115.47; }},
      holesPerM2: function(v) {{ return 1154700 / (v.T*v.T); }},
      formula: 'Open Area = (C² / T²) × 115.47%',
      holesFormula: 'Holes/m² = 1,154,700 / T²',
      valid: function(v) {{ return v.C > 0 && v.T > 0 && v.C < v.T; }},
    }},
    CU: {{
      name: 'C-U', desc: 'Square holes, 90° rectangular pitch',
      fields: [
        {{ id: 'C',  label: 'C — Hole Side Length' }},
        {{ id: 'U1', label: 'U₁ — Pitch (row)' }},
        {{ id: 'U2', label: 'U₂ — Pitch (column)' }},
      ],
      openArea:   function(v) {{ return (v.C*v.C / (v.U1*v.U2)) * 100; }},
      holesPerM2: function(v) {{ return 1000000 / (v.U1*v.U2); }},
      formula: 'Open Area = (C² / (U₁ × U₂)) × 100%',
      holesFormula: 'Holes/m² = 1,000,000 / (U₁ × U₂)',
      valid: function(v) {{ return v.C > 0 && v.U1 > 0 && v.U2 > 0; }},
    }},
    CDM: {{
      name: 'CD-M', desc: 'Square holes (diagonal), 45° pitch',
      fields: [
        {{ id: 'CD', label: 'CD — Hole Side Length' }},
        {{ id: 'M',  label: 'M — Pitch' }},
      ],
      openArea:   function(v) {{ return (v.CD*v.CD / (v.M*v.M)) * 100; }},
      holesPerM2: function(v) {{ return 1000000 / (v.M*v.M); }},
      formula: 'Open Area = (CD² / M²) × 100%',
      holesFormula: 'Holes/m² = 1,000,000 / M²',
      valid: function(v) {{ return v.CD > 0 && v.M > 0 && v.CD < v.M; }},
    }},
    HT: {{
      name: 'H-T', desc: 'Hexagon holes, 60° triangular pitch',
      fields: [
        {{ id: 'H', label: 'H — Hole Across Flats' }},
        {{ id: 'T', label: 'T — Pitch' }},
      ],
      openArea:   function(v) {{ return (v.H*v.H / (v.T*v.T)) * 100; }},
      holesPerM2: function(v) {{ return 1154700 / (v.T*v.T); }},
      formula: 'Open Area = (H² / T²) × 100%',
      holesFormula: 'Holes/m² = 1,154,700 / T²',
      valid: function(v) {{ return v.H > 0 && v.T > 0 && v.H < v.T; }},
    }},
  }};

  var GROUPS = [
    {{ label: 'Round Holes',   keys: ['RT', 'RM', 'RU'] }},
    {{ label: 'Oblong Holes',  keys: ['LRU', 'LRZ'] }},
    {{ label: 'Square Holes',  keys: ['CT', 'CU', 'CDM'] }},
    {{ label: 'Hexagon Holes', keys: ['HT'] }},
  ];

  function buildThumbs() {{
    var wrap = document.getElementById('oa-thumb-section');
    GROUPS.forEach(function(g) {{
      var hdr = document.createElement('div');
      hdr.className = 'oa-grid-header';
      hdr.textContent = g.label;
      wrap.appendChild(hdr);

      var grid = document.createElement('div');
      grid.className = 'oa-thumb-grid';

      g.keys.forEach(function(key) {{
        var p = PATTERNS[key];
        var card = document.createElement('a');
        card.className = 'oa-thumb-card';
        card.href = '#oa-section-' + key;

        var img = document.createElement('img');
        img.src = THUMB_URLS[key] || '';
        img.alt = p.name;
        card.appendChild(img);

        var name = document.createElement('div');
        name.className = 'oa-thumb-name';
        name.textContent = p.name;
        card.appendChild(name);

        var desc = document.createElement('div');
        desc.className = 'oa-thumb-desc';
        desc.textContent = p.desc;
        card.appendChild(desc);

        card.addEventListener('click', function(e) {{
          e.preventDefault();
          var sec = document.getElementById('oa-section-' + key);
          if (sec) {{
            sec.scrollIntoView({{ behavior: 'smooth' }});
            sec.classList.remove('highlight');
            void sec.offsetWidth;
            sec.classList.add('highlight');
            setTimeout(function() {{ sec.classList.remove('highlight'); }}, 800);
          }}
        }});

        grid.appendChild(card);
      }});

      wrap.appendChild(grid);
    }});
  }}

  function buildSections() {{
    var wrap = document.getElementById('oa-sections');
    var keys = [];
    GROUPS.forEach(function(g) {{ g.keys.forEach(function(k) {{ keys.push(k); }}); }});

    keys.forEach(function(key, idx) {{
      var p = PATTERNS[key];

      if (idx > 0) {{
        var hr = document.createElement('hr');
        hr.className = 'oa-section-divider';
        wrap.appendChild(hr);
      }}

      var sec = document.createElement('div');
      sec.className = 'oa-pattern-section';
      sec.id = 'oa-section-' + key;

      var hdr = document.createElement('div');
      hdr.className = 'oa-section-heading';
      hdr.innerHTML =
        '<span class="oa-pat-name">' + p.name + '</span>' +
        '<span class="oa-pat-desc">' + p.desc + '</span>';
      sec.appendChild(hdr);

      var card = document.createElement('div');
      card.className = 'oa-calc-card';

      // Left: diagram
      var diagPanel = document.createElement('div');
      diagPanel.className = 'oa-diagram-panel';
      var dImg = document.createElement('img');
      dImg.src = FULL_URLS[key] || '';
      dImg.alt = p.name + ' diagram';
      diagPanel.appendChild(dImg);
      var dLabel = document.createElement('div');
      dLabel.className = 'oa-diagram-label';
      dLabel.textContent = p.name + ' — ' + p.desc;
      diagPanel.appendChild(dLabel);
      card.appendChild(diagPanel);

      // Right: inputs + results
      var inputsPanel = document.createElement('div');
      inputsPanel.className = 'oa-inputs-panel';

      var fc = document.createElement('div');
      fc.style.display = 'flex';
      fc.style.flexDirection = 'column';
      fc.style.gap = '.75rem';

      p.fields.forEach(function(f) {{
        var row = document.createElement('div');
        row.className = 'oa-field-row';
        row.innerHTML =
          '<label class="oa-field-label" for="oa-inp-' + key + '-' + f.id + '">' + f.label + '</label>' +
          '<div class="oa-field-input-wrap">' +
            '<input class="oa-field-input" id="oa-inp-' + key + '-' + f.id + '" type="number" min="0.01" step="any" placeholder="0.00" autocomplete="off">' +
            '<span class="oa-field-unit">mm</span>' +
          '</div>';
        fc.appendChild(row);
        document.addEventListener('DOMContentLoaded', function() {{
          var el = document.getElementById('oa-inp-' + key + '-' + f.id);
          if (el) el.addEventListener('input', function() {{ calculate(key); }});
        }});
      }});
      inputsPanel.appendChild(fc);

      var results = document.createElement('div');
      results.className = 'oa-results';
      results.innerHTML =
        '<div class="oa-result-box">' +
          '<div class="oa-result-label">Open Area</div>' +
          '<div class="oa-result-value" id="oa-oa-' + key + '">—</div>' +
        '</div>' +
        '<div class="oa-result-box">' +
          '<div class="oa-result-label">Holes / m²</div>' +
          '<div class="oa-result-value" id="oa-holes-' + key + '">—</div>' +
        '</div>';
      inputsPanel.appendChild(results);

      var fn = document.createElement('div');
      fn.className = 'oa-formula-note';
      fn.id = 'oa-fn-' + key;
      fn.innerHTML = '<code>' + p.formula + '</code><br><code>' + p.holesFormula + '</code>';
      inputsPanel.appendChild(fn);

      card.appendChild(inputsPanel);
      sec.appendChild(card);

      var back = document.createElement('a');
      back.className = 'oa-back-link';
      back.href = '#oa-top';
      back.textContent = '↑ Back to patterns';
      back.addEventListener('click', function(e) {{
        e.preventDefault();
        document.getElementById('oa-top').scrollIntoView({{ behavior: 'smooth' }});
      }});
      sec.appendChild(back);

      wrap.appendChild(sec);
    }});

    // Attach input listeners after DOM is built
    keys.forEach(function(key) {{
      var p = PATTERNS[key];
      p.fields.forEach(function(f) {{
        var el = document.getElementById('oa-inp-' + key + '-' + f.id);
        if (el) el.addEventListener('input', function() {{ calculate(key); }});
      }});
    }});
  }}

  function calculate(key) {{
    var p = PATTERNS[key];
    var v = {{}};
    var allFilled = true;

    p.fields.forEach(function(f) {{
      var el = document.getElementById('oa-inp-' + key + '-' + f.id);
      var val = parseFloat(el.value);
      if (!el.value || isNaN(val) || val <= 0) allFilled = false;
      v[f.id] = val;
    }});

    var oaEl    = document.getElementById('oa-oa-' + key);
    var holesEl = document.getElementById('oa-holes-' + key);

    if (!allFilled || !p.valid(v)) {{
      oaEl.textContent = '—';
      oaEl.className = 'oa-result-value';
      holesEl.textContent = '—';
      return;
    }}

    var oa    = p.openArea(v);
    var holes = p.holesPerM2(v);

    if (oa < 0 || oa > 100) {{
      oaEl.textContent = '—';
      oaEl.className = 'oa-result-value';
      holesEl.textContent = '—';
      return;
    }}

    oaEl.innerHTML = oa.toFixed(1) + '<span class="oa-result-unit">%</span>';
    oaEl.className = 'oa-result-value ' + (oa < 20 ? 'low' : oa < 40 ? 'medium' : oa < 60 ? 'good' : 'high');
    holesEl.innerHTML = Math.round(holes).toLocaleString() + '<span class="oa-holes-unit">/m²</span>';
  }}

  buildThumbs();
  buildSections();
}})();
</script>"""


def get_page_id_by_slug(token, slug):
    """Check if a page with the given slug already exists."""
    r = requests.get(f'{API_BASE}/sites/{SITE_ID}/pages', headers=headers(token))
    if r.status_code != 200:
        return None
    pages = r.json().get('pages', [])
    for p in pages:
        if p.get('slug') == slug:
            return p.get('id')
    return None


def create_page(token):
    """Create the /open-area-calculator page."""
    existing = get_page_id_by_slug(token, 'open-area-calculator')
    if existing:
        print(f'\n── Page already exists (id: {existing}), reusing ──')
        return existing

    print('\n── Creating /open-area-calculator page ──')
    r = requests.post(
        f'{API_BASE}/sites/{SITE_ID}/pages',
        headers=headers(token),
        json={
            'slug': 'open-area-calculator',
            'title': 'Open Area Calculator',
            'seo': {
                'title': 'Open Area Calculator — Array Metal',
                'description': 'Calculate open area percentage and hole density for perforated metal sheets. Supports round, oblong, square and hexagon hole patterns.',
            },
        }
    )
    if r.status_code not in (200, 201):
        print(f'ERROR creating page: {r.status_code} {r.text[:400]}')
        sys.exit(1)

    page_id = r.json().get('id')
    print(f'  Created page id: {page_id}')
    return page_id


def inject_custom_code(token, page_id, embed_html):
    """Inject the embed as page footer custom code."""
    print('\n── Injecting custom code ──')

    # Check embed size
    size_kb = len(embed_html.encode('utf-8')) / 1024
    print(f'  Embed size: {size_kb:.1f} KB')

    r = requests.post(
        f'{API_BASE}/pages/{page_id}/custom-code',
        headers=headers(token),
        json={
            'location': 'footer',
            'version': '1.0.0',
            'scripts': [],
            'customCode': embed_html,
        }
    )
    if r.status_code not in (200, 201, 204):
        print(f'ERROR injecting custom code: {r.status_code} {r.text[:400]}')
        sys.exit(1)
    print('  Custom code injected successfully')


def publish_site(token):
    """Publish the site to live."""
    print('\n── Publishing site ──')
    r = requests.post(
        f'{API_BASE}/sites/{SITE_ID}/publish',
        headers=headers(token),
        json={'publishTargets': ['live']},
    )
    if r.status_code not in (200, 201, 202):
        print(f'ERROR publishing: {r.status_code} {r.text[:400]}')
        sys.exit(1)
    print('  Site published')


def main():
    parser = argparse.ArgumentParser(description='Deploy Open Area Calculator to Webflow')
    parser.add_argument('--token', required=True, help='Webflow API token')
    parser.add_argument('--skip-images', action='store_true',
                        help='Skip image upload (use if images already uploaded); provide URLs via --urls-json')
    parser.add_argument('--urls-json', default=None,
                        help='Path to JSON file with {"full": {...}, "thumb": {...}} CDN URLs (use with --skip-images)')
    args = parser.parse_args()

    token = args.token

    if args.skip_images and args.urls_json:
        with open(args.urls_json) as f:
            url_data = json.load(f)
        full_urls  = url_data['full']
        thumb_urls = url_data['thumb']
        print('Using pre-uploaded image URLs from', args.urls_json)
    else:
        full_urls, thumb_urls = upload_all_images(token)

        # Save URLs to file for re-use
        urls_out = os.path.join(os.path.dirname(__file__), 'oa_image_urls.json')
        with open(urls_out, 'w') as f:
            json.dump({'full': full_urls, 'thumb': thumb_urls}, f, indent=2)
        print(f'\n  Image URLs saved to {urls_out}')

        missing_full  = [k for k in JS_KEY_MAP.values() if k not in full_urls]
        missing_thumb = [k for k in JS_KEY_MAP.values() if k not in thumb_urls]
        if missing_full or missing_thumb:
            print(f'WARNING: Missing full URLs: {missing_full}')
            print(f'WARNING: Missing thumb URLs: {missing_thumb}')

    embed_html = build_embed(full_urls, thumb_urls)
    page_id    = create_page(token)
    inject_custom_code(token, page_id, embed_html)
    publish_site(token)

    print(f'\n✓ Done! Live at: https://arraymetal.com/open-area-calculator')
    print(f'  Page ID: {page_id}')


if __name__ == '__main__':
    main()
