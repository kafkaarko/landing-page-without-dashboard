"""Generate responsive WebP assets and their React manifest (requires Pillow)."""

import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
OUTPUT = PUBLIC / 'images/photos/responsive'
MANIFEST = ROOT / 'src/generated/image-variants.json'
WIDTHS = (160, 240, 320, 480, 640, 768, 960, 1200)

# Match the container widths, columns and gaps in src/index.css.
HERO_SIZES = (
    '(max-width: 959px) calc((100vw - 80px) / 2), '
    '(max-width: 1199px) calc((100vw - 110px) / 2), '
    '(max-width: 1391px) calc((100vw - 176px) / 2), 608px'
)
MENU_SIZES = (
    '(max-width: 639px) calc((100vw - 56px) / 2), '
    '(max-width: 959px) calc((100vw - 72px) / 2), '
    '(max-width: 1199px) calc((100vw - 132px) / 4), '
    '(max-width: 1391px) calc((100vw - 193px) / 4), 299.75px'
)
# The portrait about image covers a fixed-height frame on larger screens.
# Account for the pixels cropped by object-fit so those screens stay sharp.
ABOUT_SIZES = (
    '(max-width: 639px) calc(100vw - 40px), '
    '(max-width: 959px) 591px, '
    '(max-width: 1199px) 581px, 620px'
)


def crop_center(image, ratio):
    if ratio is None:
        return image
    width, height = image.size
    if width / height > ratio:
        crop_width = round(height * ratio)
        left = (width - crop_width) // 2
        return image.crop((left, 0, left + crop_width, height))
    crop_height = round(width / ratio)
    top = (height - crop_height) // 2
    return image.crop((0, top, width, top + crop_height))


def variants(image, stem, layout, sizes, ratio=None, quality=78):
    cropped = crop_center(image, ratio)
    widths = sorted({width for width in WIDTHS if width < cropped.width} | {cropped.width})
    candidates = []
    for width in widths:
        height = round(cropped.height * width / cropped.width)
        resized = cropped.resize((width, height), Image.Resampling.LANCZOS)
        target = OUTPUT / f'{stem}-{layout}-{width}.webp'
        resized.save(target, 'WEBP', quality=quality, method=6)
        candidates.append(f'/{target.relative_to(PUBLIC).as_posix()} {width}w')
    return {
        'srcSet': ', '.join(candidates),
        'sizes': sizes,
        'width': cropped.width,
        'height': cropped.height,
    }


def main():
    config = json.loads((ROOT / 'src/config/site.json').read_text(encoding='utf-8'))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    entries = [('hero', config['hero']), ('about', config.get('about', {}))]
    entries.extend(('menu', item) for item in config.get('offerings', []))
    for role, entry in entries:
        src = entry.get('image', '')
        if not src.startswith('/') or src.startswith('//'):
            continue
        source = (PUBLIC / src.lstrip('/')).resolve()
        if not source.is_relative_to(PUBLIC.resolve()):
            raise ValueError(f'Image must be inside public/: {src}')
        if source.suffix.lower() == '.svg':
            continue
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
        # Include the role so a photo reused in another section stays independent.
        stem = f'{source.stem}-{role}'
        if role == 'hero':
            default = variants(image, stem, 'default', HERO_SIZES)
            sources = [{
                'media': '(max-width: 639px)',
                **variants(image, stem, 'mobile', 'calc(100vw - 40px)', ratio=1.15),
            }]
        elif role == 'about':
            # This center crop matches the widest about frame; narrower frames
            # retain the same composition through object-fit: cover.
            default = variants(image, stem, 'default', ABOUT_SIZES, ratio=4 / 4.2, quality=74)
            sources = []
        else:
            default = variants(image, stem, 'default', MENU_SIZES, ratio=4 / 4.5)
            sources = [
                {'media': '(max-width: 639px)', **variants(image, stem, 'mobile', MENU_SIZES, ratio=4 / 5)},
                {'media': '(max-width: 959px)', **variants(image, stem, 'tablet', MENU_SIZES, ratio=1)},
            ]
        manifest.setdefault(src, {})[role] = {**default, 'sources': sources}
        print(f'{role}: {src} ({len(sources) + 1} layouts)')
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Written {MANIFEST.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
