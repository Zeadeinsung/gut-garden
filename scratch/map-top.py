from PIL import Image

m = Image.open('web/public/assets/scenes/scene_classroom_map.png').convert('RGB')
mp = m.load()
W, H = m.size
print(f'map size {W}x{H}')

def p(px, py):
    x = int(px/100*W); y = int(py/100*H)
    return '#%02X%02X%02X' % mp[x,y][:3]

# top strip: is it cream? where does the map top start?
print("== map top rows y=1..12% ==")
for yp in [1,2,3,4,6,8,10,12]:
    row = []
    for xp in [10,20,30,40,45,50,55,60,70,80,90]:
        row.append(p(xp,yp))
    print(f' y={yp}%: ' + ' '.join(row))
