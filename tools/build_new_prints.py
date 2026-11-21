"""Build the static, accessible new-collection lookbook and source credits."""
from pathlib import Path
import json,html,urllib.parse
R=Path(__file__).resolve().parent.parent
rows=[r for r in json.loads((R/'assets/collection-expansion.json').read_text(encoding='utf-8')) if r.get('active',True)]
esc=lambda v:html.escape(str(v),quote=True)
slug=lambda s:s.lower().replace(' ','-')
label=lambda s:'Liquid Prism' if s=='Liquid Color' else s
from collections import Counter
assert Counter(r['category'] for r in rows)=={'Space Photography':20,'Liquid Color':20,'Botanical Blueprints':8,'Signature Golf':8,'National Parks':4}
assert not {'kp-space-cats-eye.jpg','kp-liquid-aurora-current.jpg'} & {r['file'] for r in rows}
assert len(rows)==60
assert len({r['file'] for r in rows})==60
for r in rows:
 assert (R/'assets/new-prints'/(Path(r['file']).stem+'.webp')).exists(),r['file']
categories=['Botanical Blueprints','National Parks','Signature Golf','Liquid Color','Space Photography']
copy={
 'Botanical Blueprints':('Nature, in fine detail.','Delicate leaves, intricate fronds and deep botanical blues.'),
 'National Parks':('A little more outside.','New illustrated landscapes from Bryce Canyon, Mount Rainier, Crater Lake and Denali.'),
 'Signature Golf':('Made for your next round.','Dream-course illustrations and playful clubhouse prints. Explore the real course maps in our full golf collection.'),
 'Liquid Color':('Color that moves.','Sculptural waves, glassy ripples and rich prismatic color. These are printed visual effects; the case surface is not metallic or textured.'),
 'Space Photography':('Something out of this world.','Real telescope and spacecraft observations, composed for your case. Some observations use scientific color mapping to reveal details beyond visible light.')}
header='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fresh Prints | Keepsake Printing Co.</title><meta name="description" content="Explore new botanical, national park, golf, Liquid Prism and space designs on clear phone cases. Personalized and purchased in store."><link rel="icon" href="assets/favicon.svg"><link rel="stylesheet" href="assets/homepage.css"><link rel="stylesheet" href="assets/shop-menu.css?v=start-case-1"><link rel="stylesheet" href="assets/case-zoom.css"><link rel="stylesheet" href="assets/new-prints.css"><script src="assets/shop-menu.js?v=celestial-2" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a><div class="announcement"><span>PERSONALIZED IN STORE · EVERY CASE DESIGN $44.99</span><a href="index.html#stores">Find your counter ↗</a></div><header class="home-header"><a class="wordmark" href="index.html" aria-label="Keepsake home"><img src="assets/favicon.svg" width="40" height="40" alt=""><span>KEEPSAKE<small>PRINTING CO.</small></span></a><nav class="desktop-nav" aria-label="Main navigation"><a href="gallery.html">Phone cases</a><a href="slates.html">Photo slates</a><a href="index.html#how-it-works">How it works</a><a href="index.html#stores">Visit us</a></nav><a class="header-cta" href="instore/">In-store browsing ↗</a></header><main id="main" class="fresh-page"><header class="fresh-intro"><p class="eyebrow">FRESH PRINTS. SAME PERSONAL TOUCH.</p><h1>Find your next<br>favorite.</h1><p>From alpine mornings to liquid color. Pick your print, make it yours and we’ll bring it to life at the counter.</p><p class="fresh-note">Digital previews on clear cases · Tap any case to see the details.<br>Shown on iPhone 17 Pro Max. Choose your phone in the design studio.</p></header>'''
page=header+'<p><a class="fresh-customize" href="park-collages.html">Adventure collages →</a> · <a class="fresh-customize" href="celestial-creatures.html">New: Zodiac Creatures →</a> · <a class="fresh-customize" href="tarot.html">Tarot →</a> · <a class="fresh-customize" href="pattern-studio.html">Dots &amp; lines →</a></p>'+'<p><a class="fresh-customize" href="seasonal-weather.html#new-weather">Just added: rain, snow, surf and autumn →</a></p>'+'<nav class="fresh-nav" aria-label="New collections">'+''.join('<a href="#'+slug(c)+'">'+esc(label(c))+'</a>' for c in categories)+'</nav>'
for category in categories:
 group=[r for r in rows if r['category']==category];title,desc=copy[category]
 page+='<section class="fresh-section" id="'+slug(category)+'"><div class="fresh-heading"><div><p class="eyebrow">'+esc(label(category))+'</p><h2>'+title+'</h2><p>'+desc+'</p></div><a class="fresh-browse" href="gallery.html?cat='+urllib.parse.quote(category)+'">Browse all '+esc(label(category))+' →</a></div><div class="fresh-grid">'
 for d in group:
  name=d['title'].replace('Liquid Prism · ','').replace(' · Botanical Blueprint','');href='customizer.html?design='+urllib.parse.quote(d['file'])+'&view=phone';preview='assets/new-prints/'+Path(d['file']).stem+'.webp'
  page+='<article class="fresh-card"><a data-preview-link class="fresh-image" href="'+esc(href)+'" aria-label="View '+esc(name)+'"><img loading="lazy" decoding="async" width="600" height="1200" src="'+preview+'" alt="'+esc(name)+' printed on a clear case with the phone mounted inside"></a><div class="fresh-card-title"><h3>'+esc(name)+'</h3><span>$44.99</span></div><a class="fresh-customize" href="'+esc(href)+'">Make it yours <span aria-hidden="true">↗</span></a>'+('<p class="fresh-credit">'+esc(d['credit'])+' · <a href="new-print-credits.html#'+esc(Path(d['file']).stem)+'">Source</a></p>' if d['category']=='Space Photography' else '')+'</article>'
 page+='</div>'
 if category=='Botanical Blueprints':page+='<p><a href="field-photo-credits.html#291506">Historical cyanotype sources in the full collection →</a></p>'
 page+='</section>'
page+='''<footer class="fresh-footer"><h2>Your print. Your phone.</h2><p>Choose a phone model to explore the full collection.</p><a class="fresh-customize" href="gallery.html">Find your case →</a><p><a href="new-print-credits.html">Artwork and photograph credits</a> · <a href="index.html#stores">Visit a store</a></p></footer></main><script src="assets/case-zoom.js"></script></body></html>'''
(R/'new-prints.html').write_text(page+'\n',encoding='utf-8')
credits='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New print sources | Keepsake</title><style>body{max-width:52rem;margin:auto;padding:2rem 6vw;font:1rem/1.6 system-ui;background:#faf9f6;color:#222}a{color:#853036}section{border-top:1px solid #bbb;padding:1rem 0}h1{line-height:1.1}</style></head><body><a href="new-prints.html">← Fresh prints</a><h1>Artwork &amp; photograph credits</h1><p>Space Photography uses actual telescope and spacecraft observations from the NASA image archive. Astronomical images may combine observations or map non-visible wavelengths to visible colors. Images are cropped and, for isolated subjects, placed on a black field for the case layout. No NASA sponsorship or endorsement is implied.</p><p>The new botanical, golf, liquid and park illustrations are original AI-assisted Keepsake artwork. Golf landscapes in this drop are fictional course illustrations, not surveyed maps or photographs of named courses. The existing Pebble Beach and St Andrews maps remain a separate collection.</p>'''
for d in rows:
 credits+='<section id="'+esc(Path(d['file']).stem)+'"><h2>'+esc(d['title'])+'</h2><p>'+esc(d['credit'])+'</p>'
 if d['sourceUrl']:credits+='<a href="'+esc(d['sourceUrl'])+'">Original source record and credits</a>'
 if 'ESA' in d['credit']:credits+='<p>ESA/Hubble reuse: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · <a href="https://esahubble.org/copyright/">Image-use terms</a>. Cropped for the case layout.</p>'
 credits+='</section>'
credits+='</body></html>'
(R/'new-print-credits.html').write_text(credits+'\n',encoding='utf-8')
print('Built fresh-prints lookbook:',len(rows),'cases')
