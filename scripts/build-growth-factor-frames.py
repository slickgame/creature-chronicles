"""Extend the approved nine-slice frame family for Growth factors A."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'public/images/ui/stats-growth-b/factors-a/frames'
ROOT.mkdir(parents=True, exist_ok=True)
def frame(name, top, bottom, ornate=True, primary=False):
    corners=''
    if ornate:
        for x,y,rotation in [(4,4,0),(316,4,90),(316,196,180),(4,196,270)]:
            corners += f'<g transform="translate({x} {y}) rotate({rotation})" fill="none" stroke="url(#gold)" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="1.2" d="M0 27V0H27M3 24V3H24M0 0l13 13M4 22Q4 5 22 4M4 14Q13 13 14 4M6 6l5 1-4 4Z"/><path stroke="#f5e4b6" stroke-width=".5" d="M1 20V1H20M7 19Q9 10 19 7"/><path stroke-width=".7" d="M17 3q1 6 6 7M3 17q6 1 7 6"/></g>'
    else:
        for x,y,rotation in [(5,5,0),(315,5,90),(315,195,180),(5,195,270)]:
            corners += f'<g transform="translate({x} {y}) rotate({rotation})" fill="none" stroke="url(#gold)"><path stroke-width="1.1" d="M0 10V0H10M3 9V3H9"/></g>'
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e8d7a6"/><stop offset=".27" stop-color="#a88c54"/><stop offset=".52" stop-color="#d2b779"/><stop offset=".78" stop-color="#88713e"/><stop offset="1" stop-color="#e6d3a0"/></linearGradient><linearGradient id="face" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient><radialGradient id="glow"><stop stop-color="{'#1d6a4e' if primary else '#0b3b48'}" stop-opacity=".2"/><stop offset="1" stop-color="#001721" stop-opacity="0"/></radialGradient></defs><path d="M7 3H313L317 7V193L313 197H7L3 193V7Z" fill="url(#face)" stroke="url(#gold)" stroke-width="1.2"/><path d="M9 6H311L314 9V191L311 194H9L6 191V9Z" fill="url(#glow)" stroke="#d5bb83" stroke-opacity=".38" stroke-width=".55"/>{corners}</svg>'''
    (ROOT/f'{name}.svg').write_text(svg+'\n')
frame('card', '#022330', '#001721')
frame('result', '#06392f', '#00271f', primary=True)
frame('summary', '#022330', '#001721', ornate=False)
frame('note', '#052532', '#021c28', ornate=False)
frame('window', '#032432', '#001925')
