import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('public/images', exist_ok=True)

def create_gradient(width, height, top_color, bottom_color):
    base = Image.new('RGB', (width, height), top_color)
    top = Image.new('RGB', (width, height), bottom_color)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        mask_data.extend([int(255 * (y / height))] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

# 1. Favicon SVG
with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="16" fill="#451A03"/>
  <path d="M16 26h24v16a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10V26z" fill="#FDE68A"/>
  <path d="M40 30h4a6 6 0 0 1 0 12h-4v-12z" stroke="#FDE68A" stroke-width="4" stroke-linecap="round"/>
  <path d="M22 14c0 3-3 4-3 7m7-7c0 3-3 4-3 7m7-7c0 3-3 4-3 7" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/>
</svg>''')

# 2. Logo SVG
with open('public/images/logo.svg', 'w', encoding='utf-8') as f:
    f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <circle cx="50" cy="50" r="46" fill="#451A03" stroke="#D97706" stroke-width="3"/>
  <path d="M28 42h34v20a14 14 0 0 1-14 14H42a14 14 0 0 1-14-14V42z" fill="#FDE68A"/>
  <path d="M62 48h7a8 8 0 0 1 0 16h-7v-16z" stroke="#FDE68A" stroke-width="5" stroke-linecap="round"/>
  <path d="M37 26c0 4-4 5-4 9m9-9c0 4-4 5-4 9m9-9c0 4-4 5-4 9" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
</svg>''')

# 3. Robots.txt
with open('public/robots.txt', 'w', encoding='utf-8') as f:
    f.write('''User-agent: *
Allow: /

Sitemap: https://kopisenja.demo.local/sitemap.xml
''')

# 4. Generate WebP Images
def make_card_image(filename, width, height, bg_top, bg_bot, title, subtitle):
    img = create_gradient(width, height, bg_top, bg_bot)
    draw = ImageDraw.Draw(img)
    
    # Decorative elements
    draw.rounded_rectangle([30, 30, width-30, height-30], radius=24, outline=(253, 230, 138, 120), width=2)
    draw.ellipse([width//2 - 90, height//2 - 90, width//2 + 90, height//2 + 90], fill=(254, 243, 199, 40), outline=(217, 119, 6, 80), width=2)
    
    # Central cup icon representation
    cx, cy = width // 2, height // 2 - 10
    draw.pieslice([cx-45, cy-25, cx+45, cy+55], 0, 180, fill=(245, 158, 11))
    draw.rectangle([cx-45, cy-25, cx+45, cy+15], fill=(245, 158, 11))
    draw.arc([cx+35, cy-15, cx+65, cy+25], 270, 90, fill=(253, 230, 138), width=5)
    
    # Text labels
    # Use default bitmap font with clean spacing
    draw.text((width//2, height - 70), title, fill=(255, 253, 249), anchor="mm")
    draw.text((width//2, height - 42), subtitle, fill=(253, 230, 138), anchor="mm")
    
    img.save(f'public/images/{filename}', 'WEBP', quality=90)
    print(f'Saved public/images/{filename}')

make_card_image('hero-coffee.webp', 1000, 800, (69, 26, 3), (30, 14, 4), 'KOPI SENJA', 'Secangkir Kopi Hangat untuk Setiap Cerita')
make_card_image('about-interior.webp', 800, 600, (90, 40, 10), (45, 20, 5), 'SUASANA KEDAI', 'Ruang Nyaman, Biji Nusantara Pilihan')
make_card_image('menu-kopi-susu.webp', 600, 600, (120, 53, 15), (69, 26, 3), 'KOPI SUSU SENJA', 'Espresso Blend, Susu Segar & Gula Aren')
make_card_image('menu-v60.webp', 600, 600, (146, 64, 14), (69, 26, 3), 'MANUAL BREW V60', 'Single Origin Floral & Fruity Notes')
make_card_image('menu-croissant.webp', 600, 600, (180, 83, 9), (90, 40, 10), 'BUTTER CROISSANT', 'Flaky, Buttery, Freshly Baked')
make_card_image('menu-toast.webp', 600, 600, (160, 70, 10), (70, 30, 5), 'ROTI PANGGANG SRIKAYA', 'Crispy Toast with Cold Butter')
make_card_image('og-kopi-senja.webp', 1200, 630, (69, 26, 3), (25, 10, 2), 'KOPI SENJA BANDUNG', 'Official Landing Page • WhatsApp Order')

print('All assets created successfully!')
