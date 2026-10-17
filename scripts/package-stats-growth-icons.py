"""Rebuild approved Stats & Growth B WebPs from committed original PNGs."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public/images/ui/stats-growth-b'
manifest = []
for name in ['strength', 'dexterity', 'stamina', 'charm', 'willpower', 'fertility']:
    source = root / 'source' / f'{name}.png'
    target = root / f'{name}.webp'
    image = Image.open(source).convert('RGBA')
    alpha = image.getchannel('A').getextrema()
    if alpha[0] != 0:
        raise ValueError(f'{name} must retain actual transparent pixels')
    image.thumbnail((256, 256))
    image.save(target, lossless=True, method=6)
    manifest.append(dict(name=name, source=f'source/{name}.png', production=target.name,
                         size=image.size, alpha=alpha,
                         sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                         productionSha256=hashlib.sha256(target.read_bytes()).hexdigest()))
(root / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
