from PIL import Image
import numpy as np

ref = np.array(Image.open('D:/GutGardenBeta/.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')).astype(int)
H, W = ref.shape[:2]
print('ref', W, H)

scene = Image.open('D:/GutGardenBeta/web/public/assets/scenes/scene_classroom_map.png').convert('RGB')
sw, sh = scene.size
print('scene', sw, sh)

# Try resizing scene to ref size
scene_r = scene.resize((W, H), Image.LANCZOS)
sc = np.array(scene_r).astype(int)

# also try with a slight crop on the scene (scene may be cropped in ref)
# Try center crop of scene to ref aspect then resize
ref_aspect = W / H
scene_aspect = sw / sh
print('aspects', round(ref_aspect,3), round(scene_aspect,3))

def diff(a, b):
    d = np.abs(a - b).sum(axis=2)
    return d

d = diff(ref, sc)
print('mean diff (resized):', d.mean())
th = 60
mask = (d > th).astype(np.uint8)
print('diff px fraction >', th, ':', mask.mean().round(4))

# Try center-cropped scene resized to ref
if scene_aspect > ref_aspect:
    # scene wider -> crop width
    new_w = int(sw * (sh / H * H / sh))  # keep height, adjust width to ref aspect
    crop_w = int(sh * ref_aspect)
    x0 = (sw - crop_w) // 2
    scene_c = scene.crop((x0, 0, x0 + crop_w, sh))
else:
    crop_h = int(sw / ref_aspect)
    y0 = (sh - crop_h) // 2
    scene_c = scene.crop((0, y0, sw, y0 + crop_h))
scene_c = scene_c.resize((W, H), Image.LANCZOS)
sc2 = np.array(scene_c).astype(int)
d2 = diff(ref, sc2)
print('mean diff (crop-resized):', d2.mean())
mask2 = (d2 > th).astype(np.uint8)
print('diff px fraction (crop-resized):', mask2.mean().round(4))

# Save masks for visualization
Image.fromarray((mask*255).astype(np.uint8)).save('D:/GutGardenBeta/scratch/diff_mask.png')
Image.fromarray((mask2*255).astype(np.uint8)).save('D:/GutGardenBeta/scratch/diff_mask2.png')

# Show the region of the better alignment (compare means)
print('Using:', 'resize' if d.mean() < d2.mean() else 'crop-resize')
