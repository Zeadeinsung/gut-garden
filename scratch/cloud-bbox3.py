from PIL import Image

ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
rp = ref.load()
RW, RH = ref.size

def is_cloud(c):
    r,g,b = c
    return r>232 and g>228 and b>205

# full column scan at center x=46%: find cloud vertical extent
print("== vertical extent at x=46%, 44%, 50% ==")
for xp in [44, 46, 50]:
    x = int(xp/100*RW)
    top = None; bottom = None
    for y in range(RH):
        if is_cloud(rp[x,y]):
            if top is None: top = y
            bottom = y
    print(f'  x={xp}%: top y={top} ({top/RH*100:.1f}%), bottom y={bottom} ({bottom/RH*100:.1f}%)')

# horizontal extent at rows y=2, 5, 8, 11, 14%
print("\n== horizontal extent at rows ==")
for yp in [2, 5, 8, 11, 14, 17]:
    y = int(yp/100*RH)
    xs = [x for x in range(RW) if is_cloud(rp[x,y])]
    if xs:
        # filter to the central component (x 25-68%)
        xs = [x for x in xs if x > int(.25*RW) and x < int(.70*RW)]
    if xs:
        print(f'  y={yp}%: x {xs[0]/RW*100:.1f}-{xs[-1]/RW*100:.1f}% (w {(xs[-1]-xs[0])}px)')
    else:
        print(f'  y={yp}%: none')

# check green decoration pixels INSIDE cloud region
print("\n== green deco pixels inside cloud bbox ==")
for yp in [4, 6, 8, 10]:
    row = []
    for xp in range(34, 60, 2):
        x = int(xp/100*RW); y = int(yp/100*RH)
        c = rp[x,y]
        is_green = c[1] > 70 and c[1] > c[0]*1.15 and c[1] > c[2]*1.1 and c[0] < 200
        row.append('G' if is_green else '.')
    print(f'  y={yp}%: ' + ''.join(row))
