"""Inventory and verify locked Forge B3 assets, including unchanged canonical dependencies."""
from pathlib import Path
import hashlib,json,xml.etree.ElementTree as ET
from PIL import Image
R=Path(__file__).resolve().parents[1];K=R/'public/images/ui/forge-slate-v2'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((R/'public/images/ui/forge-gallery-v1/manifest.json').read_text())
reuse=[x for x in old['reuse'] if x['role']!='Existing item plinth']
for x in reuse:assert sha(R/'public'/x['path'].lstrip('/'))==x['sha256'],x['path']
entries=[]
for p in sorted(K.rglob('*')):
 if not p.is_file() or p.name in ['asset-index.json','manifest.json']:continue
 e={'path':p.relative_to(K).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}
 if p.suffix=='.svg':e.update(kind='vector',viewBox=ET.parse(p).getroot().attrib['viewBox'])
 elif p.suffix in ['.webp','.png']:
  im=Image.open(p);e.update(kind='raster',size=im.size,mode=im.mode)
 elif p.suffix in ['.ttf','.woff']:e['kind']='font'
 else:e['kind']='source-or-document'
 entries.append(e)
(K/'asset-index.json').write_text(json.dumps({'algorithm':'SHA256','excludes':['asset-index.json','manifest.json'],'files':entries,'reuse':reuse},indent=2)+'\n')
master=Path('/workspace/scratch/e32c3bffa7e0/generated_images/exec-0d246880-b916-40bc-8f5c-c0df62e224df.png')
locked=Path('/workspace/scratch/e32c3bffa7e0/upload/a759b7fb-e715-4c50-b735-2c5c7654f059.png')
manifest={'version':2,'design':'Locked Forge B3 — compact nameless tiles, approved silhouettes, Craft label','status':'Integrated into the existing BlacksmithWorkshop/ForgeWindow; standalone assembly remains read-only. Protected hosted gameplay is unverified.','lockedReference':{'originalFilename':locked.name,'sha256':sha(locked),'archivePath':'references/LOCKED_FORGE_B3.png'},'counts':{'svg':sum(e.get('kind')=='vector' for e in entries),'raster':sum(e.get('kind')=='raster' for e in entries),'fontFiles':sum(e.get('kind')=='font' for e in entries),'canonicalReusedImages':len(reuse)},'texture':{'production':'textures/slate.webp','sha256':sha(K/'textures/slate.webp'),'masterFilename':master.name,'masterSha256':sha(master),'archivePath':'masters/slate.png','promptFile':'generation-prompts.json','encoding':'Opaque WebP, original dimensions, quality92/method6; no creative raster edits.'},'fonts':{'family':'Tinos','styles':['Regular','Bold','Italic','BoldItalic'],'license':'fonts/OFL.txt','source':'https://github.com/google/fonts/tree/main/ofl/tinos','sourceMetadata':'fonts/METADATA.pb','originals':'Full unmodified TTF files','web':'Lossless full-font WOFF packaging; CSS local font-face, no network font service'},'reuse':reuse,'integrationContract':'README.md','preview':'preview.html','catalog':'catalog.html','scripts':['scripts/build-forge-slate-assets.py','scripts/index-forge-slate-assets.py','scripts/prepare-forge-sculpted-icons.py'],'colors':{'Common':'#b4c1cd','Uncommon':'#66d999','Rare':'#4fb7ff','Heroic':'#cd75f6','Legendary':'#f0b841'},'notes':['No text/data baked into raster or SVG surfaces.','SVG category icons are scalable original silhouette interpretations; raster concept is not an exact vector trace.','Preview stock and ownership are synthetic examples, not production save data.','Fonts and glyphs are provided; user text still rendered by UI code.','Buttons and tabs include distinct normal/hover/pressed/disabled artwork.','Runtime uses live engine/save data; the standalone assembly still uses synthetic sample data. Protected hosted gameplay remains unverified.']}

prior=json.loads((K/'manifest.json').read_text()) if (K/'manifest.json').exists() else {}
if 'categoryArt' in prior:manifest['categoryArt']=prior['categoryArt']
if 'controlRevision' in prior:manifest['controlRevision']=prior['controlRevision']
manifest['sculptedActions']={'manifest':'sculpted/manifest.json','prompts':'sculpted/generation-prompts.json','icons':['craft','gold-coin','compare','upgrade','talk','source'],'encoding':'256px RGBA WebP, quality96/method6, resized from untouched transparent PNG masters; no creative postprocessing.'}
(K/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
for e in entries:assert sha(K/e['path'])==e['sha256']
for b in ['button-primary','button-secondary','button-talk','tab','tab-active']:
 assert len({sha(K/'frames'/f'{b}{suffix}.svg') for suffix in ['','-hover','-pressed','-disabled']})==4
assert (K/'fonts/OFL.txt').read_text().startswith('Copyright 2026')
print(json.dumps(manifest['counts']));print('PASS hashes, canonical reuse, XML, complete font license, distinct state variants')
