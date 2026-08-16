from PIL import Image

ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
cur = Image.open('scratch/current_classroom_1672.png').convert('RGB')
print(f'ref {ref.size}  cur {cur.size}')

rp = ref.load(); cp = cur.load()

# sample a set of landmark points from the reference, map to current coords (current viewport == ref size 1672x941)
landmarks = {
    'n1 circle':      (17.8, 29.4),
    'n2 circle':      (52.3, 27.3),
    'n3 circle':      (35.3, 48.1),
    'n4 circle':      (16.3, 75.3),
    'n5 circle':      (59.6, 76.3),
    'AI panel bg':    (85.0, 50.0),
    'task bar bg':    (13.0, 85.0),
    'chest bar bg':   (50.0, 85.0),
    'header sky':     (50.0, 2.0),
    'bottom dock':    (50.0, 99.0),
}

def hexc(c):
    if isinstance(c, (tuple, list)):
        return '%02X%02X%02X' % tuple(c[:3])
    return '%02X%02X%02X' % ((c, c, c) if not isinstance(c, tuple) else tuple(c[:3]))

for name, (px, py) in landmarks.items():
    xr = int(px/100*ref.size[0]); yr = int(py/100*ref.size[1])
    xc = int(px/100*cur.size[0]); yc = int(py/100*cur.size[1])
    print(f'{name:14s} ref=({px},{py}) ref#{hexc(rp[xr,yr])}  cur=({xc},{yc}) cur#{hexc(cp[xc,yc])}')
