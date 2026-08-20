#!/usr/bin/env python3
"""Copy a curated list of screenshots into docs/review-assets/, downscaled+quantized.
Tall pages are capped in height (they're evidence, not pixel-perfect archives)."""
import sys
from pathlib import Path
from PIL import Image

SRC = Path("/tmp/claude-0/-home-user-octant/9226adb3-21b5-57f0-8777-75de8a014f78/scratchpad/shots")
DST = Path("/home/user/octant/docs/review-assets")
DST.mkdir(exist_ok=True)

MAX_W = 1000       # downscale desktop 1440 -> 1000, mobile stays
MAX_H = 12000      # cap extreme pages

total = 0
for name in sys.argv[1:]:
    p = SRC / name
    if not p.exists():
        print("MISSING:", name); continue
    im = Image.open(p)
    w, h = im.size
    scale = min(1.0, MAX_W / w)
    if scale < 1.0:
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    if im.size[1] > MAX_H:
        im = im.crop((0, 0, im.size[0], MAX_H))
    im = im.convert("P", palette=Image.ADAPTIVE, colors=192)
    out = DST / name
    im.save(out, optimize=True)
    kb = out.stat().st_size // 1024
    total += kb
    print(f"{name}: {kb} KB")
print(f"TOTAL: {total} KB across {len(sys.argv)-1} files")
