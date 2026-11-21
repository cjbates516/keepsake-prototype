"""Audit existing collection preservation and exact background-only compositing."""
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw,ImageFont
import json,subprocess
R=Path(__file__).resolve().parents[2];B=R.parent/'collaboration/zodiac-tarot-patterns-2026-11-20'
rows=json.loads((R/'assets/celestial-patterns.json').read_text());catalog=json.loads((R/'assets/designs/designs.json').read_text());old=json.loads(subprocess.check_output(['git','show','c1a5c0024691288e332fd1483444a061e38682ff:assets/designs/designs.json'],cwd=R));current={r['file']:r for r in catalog};assert all(current[r['file']]==r for r in old),'Existing catalog changed'
def profiles(s):return json.loads(s[s.index('{'):s.rindex('}')+1])
p=profiles((R/'assets/colorway-catalog.js').read_text());q=profiles(subprocess.check_output(['git','show','c1a5c0024691288e332fd1483444a061e38682ff:assets/colorway-catalog.js'],cwd=R,text=True));assert all(p[k]==v for k,v in q.items()),'Existing backgrounds changed'
c=json.loads((R/'instore/codes.json').read_text())['codes'];o=json.loads(subprocess.check_output(['git','show','c1a5c0024691288e332fd1483444a061e38682ff:instore/codes.json'],cwd=R))['codes'];assert all(c[k]==v for k,v in o.items()),'Existing pick code changed'
assert len(rows)==32 and len(catalog)==len(old)+35
for r in rows:
 clear=Image.open(R/r['looks'][-1]['artwork']).convert('RGBA');assert clear.size==(1200,2400);assert clear.getextrema()[3][0]==0
 for look in r['looks'][:-1]:
  expected=Image.new('RGBA',clear.size,look['background']);expected.alpha_composite(clear);actual=Image.open(R/look['artwork']).convert('RGBA');assert ImageChops.difference(expected,actual).convert("RGB").getbbox() is None,(r['file'],look['id'],'foreground altered')
 for look in r['looks']:assert (R/look['preview']).stat().st_size>1000
assert len([r for r in catalog if r['category']=='Zodiac'])==len([r for r in old if r['category']=='Zodiac'])
print('PASS: 32 designs / 192 looks; exact background-only composites; all previous designs, colorway profiles and pick codes unchanged')
