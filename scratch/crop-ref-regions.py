from PIL import Image
import os

src = 'D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png'
img = Image.open(src).convert('RGB')
W, H = img.size
outdir = 'D:/GutGardenBeta/scratch/refreg'
os.makedirs(outdir, exist_ok=True)

regions = {
    'header_full':     (0, 0, W, 120),
    'header_left':     (0, 0, 560, 110),
    'header_right':    (1080, 0, W, 110),
    'mid_left':        (0, 200, 560, 520),
    'mid_center':      (556, 200, 1116, 520),
    'mid_right':       (1112, 200, W, 520),
    'bottom_mid':      (0, 500, W, 700),
    'bottom_bar':      (0, 690, W, 900),
}
for name, box in regions.items():
    crop = img.crop(box)
    path = f'{outdir}/{name}.png'
    crop.save(path)
    print(path, crop.size)
