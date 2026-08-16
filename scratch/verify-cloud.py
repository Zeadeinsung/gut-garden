from PIL import Image

ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
cur = Image.open('scratch/current_classroom_1672.png').convert('RGB')
rp = ref.load(); cp = cur.load()
RW, RH = ref.size; CW, CH = cur.size
FW, FH = 1454, 909
OX, OY = (CW-FW)//2, (CH-FH)//2
CONTENT_H = FH - 68

def is_cloudish(c):
    r,g,b = c
    return r>230 and g>225 and b>200 and (r-b) < 60 and (g-b) < 60

# Map reference cloud bbox: scan ref rows y=1..12%, columns x=25..65%
print("== REF title cloud rows (x 25-65%) ==")
for yp in range(10, 160, 10):  # 0-16.9%
    y = int(yp/100*RH)
    run = None; xs = []
    for x in range(int(0.25*RW), int(0.65*RW)):
        if is_cloudish(rp[x,y]):
            if run is None: run = x
            xs.append(x)
    if xs:
        print(f'  ref y={yp/10:.1f}%: x {min(xs)/RW*100:.1f}-{max(xs)/RW*100:.1f}% (w {max(xs)-min(xs)}px)')

print("== CUR title cloud rows (content x 25-65%) ==")
for yp in range(10, 160, 10):
    cy = OY + int(yp/100*CONTENT_H)
    xs = []
    for x in range(OX+int(0.25*FW), OX+int(0.65*FW)):
        if is_cloudish(cp[x,cy]):
            xs.append(x)
    if xs:
        print(f'  cur content y={yp/10:.1f}%: x {(min(xs)-OX)/FW*100:.1f}-{(max(xs)-OX)/FW*100:.1f}% (w {max(xs)-min(xs)}px)')
