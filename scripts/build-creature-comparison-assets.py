from pathlib import Path
import shutil

# Reproduce the native, stretchable frame from the approved slate/gold kit.
root = Path('public/images/ui/creature-compare-a')
root.mkdir(parents=True, exist_ok=True)
shutil.copyfile('public/images/ui/roster-filters-c/panel.svg', root / 'ledger-frame.svg')
