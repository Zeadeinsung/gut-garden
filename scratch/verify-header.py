from PIL import Image
import math

def load(path):
    img = Image.open(path).convert('RGB')
    return img, img.load(), img.size

ref, rp, (RW, RH) = load('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png')
cur, cp, (CW, CH) = load('scratch/current_classroom_1672.png')

# current phone frame geometry
FW, FH = 1454, 909
OX, OY = (CW-FW)//2, (CH-FH)//2
CONTENT_H = FH - 68

def content_xy(px, py):
    return int(OX + px/100*FW), int(OY + py/100*CONTENT_H)

def is_cloudish(c):
    # cream cloud: high R,G,B, slightly warm
    r,g,b = c
    return r>230 and g>225 and b>200 and (r-b) < 60 and (g-b) < 60

# scan a horizontal strip at y=4% for "cloud" colored runs in both ref and current
for label, src, px, W, H, yp in [
    ('ref', ref, rp, RW, RH, 3.2),
    ('cur', cur, cp, CW, CH, None),
]:
    if label == 'cur':
        # scan content y from 1% to 8%
        pass
    pass

print("== REF y=3.2% of full 941 strip (find cloud) ==")
y = int(3.2/100*RH)
runs = []
run_start = None
for x in range(RW):
    isc = is_cloudish(rp[x,y])
    if isc and run_start is None: run_start = x
    if not isc and run_start is not None:
        runs.append((run_start, x-1, x-run_start)); run_start=None
if run_start is not None: runs.append((run_start, RW-1, RW-run_start))
for s,e,w in runs:
    if w > 30: print(f'  cloud run x={s}-{e} w={w}  -> x% {s/RW*100:.1f}-{e/RW*100:.1f}')

print("== CUR content strip y=1..8% (find cloud) ==")
for yp in [2.0, 4.0, 6.0, 8.0]:
    cy = OY + int(yp/100*CONTENT_H)
    runs = []; run_start=None
    for x in range(OX, OX+FW):
        isc = is_cloudish(cp[x,cy])
        if isc and run_start is None: run_start=x
        if not isc and run_start is not None:
            runs.append((run_start, x-1, x-run_start)); run_start=None
    if run_start is not None: runs.append((run_start, OX+FW-1, OX+FW-run_start))
    cloudruns = [(s,e,w) for s,e,w in runs if w>30]
    rel = [f'{((s-OX)/FW*100):.1f}-{((e-OX)/FW*100):.1f}%' for s,e,w in cloudruns]
    print(f'  content y={yp}%: cloud x-runs: {rel if rel else "none"}')
