from PIL import Image
import os

src = 'D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png'
img = Image.open(src).convert('RGB')
W, H = img.size
outdir = 'D:/GutGardenBeta/scratch/refgrid2'
os.makedirs(outdir, exist_ok=True)

# 3 cols x 2 rows grid
cols, rows = 3, 2
cw, ch = W//cols, H//rows
for r in range(rows):
    for c in range(cols):
        box = (c*cw, r*ch, (c+1)*cw, (r+1)*ch)
        crop = img.crop(box)
        path = f'{outdir}/cell_{r}_{c}.png'
        crop.save(path)
        print(path, crop.size)
