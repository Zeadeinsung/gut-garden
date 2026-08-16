from PIL import Image

img = Image.open('current_classroom_1672.png').convert('RGB')
W, H = img.size

def near(c, target, tol):
    return all(abs(a-b) <= tol for a, b in zip(c, target))

def classify(c):
    if near(c, (255, 249, 239), 14): return 'CREAM'
    if near(c, (147, 177, 78), 25): return 'GREENBG'
    return 'OTHER'

# 1. Find frame bounds (green bg region)
col_mid = W // 2
# scan from top down at center x
for y in range(0, H):
    c = classify(img.getpixel((col_mid, y)))
    if c == 'CREAM' or c == 'OTHER':
        print(f'frame top at y={y} ({c})')
        break
for y in range(H-1, 0, -1):
    c = classify(img.getpixel((col_mid, y)))
    if c == 'CREAM' or c == 'OTHER':
        print(f'frame bottom at y={y} ({c})')
        break
# left/right edges at mid-height
row_mid = H // 2
for x in range(0, W):
    c = classify(img.getpixel((x, row_mid)))
    if c != 'GREENBG':
        print(f'frame left at x={x} ({c})')
        break
for x in range(W-1, 0, -1):
    c = classify(img.getpixel((x, row_mid)))
    if c != 'GREENBG':
        print(f'frame right at x={x} ({c})')
        break

# 2. Find bottom dock top edge: scan a column near center, find transition from OTHER/cream to dark dock
# Dock is dark. Find the highest y where the row is mostly dark/gray (dock bg).
dock_row = None
for y in range(H-1, 0, -1):
    # sample several x in frame center
    row_colors = [img.getpixel((x, y)) for x in range(300, 1400, 50)]
    avg = tuple(sum(cc[i] for cc in row_colors)//len(row_colors) for i in range(3))
    if avg[0] < 200 and avg[1] < 200 and avg[2] < 200:
        dock_row = y
    elif dock_row is not None:
        print(f'last dark dock row y={dock_row}, row above y={y} avg={avg}')
        break

# 3. Find where the map (OTHER) starts below header: scan center column from top
prev = None
for y in range(0, H):
    c = classify(img.getpixel((col_mid, y)))
    if c != prev:
        if prev is not None and c == 'OTHER':
            print(f'first OTHER (map/panel) after header at y={y}')
            break
        prev = c
