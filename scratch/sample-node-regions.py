from PIL import Image

img = Image.open('D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
px = img.load()

# candidate node positions from vision (percentage -> px)
cands = {
    'node1_green':  (0.24, 0.34),
    'node2_purple': (0.50, 0.29),
    'node3_blue':   (0.40, 0.44),
    'node4_orange': (0.20, 0.54),
    'node5_yellow': (0.55, 0.54),
}

for name, (fx, fy) in cands.items():
    cx, cy = int(fx*1672), int(fy*941)
    print(f'\n== {name} center=({cx},{cy}) ==')
    # print a 25x25 patch sampled every 3 px
    for dy in range(-12, 13, 3):
        row = []
        for dx in range(-12, 13, 3):
            row.append('%02X%02X%02X' % px[cx+dx, cy+dy][:3])
        print(' '.join(row))
