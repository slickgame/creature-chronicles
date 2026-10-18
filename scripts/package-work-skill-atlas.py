"""Package the original RGBA atlas without masks or recoloring."""
import hashlib
import json
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1] / 'public/images/ui/work-skills-a'
source = root / 'source/skill-atlas.png'
image = Image.open(source)
assert image.mode == 'RGBA' and image.getextrema()[3] == (0, 255)
image.resize((896, 448), Image.Resampling.LANCZOS).save(root / 'skill-atlas.webp', lossless=True)
paths = ['source/skill-atlas.png', 'skill-atlas.webp', 'approved-concept.webp']
(root / 'manifest.json').write_text(json.dumps({
    'grid': {'columns': 4, 'rows': 2},
    'icons': ['Harvesting', 'Material Gathering', 'Husbandry', 'Hunting', 'Crafting', 'Cooking', 'Breeding', 'Cleaning'],
    'alpha': 'Direct RGBA, preserved through resize and lossless conversion',
    'sourceDimensions': list(image.size), 'runtimeDimensions': [896, 448],
    'sha256': {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in paths},
}, indent=2) + '\n')
