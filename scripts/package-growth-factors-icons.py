"""Package the approved A icons without changing their generated RGBA artwork."""
import hashlib
import json
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / 'public/images/ui/stats-growth-b/factors-a'
manifest = []
for name in ('species', 'grade', 'young'):
    source = ROOT / 'source' / f'{name}.png'
    target = ROOT / f'{name}.webp'
    with Image.open(source) as image:
        image = image.convert('RGBA')
        assert image.getchannel('A').getextrema() == (0, 255)
        image.thumbnail((256, 256), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', lossless=True, method=6)
        manifest.append({'name': name, 'dimensions': image.size, 'alpha': image.getchannel('A').getextrema(), 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'production_sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
(ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
