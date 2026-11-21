"""Prepare original layered art, background-only editions and collection metadata.
Generated master paths are supplied explicitly; existing catalog entries are preserved.
"""
from pathlib import Path
from PIL import Image
import json,hashlib,math,io,argparse
import subprocess
import numpy as np
from scipy import ndimage
R=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser();parser.add_argument('--masters',type=Path,required=True);args=parser.parse_args()
A=R/'assets/designs';C=A/'colorways';P=R/'assets/celestial-patterns';P.mkdir(exist_ok=True);C.mkdir(exist_ok=True);(C/'thumbs').mkdir(exist_ok=True);(A/'thumbs').mkdir(exist_ok=True)
MASTER_KEYS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces','sun','moon','star','lovers']
for key in MASTER_KEYS:
 name=('tarot-' if key in ['sun','moon','star','lovers'] else 'zodiac-')+key+('-final' if key=='lovers' else '')+'.png'
 assert (args.masters/name).is_file(), 'Missing master '+name
DARK=[['Midnight','#142336'],['Forest','#173e36'],['Aubergine','#39283f'],['Bordeaux','#512e3d'],['Graphite','#292c32']]
LIGHT=[['Porcelain','#f7f0e5'],['Butter','#f4e4a8'],['Powder','#c4dce9'],['Blush','#eecbd4'],['Sage','#c6d5bd']]
rows=[];profiles={};render=[]
def hashfile(p):return hashlib.sha256(p.read_bytes()).hexdigest()[:12]
def store(im,p):
 if p.suffix=='.webp':im.save(p,lossless=True,method=4)
 else:im.save(p,optimize=True)
 t=im.copy();t.thumbnail((320,640));t.save(p.parent/'thumbs'/p.name,format='PNG' if p.suffix=='.png' else 'WEBP',**({'optimize':True} if p.suffix=='.png' else {'quality':88}))
def register(key,title,category,art,palette,kind,master):
 # The identical RGBA foreground is composited on every background. Never color-key the illustration.
 name='kp-'+key+'.png';original=Image.new('RGBA',art.size,palette[0][1]);original.alpha_composite(art);store(original,A/name)
 choices=[];variants=[];hashes=[];looks=[]
 for i,(label,bg) in enumerate(palette):
  variant='original' if i==0 else 'c'+str(i)
  if i:
   p=C/('kp-'+key+'-'+variant+'.webp');im=Image.new('RGBA',art.size,bg);im.alpha_composite(art);store(im,p);variants.append(p.name);hashes.append(hashfile(p));choices.append([label,bg])
  else:p=A/name
  looks.append({'id':variant,'name':label,'background':bg,'artwork':str(p.relative_to(R)),'preview':'assets/celestial-patterns/kp-'+key+'--'+variant+'.webp'})
 clear=C/('kp-'+key+'-c5.webp');store(art,clear);variants.append(clear.name);hashes.append(hashfile(clear));choices.append(['Artwork only','transparent']);looks.append({'id':'c5','name':'Artwork only','background':'transparent','artwork':str(clear.relative_to(R)),'preview':'assets/celestial-patterns/kp-'+key+'--c5.webp'})
 h=hashfile(A/name);profiles[name]={'method':'assets','group':'celestial' if 'zodiac' in key or 'tarot' in key else 'pastel','hash':h,'preparedHash':h,'colors':choices,'variants':variants,'variantHashes':hashes,'clearVariant':'c5','backgroundOnly':True}
 row={'file':name,'title':title,'category':category,'active':True,'hash':h,'color':(['Blue','Green','Purple','Red','Black'] if palette==DARK else ['White','Yellow','Blue','Pink','Green']),'kind':kind,'sourceSize':list(art.size),'looks':looks,'master':master.name};rows.append(row)
 for look in looks:render.append({'href':'customizer.html?design='+name+'&model=iphone-17-pro-max&colorway='+look['id']+'&view=phone','design':name,'model':'iphone-17-pro-max','variant':look['id'],'output':look['preview'],'caseType':'MagSafe Clear'})

def pattern(key,title,body,ink,category,palette=LIGHT):
 svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="2400" viewBox="0 0 1200 2400">'+body.replace('INK',ink)+'</svg>'
 path=args.masters/(key+'.svg');path.write_text(svg);art=Image.open(io.BytesIO(subprocess.check_output([str(R.parent/'node-v22.12.0-darwin-arm64/bin/node'),str(R/'tools/rasterize_pattern.cjs')],input=svg.encode()))).convert('RGBA');assert art.size==(1200,2400);register(key,title,category,art,palette,'original vector pattern',path)
def dots(step,r,ink,offset=True,ring=False):
 return ''.join(f'<circle cx="{x+(step/2 if offset and (y//step)%2 else 0)}" cy="{y}" r="{r}" '+('fill="none" stroke="INK" stroke-width="8"' if ring else 'fill="INK"')+'/>' for y in range(-step,2400+step,step) for x in range(-step,1200+step,step))
for key,title,step,r,ink,ring in [('micro-ink','Micro Ink Dots',92,10,'#172b45',False),('cafe-dot','Café Dots',170,33,'#4b302b',False),('cherry-pinpoint','Cherry Pinpoint',125,18,'#a52642',False),('oversize-pop','Oversize Pop Dots',280,78,'#2853ab',False),('halo-dot','Halo Dots',190,40,'#172b45',True),('pearl-grid','Pearl Grid Dots',155,25,'#fff6df',False)]:pattern('dots-'+key,title,dots(step,r,ink,True,ring),ink,'Polka dots',DARK if key=='pearl-grid' else LIGHT)
body=''.join(f'<circle cx="{x}" cy="{y}" r="28" fill="INK"/><circle cx="{x+47}" cy="{y+42}" r="13" fill="#b3354b"/>' for y in range(-100,2500,200) for x in range(-100,1300,200));pattern('dots-offset-duo','Offset Duo Dots',body,'#182c47','Polka dots')
body=''.join(f'<circle cx="{90+(i*137)%1100}" cy="{70+(i*227)%2300}" r="{14+(i%3)*8}" fill="INK"/>' for i in range(78));pattern('dots-orbit-scatter','Orbit Scatter Dots',body,'#31534a','Polka dots')
for key,title,step,width,ink in [('fine-ticking','Fine Ticking',115,7,'#20354f'),('cabana-bold','Cabana Bold',230,104,'#284fa2'),('double-rail','Double Rail',180,12,'#252b32')]:
 body=''.join(f'<path d="M{x} 0V2400" stroke="INK" stroke-width="{width}"/>'+ (f'<path d="M{x+25} 0V2400" stroke="INK" stroke-width="{width}"/>' if key=='double-rail' else '') for x in range(-50,1300,step));pattern('lines-'+key,title,body,ink,'Stripes & waves')
for key,title,step,amp,width,ink in [('wave-ribbon','Wave Ribbon',180,38,58,'#992e48'),('contour-flow','Contour Flow',43,35,5,'#213c56'),('scallop-stripe','Scallop Stripe',175,38,17,'#c05b4c')]:
 body=''
 for x in range(-200,1450,step):
  pts=' '.join(f'{x+amp*(abs(math.sin(y/115)) if key=="scallop-stripe" else math.sin(y/115)):.2f},{y}' for y in range(-20,2430,10));body+=f'<polyline points="{pts}" fill="none" stroke="INK" stroke-width="{width}"/>'
 pattern('lines-'+key,title,body,ink,'Stripes & waves')
body=''.join(f'<path d="M{x} -100L{x+1350} 2500" stroke="INK" stroke-width="18" stroke-dasharray="130 28"/>' for x in range(-1400,1400,130));pattern('lines-diagonal-dash','Diagonal Dash',body,'#294b3c','Stripes & waves')
body=''.join(f'<path d="M{x} 0V2400" stroke="INK" stroke-width="6"/>' for x in range(0,1300,150))+''.join(f'<path d="M0 {y}H1200" stroke="INK" stroke-width="6"/>' for y in range(0,2500,200));pattern('lines-windowpane','Windowpane',body,'#20354f','Stripes & waves')
for key in MASTER_KEYS:
 tarot=key in ['sun','moon','star','lovers'];prefix='tarot-' if tarot else 'zodiac-';p=args.masters/(prefix+key+('-final' if key=='lovers' else '')+'.png')
 src=Image.open(p).convert('RGBA');assert src.getextrema()[3][0]==0,'Master must have transparency: '+key
 # Preserve figure proportions and provide model-safe margins below the camera zone.
 alpha=np.array(src.getchannel('A'));border=np.concatenate((alpha[0],alpha[-1],alpha[:,0],alpha[:,-1]));assert (border>128).mean()<.01,'Opaque master border: '+key
 # Fit whole connected figures. Only tiny detached sparkles/noise may be excluded from the bounding box.
 labels,count=ndimage.label(alpha>16);sizes=np.bincount(labels.ravel());sizes[0]=0
 assert sizes.max()>1000,'No substantial illustration: '+key
 keep=np.where(sizes>=max(200,sizes.max()*.003))[0];subject=np.isin(labels,keep);ys,xs=np.where(subject)
 box=(max(0,int(xs.min())-24),max(0,int(ys.min())-24),min(src.width,int(xs.max())+25),min(src.height,int(ys.max())+25))
 assert subject[box[1]:box[3],box[0]:box[2]].sum()==subject.sum(),'Figure clipped: '+key
 cut=src.crop(box);w,h=1200,2400;scale=min(w*.86/cut.width,h*.46/cut.height,1);assert scale<=1
 cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS);art=Image.new('RGBA',(w,h));art.alpha_composite(cut,((w-cut.width)//2,round(h*.29)+(round(h*.46)-cut.height)//2))
 register(('tarot-'+key if tarot else 'zodiac-creature-'+key),('The '+key.title() if tarot else key.title()+' · Celestial Creature'),'Tarot' if tarot else 'Zodiac Creatures',art,DARK,'original AI-assisted illustration',p)
assert len(rows)==32,('Missing masters',len(rows))
cat=A/'designs.json';old=json.loads(cat.read_text());names={r['file'] for r in rows};cat.write_text(json.dumps([{k:r[k] for k in ['file','title','category','active','hash','color']} for r in rows]+[r for r in old if r['file'] not in names],indent=0,ensure_ascii=False)+'\n')
p=R/'assets/colorway-catalog.js';s=p.read_text();data=json.loads(s[s.index('{'):s.rindex('}')+1]);data.update(profiles);p.write_text('/* Design-specific backgrounds; existing artwork profiles preserved. */\nwindow.KP_COLORWAY_CATALOG='+json.dumps(data,separators=(',',':'),ensure_ascii=False)+';\n')
(R/'assets/celestial-patterns.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n');(R/'tools/celestial-pattern-renders.json').write_text(json.dumps(render,indent=2)+'\n');print('Prepared',len(rows),'designs and',len(render),'background previews')
