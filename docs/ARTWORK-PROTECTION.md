# PosterLeague Artwork Protection

## What is protected on the live store

| Layer | What it does |
|-------|----------------|
| **Upload pipeline** | Bakes diagonal watermark into files before Shopify |
| **Preview cap** | Theme serves images at max 1600px via Shopify CDN |
| **CSS watermark** | Repeating diagonal overlay as backup on all artwork |
| **Gallery order** | Mockups first; flat preview is always slide 5 |
| **Deterrents** | Site-wide right-click block, drag block, no text selection on artwork |

## Add new artwork (step by step)

### 1. Process masters locally

```powershell
cd E:\posterleague-theme
pip install Pillow
```

Put print masters in `artwork-masters/` (never upload these):

```
artwork-masters/
  spiritual-poster-35.png   ← your 4K/8K master (private)
```

Run the pipeline:

```powershell
python scripts/protect-artwork.py
```

Outputs in `artwork-ready/`:

| File | Use |
|------|-----|
| `*-preview.webp` | Upload to Shopify as the product image |
| `*-thumb.webp` | Optional smaller asset |
| `*-detail.webp` | Optional pre-baked detail crop |

### 2. Upload to Shopify

1. Shopify Admin → Products → open product
2. Upload **only** `*-preview.webp` from `artwork-ready/`
3. **Do not** upload files from `artwork-masters/`

### 3. Theme handles the rest

- Gallery shows room mockup first, flat preview last
- Watermark overlay on every artwork view
- Right-click and drag disabled site-wide

## Gallery slide order (product page)

1. Premium room mockup (cinematic)
2. Framed wall mockup
3. Close-up detail crop
4. Side-angle mockup
5. Flat protected preview (max 1600px)

Tap **4+** for specs, size guide, dimensions, and video.

## Environment variables

None required for the Shopify theme or local Python script.

## Files

| Path | Role |
|------|------|
| `scripts/protect-artwork.py` | Bakes watermark + generates WebP previews |
| `assets/image-watermark.css` | Diagonal repeating CSS watermark |
| `assets/image-protection.js` | Right-click & drag deterrents |
| `snippets/pl-artwork-watermark.liquid` | Watermark overlay snippet |
| `sections/main-product.liquid` | Mockup-first gallery |

## Important limits

- **Screenshots cannot be blocked** on any website
- Shopify CDN URLs are public once uploaded
- **Never upload print masters** — only pipeline outputs
- CSS watermark helps but baked watermark in the file is stronger
