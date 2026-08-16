from PIL import Image

ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
cur = Image.open('scratch/current_classroom_1672.png').convert('RGB')
RW, RH = ref.size; CW, CH = cur.size
FW, FH = 1454, 909
OX, OY = (CW-FW)//2, (CH-FH)//2

# ref header center crop
ref.crop((int(0.20*RW), 0, int(0.75*RW), int(0.13*RH))).save('scratch/ref_header_crop.png')
# cur header center crop (phone frame top)
cur.crop((OX+int(0.20*FW), OY, OX+int(0.75*FW), OY+int(0.13*FH))).save('scratch/cur_header_crop.png')

# also left + right header crops
ref.crop((0, 0, int(0.28*RW), int(0.12*RH))).save('scratch/ref_header_left.png')
cur.crop((OX, OY, OX+int(0.28*FW), OY+int(0.12*FH))).save('scratch/cur_header_left.png')
ref.crop((int(0.62*RW), 0, RW, int(0.13*RH))).save('scratch/ref_header_right.png')
cur.crop((OX+int(0.62*FW), OY, OX+FW, OY+int(0.13*FH))).save('scratch/cur_header_right.png')
print('crops saved')
