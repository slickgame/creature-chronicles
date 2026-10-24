"""Rebuild the optimized overlay and record production asset provenance."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path('public/images/ui/inspect-dossier-a')
master=root/'masters/gold-botanical-corner.png'
im=Image.open(master).convert('RGBA')
assert im.getextrema()[3][0]==0 and im.getextrema()[3][1]==255
im.thumbnail((320,320))
im.save(root/'gold-botanical-corner.webp',lossless=True)
reused=['public/images/ui/breeding-desk-a/fidelity-v2/pavilion.webp','public/images/ui/breeding-desk-a/fidelity-v2/panel.svg','public/images/ui/breeding-desk-a/fidelity-v2/button.svg','public/images/ui/breeding-desk-a/fidelity-v2/primary.svg','public/images/ui/breeding-desk-a/fidelity-v2/cream.svg','public/images/ui/breeding-desk-a/art/wood.webp','public/images/ui/breeding-desk-a/fonts/Tinos-Regular.woff','public/images/ui/breeding-desk-a/fonts/Tinos-Bold.woff','public/images/ui/creature-overview-a-v2/sculpted/energy.webp','public/images/ui/creature-overview-a-v2/sculpted/heart.webp','public/images/ui/creature-overview-a-v2/sculpted/experience.webp','public/images/ui/work-skills-a/skill-atlas.webp']
reused += [f'public/images/ui/stats-growth-b/{x}.webp' for x in ['strength','dexterity','stamina','charm','willpower','fertility']]
reused += [str(p) for p in sorted(Path('public/images/ui/talents-c/icons').glob('*.webp'))]
def record(p):
 p=Path(p);info={'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 if p.suffix in ('.png','.webp','.jpg'):
  image=Image.open(p);image.load();info.update(size=image.size,mode=image.mode)
 return info
new=[record(p) for p in sorted(root.rglob('*')) if p.is_file() and p.name not in ['manifest.json','README.md']]
(root/'manifest.json').write_text(json.dumps({'direction':'Approved A Illustrated Dossier','new':new,'reused':[record(p) for p in reused],'characterArt':'Unchanged canonical profilePath; no new character imagery','generator':'Built-in image generation: transparent gold corner; native SVG builder for symbols and vital surface'},indent=2)+'\n')
print(f'Validated {len(new)} new/reference/master files and {len(reused)} reused assets.')
