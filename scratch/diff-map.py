from PIL import Image
import math

ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
mp  = Image.open('web/public/assets/scenes/scene_classroom_map.png').convert('RGB')
RW, RH = ref.size  # 1672x941
MW, MH = mp.size   # 1920x1080
rp = ref.load(); pp = mp.load()
sx = MW/RW; sy = MH/RH

# sample a coarse grid: 40 cols x 24 rows, report per-cell average |diff| and dominant color of ref
cols, rows = 48, 28
print(f'{"cell":>6} {"x%":>6} {"y%":>5}  ref-dominant   |diff|   description')
for cy in range(rows):
    for cx in range(cols):
        x0 = int(cx/cols*RW); x1 = int((cx+1)/cols*RW)
        y0 = int(cy/rows*RH); y1 = int((cy+1)/rows*RH)
        # sample center pixel
        xc = (x0+x1)//2; yc = (y0+y1)//2
        mx = int(xc*sx); my = int(yc*sy)
        r_c = rp[xc,yc]; m_c = pp[mx,my]
        d = sum(abs(a-b) for a,b in zip(r_c,m_c))
        if d > 60:
            print(f'({cx:>2},{cy:>2})  {xc/RW*100:5.1f} {yc/RH*100:5.1f}  #{r_c[0]:02X}{r_c[1]:02X}{r_c[2]:02X}  {d:5d}')
