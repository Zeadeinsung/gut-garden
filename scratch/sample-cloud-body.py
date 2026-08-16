from PIL import Image
cur = Image.open('D:/GutGardenBeta/scratch/current_classroom_1672.png').convert('RGB')
cp = cur.load()
FW, FH = 1454, 909
OX, OY = (cur.size[0]-FW)//2, (cur.size[1]-FH)//2
CONTENT_H = FH - 68

def content_xy(px, py):
    return int(OX + px/100*FW), int(OY + py/100*CONTENT_H)

for py in [2, 4, 6, 8, 10, 12, 14, 16]:
    row = []
    for px in [30, 35, 40, 45, 50, 55, 60, 65]:
        x, y = content_xy(px, py)
        c = cp[x, y]
        row.append('#%02X%02X%02X' % c[:3])
    print(f'content y={py}%: ' + ' '.join(row))
