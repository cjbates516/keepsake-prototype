#!/usr/bin/env python3
"""Compile existing view-mask alpha into exact row spans; no geometry guessed.
Requires Pillow. Use --check to detect stale source or generated data.
"""
import hashlib,json,sys
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
out={}
for p in sorted((root/'assets/masks').glob('view-*.png')):
 im=Image.open(p);w,h=im.size;a=im.getchannel('A').point(lambda n:255 if n>=128 else 0);data=a.tobytes();groups=[]
 for y in range(h):
  row=data[y*w:(y+1)*w];spans=[];x=0
  while x<w:
   if not row[x]:x+=1;continue
   x0=x
   while x<w and row[x]:x+=1
   spans.extend([x0,x])
  if not spans:continue
  if groups and groups[-1][1]==y and groups[-1][2:]==spans:groups[-1][1]=y+1
  else:groups.append([y,y+1]+spans)
 out[p.name]={'w':w,'h':h,'box':list(a.getbbox()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'rows':groups}
text='/* Generated from native mask alpha >=128 by tools/build_mask_geometry.py. */\nwindow.KP_MASK_GEOMETRY='+json.dumps(out,separators=(',',':'))+';\n'
p=root/'assets/mask-geometry.js'
if '--check' in sys.argv:
 assert p.read_text()==text,'Mask geometry needs regeneration'
 print('PASS exact row geometry and source hashes for',len(out),'masks')
else:p.write_text(text);print('Generated',len(out),'masks,',len(text),'bytes')
