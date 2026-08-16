from PIL import Image

cur = Image.open('scratch/current_classroom_1672.png').convert('RGB')
cp = cur.load()
W, H = cur.size
# phone frame geometry
FW, FH = 1454, 909
OX, OY = (W-FW)//2, (H-FH)//2
CONTENT_H = FH - 68  # dock

def content_xy(px, py):
    # px = content-x %, py = content-y % (relative to content area above dock)
    return int(OX + px/100*FW), int(OY + py/100*CONTENT_H)

def scan_pastel(cx, cy, target, tol=38, r=22):
    hits = 0
    for dy in range(-r, r+1):
        for dx in range(-r, r+1):
            x, y = cx+dx, cy+dy
            if 0 <= x < W and 0 <= y < H:
                c = cp[x, y]
                if abs(c[0]-target[0])<=tol and abs(c[1]-target[1])<=tol and abs(c[2]-target[2])<=tol:
                    hits += 1
    return hits

targets = {
    'n1': (0xAC,0xD2,0x58),  # green
    'n2': (0x8A,0x5F,0xA4),  # purple
    'n3': (0x58,0xB8,0xDD),  # sky
    'n4': (0x9F,0xD3,0xEF),  # blue
    'n5': (0xEA,0xD0,0x7D),  # yellow
}
pos = {
    'n1': (17.8, 29.4),
    'n2': (52.3, 27.3),
    'n3': (35.3, 48.1),
    'n4': (16.3, 75.3),
    'n5': (59.6, 76.3),
}

for name in ['n1','n2','n3','n4','n5']:
    cx, cy = content_xy(*pos[name])
    n = scan_pastel(cx, cy, targets[name])
    print(f'{name}: expected circle at content({pos[name][0]:.1f}%,{pos[name][1]:.1f}%) -> screen({cx},{cy})  pastel-pixel hits in 45px box: {n}')
