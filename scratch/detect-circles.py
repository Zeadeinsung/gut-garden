from PIL import Image

img = Image.open('D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
W, H = img.size
px = img.load()
print(f'{W}x{H}')

def sat(c):
    r, g, b = c
    mx, mn = max(c), min(c)
    return (mx - mn) / (mx + 1e-6)

# Collect all high-saturation pixels
pts = []
for y in range(0, H, 1):
    for x in range(0, W, 1):
        c = px[x, y]
        if sat(c) >= 0.55:
            pts.append((x, y, c))
print('sat pts:', len(pts))

# Cluster by proximity (8-connected BFS)
visited = set()
clusters = []
for p in pts:
    if (p[0], p[1]) in visited:
        continue
    stack = [p]
    visited.add((p[0], p[1]))
    comp = []
    while stack:
        cx, cy, cc = stack.pop()
        comp.append((cx, cy, cc))
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                nx, ny = cx+dx, cy+dy
                if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in visited:
                    nc = px[nx, ny]
                    if sat(nc) >= 0.55:
                        visited.add((nx, ny))
                        stack.append((nx, ny, nc))
    clusters.append(comp)

print('clusters:', len(clusters))

def med(cs):
    rs = sorted(c[0] for c in cs); gs = sorted(c[1] for c in cs); bs = sorted(c[2] for c in cs)
    n = len(cs)
    return (rs[n//2], gs[n//2], bs[n//2])

# Filter: bounding box 12-45px each side, area reasonable
cands = []
for comp in clusters:
    xs = [c[0] for c in comp]
    ys = [c[1] for c in comp]
    wc = max(xs)-min(xs)+1
    hc = max(ys)-min(ys)+1
    if 14 <= wc <= 42 and 14 <= hc <= 42 and len(comp) >= 80:
        cx = sum(xs)/len(xs); cy = sum(ys)/len(ys)
        m = med([c[2] for c in comp])
        cands.append((cx, cy, len(comp), wc, hc, m))

print(f'candidates: {len(cands)}')
for cx, cy, n, wc, hc, m in sorted(cands, key=lambda c: c[0]):
    print(f'  center=({cx:.0f},{cy:.0f}) -> ({cx/W*100:.1f}%, {cy/H*100:.1f}%) size={wc}x{hc} px={n} color=#{m[0]:02X}{m[1]:02X}{m[2]:02X}')
