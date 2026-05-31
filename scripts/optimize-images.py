#!/usr/bin/env python3
"""
optimize-images.py
────────────────────────────────────────────────────────────────────
Bulk-resize and recompress oversized images across the site to fix
the Core Web Vitals / LCP score flagged by PageSpeed Insights.

Strategy
- Walks: property-images/, itinerary-images/, cruise-images/,
  blog-images/, welcome-guide-images/, plus root hero-poster.jpg
  and wilson.jpg
- For each image:
    * If original file size <= 400 KB → skip (already lean)
    * Backup the original to _originals/<same path> (preserves
      everything so any image can be restored later)
    * Open with Pillow, EXIF-transpose to bake orientation
    * If width > MAX_WIDTH, resize keeping aspect ratio
    * Re-save with quality 85 (JPEG and WebP both)
    * Strip metadata to keep size minimal

Run:   python3 scripts/optimize-images.py
       python3 scripts/optimize-images.py --dry-run   (preview only)
────────────────────────────────────────────────────────────────────
"""
import sys
import shutil
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ORIGINALS_DIR = ROOT / '_originals'

MAX_WIDTH = 1600           # plenty for any retina display use
MIN_SIZE_BYTES = 400 * 1024 # don't bother with files already lean
QUALITY = 85

SCAN_DIRS = [
    'property-images',
    'itinerary-images',
    'cruise-images',
    'blog-images',
    'welcome-guide-images',
]
SCAN_ROOT_FILES = ['hero-poster.jpg', 'wilson.jpg']

EXTS = {'.jpg', '.jpeg', '.png', '.webp'}

DRY_RUN = '--dry-run' in sys.argv

def iter_targets():
    for d in SCAN_DIRS:
        for p in (ROOT / d).rglob('*'):
            if p.is_file() and p.suffix.lower() in EXTS:
                yield p
    for name in SCAN_ROOT_FILES:
        p = ROOT / name
        if p.is_file():
            yield p

def backup(src: Path):
    rel = src.relative_to(ROOT)
    dst = ORIGINALS_DIR / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        shutil.copy2(src, dst)

def optimize(p: Path):
    orig_bytes = p.stat().st_size
    if orig_bytes < MIN_SIZE_BYTES:
        return None  # skipped
    try:
        img = Image.open(p)
        # Bake any EXIF rotation into pixels so re-save is clean
        img = ImageOps.exif_transpose(img)
        orig_w, orig_h = img.size
        resized = False
        if orig_w > MAX_WIDTH:
            new_h = int(orig_h * MAX_WIDTH / orig_w)
            img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
            resized = True
        if DRY_RUN:
            return {
                'path': p.relative_to(ROOT),
                'orig_size': orig_bytes,
                'orig_dims': (orig_w, orig_h),
                'new_dims': img.size,
                'resized': resized,
                'new_size': None,
            }
        # Real run — backup, then save
        backup(p)
        ext = p.suffix.lower()
        fmt = 'WEBP' if ext == '.webp' else ('PNG' if ext == '.png' else 'JPEG')
        save_kwargs = {'optimize': True, 'quality': QUALITY}
        if fmt == 'JPEG':
            # Strip EXIF (we already baked rotation in)
            img = img.convert('RGB')
            save_kwargs['progressive'] = True
        elif fmt == 'WEBP':
            img = img.convert('RGB')
            save_kwargs['method'] = 6  # max compression effort
        elif fmt == 'PNG':
            save_kwargs.pop('quality', None)  # PNG has no quality
        img.save(p, fmt, **save_kwargs)
        new_bytes = p.stat().st_size
        return {
            'path': p.relative_to(ROOT),
            'orig_size': orig_bytes,
            'orig_dims': (orig_w, orig_h),
            'new_dims': img.size,
            'resized': resized,
            'new_size': new_bytes,
        }
    except Exception as e:
        print(f'  ⚠ error processing {p.relative_to(ROOT)}: {e}')
        return None

def fmt_bytes(n):
    if n > 1024 * 1024:
        return f'{n / 1024 / 1024:.1f} MB'
    return f'{n // 1024} KB'

def main():
    if DRY_RUN:
        print('=== DRY RUN — no files will be modified ===\n')
    else:
        print(f'Originals backed up to: {ORIGINALS_DIR.relative_to(ROOT)}/')

    print(f'Max width: {MAX_WIDTH}px · Min file size: {MIN_SIZE_BYTES // 1024} KB · Quality: {QUALITY}\n')

    processed = 0
    saved_bytes = 0
    skipped = 0
    biggest_wins = []  # (savings, path)

    for p in iter_targets():
        result = optimize(p)
        if result is None:
            skipped += 1
            continue
        processed += 1
        if DRY_RUN:
            # In dry-run just estimate from dim reduction
            scale = (result['new_dims'][0] / result['orig_dims'][0]) ** 2
            est_new = int(result['orig_size'] * scale * 0.85)
            est_saving = result['orig_size'] - est_new
            saved_bytes += est_saving
            biggest_wins.append((est_saving, str(result['path'])))
        else:
            saving = result['orig_size'] - result['new_size']
            saved_bytes += saving
            biggest_wins.append((saving, str(result['path'])))

    biggest_wins.sort(reverse=True)
    print(f'\nProcessed: {processed} files')
    print(f'Skipped (already lean): {skipped}')
    print(f'{"Estimated " if DRY_RUN else ""}Bytes saved: {fmt_bytes(saved_bytes)}')
    print(f'\nTop 15 size reductions:')
    for saving, path in biggest_wins[:15]:
        print(f'  −{fmt_bytes(saving):>8s}  {path}')

if __name__ == '__main__':
    main()
