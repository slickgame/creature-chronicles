"""Package selected painted masters without altering their original image contents."""
from pathlib import Path
from PIL import Image
import json,shutil,hashlib,zipfile
R=Path(__file__).resolve().parents[1];K=R/'public/images/ui/creature-overview-a-v2';P=K/'painted-r4'
items=json.loads((P/'generation.json').read_text())['assets'];validation=[]
for item in items:
 name=item['name'];src=Path(item['path']);master=P/'source'/f'{name}.png'
 if src.exists() and src.resolve()!=master.resolve():shutil.copyfile(src,master)
 if not master.exists():raise FileNotFoundError(f'Missing selected master: {master}')
 src=master
 im=Image.open(src).convert('RGBA');bounds=im.getchannel('A').getextrema();assert bounds[0]==0 and bounds[1]>=250,(name,bounds)
 im.thumbnail((256,256),Image.Resampling.LANCZOS);im.save(P/f'{name}.webp',lossless=True)
 validation.append({'name':name,'dimensions':im.size,'alphaRange':bounds,'masterSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'productionSha256':hashlib.sha256((P/f'{name}.webp').read_bytes()).hexdigest()})
(P/'manifest.json').write_text(json.dumps({'version':'painted-r4','approved':True,'scope':'production icons and asset assembly; live game integration pending','uniqueIcons':14,'aliases':{'case':'inventory'},'validation':validation,'note':'All assets contain actual alpha. Identity retains a soft gold edge glow in its generated master; no opaque rectangular backdrop is introduced. Original aspect ratios are preserved.'},indent=2))
# Consume the approved raster assets while retaining vector navigation helpers.
p=K/'preview.js';s=p.read_text();start=s.index("const base='./';");end=s.index('\nconst sculpt=',start)
s=s[:start]+"const base='./';const painted=new Set("+json.dumps([i['name'] for i in items]+['case'])+");const icon=(n,extra='')=>`<img class=\"cc-oa-icon ${extra}\" src=\"${base}${painted.has(n)?'painted-r4/'+(n==='case'?'inventory':n)+'.webp':'icons/'+n+'.svg'}\" alt=\"\">`;"+s[end:];p.write_text(s)
p=K/'icon-review.html';s=p.read_text().replace('Creature page · Refined icon family','Creature page · Approved painted icon family').replace('Ivory faces · Gold bevels · Shown enlarged and at 24, 32 and 40px · Asset preview','Painted ivory & gold · Actual production images at 24, 32 and 40px · Asset preview')
for n in [i['name'] for i in items]+['case']:s=s.replace(f'icons/{n}.svg',f'painted-r4/{"inventory" if n=="case" else n}.webp')
p.write_text(s)
notes='''# Approved painted creature icon family R4

The user explicitly approved the Painted ivory & gold study and requested a commit. This locks the softer painterly finish, carved ivory surfaces, brushed antique gold and organic contours. It supersedes R3 vector icons for all requested creature section, selection, record and footer placements.

Fourteen unique generated assets serve all requested placements through the Inventory alias: both Inventory placements use `inventory.webp`; Lineage reuses the same image across tab and record. Native SVGs remain only as legacy studies and simple navigation helpers. Never flatten the painted images into a monochrome mask.

`approved-style.png` is the approved review reference. `source/*.png` are original selected masters, copied unchanged. Production `*.webp` files preserve alpha and aspect ratio at a maximum 256px. `generation.json` records exact built-in image_gen prompts and the selected outputs. `manifest.json` records dimensions, source/production hashes and alpha ranges. The standalone download contains the production WebPs, manifest, prompt set and this documentation; original masters remain in the repository.

Growth received a separate cutout cleanup. Identity retains a soft gold edge glow in its generated master. All files have alpha=0 outside their transparent regions and no opaque rectangular backdrop. Transparent padding and internal detail vary; inspect the actual 24/32/40px assembly rather than assuming the AI study's miniature samples are exact.

The asset assembly now consumes the painted files. Live gameplay integration remains pending: this commit changes the approved art kit and read-only assembly only. Preserve canonical creature artwork, authoritative values, eight sections, equipment transaction guards and parent navigation when integrating. The PR remains draft and unmerged.
'''
(P/'README.md').write_text(notes);(R/'docs/CREATURE_OVERVIEW_PAINTED_ICONS_R4_2026-10-17.md').write_text(notes)
D=R/'docs/exports';D.mkdir(exist_ok=True)
with zipfile.ZipFile(D/'creature-overview-painted-icons-r4.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in list(P.glob('*.webp'))+[P/'README.md',P/'manifest.json',P/'generation.json']:z.write(p,p.relative_to(P))
print('Prepared',len(items),'painted icons; preserved 14 original PNG masters.')
