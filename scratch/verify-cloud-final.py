from PIL import Image

cur = Image.open('D:/GutGardenBeta/scratch/current_classroom_1672.png').convert('RGB')
cp = cur.load()
FW, FH = 1454, 909
OX, OY = (cur.size[0]-FW)//2, (cur.size[1]-FH)//2
CONTENT_H = FH - 68

def content_xy(px, py):
    return int(OX + px/100*FW), int(OY + py/100*CONTENT_H)

def is_cloud(c):
    r,g,b = c
    return r>232 and g>228 and b>200

# current cloud bbox
print("== CUR cloud component bbox (content x 20-75%, y 0-20%) ==")
visited=set(); best=None
x0,x1 = content_xy(20,0)[0], content_xy(75,0)[0]
y0,y1 = OY, content_xy(0,20)[1]
for y in range(y0,y1):
    for x in range(x0,x1):
        if (x,y) in visited or not is_cloud(cp[x,y]): continue
        stack=[(x,y)]; visited.add((x,y)); pts=0
        minx=maxx=x; miny=maxy=y
        while stack:
            cx,cy=stack.pop(); pts+=1
            if cx<minx:minx=cx
            if cx>maxx:maxx=cx
            if cy<miny:miny=cy
            if cy>maxy:maxy=cy
            for dx in (-1,0,1):
                for dy in (-1,0,1):
                    nx,ny=cx+dx,cy+dy
                    if x0<=nx<x1 and y0<=ny<y1 and (nx,ny) not in visited and is_cloud(cp[nx,ny]):
                        visited.add((nx,ny)); stack.append((nx,ny))
        if best is None or pts>best[4]:
            best=(minx,maxx,miny,maxy,pts)
if best:
    minx,maxx,miny,maxy,pts = best
    print(f'  bbox x {(minx-OX)/FW*100:.1f}-{(maxx-OX)/FW*100:.1f}% y {(miny-OY)/FH*100:.1f}-{(maxy-OY)/FH*100:.1f}%  px={pts}')

# check title text present: dark green pixels in cloud area
x0,y0 = content_xy(40,3); x1,y1 = content_xy(58,10)
cnt=0
for y in range(y0, y1):
    for x in range(x0, x1):
        c=cp[x,y]
        if c[1]>70 and c[0]<120 and c[2]<80 and c[1]>c[0]*1.3:
            cnt+=1
print('  dark-green title-text px in cloud center:', cnt)

print("  AI panel bg @85%,50%:", '#%02X%02X%02X' % cp[content_xy(85,50)][:3])
print("  task bar @13%,85%:", '#%02X%02X%02X' % cp[content_xy(13,85)][:3])
print("  chest bar @50%,85%:", '#%02X%02X%02X' % cp[content_xy(50,85)][:3])

targets = {'n1':(0xAC,0xD2,0x58),'n2':(0x8A,0x5F,0xA4),'n3':(0x58,0xB8,0xDD),'n4':(0x9F,0xD3,0xEF),'n5':(0xEA,0xD0,0x7D)}
pos = {'n1':(17.8,29.4),'n2':(52.3,27.3),'n3':(35.3,48.1),'n4':(16.3,75.3),'n5':(59.6,76.3)}
for n in ['n1','n2','n3','n4','n5']:
    cx,cy = content_xy(*pos[n]); t=targets[n]; hits=0
    for dy in range(-22,23):
        for dx in range(-22,23):
            x,y=cx+dx,cy+dy
            if 0<=x<cur.size[0] and 0<=y<cur.size[1]:
                c=cp[x,y]
                if abs(c[0]-t[0])<=38 and abs(c[1]-t[1])<=38 and abs(c[2]-t[2])<=38: hits+=1
    print(f'  {n} circle hits: {hits}')
