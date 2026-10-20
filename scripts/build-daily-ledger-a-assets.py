"""Assemble selected Ledger A from the approved production asset family."""
from pathlib import Path
import hashlib
import json
import shutil

root = Path('public/images/ui/daily-ledger-a')
root.mkdir(parents=True, exist_ok=True)
sources = {}
for name in ['window', 'button', 'primary', 'action', 'action-hover', 'chevron', 'divider']:
    source = Path(f'public/images/ui/ranch-house-a/{name}.svg')
    shutil.copyfile(source, root / f'{name}.svg')
    sources[str(source)] = hashlib.sha256(source.read_bytes()).hexdigest()
for source in [Path(p) for p in [
    'public/images/ui/habitat-a/feed.webp',
    'public/images/ui/atelier-v1/egg.webp',
    'public/images/ui/atelier-v1/ledger.webp',
    'public/images/ui/ranch-v2/icons.webp',
    'public/images/ui/ranch-v3/house.webp',
    'public/images/ui/forge-slate-v2/fonts/Tinos-Regular.woff',
    'public/images/ui/forge-slate-v2/fonts/Tinos-Bold.woff',
]]:
    sources[str(source)] = hashlib.sha256(source.read_bytes()).hexdigest()
(root / 'manifest.json').write_text(json.dumps({'selected': 'A — Scenic briefing', 'sources': sources}, indent=2) + '\n')
