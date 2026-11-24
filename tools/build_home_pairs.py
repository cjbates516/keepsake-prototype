"""Full-width paired-case campaigns using the same clear-case previews as the editor."""
from pathlib import Path
import html,re
R=Path(__file__).resolve().parent.parent
e=lambda x:html.escape(x,quote=True)
def fresh(key,variant='original'):return 'assets/celestial-patterns/kp-'+key+'--'+variant+'.webp'
def old(key,variant='original'):return 'assets/case-only-previews/iphone-15-pro-max--'+key+'--'+variant+'.webp?v=clear-mounted-1'
def custom(file,variant='original'):
 assert (R/'assets/designs'/file).is_file(),file
 return 'customizer.html?design='+file+'&colorway='+variant+'&view=phone'
# collection, headline, background, collection URL, two [image, destination, label] records
slides=[
 ('NEW · OCEAN & RAIN AFTER DARK','Drift away.<br>Stay out late.','#dce9e9','ocean-and-rain.html',[['assets/ocean-rain/ocean-photo-turtle-glide.webp',custom('ocean-photo-turtle-glide.jpg')+'&back=ocean-and-rain.html%23ocean-photography','Turtle Glide'],['assets/ocean-rain/rain-photo-midnight-window.webp',custom('rain-photo-midnight-window.jpg')+'&back=ocean-and-rain.html%23rain-after-dark','Midnight Window']]),
 ('NEW · ADVENTURE COLLAGES','A little more<br>outside.','#e4eadc','park-collages.html',[[fresh('park-collage-grand-canyon').replace('--original','--iphone-15-pro'),custom('kp-park-collage-grand-canyon.jpg'),'Grand Canyon'],[fresh('park-collage-smokies').replace('--original','--iphone-15-pro'),custom('kp-park-collage-smokies.jpg'),'Great Smoky Mountains']]),
 ('NEW · ZODIAC CREATURES','Written in<br>your stars.','#eee4d8','celestial-creatures.html',[[fresh('zodiac-creature-aries'),custom('kp-zodiac-creature-aries.png'),'Aries'],[fresh('zodiac-creature-leo','c1'),custom('kp-zodiac-creature-leo.png','c1'),'Leo · Forest']]),
 ('NEW · TAROT','A little<br>everyday magic.','#e6e0ed','tarot.html',[[fresh('tarot-sun'),custom('kp-tarot-sun.png'),'The Sun'],[fresh('tarot-moon','c2'),custom('kp-tarot-moon.png','c2'),'The Moon · Aubergine']]),
 ('NEW · DOTS & LINES','Find your<br>rhythm.','#f2dfd1','pattern-studio.html',[[fresh('dots-cafe-dot'),custom('kp-dots-cafe-dot.png'),'Café Dots'],[fresh('lines-wave-ribbon','c3'),custom('kp-lines-wave-ribbon.png','c3'),'Wave Ribbon · Blush']]),
 ('YOUR CHILD’S ARTWORK','“I love<br>you Dad”','#f4d7c7','customizer.html?studio=drawing&model=iphone-17-pro-max&finish=Silver#personalStudio',[['assets/home/personal/drawing-clear-case-v2.webp','customizer.html?studio=drawing&model=iphone-17-pro-max&finish=Silver#personalStudio','Your child’s drawing'],['assets/home/personal/sky-clear-case-v2.webp','customizer.html?studio=sky&model=iphone-17-pro-max&finish=Silver#personalStudio','Your special night sky']]),
 ('CITY AFTER DARK · NEW YORK','After dark.<br>All yours.','#dce5ec','gallery.html?cat=City%20Scenes',[[old('city-night-new-york'),custom('city-night-new-york.jpg'),'Times Square Rain'],[old('city-night-philadelphia'),custom('city-night-philadelphia.jpg'),'Philadelphia at night']]),
 ('CITY AFTER DARK · PHILADELPHIA','Take home<br>with you.','#e5e4dc','gallery.html?cat=City%20Scenes',[[old('city-night-philadelphia'),custom('city-night-philadelphia.jpg'),'Philadelphia at night'],[old('city-night-los-angeles'),custom('city-night-los-angeles.jpg'),'Los Angeles at night']]),
 ('CITY AFTER DARK · LOS ANGELES','City lights.<br>Your story.','#dedde8','gallery.html?cat=City%20Scenes',[[old('city-night-los-angeles'),custom('city-night-los-angeles.jpg'),'Los Angeles at night'],[old('city-night-new-york'),custom('city-night-new-york.jpg'),'Times Square Rain']]),
 ('NATIONAL PARKS','Answer<br>the call.','#dfe8dc','parks-rugged.html',[[old('modern-yosemite-national-park-logo-for-mug','forest-topo'),custom('modern-yosemite-national-park-logo-for-mug.jpg','forest-topo'),'Yosemite · Forest Topo'],[fresh('park-collage-everest').replace('--original','--iphone-15-pro'),custom('kp-park-collage-everest.jpg'),'Mount Everest']]),
 ('CHERRY DOT & WRONG WAY DUCK','Made to<br>stand out.','#f5d1d9','cherry-duck.html',[[old('kp-cherry-dot'),custom('kp-cherry-dot.png'),'Cherry Dot'],[old('kp-wrong-way-duck'),custom('kp-wrong-way-duck.png'),'Wrong Way Duck']]),
 ('NEON HEARTS','Wear your<br>heart out.','#e5d9eb','gallery.html?cat=Neon%20Hearts',[[old('kp-heart-riot','c4'),custom('kp-heart-riot.png','c4'),'Neon Hearts · Lilac Love'],[old('kp-heart-riot','c2'),custom('kp-heart-riot.png','c2'),'Neon Hearts · Ice Pop']]),
 ('LIQUID PRISM','Color outside<br>the ordinary.','#e2ddf2','new-prints.html#liquid-color',[[old('kp-liquid-prism'),custom('kp-liquid-prism.png'),'Liquid Prism'],['assets/new-prints/kp-liquid-copper-wave.webp',custom('kp-liquid-copper-wave.jpg'),'Copper Wave']])]
body='<section class="case-edit paired-campaigns" aria-roledescription="carousel" aria-labelledby="hero-title"><h1 id="hero-title" class="edit-status">Design a case that feels like you</h1><div class="edit-window">'
for i,(collection,title,wash,href,pair) in enumerate(slides):
 title=title.replace("<br>"," <br>")
 body+=f'<article class="case-slide pair-slide" role="group" aria-roledescription="slide" aria-label="{i+1} of {len(slides)}: {e(collection)}" style="--wash:{wash}"'+(' hidden' if i else '')+'><div class="case-story"><div class="campaign-pair">'
 for j,(img,url,label) in enumerate(pair):
  assert (R/img.split('?')[0]).is_file(),img
  body+=f'<a class="paired-phone {("inverted" if j else "upright")}" href="{e(url)}" aria-label="Customize {e(label)}"><img src="{e(img)}" width="632" height="1244" alt="{e(label)} printed on a clear case" '+('fetchpriority="high"' if i==0 else 'loading="lazy"')+' decoding="async"></a>'
 label='Explore all 12 photographs' if collection=='NEW · OCEAN & RAIN AFTER DARK' else 'Make a drawing case' if collection=='YOUR CHILD’S ARTWORK' else 'Shop all City After Dark' if collection.startswith('CITY AFTER DARK') else 'Explore the collection'
 subtitle='Real photographs. Your everyday escape.<br>Printed on a clear case in store. $44.99.' if collection=='NEW · OCEAN & RAIN AFTER DARK' else 'Your photos. Your favorite prints. <br>Made personal in store. From $44.99.'
 body+=f'<div class="campaign-pair-hint">Swipe to explore · Tap a case to make it yours</div></div><div class="campaign-copy"><span class="campaign-collection">{e(collection)}</span><strong class="campaign-title">{title}</strong><p class="campaign-subtitle">{subtitle}</p><div class="campaign-actions"><a class="campaign-shop" href="customizer.html">Design your case</a><a class="campaign-browse" href="{e(href)}">{label} →</a></div></div></div></article>'
body+='</div><span class="edit-status" aria-live="polite"></span></section>'
p=R/'index.html';s=p.read_text();
for target in ['celestial-creatures.html','tarot.html','pattern-studio.html','park-collages.html']:
 s=re.sub(r'<a href="'+re.escape(target)+r'">[^<]*</a>','',s)
start=s.index('<section class="case-edit');end=s.index('<nav class="collection-strip"',start);s=s[:start]+body+'\n'+s[end:];s=s.replace('assets/homepage.css?v=case-zoom','assets/homepage.css?v=paired-campaign-1').replace('assets/homepage.js?v=case-zoom','assets/homepage.js?v=paired-campaign-1');s=re.sub(r'<link rel="preload" as="image" href="[^"]+">','<link rel="preload" as="image" href="'+slides[0][4][0][0]+'">',s,count=1);s=s.replace('<span>FIND YOUR VIBE</span>','<span>FIND YOUR VIBE</span><a href="celestial-creatures.html">Zodiac Creatures ↗</a><a href="tarot.html">Tarot ↗</a><a href="pattern-studio.html">Dots &amp; lines ↗</a><a href="park-collages.html">Adventure Collages ↗</a>');p.write_text(s)
print('Built',len(slides),'paired campaigns with individually linked clear cases')
