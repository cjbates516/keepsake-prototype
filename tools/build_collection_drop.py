"""Publish reviewed collection artwork; keep existing catalog entries and pick codes intact.
Input: --prepared <verified source manifest> --masters <generated image directory>.
"""
from pathlib import Path
from PIL import Image
import argparse,json,hashlib,html,urllib.parse
from sync_designs import classify_colors
R=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--prepared',type=Path,required=True);p.add_argument('--masters',type=Path,required=True);a=p.parse_args()
e=lambda s:html.escape(str(s),quote=True)
photos=json.loads(a.prepared.read_text());assert len(photos)==58 and not any(x.get('error') for x in photos),'All selected sources must be ready'
rows=[]
for x in photos:
 rows.append({k:x[k] for k in ['file','title','category','kind','hash','credit','license','licenseUrl','sourceUrl','sourceTitle','description','originalSize','artworkSize','originalSha256','adaptation']})
artists=json.loads((a.masters/'prompts.json').read_text())+json.loads((a.masters/'golf-prompts.json').read_text())
artists.append({'slug':'fool','title':'The Fool','path':str(a.masters/'fool.png'),'prompt':'Original gold and ivory copperplate engraving of a full-length traveler and small dog stepping toward a rocky ledge, midnight navy background, botanical sprigs, phone-safe centered composition, no text or border.','method':'built-in image_gen'})
assert len(artists)==20
for x in artists:
 cat='Signature Golf' if x['slug'].startswith('golf-') else 'Tarot';name='drop-'+('' if cat=='Signature Golf' else 'tarot-')+x['slug']+'.png';im=Image.open(x['path']).convert('RGB');im.save(R/'assets/designs'/name,optimize=True);thumb=im.copy();thumb.thumbnail((320,640));thumb.save(R/'assets/designs/thumbs'/name,optimize=True)
 rows.append({'file':name,'title':x['title'],'category':cat,'kind':'original AI-assisted illustration','hash':hashlib.sha256((R/'assets/designs'/name).read_bytes()).hexdigest()[:12],'credit':'Keepsake · original AI-assisted artwork','license':'Original artwork','licenseUrl':'','sourceUrl':'','sourceTitle':x['title'],'description':x['prompt'],'originalSize':list(im.size),'artworkSize':list(im.size),'adaptation':'Original generated artwork, saved at native resolution. No upscaling.','generationMethod':x['method']})
order=['Ocean Photography','Rain After Dark','Botanical Blueprints','Signature Golf','Seasonal Weather','Tarot'];rows.sort(key=lambda r:(order.index(r['category']),r['title']))
assert len(rows)==78 and len({r['file'] for r in rows})==78
catpath=R/'assets/designs/designs.json';old=json.loads(catpath.read_text());names={r['file'] for r in rows};new=[]
for r in rows:
 new.append({k:r[k] for k in ['file','title','category','hash','credit','license','kind']}|{'active':True,'color':classify_colors(R/'assets/designs'/r['file']),'creditUrl':'collection-credits.html#'+Path(r['file']).stem,'added':'2026-11-25'})
catpath.write_text(json.dumps(new+[x for x in old if x['file'] not in names],indent=0,ensure_ascii=False)+'\n')
(R/'assets/collection-drop-20261125.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n')
manifest=[]
for r in rows:
 for rim,key in [('Smoke Frost','smoke'),('Clear Frost','clear')]:
  href='customizer.html?'+urllib.parse.urlencode({'design':r['file'],'model':'iphone-15-pro','colorway':'original','view':'phone','case':'rated','rim':rim})
  manifest.append({'href':href,'design':r['file'],'model':'iphone-15-pro','variant':'original','caseType':'Rated Case','rim':rim,'output':'assets/new-arrivals/'+Path(r['file']).stem+'--'+key+'.webp'})
(R/'tools/collection-drop-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
head='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Arrivals | Keepsake</title><meta name="description" content="Discover 78 new ocean, rainy-night, botanical, golf, seasonal and tarot designs. Preview a Frost case, choose your phone and personalize in store."><link rel="icon" href="assets/favicon.svg"><link rel="stylesheet" href="assets/homepage.css?v=parks-atmosphere-20261124"><link rel="stylesheet" href="assets/shop-menu.css?v=narrow-rail-20261124"><link rel="stylesheet" href="assets/new-prints.css"><link rel="stylesheet" href="assets/new-arrivals.css?v=20261125"><script defer src="assets/shop-menu.js?v=arrivals-20261125"></script><script defer src="assets/new-arrivals.js?v=20261125"></script></head><body><a class="skip-link" href="#main">Skip to content</a><div class="announcement"><span>PERSONALIZED IN STORE · FROST CASE DESIGNS $49.99</span><a href="index.html#stores">Find your counter ↗</a></div><header class="home-header"><a class="wordmark" href="index.html" aria-label="Keepsake home"><img src="assets/favicon.svg" width="40" height="40" alt=""><span>KEEPSAKE<small>PRINTING CO.</small></span></a><nav class="desktop-nav" aria-label="Main navigation"><a href="gallery.html">Phone cases</a><a href="slates.html">Photo slates</a><a href="index.html#stores">Visit us</a></nav><a class="header-cta" href="customizer.html?case=rated&amp;rim=Smoke%20Frost">Design your case</a></header><main id="main" class="fresh-page arrivals-page"><header class="fresh-intro"><p class="eyebrow">THE LATEST KEEPSAKE FINDS</p><h1>Find your next favorite.</h1><p>78 new designs. Ocean escapes, rainy nights, botanical blues and a little everyday magic.</p></header><div class="arrivals-controls"><label for="arrivalCategory">Explore a collection<select id="arrivalCategory"><option value="All">All new arrivals (78)</option>'''
for c in order:head+='<option value="'+e(c)+'">'+e(c)+' ('+str(sum(r['category']==c for r in rows))+')</option>'
head+='''</select></label><fieldset class="arrival-rims"><legend>Preview case rim</legend><button type="button" data-rim="smoke" aria-pressed="true">Smoke Frost</button><button type="button" data-rim="clear" aria-pressed="false">Clear Frost</button></fieldset></div><p id="arrivalCount" role="status" aria-live="polite">78 new designs · Tap a case to choose your phone.</p><div class="fresh-grid" id="arrivalGrid">'''
page=head
for i,r in enumerate(rows):
 stem=Path(r['file']).stem;href='gallery.html?'+urllib.parse.urlencode({'cat':r['category'],'pick':r['file'],'colorway':'original','case':'rated','rim':'Smoke Frost','back':'new-arrivals.html'})
 kind='Illustration' if 'AI-assisted' in r['kind'] else 'Historic cyanotype' if 'cyanotype' in r['kind'] else 'Photograph'
 page+='<article class="fresh-card" data-category="'+e(r['category'])+'" data-art="'+e(stem)+'"><a class="fresh-image" href="'+e(href)+'" aria-label="Customize '+e(r['title'])+'"><img loading="lazy" decoding="async" width="600" height="1200" src="assets/new-arrivals/'+stem+'--smoke.webp" alt="'+e(r['title'])+' on a Smoke Frost case"></a><p class="arrival-kind">'+e(r['category'])+' · '+kind+'</p><div class="fresh-card-title"><h2>'+e(r['title'])+'</h2><span>$49.99</span></div><a class="fresh-customize" href="'+e(href)+'">Make it yours ↗</a><a class="arrival-credit" href="collection-credits.html#'+stem+'">'+('About this artwork' if kind=='Illustration' else 'Photo &amp; source')+'</a></article>'
page+='''</div><div class="arrivals-more"><button type="button" id="arrivalMore" hidden>Show 12 more</button><a id="arrivalCollection" href="gallery.html">Explore the full design library →</a></div><p class="arrival-note">Digital previews show artwork on an iPhone 15 Pro Frost case. Choose your phone to see its print area. Personalize here, then purchase with a team member in store.</p><p class="arrival-note"><a href="collection-credits.html">Photograph credits &amp; artwork details</a></p></main></body></html>'''
(R/'new-arrivals.html').write_text(page+'\n')
credits='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Arrivals · Sources &amp; Credits | Keepsake</title><style>body{max-width:58rem;margin:auto;padding:2rem 5vw;font:1rem/1.7 system-ui;background:#faf9f6;color:#222}a{color:#853036}h1{line-height:1.15}section{border-top:1px solid #ccc;padding:1.5rem 0;scroll-margin-top:1rem}section:after{content:'';display:block;clear:both}img{float:right;width:110px;max-height:220px;object-fit:contain;margin:0 0 1rem 1rem}h2{line-height:1.25}nav{display:flex;flex-wrap:wrap;gap:1rem}small{display:block}</style></head><body><a href="new-arrivals.html">← New arrivals</a><h1>Photographs &amp; original artwork</h1><p>Ocean, rain, seasonal and golf photographs are sourced photographs. Botanical blueprints are historic cyanotype reproductions. The new tarot designs and two vintage golf illustrations are original AI-assisted artwork. Case previews are digital composites.</p><p>Photographs are resized without upscaling and cropped by each case’s print mask. Historic scan borders may be trimmed. ShareAlike adaptations retain their source license; attribution is included with the staff artwork files.</p>'''
for r in rows:
 stem=Path(r['file']).stem;credits+='<section id="'+stem+'"><img loading="lazy" src="assets/designs/thumbs/'+r['file']+'" alt="'+e(r['title'])+'"><h2>'+e(r['title'])+'</h2><p>'+e(r['category'])+' · '+e(r['kind'])+'</p><p><strong>'+e(r['credit'])+'</strong><br>'+e(r['sourceTitle'])+'</p>'
 if r['sourceUrl']:credits+='<p><a href="'+e(r['sourceUrl'])+'">Source and reuse record</a> · '+('<a href="'+e(r['licenseUrl'])+'">'+e(r['license'])+'</a>' if r['licenseUrl'] else e(r['license']))+'</p>'
 credits+='<p>'+e(r['adaptation'])+'</p><p><a href="assets/designs/'+r['file']+'" download>Download artwork</a></p></section>'
(R/'collection-credits.html').write_text(credits+'</body></html>\n')
print('Prepared',len(rows),'new designs and',len(manifest),'Frost preview jobs')
