from PIL import Image

ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
rp = ref.load()
RW, RH = ref.size

def px(xp, yp):
    x = int(xp/100*RW); y = int(yp/100*RH)
    c = rp[x,y]
    return x, y, '#%02X%02X%02X' % c[:3]

# Cloud center-left boundary: x~34%, scan down y 2-14% for non-cloud color
print("== boundary column x=33% (left of cloud), x=34%, x=35% ==")
for xp in [32, 33, 34, 35, 36, 37]:
    xs = [px(xp, yp) for yp in range(4, 13, 2)]
    print(f' x={xp}%: ' + '  '.join(f'y{yp}%:{h}' for (x,y,h),yp in zip(xs, range(4,13,2))))

# cloud top area, check for green vine color at y 0-3%
print("\n== top edge y=0.5..3% x 40-55% (check vines) ==")
for yp in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]:
    row = []
    for xp in range(40, 56, 3):
        x, y, h = px(xp, yp)
        c = rp[x,y]
        is_green = c[1] > 60 and c[1] > c[0]*1.15 and c[1] > c[2]*1.1
        row.append(('G' if is_green else h))
    print(f' y={yp}%: ' + ' '.join(row))

# text color: sample inside cloud center where title text is (~x 46%, y 6%)
print("\n== text sample inside cloud ==")
for xp in [42, 44, 46, 48, 50]:
    for yp in [4, 5, 6, 7, 8]:
        x,y,h = px(xp,yp)
        c = rp[x,y]
        print(f'  ({xp}%,{yp}%) {h}', end='')
    print()
