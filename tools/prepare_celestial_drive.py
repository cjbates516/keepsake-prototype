"""Employee-friendly Drive packages: named art, six print backgrounds and a case comparison."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,shutil
R=Path(__file__).resolve().parent.parent;B=R.parent/'collaboration/zodiac-tarot-patterns-2026-11-20';rows=json.loads((R/'assets/celestial-patterns.json').read_text());folders={r['file']:r for r in json.loads((B/'drive-folders.json').read_text())};jobs=[]
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',22)
for row in rows:
 folder=B/'drive-upload'/row['category']/row['title'].replace(' · Celestial Creature','');folder.mkdir(parents=True,exist_ok=True);files=[]
 master=B/'masters'/row['master'];target=folder/('01 Original artwork'+master.suffix);shutil.copyfile(master,target);files.append(target)
 sheet=Image.new('RGB',(1800,820),'#f6f1e8');d=ImageDraw.Draw(sheet);d.text((24,16),row['title']+' · CLEAR CASE PREVIEWS',font=font,fill='#202124')
 for i,look in enumerate(row['looks']):
  im=Image.open(R/look['artwork']).convert('RGBA');target=folder/(f'{i+2:02d} Case artwork - '+look['name']+'.png');im.save(target,optimize=True);files.append(target)
  preview=Image.open(R/look['preview']).convert('RGBA');preview.thumbnail((270,650));sheet.paste(preview,(i*300+(300-preview.width)//2,80),preview);d.text((i*300+20,745),look['name'],font=font,fill='#202124')
 target=folder/'08 Compare all backgrounds.jpg';sheet.save(target,quality=93);files.append(target)
 target=folder/'09 Clear case preview.webp';shutil.copyfile(R/row['looks'][0]['preview'],target);files.append(target)
 jobs.append({'file':row['file'],'title':row['title'],'folder':folders[row['file']]['id'],'url':folders[row['file']]['url'],'files':[{'path':str(f),'name':f.name} for f in files]})
(B/'drive-upload-jobs.json').write_text(json.dumps(jobs,indent=2));print('Prepared',len(jobs),'design folders /',sum(len(j['files']) for j in jobs),'files')
for group in range(4):
 sheet=Image.new('RGB',(1600,1050),'#f6f1e8');d=ImageDraw.Draw(sheet)
 for i,row in enumerate(rows[group*8:group*8+8]):
  im=Image.open(R/row['looks'][0]['preview']);im.thumbnail((330,420));x=(i%4)*400+(400-im.width)//2;y=(i//4)*520;sheet.paste(im,(x,y),im);d.text(((i%4)*400+15,y+440),row['title'].replace(' · Celestial Creature',''),font=font,fill='black')
 sheet.save(B/f'case-review-{group+1}.jpg',quality=94)
