from PIL import Image

img = Image.open('D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
W, H = img.size
print(f'{W}x{H}')

targets = {
    'green':  (0x4C, 0xAF, 0x50),
    'purple': (0x9C, 0x6A, 0xDE),
    'sky':    (0x38, 0xBD, 0xF8),
    'blue':   (0x5B, 0x9B, 0xD5),
    'orange': (0xF5, 0xA6, 0x23),
    'yellow': (0xF4, 0xC5, 0x42),
}

TOL = 40
def near(c, t):
    return all(abs(a-b) <= TOL for a, b in zip(c, t))

# collect pixel positions per target
px = img.load()
points = {k: [] for k in targets}
for y in range(0, H, 2):
    for x in range(0, W, 2):
        c = px[x, y]
        for k, t in targets.items():
            if near(c, t):
                points[k].append((x, y))
                break

def cluster(pts, gap=8):
    clusters = []
    for p in pts:
        placed = False
        for cl in clusters:
            # check distance to cluster centroid
            cx = sum(q[0] for q in cl)/len(cl)
            cy = sum(q[1] for q in cl)/len(cl)
            if abs(p[0]-cx) < gap and abs(p[1]-cy) < gap:
                cl.append(p)
                placed = True
                break
        if not placed:
            clusters.append([p])
    return clusters

for k in targets:
    cl = cluster(points[k])
    big = [c for c in cl if len(c) > 6]
    print(f'\n{k}: {len(points[k])} pts, {len(big)} clusters>6')
    for c in sorted(big, key=lambda c: c[0]):
        cx = sum(q[0] for q in c)/len(c)
        cy = sum(q[1] for q in c)/len(c)
        print(f'  center=({cx:.0f},{cy:.0f}) -> ({cx/W*100:.1f}%, {cy/H*100:.1f}%) n={len(c)}')
