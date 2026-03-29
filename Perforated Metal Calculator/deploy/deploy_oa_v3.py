"""
deploy_oa_v3.py
Deploy Open Area Calculator v3 to arraymetal.com Webflow site.

Steps:
  1. Upload 18 PNG images (9 full + 9 thumbnails) to Webflow assets
     (skip if already uploaded — use --skip-images --urls-json oa_image_urls.json)
  2. Read embed from embed_oa_v3.txt and inject CDN URLs
  3. Create /open-area-calculator-v3 page with site symbols
  4. Inject embed as page custom code (footer)
  5. Publish the site

Usage:
  python deploy_oa_v3.py --token YOUR_WEBFLOW_API_TOKEN

  # If images already uploaded (e.g. from v2 deploy):
  python deploy_oa_v3.py --token YOUR_TOKEN --skip-images --urls-json oa_image_urls.json
"""

import argparse
import hashlib
import json
import os
import re
import sys
import io
import requests

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

SITE_ID  = '6082b34dc5995b3e8dc8c73b'
API_BASE = 'https://api.webflow.com/v2'

PAGE_SLUG  = 'open-area-calculator-v3'
PAGE_TITLE = 'Open Area Calculator v3'

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
EMBED_FILE   = os.path.join(SCRIPT_DIR, 'embed_oa_v3.txt')
DIAGRAMS_DIR = os.path.join(SCRIPT_DIR, 'diagrams')
THUMBS_DIR   = os.path.join(DIAGRAMS_DIR, 'thumbs')

PATTERN_KEYS = ['R-T', 'R-M', 'R-U', 'LR-U', 'LR-ZxZ', 'C-T', 'C-U', 'CD-M', 'H-T']

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


def _file_md5(filepath):
    with open(filepath, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def upload_image(token, filepath, display_name):
    """Upload a single image to Webflow assets, return CDN URL."""
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

    with open(filepath, 'rb') as f:
        file_bytes = f.read()

    form_data = {k: (None, v) for k, v in upload_fields.items()}
    form_data['file'] = (filename, file_bytes, 'image/png')

    s3r = requests.post(upload_url, files=form_data)
    if s3r.status_code not in (200, 201, 204):
        print(f'  ERROR uploading to S3 for {display_name}: {s3r.status_code} {s3r.text[:200]}')
        return None

    cdn_url = data.get('hostedUrl') or data.get('url')
    if not cdn_url:
        key = upload_fields.get('key', '')
        cdn_url = f"https://uploads-ssl.webflow.com/{key}"

    print(f'  Uploaded {display_name}: {cdn_url}')
    return cdn_url


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
    """Read embed_oa_v3.txt and inject CDN URLs into the IMGS placeholder."""
    with open(EMBED_FILE, 'r', encoding='utf-8') as f:
        embed = f.read()

    # The embed uses hardcoded CDN URLs in FULL_URLS / THUMB_URLS objects.
    # Replace them with the freshly uploaded URLs if provided.
    if full_urls:
        full_js  = json.dumps(full_urls,  indent=2)
        thumb_js = json.dumps(thumb_urls, indent=2)
        embed = re.sub(
            r'var FULL_URLS\s*=\s*\{[^}]*\};',
            'var FULL_URLS = ' + full_js + ';',
            embed, flags=re.DOTALL
        )
        embed = re.sub(
            r'var THUMB_URLS\s*=\s*\{[^}]*\};',
            'var THUMB_URLS = ' + thumb_js + ';',
            embed, flags=re.DOTALL
        )

    return embed


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
    """Create the /open-area-calculator-v3 page."""
    existing = get_page_id_by_slug(token, PAGE_SLUG)
    if existing:
        print(f'\n── Page already exists (id: {existing}), reusing ──')
        return existing

    print(f'\n── Creating /{PAGE_SLUG} page ──')
    r = requests.post(
        f'{API_BASE}/sites/{SITE_ID}/pages',
        headers=headers(token),
        json={
            'slug': PAGE_SLUG,
            'title': PAGE_TITLE,
            'seo': {
                'title': 'Open Area Calculator v3 — Array Metal',
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
    size_kb = len(embed_html.encode('utf-8')) / 1024
    print(f'  Embed size: {size_kb:.1f} KB')

    r = requests.put(
        f'{API_BASE}/pages/{page_id}/custom_code',
        headers=headers(token),
        json={
            'headerCode': '',
            'footerCode': embed_html,
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
    parser = argparse.ArgumentParser(description='Deploy Open Area Calculator v3 to Webflow')
    parser.add_argument('--token', required=True, help='Webflow API token')
    parser.add_argument('--skip-images', action='store_true',
                        help='Skip image upload (use if images already on CDN)')
    parser.add_argument('--urls-json', default=None,
                        help='Path to JSON file with {"full": {...}, "thumb": {...}} CDN URLs')
    args = parser.parse_args()

    token = args.token

    if args.skip_images and args.urls_json:
        with open(args.urls_json) as f:
            url_data = json.load(f)
        full_urls  = url_data['full']
        thumb_urls = url_data['thumb']
        print('Using pre-uploaded image URLs from', args.urls_json)
        embed_html = build_embed(full_urls, thumb_urls)
    elif args.skip_images:
        # No URL injection — embed already has hardcoded CDN URLs
        print('Skipping image upload, using URLs already in embed_oa_v3.txt')
        with open(EMBED_FILE, 'r', encoding='utf-8') as f:
            embed_html = f.read()
    else:
        full_urls, thumb_urls = upload_all_images(token)

        urls_out = os.path.join(SCRIPT_DIR, 'oa_image_urls.json')
        with open(urls_out, 'w') as f:
            json.dump({'full': full_urls, 'thumb': thumb_urls}, f, indent=2)
        print(f'\n  Image URLs saved to {urls_out}')

        missing_full  = [k for k in JS_KEY_MAP.values() if k not in full_urls]
        missing_thumb = [k for k in JS_KEY_MAP.values() if k not in thumb_urls]
        if missing_full or missing_thumb:
            print(f'WARNING: Missing full URLs: {missing_full}')
            print(f'WARNING: Missing thumb URLs: {missing_thumb}')

        embed_html = build_embed(full_urls, thumb_urls)

    page_id = create_page(token)
    inject_custom_code(token, page_id, embed_html)
    publish_site(token)

    print(f'\n✓ Done! Live at: https://arraymetal.com/{PAGE_SLUG}')
    print(f'  Page ID: {page_id}')


if __name__ == '__main__':
    main()
