from PIL import Image

img = Image.open('D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
px = img.load()

# candidate node circle positions from vision crops
cands = {
    'n1(8.3%,26.3%)':  (139, 247),
    'n2~50%,30%':      (836, 282),
    'n4(9.6%,66.7%)':  (160, 627),
    'n5(58.9%,68.2%)': (985, 642),
    'n3 fountain~40%,45%': (669, 423),
}

for name, (cx, cy) in cands.items():
    print(f'\n== {name} center=({cx},{cy}) ==')
    for dy in range(-10, 11, 2):
        row = []
        for dx in range(-10, 11, 2):
            c = px[cx+dx, cy+dy]
            row.append('%02X%02X%02X' % c[:3])
        print(' '.join(row))
