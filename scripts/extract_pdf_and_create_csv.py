#!/usr/bin/env python3
"""
POSTERLEAGUE — PDF Image Extractor & Shopify CSV Generator
Extracts all high-res poster images from a PDF and creates a ready-to-import Shopify CSV.
"""

import os
import sys
import csv
import re
import argparse
from pathlib import Path

try:
    import fitz # PyMuPDF
except ImportError:
    print("[ERROR] PyMuPDF (fitz) is required. Run: pip install pymupdf")
    sys.exit(1)

VARIANT_CONFIGS = [
    {'size': 'A5 (5.8 x 8.3 in)', 'price': '69.00', 'compare_price': '99.00', 'sku_suffix': 'A5'},
    {'size': 'A4 (8.3 x 11.7 in)', 'price': '99.00', 'compare_price': '149.00', 'sku_suffix': 'A4'},
    {'size': 'A3 (11.7 x 16.5 in)', 'price': '129.00', 'compare_price': '199.00', 'sku_suffix': 'A3'},
]

def extract_pdf_images(pdf_path, output_dir, category_tag="spiritual"):
    pdf_path = Path(pdf_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    if not pdf_path.exists():
        print(f"[ERROR] PDF file not found at: {pdf_path}")
        return []

    doc = fitz.open(pdf_path)
    print(f"[INFO] Processing PDF: {pdf_path.name} ({len(doc)} pages)")

    extracted_products = []
    image_count = 0

    for page_idx, page in enumerate(doc):
        # 1. Extract embedded images
        image_list = page.get_images(full=True)
        
        if image_list:
            for img_idx, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Filter out tiny icons (must be at least 200x200)
                if base_image["width"] < 200 or base_image["height"] < 200:
                    continue
                
                image_count += 1
                img_filename = f"{category_tag}_poster_{image_count:03d}.{image_ext}"
                img_path = output_dir / img_filename
                
                with open(img_path, "wb") as img_file:
                    img_file.write(image_bytes)
                
                title = f"{category_tag.capitalize()} Art Print #{image_count}"
                handle = f"{category_tag}-art-print-{image_count}"
                
                extracted_products.append({
                    'handle': handle,
                    'title': title,
                    'image_filename': img_filename,
                    'image_path': str(img_path),
                    'genre': category_tag
                })
        else:
            # 2. If no embedded images, render the full page as a 300 DPI image
            pix = page.get_pixmap(dpi=300)
            image_count += 1
            img_filename = f"{category_tag}_poster_{image_count:03d}.png"
            img_path = output_dir / img_filename
            pix.save(str(img_path))
            
            title = f"{category_tag.capitalize()} Art Print #{image_count}"
            handle = f"{category_tag}-art-print-{image_count}"
            
            extracted_products.append({
                'handle': handle,
                'title': title,
                'image_filename': img_filename,
                'image_path': str(img_path),
                'genre': category_tag
            })

    print(f"[SUCCESS] Extracted {len(extracted_products)} high-res poster images to: {output_dir}")
    return extracted_products

def generate_csv_from_extracted(products, csv_output_path, category_tag="spiritual", image_base_url=""):
    all_rows = []
    
    for prod in products:
        handle = prod['handle']
        title = prod['title']
        img_url = f"{image_base_url}/{prod['image_filename']}" if image_base_url else prod['image_filename']
        tags = f"poster, {category_tag}, 300gsm, laminated, made-to-order"
        
        description = f"""
        <p><strong>Transform your sacred space with the {title} from POSTERLEAGUE.</strong></p>
        <ul>
          <li><strong>Material:</strong> 300 GSM Heavyweight Premium Cardstock</li>
          <li><strong>Finish:</strong> Ultra-Clear Matte Thermal Lamination (Water &amp; Fade Resistant)</li>
          <li><strong>Print Quality:</strong> Ultra-HD 8K Vivid Color Reproduction</li>
          <li><strong>Available Sizes:</strong> A5, A4, and A3 formats</li>
          <li><strong>Packaging:</strong> Shipped in crush-resistant protective packaging</li>
          <li><strong>Guarantee:</strong> 100% Satisfaction &bull; Made in India</li>
        </ul>
        """

        for idx, v in enumerate(VARIANT_CONFIGS):
            row = {
                'Handle': handle,
                'Title': title if idx == 0 else '',
                'Body (HTML)': description.strip() if idx == 0 else '',
                'Vendor': 'POSTERLEAGUE',
                'Product Category': 'Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork',
                'Type': 'Art Print',
                'Tags': tags if idx == 0 else '',
                'Published': 'TRUE',
                'Option1 Name': 'Size',
                'Option1 Value': v['size'],
                'Option2 Name': '',
                'Option2 Value': '',
                'Option3 Name': '',
                'Option3 Value': '',
                'Variant SKU': f"PL-{handle[:10].upper()}-{v['sku_suffix']}",
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
                'Image Src': img_url if idx == 0 else '',
                'Image Position': '1' if idx == 0 else '',
                'Image Alt Text': f"{title} - 300GSM Spiritual Poster" if idx == 0 else '',
                'Gift Card': 'FALSE',
                'SEO Title': f"{title} | 300GSM Spiritual Poster - POSTERLEAGUE",
                'SEO Description': f"Buy {title} online in India. High quality 300 GSM print with matte lamination.",
                'Status': 'active'
            }
            all_rows.append(row)

    if all_rows:
        fieldnames = list(all_rows[0].keys())
        with open(csv_output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_rows)
        print(f"[SUCCESS] Generated Shopify CSV at: {csv_output_path} ({len(products)} products, {len(all_rows)} variant rows)")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Extract PDF Images & Generate Shopify CSV")
    parser.add_argument('--pdf', required=True, help="Path to input PDF file")
    parser.add_argument('--out-dir', default="E:\\poster-images\\spiritual", help="Directory to save extracted images")
    parser.add_argument('--out-csv', default="E:\\posterleague-theme\\spiritual_products_import.csv", help="Output CSV path")
    parser.add_argument('--category', default="spiritual", help="Category tag (e.g. spiritual, anime, cars)")
    
    args = parser.parse_args()
    
    prods = extract_pdf_images(args.pdf, args.out_dir, args.category)
    if prods:
        generate_csv_from_extracted(prods, args.out_csv, args.category)

