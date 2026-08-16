from PIL import Image
import sys

img = Image.open('current_classroom_1672.png').convert('RGB')
W, H = img.size
print(f'size {W}x{H}')

def near(c, target, tol=18):
    return all(abs(a-b) <= tol for a, b in zip(c, target))

# Cream background from body: #FFF9EF = (255,249,239)
# The green outer bg: garden-mascot #93B14E = (147,177,78)
def classify(c):
    if near(c, (255, 249, 239), 12): return 'CREAM'
    if near(c, (147, 177, 78), 20): return 'GREENBG'
    return 'OTHER'

# Scan a horizontal row at several y values, report runs of CREAM vs OTHER
for y in [100, 200, 300, 400, 500, 600, 700, 800]:
    row = []
    prev = None
    runs = []
    start = 0
    for x in range(0, W, 4):
        c = classify(img.getpixel((x, y)))
        if c != prev:
            if prev is not None:
                runs.append((prev, start, x-4))
            prev = c
            start = x
    runs.append((prev, start, W-4))
    # print only substantial runs
    s = ' '.join(f'{k}@[{a}-{b}]' for k, a, b in runs if b-a > 8)
    print(f'y={y}: {s}')
