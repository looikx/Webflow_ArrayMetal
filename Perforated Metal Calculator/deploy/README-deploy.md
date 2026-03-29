# Deployment Guide

The scripts in this folder use the Webflow API to upload images and inject the calculator embed into the Webflow page.

## Prerequisites

- Python 3.8+
- `requests` library: `pip install requests`
- A Webflow API token with read/write access to the site

## Token Setup

**Never hardcode the token in a file.** Set it as an environment variable:

```bash
# macOS / Linux
export WEBFLOW_TOKEN=your_token_here

# Windows (PowerShell)
$env:WEBFLOW_TOKEN = "your_token_here"

# Windows (cmd)
set WEBFLOW_TOKEN=your_token_here
```

To generate a token: Webflow → Account Settings → Integrations → API Access → Generate Token.

## deploy_oa_v3.py (current)

Deploys the v3 embed with the modal inquiry form.

```bash
python deploy_oa_v3.py --token $WEBFLOW_TOKEN
```

**Options:**

| Flag | Description |
|------|-------------|
| `--token TOKEN` | Webflow API token (or set `WEBFLOW_TOKEN` env var) |
| `--skip-images` | Skip image upload (use with `--urls-json`) |
| `--urls-json PATH` | Path to previously saved CDN URL map (default: `oa_image_urls.json`) |

**What it does:**
1. Uploads 9 full-res diagrams + 9 thumbnails from `assets/diagrams/` and `assets/thumbs/` to Webflow Assets
2. Saves CDN URLs to `oa_image_urls.json`
3. Creates `/open-area-calculator` page (skips if it already exists)
4. Injects `embed/calculator-embed.txt` as page footer custom code
5. Publishes the site

## deploy_oa_calculator.py (v2 reference)

Earlier version of the deploy script. Kept for reference. Use `deploy_oa_v3.py` for new deployments.

## Manual Update (no script needed)

For content-only changes to the embed:
1. Edit `embed/calculator-embed.txt`
2. Open Webflow Designer → `open-area-calculator` page → Page Settings → Custom Code
3. Replace the contents of **Before `</body>` tag** with the updated file
4. Save → Publish

## Image CDN URLs

Once images are uploaded, their CDN URLs are saved to `oa_image_urls.json` (gitignored). If you re-upload images, update the `IMGS` object in `embed/calculator-embed.txt` with the new URLs.

The CDN base URL is:
```
https://cdn.prod.website-files.com/6082b34dc5995b3e8dc8c73b/
```
