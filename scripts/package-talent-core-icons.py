"""Extract generated RGBA atlas cells without repainting or removing a background."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

IDS = ['eager_learner','sound_sleeper','diligent','efficient_worker','sure_strike','thick_hide','light_footed','hot_blooded','lasting_vigor','guard_dog']
parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--output', type=Path, default=Path('public/images/ui/talents-c'))
args = parser.parse_args()
atlas = Image.open(args.source)
assert atlas.mode == 'RGBA', f'Expected generated RGBA, got {atlas.mode}'
assert atlas.getchannel('A').getextrema() == (0,255), 'Source must contain real transparent and opaque pixels'
out = args.output
(out/'source').mkdir(parents=True, exist_ok=True)
(out/'icons').mkdir(exist_ok=True)
source_copy = out/'source/core-atlas.png'
shutil.copyfile(args.source, source_copy)
manifest = {'source':'source/core-atlas.png','sourceSize':list(atlas.size),'sourceSha256':hashlib.sha256(source_copy.read_bytes()).hexdigest(),'grid':[5,2],'size':192,'icons':[]}
for i, icon_id in enumerate(IDS):
    col, row = i%5, i//5
    cell_box = [round(col*atlas.width/5), round(row*atlas.height/2), round((col+1)*atlas.width/5), round((row+1)*atlas.height/2)]
    cell = atlas.crop(cell_box)
    bbox = cell.getchannel('A').getbbox()
    assert bbox, f'Empty cell: {icon_id}'
    # The generated atlas contains a few opacity-1..6 fringe pixels at cell edges.
    # Inspect a thresholded mask only for clipping checks; never alter source alpha.
    visible = cell.getchannel('A').point(lambda value: 255 if value>16 else 0).getbbox()
    assert visible and visible[0]>0 and visible[1]>0 and visible[2]<cell.width and visible[3]<cell.height, f'Visible artwork touches a cell boundary: {icon_id}, {visible}'
    # Crop only transparent padding, then contain the complete art inside a 192px canvas.
    art = cell.crop(bbox)
    art.thumbnail((172,172),Image.Resampling.LANCZOS)
    icon = Image.new('RGBA',(192,192))
    icon.alpha_composite(art,((192-art.width)//2,(192-art.height)//2))
    target = out/'icons'/f'{icon_id}.webp'
    icon.save(target,format='WEBP',lossless=True,method=6)
    loaded = Image.open(target)
    assert loaded.mode=='RGBA' and loaded.getchannel('A').getextrema()==(0,255)
    manifest['icons'].append({'id':icon_id,'path':f'icons/{icon_id}.webp','cell':cell_box,'sourceAlphaBounds':list(bbox),'visibleAlphaBounds':list(visible),'size':[192,192],'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size})
(out/'core-icon-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'sourceSize':atlas.size,'icons':len(manifest['icons']),'output':str(out)}))
