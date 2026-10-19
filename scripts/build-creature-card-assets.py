from pathlib import Path

root = Path('public/images/ui/creature-cards-c')
root.mkdir(parents=True, exist_ok=True)
frame = Path('public/images/ui/roster-filters-c/panel.svg').read_text()
(root / 'tile.svg').write_text(frame)
(root / 'tile-selected.svg').write_text(frame.replace('#031b27', '#064d40').replace('#c4a05c', '#f1d797').replace('#80662f', '#68b28e'))
