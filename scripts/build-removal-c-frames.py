"""Native nine-slice frames refining the approved removal C concept."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'public/images/ui/creature-removal-c'
ROOT.mkdir(parents=True, exist_ok=True)
def frame(name, top, bottom, ornate=True):
    corners = ''
    for x, y, r in [(4,4,0),(316,4,90),(316,196,180),(4,196,270)]:
        if ornate:
            corners += f'<g transform="translate({x} {y}) rotate({r})" fill="none" stroke="url(#gold)" stroke-linejoin="round" stroke-linecap="round"><path stroke-width="1.8" d="M0 36V9Q0 0 9 0H36M4 33V10Q4 4 10 4H33M1 25Q1 5 25 1M7 23Q9 9 23 7M4 15Q18 16 15 4M8 8l10 3-7 7Z"/><path stroke="#ffefb2" stroke-width=".8" d="M1 32V10Q1 1 10 1H32M7 20Q10 11 20 7"/><path stroke-width="1" d="M24 4q-3 8 7 9M4 24q8-3 9 7"/></g>'
    (ROOT / f'{name}.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#fff0af"/><stop offset=".2" stop-color="#d4a13e"/><stop offset=".45" stop-color="#916022"/><stop offset=".65" stop-color="#ffe2a0"/><stop offset="1" stop-color="#be8d35"/></linearGradient><linearGradient id="face" x2=".6" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient></defs><rect x="3" y="3" width="314" height="194" rx="9" fill="url(#face)" stroke="#422b13" stroke-width="5"/><rect x="3" y="3" width="314" height="194" rx="9" fill="none" stroke="url(#gold)" stroke-width="2.4"/><rect x="7" y="7" width="306" height="186" rx="6" fill="none" stroke="#ffe1a0" stroke-opacity=".6" stroke-width=".8"/>{corners}</svg>\n''')
frame('window-ornate', '#001b27', '#00121c')
frame('primary-ornate', '#004b43', '#004b43')
frame('danger-ornate', '#591720', '#591720')
frame('secondary-ornate', '#031e2b', '#031e2b', False)
frame('panel', '#002130', '#00131f', False)
