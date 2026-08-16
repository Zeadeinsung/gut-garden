from PIL import Image

img = Image.open('D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
W, H = img.size
px = img.load()
print(f'{W}x{H}')

def is_white(c):
    return c[0] > 235 and c[1] > 235 and c[2] > 235

# Connected components of white pixels
visited = set()
comps = []
for y in range(0, H):
    for x in range(0, W):
        if (x, y) in visited:
            continue
        if not is_white(px[x, y]):
            continue
        stack = [(x, y)]
        visited.add((x, y))
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
                        if is_white(px[nx, ny]):
                            visited.add((nx, ny))
                            stack.append((nx, ny))
        wc = maxx-minx+1
        hc = maxy-miny+1
        if wc >= 50 and hc >= 20 and wc <= 260 and hc <= 110:
            comps.append((minx, miny, maxx, maxy, wc, hc, len(pts)))

print('white card candidates:', len(comps))
for c in sorted(comps, key=lambda c: c[1]):
    minx, miny, maxx, maxy, wc, hc, n = c
    fill = n / (wc*hc)
    if fill > 0.5:
        print(f'  box=({minx},{miny})-({maxx},{maxy}) center=({(minx+maxx)/2:.0f},{(miny+maxy)/2:.0f}) -> ({(minx+maxx)/2/W*100:.1f}%,{(miny+maxy)/2/H*100:.1f}%) {wc}x{hc} fill={fill:.2f}')
