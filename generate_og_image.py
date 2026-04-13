#!/usr/bin/env python3
"""Generate OG image (1200x630) for Custorian website."""

from PIL import Image, ImageDraw, ImageFont
import sys

WIDTH, HEIGHT = 1200, 630
BG_COLOR = (8, 8, 12)

img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

# --- Top gradient line (3px) ---
# purple #7c3aed → #a78bfa → green #10b981 → purple #a78bfa
gradient_stops = [
    (0.0,  (124, 58, 237)),   # #7c3aed
    (0.33, (167, 139, 250)),  # #a78bfa
    (0.66, (16, 185, 129)),   # #10b981
    (1.0,  (167, 139, 250)),  # #a78bfa
]

def interpolate_color(stops, t):
    """Interpolate between gradient color stops at position t (0-1)."""
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t0 <= t <= t1:
            ratio = (t - t0) / (t1 - t0) if t1 != t0 else 0
            return tuple(int(c0[j] + (c1[j] - c0[j]) * ratio) for j in range(3))
    return stops[-1][1]

for x in range(WIDTH):
    color = interpolate_color(gradient_stops, x / (WIDTH - 1))
    for y in range(3):
        img.putpixel((x, y), color)

# --- Load fonts ---
# Try to find a good font, fall back to default
def get_font(size, bold=False):
    """Try to load a nice font, fall back to default."""
    font_paths = [
        # macOS system fonts
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    # Ultimate fallback
    try:
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except:
        return ImageFont.load_default()

font_title = get_font(72, bold=True)
font_subtitle = get_font(32)
font_detail = get_font(24)
font_url = get_font(20)

# --- Text colors ---
WHITE = (255, 255, 255)
LIGHT_PURPLE = (167, 139, 250)  # #a78bfa
DIM_WHITE = (255, 255, 255, 153)  # ~60% opacity — we'll use RGB approximation on dark bg
DIM_TEXT = (153, 153, 163)  # approximate of white 60% on #08080c

# --- Draw text centered ---
def draw_centered(y, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (WIDTH - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)

# Layout: center everything vertically
# Title at ~210, subtitle at ~300, detail at ~355, url at ~520
draw_centered(200, "Custorian", font_title, WHITE)
draw_centered(295, "The PCI DSS for Protecting Children", font_subtitle, LIGHT_PURPLE)
draw_centered(350, "6 Domains  ·  90+ Controls  ·  One API", font_detail, DIM_TEXT)
draw_centered(530, "custorian.org", font_url, DIM_TEXT)

# --- Save ---
output_path = "/Users/tanyabecheva/Documents/GitHub/custorian-website/og-image.png"
img.save(output_path, "PNG")
print(f"OG image saved to {output_path}")
print(f"Size: {WIDTH}x{HEIGHT}")
