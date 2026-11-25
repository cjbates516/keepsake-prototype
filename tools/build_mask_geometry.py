#!/usr/bin/env python3
"""Compile existing view-mask alpha into exact row spans; no geometry guessed.
Requires Pillow. Use --check to detect stale source or generated data.
Two files: assets/mask-geometry.js (every phone with a clear case, loaded with the page) and
assets/mask-geometry-rated.js (Rated Case masks no such phone uses; customizer.html loads it with the first Rated only
phone). Which is which comes from RATED in customizer.html, the Rated Cases of phones that also have a clear kit.
"""
import hashlib,json,re,sys
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
page=(root/'customizer.html').read_text()
kept={'view-rated-'+key+'.png' for key in json.loads(re.search(r'var RATED=(\{.*?\});',page,re.S).group(1).replace("'",'"')).values()}
late=lambda name:name.startswith('view-rated-') and name not in kept
pack=lambda masks:json.dumps(masks,separators=(',',':'))
files={
 'assets/mask-geometry.js':'window.KP_MASK_GEOMETRY='+pack({n:g for n,g in out.items() if not late(n)})+';\n',
 'assets/mask-geometry-rated.js':'window.KP_MASK_GEOMETRY=Object.assign(window.KP_MASK_GEOMETRY||{},'+pack({n:g for n,g in out.items() if late(n)})+');\n',
}
for name,text in files.items():
 text='/* Generated from native mask alpha >=128 by tools/build_mask_geometry.py. */\n'+text
 p=root/name
 if '--check' in sys.argv:assert p.exists() and p.read_text()==text,'Mask geometry needs regeneration: '+name
 else:p.write_text(text);print('Generated',name,len(text),'bytes')
assert kept<=set(out),'RATED masks missing: '+', '.join(sorted(kept-set(out)))
if '--check' in sys.argv:print('PASS exact row geometry and source hashes for',len(out),'masks,',sum(map(late,out)),'of them loaded on demand')
