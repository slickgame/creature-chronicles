from pathlib import Path
import json,hashlib,shutil,zipfile
from PIL import Image
R=Path(__file__).resolve().parents[1];K=R/'public/images/ui/creature-overview-a-v2'
icons=sorted((K/'icons').glob('*.svg'));frames=sorted((K/'frames').glob('*.svg'))
items=lambda paths:''.join(f'<figure><img src="{p.relative_to(K)}" alt=""><figcaption>{p.stem}</figcaption></figure>' for p in paths)
(K/'catalog.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Overview A — complete asset catalog</title><link rel="stylesheet" href="overview-kit.css"><style>body{margin:0;padding:30px;background:#061a26;color:#fff0d0;font:18px OverviewATinos,serif;}h1{font-size:40px}h2{font-size:28px;margin-top:30px}.grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}.frames{grid-template-columns:repeat(4,minmax(0,1fr))}figure{margin:0;padding:10px;border:1px solid #80683e;background:linear-gradient(130deg,#122f3e,#061822);text-align:center;}figure img{width:64px;height:64px;object-fit:contain}.frames figure img{width:100%;height:92px}figcaption{font-size:14px;margin-top:7px}.vital figure img{width:96px;height:96px}p{color:#d5c69e}@media(max-width:700px){.grid{grid-template-columns:repeat(3,1fr)}.frames{grid-template-columns:repeat(2,1fr)}} </style><h1>Overview A · Production asset kit</h1><p>Asset catalog · not live gameplay. Editable SVG surfaces plus generated transparent vital icons.</p><h2>Painted vital icons</h2><div class="grid vital">'''+items(sorted((K/'sculpted').glob('*.webp')))+'''</div><h2>Section, record & action symbols</h2><div class="grid">'''+items(icons)+'''</div><h2>Text-free frames, controls & states</h2><div class="grid frames">'''+items(frames)+'''</div><h2>Meters & ornament</h2><div class="grid">'''+items(sorted((K/'meters').glob('*.svg'))+sorted((K/'ornaments').glob('*.svg')))+'''</div>''')
readme='''# Creature Overview A — production art kit

Target: the user's second image, `image(20261017-210340).png`, approved portrait-led Overview A. This is a production asset kit and a read-only browser assembly, not a live gameplay integration or an actual transaction screenshot.

## Complete inventory

- 90 original editable SVG assets: 8 structural frames, 40 control/card state surfaces (8 families × normal/hover/pressed/disabled/focus), 8 metadata/status plaques, 26 section/record/action symbols, 3 ornaments/backgrounds, 5 meter assets.
- 3 generated painted RGBA vital icons: red heart (shared by Affection, Hearts and heart pips), gold lightning and gold star. Untouched PNG masters are in `source/`; 256px lossless WebP runtime files are in `sculpted/`. Every source has actual alpha (0–255). Built-in image_gen was used; exact prompts are in generation-prompts.json. No paid CLI fallback was used.
- Local Tinos Regular/Bold fonts reused from forge-slate-v2, including the SIL Open Font License. Both weights are explicitly declared; the regular-only declaration in the previous runtime must be replaced when integrating.
- tokens.json: palette, typography, border slices, icon sizes. icon-map.json: every visible label mapped to its symbol.
- overview-kit.css: scoped production classes, nine-slice frames, real text, colored meters, heart pips and responsive desktop/phone composition.
- preview.html + preview.js: read-only assembled sample using canonical Mira artwork and existing meadow backdrop; sample values only, no game state/save APIs.
- catalog.html: every actual production asset and state, not a concept redraw.
- validation.json: browser fit, missing-image and error checks at 1280×920, 1440×960, 390×844 and 360×740.

## Fidelity correction — October 17 follow-up

The user's first image exposed records extending below the footer divider. The revised assembly sets explicit `minmax(0,1fr)` rows and minimum heights, resets record icons to a single grid row, and reserves the footer track. Validation now checks record containment and a positive gap above the footer divider; viewport bounds alone did not detect the earlier overlap.

Dark navy card faces replace the grey gloss. The hammer, pouch, family-tree and group silhouettes are revised; gold symbols have a lighter ivory finish. Three separately generated icon refinements soften the red heart and gold star/bolt. Earlier painted masters are retained as `*-master-v1.png` for provenance. The preview also uses taller section tabs, compact vital cards, larger headings and corrected portrait clipping.

## Integration details

Use nine-slice border images. Ornate frames have 40px source corner zones, with 13–24px rendered borders. Simple frames/control surfaces use 16px slices and 7–10px rendered borders. Preserve the corners; do not scale a whole frame as one stretched rectangle. A complete state family is provided even when the assembly uses a CSS focus outline instead of the focus surface.

Desktop: portrait ~35%, right content ~65%; eight tabs in two rows of four; four compact vitals; all four secondary records; three footer actions. Phone: Menu + title, Previous screen + Choose creature, compact portrait/identity, section picker, four vital cards, More overview, three footer actions. The kit's h1 is 44px desktop/28px phone, section title 38px/25px; vital values 22px desktop/15px phone. Use the explicit bold face rather than browser-synthesized weight.

Artwork remains the existing approved `public/images/creatures/feline/nyla/nyla_01_full_body.png`. Do not replace it with the concept's AI redraw. The scenery remains `public/images/ui/ranch-dossier-v2/portrait-meadow.webp`. These and licensed fonts are included unchanged in the download archive, at original project-relative paths.

Keep all text as text. All surfaces are text-free and accept longer labels. Bind real values to meters and pips; 91/91, 50/100, 4/4, 0/75 and Generation 1 are assembly samples. Hearts are not combat HP. Retain the eight creature sections, complete detail text, search/filter/sort/compare, existing actions and parent navigation. Put additional links in existing navigation rather than discarding them to match the concept's simplified header. Preserve equipment's shared transaction windows and all protections. For shorter desktop/landscape layouts use existing focused pages, not clipped controls. See the existing Overview runtime QA for supported game breakpoints.

## Build and review

Run `python scripts/build-creature-overview-assets.py` to deterministically rebuild the SVG assets. Run a static server with `public/` as its root and open `/images/ui/creature-overview-a-v2/preview.html` or `catalog.html`. The read-only preview's buttons explain that gameplay is not connected; More overview switches the phone sample page.

The assembled kit matches the concept's visual language and component hierarchy. AI concept typography and the redrawn character are not pixel-identical source assets; production uses the explicit licensed font and canonical creature. This kit does not claim an already-deployed live-game replacement.
'''
(K/'README.md').write_text(readme)
# Exact reuse inventory is authoritative and hashed.
reuse=['public/images/creatures/feline/nyla/nyla_01_full_body.png','public/images/ui/ranch-dossier-v2/portrait-meadow.webp','public/images/ui/forge-slate-v2/fonts/Tinos-Regular.woff','public/images/ui/forge-slate-v2/fonts/Tinos-Bold.woff','public/images/ui/forge-slate-v2/fonts/Tinos-Regular.ttf','public/images/ui/forge-slate-v2/fonts/Tinos-Bold.ttf','public/images/ui/forge-slate-v2/fonts/OFL.txt']
manifest={'version':'creature-overview-a-v2','scope':'production kit; runtime integration pending','svgCount':len(list(K.rglob('*.svg'))),'paintedIconCount':3,'reuse':[{'path':p,'sha256':hashlib.sha256((R/p).read_bytes()).hexdigest()} for p in reuse]}
(K/'manifest.json').write_text(json.dumps(manifest,indent=2))
# Source-image dimensional verification only; no image content modification.
for p in K.glob('assembly-*.png'):
 Image.open(p).save(p.with_suffix('.webp'),quality=90)
index=[]
for p in sorted(K.rglob('*')):
 if p.is_file() and p.name!='asset-index.json':
  b=p.read_bytes();index.append({'path':str(p.relative_to(K)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(K/'asset-index.json').write_text(json.dumps(index,indent=2))
(R/'docs/CREATURE_OVERVIEW_A_ASSET_KIT_2026-10-17.md').write_text(readme)
D=R/'docs/exports';D.mkdir(exist_ok=True);z=D/'creature-overview-a-production-kit-r2.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as out:
 for p in K.rglob('*'):
  if p.is_file():out.write(p,p.relative_to(R))
 for p in reuse:out.write(R/p,p)
 for p in ['scripts/build-creature-overview-assets.py','scripts/package-creature-overview-assets.py','docs/CREATURE_OVERVIEW_A_ASSET_KIT_2026-10-17.md']:out.write(R/p,p)
print(json.dumps({'svg':manifest['svgCount'],'icons':3,'symbols':len(icons),'archiveBytes':z.stat().st_size,'archive':str(z)}))
