"""Native production frames for the approved scenic Ranch House A."""
from pathlib import Path

root = Path('public/images/ui/ranch-house-a')
root.mkdir(parents=True, exist_ok=True)
for name in ['window', 'button', 'primary']:
    (root / f'{name}.svg').write_text(Path(f'public/images/ui/habitat-a/{name}.svg').read_text())
gold = '<linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#ffedb0"/><stop offset=".3" stop-color="#d2a04e"/><stop offset=".6" stop-color="#8c6028"/><stop offset="1" stop-color="#f3d48b"/></linearGradient>'
for name, face in [('action', '#041b29'), ('action-hover', '#0b2b39')]:
    (root / f'{name}.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" viewBox="0 0 600 120"><defs>{gold}</defs><path d="M11 3H589L597 11V109L589 117H11L3 109V11Z" fill="{face}" stroke="#463019" stroke-width="4"/><path d="M11 3H589L597 11V109L589 117H11L3 109V11Z" fill="none" stroke="url(#gold)" stroke-width="2"/><path d="M12 7H588L593 12V108L588 113H12L7 108V12Z" fill="none" stroke="#d3b278" stroke-width=".7" stroke-opacity=".4"/><g fill="none" stroke="#f6daa0" stroke-width="1.3"><path d="M3 21V11L11 3H21M579 3H589L597 11V21M597 99V109L589 117H579M21 117H11L3 109V99"/></g></svg>''')
(root / 'chevron.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32"><path d="m7 5 11 11L7 27" fill="none" stroke="#efc873" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>')
(root / 'menu.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 8h20M6 16h20M6 24h20" fill="none" stroke="#f2d18e" stroke-width="2.4" stroke-linecap="round"/></svg>')
(root / 'divider.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 12"><path d="M0 6h188m24 0h188m-200-5 5 5-5 5-5-5Z" fill="none" stroke="#b79a60" stroke-width="1"/></svg>')
