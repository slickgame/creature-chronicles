from pathlib import Path
root=Path('public/images/ui/creature-inventory-a/frames');root.mkdir(parents=True,exist_ok=True)
for name,source in [('panel','window-ornate'),('window','window-ornate'),('button','secondary-ornate'),('button-active','primary-ornate')]:
 content=Path(f'public/images/ui/creature-removal-c/{source}.svg').read_text()
 if name=='button-active':content=content.replace('stroke="url(#gold)" stroke-width="2.4"','stroke="#8beac0" stroke-width="2.4"',1)
 (root/f'{name}.svg').write_text(content)
tile=Path('public/images/ui/roster-filters-c/panel.svg').read_text().replace('#031b27','#031521')
(root/'tile.svg').write_text(tile)
(root/'tile-selected.svg').write_text(tile.replace('#c4a05c','#9af0c2').replace('#80662f','#31b98c').replace('#031521','#064236'))
from PIL import Image
import json,hashlib
base=root.parent
src=base/'source/supply-atlas.png'
if src.exists():
 atlas=Image.open(src).convert('RGBA');art=base/'art';art.mkdir(exist_ok=True)
 names=['energy_snack','energy_meal','affection_treat','recovery_balm','stock','chevron']
 for index,name in enumerate(names):
  col,row=index%3,index//3
  cell=atlas.crop((col*512,row*512,(col+1)*512,(row+1)*512))
  box=cell.getchannel('A').getbbox()
  if box:cell=cell.crop(box)
  cell.thumbnail((452,452),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',(480,480));canvas.alpha_composite(cell,((480-cell.width)//2,(480-cell.height)//2))
  canvas.save(art/f'{name}.webp',lossless=True)
 (base/'source/manifest.json').write_text(json.dumps({'source':'supply-atlas.png','sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'tool':'built-in image_gen','transparent_background':True,'layout':'3 columns by 2 rows, each 512px cell; crop alpha bounds; center within 480px export with 28px minimum padding','exports':names},indent=2))
