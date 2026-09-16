#!/usr/bin/env python3
import os
import csv
import re
from pathlib import Path

folder = Path(r"E:\posters catlog\Spiritual")
files = sorted([f for f in folder.glob("*.png")], key=lambda x: int(re.search(r'\d+', x.stem).group()) if re.search(r'\d+', x.stem) else x.stem)

output_csv = r"E:\posters catlog\spiritual_105_posters_shopify.csv"
output_csv_backup = r"E:\posterleague-theme\spiritual_105_posters_shopify.csv"

CDN_BASE = "https://cdn.shopify.com/s/files/1/0750/3639/3633/files"

VARIANT_CONFIGS = [
    {'size': 'A5 (5.8 x 8.3 in)', 'price': '69.00', 'compare_price': '99.00', 'sku_suffix': 'A5'},
    {'size': 'A4 (8.3 x 11.7 in)', 'price': '99.00', 'compare_price': '149.00', 'sku_suffix': 'A4'},
    {'size': 'A3 (11.7 x 16.5 in)', 'price': '129.00', 'compare_price': '199.00', 'sku_suffix': 'A3'},
]

all_rows = []

for idx, file_path in enumerate(files, 1):
    num_str = file_path.stem
    handle = f"spiritual-sacred-art-poster-{num_str}"
    title = f"Spiritual Sacred Art Poster #{num_str}"
    image_url = f"{CDN_BASE}/{num_str}.png"
    
    description = f"<p><strong>Transform your sacred space with {title} from POSTERLEAGUE.</strong></p><ul><li><strong>Material:</strong> 300 GSM Heavyweight Premium Cardstock</li><li><strong>Finish:</strong> Ultra-Clear Matte Thermal Lamination (Scratch-Proof &amp; Splash-Resistant)</li><li><strong>Print Quality:</strong> Ultra-HD 8K Vivid Color Reproduction</li><li><strong>Available Sizes:</strong> A5, A4, and A3 formats</li><li><strong>Packaging:</strong> Shipped in crush-resistant protective mailers</li><li><strong>Guarantee:</strong> 100% Quality Inspected &bull; Made in India</li></ul>"
    
    tags = "poster, spiritual, 300gsm, laminated, made-to-order"
    
    for v_idx, v in enumerate(VARIANT_CONFIGS):
        is_first = (v_idx == 0)
        row = {
            'Handle': handle,
            'Title': title if is_first else '',
            'Body (HTML)': description if is_first else '',
            'Vendor': 'POSTERLEAGUE' if is_first else '',
            'Product Category': 'Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork' if is_first else '',
            'Type': 'Art Print' if is_first else '',
            'Tags': tags if is_first else '',
            'Published': 'TRUE' if is_first else '',
            'Option1 Name': 'Size' if is_first else '',
            'Option1 Value': v['size'],
            'Option2 Name': '',
            'Option2 Value': '',
            'Option3 Name': '',
            'Option3 Value': '',
            'Variant SKU': f"PL-SPIRIT-{num_str}-{v['sku_suffix']}",
            'Variant Grams': '100',
            'Variant Inventory Tracker': 'shopify',
            'Variant Inventory Qty': '999',
            'Variant Inventory Policy': 'continue',
            'Variant Fulfillment Service': 'manual',
            'Variant Price': v['price'],
            'Variant Compare At Price': v['compare_price'],
            'Variant Requires Shipping': 'TRUE',
            'Variant Taxable': 'FALSE',
            'Variant Barcode': '',
            'Image Src': image_url if is_first else '',
            'Image Position': '1' if is_first else '',
            'Image Alt Text': f"{title} - 300GSM Poster" if is_first else '',
            'Gift Card': 'FALSE' if is_first else '',
            'SEO Title': f"{title} | 300GSM Spiritual Poster - POSTERLEAGUE" if is_first else '',
            'SEO Description': f"Buy {title} online in India. High quality 300 GSM print with matte lamination." if is_first else '',
            'Status': 'active' if is_first else ''
        }
        all_rows.append(row)

fieldnames = list(all_rows[0].keys())

for target_file in [output_csv, output_csv_backup]:
    with open(target_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

print(f"[SUCCESS] CSV generated with all 105 Shopify CDN image URLs attached! ({len(files)} products, {len(all_rows)} rows)")
