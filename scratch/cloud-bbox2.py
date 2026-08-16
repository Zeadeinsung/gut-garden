from PIL import Image

cur = Image.open('scratch/current_classroom_1672.png').convert('RGB')
cp = cur.load()
FW, FH = 1454, 909
OX, OY = (cur.size[0]-FW)//2, (cur.size[1]-FH)//2

def is_cloud(c):
    r,g,b = c
    return r>232 and g>228 and b>205

def comps(px, x0, x1, y0, y1):
    visited = set(); comps = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x,y) in visited or not is_cloud(px[x,y]): continue
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
                        if x0<=nx<x1 and y0<=ny<y1 and (nx,ny) not in visited and is_cloud(px[nx,ny]):
                            visited.add((nx,ny)); stack.append((nx,ny))
            comps.append((minx,maxx,miny,maxy,pts))
    return comps

print("== CUR header zone (content x 5-66%, y 0-14%) cloud comps ==")
for c in sorted(comps(cp, OX+int(.05*FW), OX+int(.66*FW), OY, OY+int(.14*FH)), key=lambda c:-c[4]):
    if c[4] > 200:
        print(f'  bbox x {(c[0]-OX)/FW*100:.1f}-{(c[1]-OX)/FW*100:.1f}% y {(c[2]-OY)/FH*100:.1f}-{(c[3]-OY)/FH*100:.1f}%  px={c[4]}')
