import sys
from PIL import Image
# usage: crop.py in.png out.png x y w h
inp, outp, x, y, w, h = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
im = Image.open(inp)
W,H = im.size
x2 = min(x+w, W); y2 = min(y+h, H)
crop = im.crop((x, y, x2, y2))
crop.save(outp)
print(f"src {W}x{H} -> crop {crop.size}")
