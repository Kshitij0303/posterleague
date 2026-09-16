#!/usr/bin/env python3
"""
PosterLeague artwork protection pipeline.

Drop high-res masters into artwork-masters/, run this script, upload outputs
from artwork-ready/ to Shopify (never upload masters).

Usage:
  pip install Pillow
  python scripts/protect-artwork.py
  python scripts/protect-artwork.py --input path/to/masters --output path/to/ready
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Install Pillow: pip install Pillow", file=sys.stderr)
    sys.exit(1)

MAX_PREVIEW = 1600
THUMB_SIZE = 400
DETAIL_SCALE = 1.65
WATERMARK_TEXT = "PosterLeague"
WATERMARK_OPACITY = 0.15
WATERMARK_SPACING = 220
WATERMARK_ANGLE = -35

SUPPORTED = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def fit_long_side(img: Image.Image, max_side: int) -> Image.Image:
    w, h = img.size
    long_side = max(w, h)
    if long_side <= max_side:
        return img
    scale = max_side / long_side
    return img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def make_watermark_layer(size: tuple[int, int]) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = load_font(13)
    w, h = size
    diag = int(math.hypot(w, h)) + WATERMARK_SPACING
    tile = Image.new("RGBA", (diag, diag), (0, 0, 0, 0))
    tile_draw = ImageDraw.Draw(tile)

    y = 0
    toggle = False
    while y < diag + WATERMARK_SPACING:
        x = 0 if not toggle else WATERMARK_SPACING // 2
        while x < diag + WATERMARK_SPACING:
            color = (255, 255, 255, int(255 * WATERMARK_OPACITY * 1.1)) if not toggle else (
                210,
                210,
                210,
                int(255 * WATERMARK_OPACITY),
            )
            tile_draw.text((x, y), WATERMARK_TEXT, font=font, fill=color)
            x += WATERMARK_SPACING
        y += WATERMARK_SPACING // 2
        toggle = not toggle

    rotated = tile.rotate(WATERMARK_ANGLE, expand=True, resample=Image.Resampling.BICUBIC)
    ox = (rotated.width - w) // 2
    oy = (rotated.height - h) // 2
    layer.paste(rotated, (-ox, -oy), rotated)
    return layer


def apply_watermark(img: Image.Image) -> Image.Image:
    base = img.convert("RGBA")
    mark = make_watermark_layer(base.size)
    return Image.alpha_composite(base, mark)


def center_detail_crop(img: Image.Image, scale: float = DETAIL_SCALE) -> Image.Image:
    w, h = img.size
    crop_w = int(w / scale)
    crop_h = int(h / scale)
    left = (w - crop_w) // 2
    top = int((h - crop_h) * 0.38)
    cropped = img.crop((left, top, left + crop_w, top + crop_h))
    return cropped.resize((w, h), Image.Resampling.LANCZOS)


def save_webp(img: Image.Image, path: Path, quality: int = 88) -> None:
    out = img.convert("RGB") if img.mode == "RGBA" else img
    out.save(path, "WEBP", quality=quality, method=6)


def process_file(src: Path, out_dir: Path) -> None:
    stem = src.stem
    img = Image.open(src)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    preview = fit_long_side(img, MAX_PREVIEW)
    preview_wm = apply_watermark(preview)
    thumb = fit_long_side(preview_wm, THUMB_SIZE)
    detail = apply_watermark(center_detail_crop(preview))

    save_webp(preview_wm, out_dir / f"{stem}-preview.webp")
    save_webp(thumb, out_dir / f"{stem}-thumb.webp")
    save_webp(detail, out_dir / f"{stem}-detail.webp")

    print(f"OK  {src.name}")
    print(f"    -> {stem}-preview.webp  ({preview_wm.size[0]}x{preview_wm.size[1]})")
    print(f"    -> {stem}-thumb.webp")
    print(f"    -> {stem}-detail.webp")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="PosterLeague artwork protection pipeline")
    parser.add_argument(
        "--input",
        type=Path,
        default=root / "artwork-masters",
        help="Folder with high-res master files",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=root / "artwork-ready",
        help="Folder for protected WebP outputs",
    )
    args = parser.parse_args()

    args.input.mkdir(parents=True, exist_ok=True)
    args.output.mkdir(parents=True, exist_ok=True)

    files = sorted(p for p in args.input.iterdir() if p.suffix.lower() in SUPPORTED)
    if not files:
        print(f"No images in {args.input}")
        print("Add master PNG/JPG files, then run again.")
        return

    print(f"Processing {len(files)} file(s)...\n")
    for path in files:
        process_file(path, args.output)
    print(f"\nDone. Upload files from:\n  {args.output}\n")
    print("Shopify Admin -> Products -> upload *-preview.webp as product image.")
    print("Keep masters offline — never upload originals to Shopify.")


if __name__ == "__main__":
    main()
