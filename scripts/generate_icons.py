from PIL import Image, ImageDraw
import os
import math

assets_dir = r"c:\Users\user\OneDrive\桌面\專案\GM_Plugin\dist\assets"
os.makedirs(assets_dir, exist_ok=True)

# 1. Submit 圖標 (表單/紙張)
img = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
draw.rectangle([(3, 3), (21, 21)], outline='#667eea', width=2)
draw.line([(3, 9), (21, 9)], fill='#667eea', width=2)
draw.line([(9, 15), (15, 15)], fill='#667eea', width=2)
img.save(os.path.join(assets_dir, 'submit.png'))
print("✓ submit.png")

# 2. Clear 圖標 (X)
img = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([(2, 2), (22, 22)], outline='#667eea', width=2)
draw.line([(7, 7), (17, 17)], fill='#667eea', width=2)
draw.line([(7, 17), (17, 7)], fill='#667eea', width=2)
img.save(os.path.join(assets_dir, 'clear.png'))
print("✓ clear.png")

# 3. Settings 圖標 (齒輪)
img = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([(10, 10), (14, 14)], fill='#667eea')
for angle in range(0, 360, 60):
    rad = math.radians(angle)
    x1 = 12 + 8 * math.cos(rad)
    y1 = 12 + 8 * math.sin(rad)
    x2 = 12 + 10 * math.cos(rad)
    y2 = 12 + 10 * math.sin(rad)
    draw.line([(x1, y1), (x2, y2)], fill='#667eea', width=2)
img.save(os.path.join(assets_dir, 'settings.png'))
print("✓ settings.png")

# 4. Sun 圖標
img = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
draw.ellipse([(9, 9), (15, 15)], outline='#667eea', width=2)
for i in range(0, 360, 45):
    rad = math.radians(i)
    x1 = 12 + 6 * math.cos(rad)
    y1 = 12 + 6 * math.sin(rad)
    x2 = 12 + 8 * math.cos(rad)
    y2 = 12 + 8 * math.sin(rad)
    draw.line([(x1, y1), (x2, y2)], fill='#667eea', width=2)
img.save(os.path.join(assets_dir, 'sun.png'))
print("✓ sun.png")

# 5. Moon 圖標
img = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
draw.arc([(5, 5), (19, 19)], 0, 360, fill='#667eea', width=2)
draw.ellipse([(11, 5), (19, 13)], fill=(255, 255, 255, 255))
img.save(os.path.join(assets_dir, 'moon.png'))
print("✓ moon.png")

print(f"\n✅ 所有圖標已生成到: {assets_dir}")
