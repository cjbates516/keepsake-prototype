#!/usr/bin/env python3
"""Independent Pillow/NumPy/SciPy reference for browser mask PNGs."""
import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
root=Path(__file__).resolve().parents[2];folder=Path(sys.argv[1]);layouts=json.loads((root/'assets/print-layouts.js').read_text().split(' = ',1)[1].rsplit(';',1)[0]);results=[]
for name,layout in layouts.items():
 slug=''.join(c for c in name if c.isalnum());meta=json.loads((folder/f'chromium-{slug}.json').read_text());t=meta['tpl'];f=meta['fit'];w=t['pxW']+36;h=t['pxH']+36
 alpha=np.array(Image.open(root/'assets/masks'/layout['mask']).getchannel('A'))>=128
 xs=np.floor((np.arange(w)+.5-18)/(t['pxW']/t['w']/f['sx'])+f['x']).astype(int)
 ys=np.floor((np.arange(h)+.5-18)/(t['pxH']/t['h']/f['sy'])+f['y']).astype(int)
 trim=alpha[np.clip(ys,0,2999)[:,None],np.clip(xs,0,2499)[None,:]] & ((ys>=0)&(ys<3000))[:,None] & ((xs>=0)&(xs<2500))[None,:]
 expect=distance_transform_edt(~trim)<=18
 for engine in ['chromium','webkit']:
  actual=np.array(Image.open(folder/f'{engine}-{slug}-mask.png').getchannel('A'))
  mismatch=int(np.count_nonzero(actual!=expect*255));results.append({'model':name,'engine':engine,'mismatches':mismatch})
  assert mismatch==0,(name,engine,mismatch)
print('PASS',len(results),'exports equal independently sampled native alpha + SciPy Euclidean dilation')
(folder/'independent-mask-reference.json').write_text(json.dumps(results,indent=2))
