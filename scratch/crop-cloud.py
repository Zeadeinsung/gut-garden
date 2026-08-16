from PIL import Image
ref = Image.open('.tokenicode/tmp/6a9b28f0847f8a6c371e1d6b6aa067a_17864542097505.png').convert('RGB')
RW, RH = ref.size
ref.crop((int(0.22*RW), 0, int(0.75*RW), int(0.20*RH))).save('scratch/ref_cloud_crop.png')
print('saved ref_cloud_crop.png', int(0.22*RW), int(0.75*RW), int(0.20*RH))
