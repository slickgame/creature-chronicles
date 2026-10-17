"""Resize approved transparent masters; never modify the original PNGs.

Usage: python scripts/prepare-forge-sculpted-icons.py --masters /path/to/masters
Masters and their expected SHA256 values are recorded in sets/sculpted/manifest.json.
Requires Pillow. Runtime consumes only the resulting 256px RGBA WebP files.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--masters', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / 'public/images/ui/forge-slate-v2/sets/sculpted'
manifest = json.loads((root / 'manifest.json').read_text())
for entry in manifest['icons']:
    filename = Path(entry['master']).name
    source = args.masters / filename
    if not source.exists():
        source = args.masters / entry['master']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == entry['masterSha256'], filename
    with Image.open(source) as original:
        assert original.mode == 'RGBA', filename
        assert original.getchannel('A').getextrema() == (0, 255), filename
        original.resize((256, 256), Image.Resampling.LANCZOS).save(
            root / entry['file'], quality=96, method=6)
    assert hashlib.sha256((root / entry['file']).read_bytes()).hexdigest() == entry['sha256'], entry['file']
    print('PASS', entry['file'], 'master hash / alpha / production hash')
