#!/usr/bin/env python3
"""
POSTERLEAGUE — Shopify Bulk Product CSV Generator & Importer Tool
Exact Poster Categories: Anime, Cars, Bikes, Movies & Series, Gaming, Sports, Spiritual, Custom
"""

import os
import sys
import csv
import re
import argparse
from pathlib import Path

VARIANT_CONFIGS = {
        'poster': [
        {'size': 'A5 (5.8 x 8.3 in)', 'price': '69.00', 'compare_price': '99.00', 'sku_suffix': 'A5'},
        {'size': 'A4 (8.3 x 11.7 in)', 'price': '99.00', 'compare_price': '149.00', 'sku_suffix': 'A4'},
        {'size': 'A3 (11.7 x 16.5 in)', 'price': '129.00', 'compare_price': '199.00', 'sku_suffix': 'A3'},
    ],
    'splits': [
        {'size': '3-Piece Set (A4)', 'price': '699.00', 'compare_price': '999.00', 'sku_suffix': '3P'},
        {'size': '4-Piece Grid Set (A4)', 'price': '899.00', 'compare_price': '1299.00', 'sku_suffix': '4P'},
        {'size': '8-Piece Panel Set (A4)', 'price': '1499.00', 'compare_price': '1999.00', 'sku_suffix': '8P'},
    ],
    'single': [
        {'size': 'Default', 'price': '149.00', 'compare_price': '199.00', 'sku_suffix': 'STD'}
    ]
}

GENRE_KEYWORDS = {
    'anime': ['anime', 'goku', 'naruto', 'luffy', 'zoro', 'demon slayer', 'jujutsu', 'gojo', 'titan', 'death note', 'manga', 'itachi', 'sukuna'],
    'cars': ['car', 'porsche', 'ferrari', 'bmw', 'mercedes', 'supra', 'gt-r', 'mustang', 'lamborghini', 'audi', 'supercar', 'f1', 'mclaren'],
    'bikes': ['bike', 'ducati', 'kawasaki', 'ninja', 'hayabusa', 'royalenfield', 'harley', 'superbike', 'motogp', 'ktm', 'yamaha'],
    'movies-series': ['batman', 'marvel', 'avengers', 'joker', 'godfather', 'oppenheimer', 'interstellar', 'pulp fiction', 'star wars', 'peaky blinders', 'breaking bad', 'stranger things', 'game of thrones', 'kgf', 'pushpa', 'rrr', 'salaar', 'kalki'],
    'gaming': ['game', 'gaming', 'gta', 'cyberpunk', 'witcher', 'elden ring', 'valorant', 'minecraft', 'playstation', 'xbox', 'assassins creed', 'cod', 'fortnite'],
    'sports': ['sport', 'cricket', 'kohli', 'dhoni', 'rohit', 'messi', 'ronaldo', 'football', 'nba', 'jordan', 'kobe', 'lebron', 'neymar'],
    'spiritual': ['spiritual', 'shiva', 'mahadev', 'ram', 'hanuman', 'krishna', 'ganesha', 'buddha', 'god', 'temple', 'bhagavad gita', 'kedarnath']
}

def clean_title(filename):
    name = Path(filename).stem
    name = re.sub(r'[-_+]+', ' ', name)
    name = re.sub(r'\b(4k|8k|1080p|wallpaper|hd|poster|print)\b', '', name, flags=re.I)
    title = ' '.join(word.capitalize() for word in name.split() if word)
    return title if title else "Art Print"

def detect_genre(text, folder_name=""):
    combined = f"{text} {folder_name}".lower()
    for genre, keywords in GENRE_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                return genre
    return "anime"

def build_product_rows(handle, title, image_url, category="poster", genre="anime"):
    variants = VARIANT_CONFIGS.get(category, VARIANT_CONFIGS['poster'])
    tags = f"poster, {genre}, 300gsm, laminated, made-to-order"
    if category == 'splits':
        tags += ", splits, 3-piece, 4-piece, 8-piece, bestseller"

    description = f"""
    <p><strong>Transform your space with the {title} from POSTERLEAGUE.</strong></p>
    <ul>
      <li><strong>Material:</strong> 300 GSM Heavyweight Premium Cardstock</li>
      <li><strong>Finish:</strong> Ultra-Clear Matte Thermal Lamination (Scratch &amp; Splash Proof)</li>
      <li><strong>Print Quality:</strong> Ultra-HD 8K Vivid Color Reproduction</li>
      <li><strong>Packaging:</strong> Shipped in crush-resistant protective packaging</li>
      <li><strong>Guarantee:</strong> 100% Satisfaction &bull; Made in India</li>
    </ul>
    """

    rows = []
    for idx, v in enumerate(variants):
        row = {
            'Handle': handle,
            'Title': title if idx == 0 else '',
            'Body (HTML)': description.strip() if idx == 0 else '',
            'Vendor': 'POSTERLEAGUE',
            'Product Category': 'Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork',
            'Type': 'Art Print',
            'Tags': tags if idx == 0 else '',
            'Published': 'TRUE',
            'Option1 Name': 'Format / Pieces' if category == 'splits' else ('Size' if category != 'single' else 'Title'),
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
            'Image Src': image_url if idx == 0 else '',
            'Image Position': '1' if idx == 0 else '',
            'Image Alt Text': f"{title} - 300GSM Poster" if idx == 0 else '',
            'Gift Card': 'FALSE',
            'SEO Title': f"{title} | 300GSM Laminated Poster - POSTERLEAGUE",
            'SEO Description': f"Buy {title} online in India. High quality 300 GSM print with matte lamination.",
            'Status': 'active'
        }
        rows.append(row)
    return rows

def generate_sample_csv(output_path):
    samples = [
        ("goku-ultra-instinct-poster", "Goku Ultra Instinct Awakening Poster", "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000", "poster", "anime"),
        ("porsche-911-gt3-rs-poster", "Porsche 911 GT3 RS Track Edition", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000", "poster", "cars"),
        ("ducati-panigale-v4-superbike", "Ducati Panigale V4 Superbike Wall Poster", "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1000", "poster", "bikes"),
        ("peaky-blinders-thomas-shelby", "Thomas Shelby - By Order Of The Peaky Blinders", "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000", "poster", "movies-series"),
        ("gta-vi-vice-city-retro-poster", "GTA VI Vice City Sunset Neon Poster", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000", "poster", "gaming"),
        ("virat-kohli-king-cricket-poster", "Virat Kohli The King Tribute Poster", "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1000", "poster", "sports"),
        ("lord-shiva-mahadev-meditation", "Lord Shiva Mahadev Cosmic Meditation Poster", "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1000", "poster", "spiritual"),
        ("naruto-sage-mode-split-poster", "Naruto Sage Mode Split Poster Set", "https://images.unsplash.com/photo-1563089145-599997674d42?w=1000", "splits", "anime"),
    ]

    all_rows = []
    for handle, title, img, cat, genre in samples:
        rows = build_product_rows(handle, title, img, cat, genre)
        all_rows.extend(rows)

    fieldnames = list(all_rows[0].keys())
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"[SUCCESS] Sample products CSV generated at: {output_path} ({len(samples)} products, {len(all_rows)} variant rows)")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="POSTERLEAGUE Shopify CSV Generator")
    parser.add_argument('--input-dir', help="Directory of poster image files to process")
    parser.add_argument('--output-csv', default="E:\\posterleague-theme\\shopify_products_import.csv", help="Output CSV path")
    parser.add_argument('--generate-samples', action='store_true', help="Generate ready-to-test sample products CSV")
    
    args = parser.parse_args()

    if args.generate_samples or not args.input_dir:
        generate_sample_csv(args.output_csv)
    else:
        print(f"Scanning directory: {args.input_dir}")

