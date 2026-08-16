from PIL import Image
from collections import deque

img = Image.open('D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
W, H = img.size
px = img.load()
print(f'{W}x{H}')

# Target circle colors (reference node badge colors) - high saturation solids
targets = {
    'green':  (0x4C, 0xAF, 0x50),
    'purple': (0x9C, 0x6A, 0xDE),
    'blue':   (0x5B, 0x9B, 0xD5),
    'orange': (0xF5, 0xA6, 0x23),
    'yellow': (0xF4, 0xC5, 0x42),
    'sky':    (0x38, 0xBD, 0xF8),
}

def sat(c):
    r, g, b = c
    mx, mn = max(c), min(c)
    return (mx - mn) / (mx + 1e-6)

def matches(c, t):
    if sat(c) < 0.35:
        return False
    return all(abs(a-b) <= 30 for a, b in zip(c, t))

# Label connected components for each target color
for name, t in targets.items():
    visited = {}
    comps = []
    for y in range(0, H, 1):
        for x in range(0, W, 1):
            if (x, y) in visited:
                continue
            c = px[x, y]
            if not matches(c, t):
                continue
            # BFS
            stack = [(x, y)]
            visited[(x, y)] = True
            pts = []
            minx, maxx, miny, maxy = x, x, y, y
            while stack:
                cx, cy = stack.pop()
                pts.append((cx, cy))
                if cx < minx: minx = cx
                if cx > maxx: maxx = cx
                if cy < miny: miny = cy
                if cy > maxy: maxy = cy
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx+dx, cy+dy
                        if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in visited:
                            nc = px[nx, ny]
                            if matches(nc, t):
                                visited[(nx, ny)] = True
                                stack.append((nx, ny))
            wc = maxx-minx+1
            hc = maxy-miny+1
            if 12 <= wc <= 45 and 12 <= hc <= 45:
                cx = sum(p[0] for p in pts)/len(pts)
                cy = sum(p[1] for p in pts)/len(pts)
                comps.append((cx, cy, len(pts), wc, hc))
    print(f'\n== {name} ==')
    for cx, cy, n, wc, hc in sorted(comps, key=lambda c: c[0]):
        print(f'  center=({cx:.0f},{cy:.0f}) -> ({cx/W*100:.1f}%, {cy/H*100:.1f}%) size={wc}x{hc} px={n}')
