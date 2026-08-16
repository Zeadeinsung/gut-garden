from PIL import Image
ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
rp = ref.load()
RW, RH = ref.size
def px(xp, yp):
    x = int(xp/100*RW); y = int(yp/100*RH)
    c = rp[x,y]
    return '#%02X%02X%02X' % c[:3]

# subtitle row y 9-12%, sample across
print("== subtitle area y=9..12.5% x 40-58% ==")
for yp in [9, 9.5, 10, 10.5, 11, 11.5, 12]:
    row = [px(xp, yp) for xp in [42,44,46,48,50,52,54,56]]
    print(f' y={yp}%: ' + ' '.join(row))

# cloud bottom edge: find where cream ends going down at x=46%
print("\n== cloud bottom at x=46% ==")
x = int(46/100*RW)
for y in range(0, RH):
    c = rp[x,y]
    r,g,b = c
    is_cream = r>232 and g>228 and b>200 and (r-b)<50
    if y % 8 == 0 or (not is_cream and y%2==0):
        pass
# find transitions
prev = None
for y in range(0, RH):
    c = rp[x,y]; r,g,b = c
    is_cream = r>232 and g>228 and b>200 and (r-b)<50
    if prev is not None and is_cream != prev[0]:
        print(f'  y={y} ({y/RH*100:.1f}%) -> {"cream" if is_cream else "not-cream"} #{c[0]:02X}{c[1]:02X}{c[2]:02X}')
    prev = (is_cream, c)
